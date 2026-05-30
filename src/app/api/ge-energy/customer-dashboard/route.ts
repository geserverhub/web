import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import {
  deviceFilterSql,
  getSiteElectricityRates,
  loadDeviceSitesByIds,
  formatDeviceLocation,
  loadCustomerMetersByDeviceIds,
  resolveCustomerMeters,
  resolveRate,
  type CustomerScopeInput,
} from '@/lib/ge-energy/customer-scope'
import {
  listElectricityRateRules,
  resolveRateForDateWithMeta,
} from '@/lib/ge-energy/electricity-rates'
import {
  assertCustomerDeviceAccess,
  requireCustomerDashboardAuth,
} from '@/lib/customer-dashboard-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type MonthlyRow = {
  month_key: string
  year_num: number | string
  month_num: number | string
  period_time?: string | null
  before_kwh: number | string | null
  after_kwh: number | string | null
  saved_kwh: number | string | null
}

const toNumber = (value: number | string | null | undefined) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireCustomerDashboardAuth(request)
    if (auth.ok === false) return auth.response

    const scope = auth.scope
    const searchParams = request.nextUrl.searchParams
    const deviceIdParam = searchParams.get('deviceId')
    const siteParam = (searchParams.get('site') || '').toLowerCase()

    const deviceDenied = await assertCustomerDeviceAccess(scope, deviceIdParam)
    if (deviceDenied) return deviceDenied

    let meters = await resolveCustomerMeters(scope)

    if (!meters.length) {
      return NextResponse.json({
        success: true,
        data: {
          monthly: [],
          meters: [],
          primarySite: 'thailand',
          summary: {
            totalBefore: 0,
            totalAfter: 0,
            totalCostBefore: 0,
            totalCostAfter: 0,
            totalSavedKwh: 0,
            totalSavedCost: 0,
            totalSavedBaht: 0,
            savingPct: 0,
            co2SavedKg: 0,
            electricityRate: resolveRate('thailand', searchParams.get('rate')),
          },
        },
      })
    }

    let deviceIds: number[] = meters.map((m) => m.deviceId)

    if (deviceIdParam) {
      const pick = Number(deviceIdParam)
      if (Number.isFinite(pick) && pick > 0) {
        deviceIds = deviceIds.filter((id) => id === pick)
      }
    }

    const deviceMeta = await loadCustomerMetersByDeviceIds(deviceIds)
    const metaByDeviceId = new Map(deviceMeta.map((m) => [m.deviceId, m]))
    if (!meters.length && deviceMeta.length) {
      meters = deviceMeta
    } else if (meters.length && deviceMeta.length) {
      meters = meters.map((m) => {
        const meta = metaByDeviceId.get(m.deviceId)
        if (!meta) return m
        return {
          ...m,
          geId: m.geId ?? meta.geId,
          seriesNo: m.seriesNo ?? meta.seriesNo,
          ch1MeterNo: m.ch1MeterNo ?? meta.ch1MeterNo,
          ch2MeterNo: m.ch2MeterNo ?? meta.ch2MeterNo,
          channels: m.channels?.length ? m.channels : meta.channels,
          locationName: meta.locationName ?? m.locationName,
        }
      })
    }

    const primarySite =
      (deviceIdParam
        ? meters.find((m) => m.deviceId === Number(deviceIdParam))?.site
        : meters[0]?.site) ||
      (siteParam && siteParam !== 'all' ? siteParam : 'thailand')

    const safeRate = resolveRate(primarySite, searchParams.get('rate'))
    const rateOverride = searchParams.get('rate')
    const rateRules = await listElectricityRateRules()
    const deviceSiteMap = await loadDeviceSitesByIds(deviceIds)
    const resolveMeterSite = (deviceId: number) =>
      meters.find((m) => m.deviceId === deviceId)?.site ||
      deviceSiteMap.get(deviceId) ||
      primarySite

    const { sql: deviceSql, params: deviceParams } = deviceFilterSql(deviceIds)

    const dateFrom = searchParams.get('dateFrom')
    const dateTo   = searchParams.get('dateTo')

    let dateCondition: string
    let dateConditionParams: string[]
    if (dateFrom && dateTo) {
      dateCondition = `AND pr.record_time >= ? AND pr.record_time < DATE_ADD(?, INTERVAL 1 DAY)`
      dateConditionParams = [dateFrom, dateTo]
    } else {
      dateCondition = `AND pr.record_time >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 23 MONTH)`
      dateConditionParams = []
    }

    type MonthlyDeviceRow = MonthlyRow & {
      device_id: number
      co2_kg: number | string | null
    }

    const monthlyDeviceRows = (await queryGe(
      `SELECT
        DATE_FORMAT(pr.record_time, '%Y-%m') AS month_key,
        YEAR(pr.record_time) AS year_num,
        MONTH(pr.record_time) AS month_num,
        MIN(pr.record_time) AS period_time,
        pr.device_id,
        SUM(COALESCE(pr.before_kWh, 0)) AS before_kwh,
        SUM(COALESCE(pr.metrics_kWh, 0)) AS after_kwh,
        SUM(COALESCE(pr.energy_reduction, 0)) AS saved_kwh,
        SUM(COALESCE(pr.co2_reduction, 0)) AS co2_kg
       FROM power_records pr
       INNER JOIN devices d ON d.deviceID = pr.device_id
       WHERE 1=1
       ${dateCondition}
       ${deviceSql}
       GROUP BY DATE_FORMAT(pr.record_time, '%Y-%m'), YEAR(pr.record_time), MONTH(pr.record_time), pr.device_id
       ORDER BY YEAR(pr.record_time) ASC, MONTH(pr.record_time) ASC, pr.device_id ASC`,
      [...dateConditionParams, ...deviceParams],
    )) as MonthlyDeviceRow[]

    const monthlyByKey = new Map<
      string,
      {
        monthKey: string
        year: number
        monthIndex: number
        before: number
        after: number
        savedKwh: number
        co2Kg: number
        costBefore: number
        costAfter: number
      }
    >()
    const monthlyCostByDevice = new Map<number, { costBefore: number; costAfter: number }>()

    for (const row of monthlyDeviceRows) {
      const before = toNumber(row.before_kwh)
      const after = toNumber(row.after_kwh)
      const savedKwh = toNumber(row.saved_kwh)
      const co2Kg = toNumber(row.co2_kg)
      const deviceId = Number(row.device_id)
      const meterSite = resolveMeterSite(deviceId)
      const { rate: deviceRate } = resolveRateForDateWithMeta(
        meterSite,
        row.period_time || null,
        rateRules,
        rateOverride,
      )
      const costBefore = Math.round(before * deviceRate)
      const costAfter = Math.round(after * deviceRate)

      const key = String(row.month_key)
      const channelSavedKwh = Math.max(0, before - after)
      const existing = monthlyByKey.get(key)
      if (existing) {
        existing.before += before
        existing.after += after
        existing.savedKwh += channelSavedKwh
        existing.co2Kg += co2Kg
        existing.costBefore += costBefore
        existing.costAfter += costAfter
      } else {
        monthlyByKey.set(key, {
          monthKey: key,
          year: toNumber(row.year_num),
          monthIndex: toNumber(row.month_num),
          before,
          after,
          savedKwh: channelSavedKwh,
          co2Kg,
          costBefore,
          costAfter,
        })
      }

      const meterCost = monthlyCostByDevice.get(deviceId)
      if (meterCost) {
        meterCost.costBefore += costBefore
        meterCost.costAfter += costAfter
      } else {
        monthlyCostByDevice.set(deviceId, { costBefore, costAfter })
      }
    }

    const monthly = Array.from(monthlyByKey.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey),
    )

    const summary = monthly.reduce(
      (acc, row) => {
        acc.totalBefore += row.before
        acc.totalAfter += row.after
        acc.totalCostBefore += row.costBefore
        acc.totalCostAfter += row.costAfter
        return acc
      },
      { totalBefore: 0, totalAfter: 0, totalCostBefore: 0, totalCostAfter: 0 },
    )

    const totalSavedKwh = Math.max(0, summary.totalBefore - summary.totalAfter)
    const totalSavedCost = summary.totalCostBefore - summary.totalCostAfter
    const totalCo2Kg = monthly.reduce((s, row) => s + row.co2Kg, 0)

    // Per-meter aggregate stats
    type ChannelLive = {
      kwh: number
      cost: number
      currentL1: number | null
      currentL2: number | null
      currentL3: number | null
      recordTime: string | null
    }

    let meterStats: Array<{
      deviceId: number
      site: string
      beforeKwh: number
      afterKwh: number
      savedKwh: number
      recordCount: number
      firstRecord: string | null
      lastRecord: string | null
      costBefore: number
      costAfter: number
      savedCost: number
      savingPct: number
      co2SavedKg: number
      electricityRate: number
      rateSource: 'database' | 'env' | 'query'
      rateLabel: string | null
      channels: {
        ch1: ChannelLive
        ch2: ChannelLive
      }
    }> = []

    const latestByDevice = new Map<
      number,
      {
        before_kwh: number | string | null
        metrics_kwh: number | string | null
        before_l1: number | string | null
        before_l2: number | string | null
        before_l3: number | string | null
        metrics_l1: number | string | null
        metrics_l2: number | string | null
        metrics_l3: number | string | null
        record_time: string | null
      }
    >()

    if (deviceIds.length > 0) {
      const { sql: meterDevSql, params: meterDevParams } = deviceFilterSql(deviceIds)
      const meterRows = (await queryGe(
        `SELECT
           pr.device_id,
           SUM(COALESCE(pr.before_kWh, 0))       AS before_kwh,
           SUM(COALESCE(pr.metrics_kWh, 0))       AS after_kwh,
           SUM(COALESCE(pr.energy_reduction, 0))  AS saved_kwh,
           SUM(COALESCE(pr.co2_reduction, 0))     AS co2_kg,
           COUNT(*)                               AS record_count,
           MIN(pr.record_time)                    AS first_record,
           MAX(pr.record_time)                    AS last_record
         FROM power_records pr
         WHERE 1=1
         ${dateCondition}
         ${meterDevSql}
         GROUP BY pr.device_id
         ORDER BY pr.device_id ASC`,
        [...dateConditionParams, ...meterDevParams],
      )) as Array<{
        device_id: number
        before_kwh: number | string | null
        after_kwh: number | string | null
        saved_kwh: number | string | null
        co2_kg: number | string | null
        record_count: number | string
        first_record: string | null
        last_record: string | null
      }>

      if (deviceIds.length) {
        const placeholders = deviceIds.map(() => '?').join(',')
        const latestRows = (await queryGe(
          `SELECT pr.device_id, pr.before_kWh, pr.metrics_kWh,
                  pr.before_L1, pr.before_L2, pr.before_L3,
                  pr.metrics_L1, pr.metrics_L2, pr.metrics_L3,
                  pr.record_time
           FROM power_records pr
           INNER JOIN (
             SELECT device_id, MAX(record_time) AS max_time
             FROM power_records
             WHERE device_id IN (${placeholders})
             GROUP BY device_id
           ) latest ON latest.device_id = pr.device_id AND latest.max_time = pr.record_time`,
          deviceIds,
        )) as Array<{
          device_id: number
          before_kWh: number | string | null
          metrics_kWh: number | string | null
          before_L1: number | string | null
          before_L2: number | string | null
          before_L3: number | string | null
          metrics_L1: number | string | null
          metrics_L2: number | string | null
          metrics_L3: number | string | null
          record_time: string | null
        }>
        for (const row of latestRows) {
          latestByDevice.set(Number(row.device_id), {
            before_kwh: row.before_kWh,
            metrics_kwh: row.metrics_kWh,
            before_l1: row.before_L1,
            before_l2: row.before_L2,
            before_l3: row.before_L3,
            metrics_l1: row.metrics_L1,
            metrics_l2: row.metrics_L2,
            metrics_l3: row.metrics_L3,
            record_time: row.record_time,
          })
        }
      }

      const toNullable = (v: number | string | null | undefined) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : null
      }

      // Use per-meter rate (match meter site)
      meterStats = meterRows.map((r) => {
        const dId = Number(r.device_id)
        const meterSite = resolveMeterSite(dId)
        const bKwh = toNumber(r.before_kwh)
        const aKwh = toNumber(r.after_kwh)
        const sKwh = Math.max(0, bKwh - aKwh)
        const co2Kg = toNumber(r.co2_kg)
        const meterCosts = monthlyCostByDevice.get(dId)
        const rateMeta = resolveRateForDateWithMeta(
          meterSite,
          r.last_record || r.first_record || null,
          rateRules,
          rateOverride,
        )
        const cB = meterCosts ? meterCosts.costBefore : Math.round(bKwh * rateMeta.rate)
        const cA = meterCosts ? meterCosts.costAfter : Math.round(aKwh * rateMeta.rate)
        const effectiveRate = bKwh > 0 ? Number((cB / bKwh).toFixed(4)) : rateMeta.rate
        const live = latestByDevice.get(dId)
        const ch1: ChannelLive = {
          kwh: bKwh,
          cost: cB,
          currentL1: toNullable(live?.before_l1),
          currentL2: toNullable(live?.before_l2),
          currentL3: toNullable(live?.before_l3),
          recordTime: live?.record_time ? String(live.record_time) : null,
        }
        const ch2: ChannelLive = {
          kwh: aKwh,
          cost: cA,
          currentL1: toNullable(live?.metrics_l1),
          currentL2: toNullable(live?.metrics_l2),
          currentL3: toNullable(live?.metrics_l3),
          recordTime: live?.record_time ? String(live.record_time) : null,
        }
        return {
          deviceId: dId,
          site: meterSite,
          beforeKwh: bKwh,
          afterKwh: aKwh,
          savedKwh: sKwh,
          recordCount: Number(r.record_count),
          firstRecord: r.first_record ? String(r.first_record) : null,
          lastRecord: r.last_record ? String(r.last_record) : null,
          costBefore: cB,
          costAfter: cA,
          savedCost: cB - cA,
          savingPct: bKwh > 0 ? Number(((sKwh / bKwh) * 100).toFixed(1)) : 0,
          co2SavedKg: Math.round(co2Kg),
          electricityRate: effectiveRate,
          rateSource: rateMeta.source,
          rateLabel: rateMeta.ruleLabel,
          channels: { ch1, ch2 },
        }
      })
    }

    const dbRuleCount = rateRules.filter((rule) => rule.isActive).length

    return NextResponse.json({
      success: true,
      data: {
        monthly,
        meters: meters.map((m) => ({
          deviceId: m.deviceId,
          deviceName: m.deviceName,
          geId: m.geId,
          seriesNo: m.seriesNo,
          meterId: m.meterId,
          meterNo: m.meterNo,
          ch1MeterNo: m.ch1MeterNo,
          ch2MeterNo: m.ch2MeterNo,
          channels: m.channels,
          site: m.site,
          locationName: formatDeviceLocation(m.site, m.locationName),
          label: m.label,
        })),
        meterStats,
        primarySite,
        siteRates: getSiteElectricityRates(),
        rateRules,
        rateRuleCount: dbRuleCount,
        dataSource: 'power_records',
        rateLogic: {
          siteField: 'devices.site / carbon_locations.site',
          timeField: 'power_records.record_time',
          fallback: 'env KOREA_ELECTRICITY_RATE / THAILAND_ELECTRICITY_RATE',
        },
        summary: {
          ...summary,
          totalSavedKwh,
          totalSavedCost,
          totalSavedBaht: totalSavedCost,
          savingPct:
            summary.totalBefore > 0
              ? Number(((totalSavedKwh / summary.totalBefore) * 100).toFixed(1))
              : 0,
          co2SavedKg: Math.round(totalCo2Kg),
          electricityRate: safeRate,
        },
      },
    })
  } catch (error: unknown) {
    console.error('customer-dashboard API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer dashboard data',
      },
      { status: 500 },
    )
  }
}
