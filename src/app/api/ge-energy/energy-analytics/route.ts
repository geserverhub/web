import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30' // days
    const deviceId = searchParams.get('deviceId') // optional device filter
    const site = (searchParams.get('site') || 'thailand').toLowerCase()

    // Build WHERE clause
    let whereClause = `WHERE pr.record_time >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`
    const params: any[] = []

    const validSites = ['thailand', 'korea', 'vietnam', 'malaysia']
    const safeSite = validSites.includes(site) ? site : 'thailand'
    whereClause += " AND LOWER(COALESCE(d.site, d.location, '')) LIKE ?"
    params.push(`%${safeSite}%`)

    if (deviceId) {
      whereClause += ' AND pr.device_id = ?'
      params.push(deviceId)
    }

    // 1. Get daily aggregated energy data
    const dailyData = await queryGe(
      `SELECT
        DATE(pr.record_time) as date,
        COUNT(DISTINCT pr.device_id) as active_devices,
        SUM(pr.energy_reduction) as total_energy_saved,
        SUM(pr.co2_reduction) as total_co2_saved,
        AVG(pr.before_kWh) as avg_before_kwh,
        AVG(pr.metrics_kWh) as avg_after_kwh,
        AVG(pr.metrics_P) as avg_power
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       ${whereClause}
       GROUP BY DATE(pr.record_time)
       ORDER BY date ASC`,
      params
    )

    // 2. Get total summary statistics
    const summaryResult = await queryGe(
      `SELECT
        SUM(pr.energy_reduction) as total_energy_saved,
        SUM(pr.co2_reduction) as total_co2_saved,
        AVG(pr.before_kWh) as avg_before,
        AVG(pr.metrics_kWh) as avg_after,
        COUNT(DISTINCT pr.device_id) as device_count
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       ${whereClause}`,
      params
    )

    const summary = summaryResult[0] || {
      total_energy_saved: 0,
      total_co2_saved: 0,
      avg_before: 0,
      avg_after: 0,
      device_count: 0
    }

    // 3. Calculate cost savings (assuming 4 THB/kWh average rate)
    const electricityRate = Number(searchParams.get('rate') || 4)
    const costSavings = Math.round((summary.total_energy_saved || 0) * electricityRate)

    // 4. Calculate percentage reduction
    const avgBefore = summary.avg_before || 0
    const avgAfter = summary.avg_after || 0
    const reductionPercent = avgBefore > 0
      ? Math.round(((avgBefore - avgAfter) / avgBefore) * 100)
      : 0

    // 5. Get hourly pattern data (last 24 hours for chart)
    const hourlyParams: any[] = [`%${safeSite}%`]
    let hourlyWhere = "WHERE pr.record_time >= NOW() - INTERVAL 24 HOUR AND LOWER(COALESCE(d.site, d.location, '')) LIKE ?"
    if (deviceId) {
      hourlyWhere += ' AND pr.device_id = ?'
      hourlyParams.push(deviceId)
    }

    const hourlyPattern = await queryGe(
      `SELECT
        HOUR(pr.record_time) as hour,
        AVG(pr.metrics_P) as avg_power,
        AVG(pr.energy_reduction) as avg_savings
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       ${hourlyWhere}
       GROUP BY HOUR(pr.record_time)
       ORDER BY hour ASC`,
      hourlyParams
    )

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEnergySaved: Math.round(summary.total_energy_saved || 0),
          totalCO2Saved: Math.round(summary.total_co2_saved || 0),
          costSavings,
          reductionPercent,
          deviceCount: summary.device_count || 0,
          avgBefore: Math.round(avgBefore),
          avgAfter: Math.round(avgAfter)
        },
        dailyData: dailyData.map((row: any) => ({
          date: row.date,
          activeDevices: row.active_devices || 0,
          energySaved: Math.round(row.total_energy_saved || 0),
          co2Saved: Math.round(row.total_co2_saved || 0),
          avgBefore: Math.round(row.avg_before_kwh || 0),
          avgAfter: Math.round(row.avg_after_kwh || 0),
          avgPower: parseFloat((row.avg_power || 0).toFixed(2))
        })),
        hourlyPattern: hourlyPattern.map((row: any) => ({
          hour: row.hour,
          avgPower: parseFloat((row.avg_power || 0).toFixed(2)),
          avgSavings: parseFloat((row.avg_savings || 0).toFixed(2))
        })),
        period: parseInt(period)
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Energy analytics error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch energy analytics'
    }, { status: 500 })
  }
}
