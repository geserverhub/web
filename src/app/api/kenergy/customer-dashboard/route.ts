import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

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

const SITE_RATES: Record<string, number> = {
  korea: Number(process.env.KOREA_ELECTRICITY_RATE || 140),
  thailand: Number(process.env.THAILAND_ELECTRICITY_RATE || 3.88),
  vietnam: Number(process.env.VIETNAM_ELECTRICITY_RATE || 2500),
  malaysia: Number(process.env.MALAYSIA_ELECTRICITY_RATE || 0.45),
}

function resolveRate(site: string, override?: string | null) {
  const fromQuery = override ? Number(override) : NaN
  if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery
  const fromEnv = Number(process.env.CUSTOMER_DASHBOARD_RATE)
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv
  return SITE_RATES[site] ?? SITE_RATES.thailand
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const site = (searchParams.get('site') || 'thailand').toLowerCase()
    const safeRate = resolveRate(site, searchParams.get('rate'))

    const siteFilterSql = site === 'all' ? '' : "AND LOWER(COALESCE(d.site, d.location, '')) LIKE ?"
    const siteParams = site === 'all' ? [] : [`%${site}%`]

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
       WHERE pr.record_time >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
       ${siteFilterSql}
       GROUP BY DATE_FORMAT(pr.record_time, '%Y-%m'), YEAR(pr.record_time), MONTH(pr.record_time)
       ORDER BY YEAR(pr.record_time) ASC, MONTH(pr.record_time) ASC`,
      siteParams
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
        savedKwh: toNumber(row.saved_kwh)
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
      { totalBefore: 0, totalAfter: 0, totalCostBefore: 0, totalCostAfter: 0 }
    )

    return NextResponse.json({
      success: true,
      data: {
        monthly,
        summary: {
          ...summary,
          totalSavedKwh: summary.totalBefore - summary.totalAfter,
          totalSavedBaht: summary.totalCostBefore - summary.totalCostAfter,
          savingPct: summary.totalBefore > 0
            ? Number((((summary.totalBefore - summary.totalAfter) / summary.totalBefore) * 100).toFixed(1))
            : 0,
          co2SavedKg: Math.round((summary.totalBefore - summary.totalAfter) * 0.5313),
          electricityRate: safeRate
        }
      }
    })
  } catch (error: unknown) {
    console.error('customer-dashboard API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch customer dashboard data'
    }, { status: 500 })
  }
}
