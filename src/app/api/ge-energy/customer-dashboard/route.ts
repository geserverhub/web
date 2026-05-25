import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import {
  deviceFilterSql,
  resolveCustomerMeters,
  resolveRate,
  type CustomerScopeInput,
} from '@/lib/ge-energy/customer-scope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type MonthlyRow = {
  month_key: string
  year_num: number | string
  month_num: number | string
  before_kwh: number | string | null
  after_kwh: number | string | null
  saved_kwh: number | string | null
}

const toNumber = (value: number | string | null | undefined) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function parseScope(searchParams: URLSearchParams): CustomerScopeInput {
  return {
    userId: searchParams.get('userId'),
    clientId: searchParams.get('clientId'),
    email: searchParams.get('email'),
    phone: searchParams.get('phone'),
    username: searchParams.get('username'),
  }
}

function hasUserScope(scope: CustomerScopeInput) {
  return Boolean(
    scope.userId?.trim() ||
      scope.clientId?.trim() ||
      scope.email?.trim() ||
      scope.phone?.trim() ||
      scope.username?.trim(),
  )
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const scope = parseScope(searchParams)
    const userScoped = hasUserScope(scope)
    const deviceIdParam = searchParams.get('deviceId')
    const siteParam = (searchParams.get('site') || '').toLowerCase()

    let meters = userScoped ? await resolveCustomerMeters(scope) : []

    if (userScoped && !meters.length) {
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

    if (!userScoped) {
      const siteFilterSql =
        !siteParam || siteParam === 'all' ? '' : "AND LOWER(COALESCE(d.site, d.location, '')) LIKE ?"
      const siteParams = !siteParam || siteParam === 'all' ? [] : [`%${siteParam}%`]
      const legacyRows = (await queryGe(
        `SELECT DISTINCT d.deviceID AS device_id
         FROM devices d
         WHERE 1=1 ${siteFilterSql}`,
        siteParams,
      )) as Array<{ device_id: number }>
      deviceIds = legacyRows.map((r) => Number(r.device_id))
    }

    if (deviceIdParam) {
      const pick = Number(deviceIdParam)
      if (Number.isFinite(pick) && pick > 0) {
        deviceIds = userScoped
          ? deviceIds.filter((id) => id === pick)
          : [pick]
      }
    }

    const primarySite =
      (deviceIdParam
        ? meters.find((m) => m.deviceId === Number(deviceIdParam))?.site
        : meters[0]?.site) ||
      (siteParam && siteParam !== 'all' ? siteParam : 'thailand')

    const safeRate = resolveRate(primarySite, searchParams.get('rate'))
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

    const monthlyRows = await queryGe(
      `SELECT
        DATE_FORMAT(pr.record_time, '%Y-%m') AS month_key,
        YEAR(pr.record_time) AS year_num,
        MONTH(pr.record_time) AS month_num,
        SUM(COALESCE(pr.before_kWh, 0)) AS before_kwh,
        SUM(COALESCE(pr.metrics_kWh, 0)) AS after_kwh,
        SUM(COALESCE(pr.energy_reduction, 0)) AS saved_kwh
       FROM power_records pr
       INNER JOIN devices d ON d.deviceID = pr.device_id
       WHERE 1=1
       ${dateCondition}
       ${deviceSql}
       GROUP BY DATE_FORMAT(pr.record_time, '%Y-%m'), YEAR(pr.record_time), MONTH(pr.record_time)
       ORDER BY YEAR(pr.record_time) ASC, MONTH(pr.record_time) ASC`,
      [...dateConditionParams, ...deviceParams],
    )

    const monthly = (monthlyRows as MonthlyRow[]).map((row) => {
      const before = toNumber(row.before_kwh)
      const after = toNumber(row.after_kwh)

      return {
        monthKey: row.month_key,
        year: toNumber(row.year_num),
        monthIndex: toNumber(row.month_num),
        before,
        after,
        costBefore: Math.round(before * safeRate),
        costAfter: Math.round(after * safeRate),
        savedKwh: toNumber(row.saved_kwh),
      }
    })

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

    const totalSavedKwh = summary.totalBefore - summary.totalAfter
    const totalSavedCost = summary.totalCostBefore - summary.totalCostAfter

    // Per-meter aggregate stats
    let meterStats: Array<{
      deviceId: number
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
    }> = []

    if (deviceIds.length > 0) {
      const { sql: meterDevSql, params: meterDevParams } = deviceFilterSql(deviceIds)
      const meterRows = (await queryGe(
        `SELECT
           pr.device_id,
           SUM(COALESCE(pr.before_kWh, 0))       AS before_kwh,
           SUM(COALESCE(pr.metrics_kWh, 0))       AS after_kwh,
           SUM(COALESCE(pr.energy_reduction, 0))  AS saved_kwh,
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
        record_count: number | string
        first_record: string | null
        last_record: string | null
      }>

      // Use per-meter rate (match meter site)
      meterStats = meterRows.map((r) => {
        const dId = Number(r.device_id)
        const mMeta = meters.find((m) => m.deviceId === dId)
        const mRate = mMeta ? resolveRate(mMeta.site, searchParams.get('rate')) : safeRate
        const bKwh = toNumber(r.before_kwh)
        const aKwh = toNumber(r.after_kwh)
        const sKwh = toNumber(r.saved_kwh)
        const cB = Math.round(bKwh * mRate)
        const cA = Math.round(aKwh * mRate)
        return {
          deviceId: dId,
          beforeKwh: bKwh,
          afterKwh: aKwh,
          savedKwh: sKwh,
          recordCount: Number(r.record_count),
          firstRecord: r.first_record ? String(r.first_record) : null,
          lastRecord: r.last_record ? String(r.last_record) : null,
          costBefore: cB,
          costAfter: cA,
          savedCost: cB - cA,
          savingPct: bKwh > 0 ? Number(((bKwh - aKwh) / bKwh * 100).toFixed(1)) : 0,
          co2SavedKg: Math.round((bKwh - aKwh) * 0.5313),
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        monthly,
        meters: meters.map((m) => ({
          deviceId: m.deviceId,
          deviceName: m.deviceName,
          meterId: m.meterId,
          meterNo: m.meterNo,
          site: m.site,
          locationName: m.locationName,
          label: m.label,
        })),
        meterStats,
        primarySite,
        summary: {
          ...summary,
          totalSavedKwh,
          totalSavedCost,
          totalSavedBaht: totalSavedCost,
          savingPct:
            summary.totalBefore > 0
              ? Number(((totalSavedKwh / summary.totalBefore) * 100).toFixed(1))
              : 0,
          co2SavedKg: Math.round(totalSavedKwh * 0.5313),
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
