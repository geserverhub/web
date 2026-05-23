import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const deviceId = params.get('deviceId')
    const from     = params.get('from')              // YYYY-MM-DD
    const to       = params.get('to')                // YYYY-MM-DD
    const period   = params.get('period') ?? 'minute' // minute | hour | day
    const limit    = parseInt(params.get('limit') ?? '1440')

    if (!deviceId) {
      return NextResponse.json({ success: false, error: 'deviceId required' }, { status: 400 })
    }

    const timeFormat =
      period === 'day'  ? '%Y-%m-%d' :
      period === 'hour' ? '%Y-%m-%d %H:00' :
                          '%Y-%m-%d %H:%i'

    let where = 'WHERE device_id = ?'
    const binds: any[] = [deviceId]
    if (from) { where += ' AND DATE(record_time) >= ?'; binds.push(from) }
    if (to)   { where += ' AND DATE(record_time) <= ?'; binds.push(to) }

    const rows: any[] = await queryGe(
      `SELECT
         DATE_FORMAT(record_time, ?) AS time,
         AVG(before_L1)        AS voltageL1,
         AVG(before_L2)        AS voltageL2,
         AVG(before_L3)        AS voltageL3,
         AVG(metrics_L1)       AS currentL1,
         AVG(metrics_L2)       AS currentL2,
         AVG(metrics_L3)       AS currentL3,
         AVG(metrics_P)        AS totalPower,
         AVG(metrics_Q)        AS reactivePower,
         AVG(metrics_S)        AS apparentPower,
         AVG(metrics_PF)       AS powerFactor,
         AVG(metrics_F)        AS frequency,
         AVG(metrics_kWh)      AS energy,
         AVG(energy_reduction) AS energySaved,
         AVG(co2_reduction)    AS co2Saved,
         AVG(before_THD)       AS thdBefore,
         AVG(metrics_THD)      AS thdAfter,
         HOUR(MIN(record_time))    AS hour,
         DAYOFWEEK(MIN(record_time)) AS dow
       FROM power_records
       ${where}
       GROUP BY DATE_FORMAT(record_time, ?)
       ORDER BY MIN(record_time) DESC
       LIMIT ?`,
      [timeFormat, ...binds, timeFormat, limit]
    )

    const OFF_PEAK_RATE = 2.6
    const ON_PEAK_RATE  = 4.1

    const history = rows.reverse().map((r: any) => {
      const h   = Number(r.hour)
      const dow = Number(r.dow)
      const isWeekend = dow === 1 || dow === 7
      const isOffPeak = isWeekend || h < 9 || h >= 22
      const energy    = Number(r.energy) || 0
      const rate      = isOffPeak ? OFF_PEAK_RATE : ON_PEAK_RATE

      return {
        time:          r.time,
        voltageL1:     Number(r.voltageL1)     || 0,
        voltageL2:     Number(r.voltageL2)     || 0,
        voltageL3:     Number(r.voltageL3)     || 0,
        currentL1:     Number(r.currentL1)     || 0,
        currentL2:     Number(r.currentL2)     || 0,
        currentL3:     Number(r.currentL3)     || 0,
        totalPower:    Number(r.totalPower)    || 0,
        reactivePower: Number(r.reactivePower) || 0,
        apparentPower: Number(r.apparentPower) || 0,
        powerFactor:   Number(r.powerFactor)   || 0,
        frequency:     Number(r.frequency)     || 0,
        energy,
        energySaved:   Number(r.energySaved)   || 0,
        co2Saved:      Number(r.co2Saved)      || 0,
        thdBefore:     r.thdBefore != null ? Number(r.thdBefore) : null,
        thdAfter:      r.thdAfter  != null ? Number(r.thdAfter)  : null,
        offPeak:       isOffPeak ? energy : 0,
        onPeak:        isOffPeak ? 0      : energy,
        costOffPeak:   isOffPeak ? energy * OFF_PEAK_RATE : 0,
        costOnPeak:    isOffPeak ? 0      : energy * ON_PEAK_RATE,
        cost:          energy * rate,
      }
    })

    return NextResponse.json({ success: true, history })
  } catch (error: any) {
    console.error('device-history error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
