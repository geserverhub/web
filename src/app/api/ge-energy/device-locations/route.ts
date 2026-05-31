import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ge-energy/device-locations
 * 錫붲마錫뉋툊仙됢릎錫□많錫?릎錫멘툤錫곟르錫볙퉴錫쀠링仙댽륫錫듀툧錫닮툈錫긍툝 location 錫왽르仙됢릎錫□릉錫뽤림錫쇸린 online/offline
 * Query params:
 *   - site: thailand | korea | all
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const site = searchParams.get('site') || 'thailand'

    const devices = await queryGe(`
      SELECT
        d.deviceID as id,
        d.deviceName as name,
        d.latitude as lat,
        d.longitude as lng,
        d.location,
        d.ipAddress,
        CASE
          WHEN MAX(p.record_time) >= NOW() - INTERVAL 20 MINUTE THEN 'online'
          ELSE 'offline'
        END as status
      FROM devices d
      LEFT JOIN power_records p ON d.deviceID = p.device_id
      WHERE d.latitude IS NOT NULL AND d.longitude IS NOT NULL
        AND (d.location LIKE ? OR ? = 'all')
      GROUP BY d.deviceID, d.deviceName, d.latitude, d.longitude, d.location, d.ipAddress
      ORDER BY d.deviceName ASC
    `, [
      site === 'thailand' ? '%Thailand%' : (site === 'korea' ? '%Korea%' : '%'),
      site
    ])

    return NextResponse.json({
      success: true,
      count: devices.length,
      devices
    })
  } catch (err: any) {
    console.error('Device locations API error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to fetch device locations'
    }, { status: 500 })
  }
}

/**
 * PUT /api/ge-energy/device-locations
 * 錫?릴錫왽?錫붲툠錫왽릿錫곟릴錫?location 錫귖릎錫뉋릎錫멘툤錫곟르錫볙퉴
 * Body: { deviceId: number, latitude: number, longitude: number }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceId, latitude, longitude } = body

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'deviceId is required'
      }, { status: 400 })
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({
        success: false,
        error: 'latitude and longitude are required'
      }, { status: 400 })
    }

    await queryGe(`
      UPDATE devices
      SET latitude = ?, longitude = ?, updated_at = NOW()
      WHERE deviceID = ?
    `, [latitude, longitude, deviceId])

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully'
    })
  } catch (err: any) {
    console.error('Update location error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to update location'
    }, { status: 500 })
  }
}
