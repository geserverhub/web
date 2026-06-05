import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ge-energy/device-notifications
 * List per-device notification settings by site.
 * Query params:
 *   - site: thailand | korea | all
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const site = searchParams.get('site') || 'thailand'

    const notifications = await queryGe(`
      SELECT
        d.deviceID,
        d.deviceName,
        d.GEsaveID,
        d.U_email as owner,
        d.location,
        COALESCE(dn.alarm_enabled, 1) as alarm_enabled,
        COALESCE(dn.high_active_enabled, 0) as high_active_enabled,
        COALESCE(dn.low_active_enabled, 0) as low_active_enabled,
        COALESCE(dn.message_enabled, 0) as message_enabled,
        COALESCE(dn.email_enabled, 0) as email_enabled,
        COALESCE(dn.output_enabled, 0) as output_enabled,
        dn.updated_at as lastUpdate
      FROM devices d
      LEFT JOIN device_notifications dn ON d.deviceID = dn.device_id
      WHERE d.location LIKE ? OR ? = 'all'
      ORDER BY d.deviceName ASC
    `, [
      site === 'thailand' ? '%Thailand%' : (site === 'korea' ? '%Korea%' : '%'),
      site
    ])

    // Format to match frontend expectations
    const formattedNotifications = notifications.map((n: any, index: number) => ({
      no: index + 1,
      deviceID: n.deviceID,
      name: n.deviceName,
      type: 'Energy 3-Ph',
      owner: n.owner,
      alarm: Boolean(n.alarm_enabled),
      highActive: Boolean(n.high_active_enabled),
      lowActive: Boolean(n.low_active_enabled),
      message: Boolean(n.message_enabled),
      email: Boolean(n.email_enabled),
      output: Boolean(n.output_enabled),
      lastUpdate: n.lastUpdate || new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      count: formattedNotifications.length,
      notifications: formattedNotifications
    })
  } catch (err: any) {
    console.error('Device notifications API error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to fetch device notifications'
    }, { status: 500 })
  }
}

/**
 * PUT /api/ge-energy/device-notifications
 * ??????????????????????????????????
 * Body: {
 *   deviceId: number,
 *   alarm_enabled?: boolean,
 *   high_active_enabled?: boolean,
 *   low_active_enabled?: boolean,
 *   message_enabled?: boolean,
 *   email_enabled?: boolean,
 *   output_enabled?: boolean
 * }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      deviceId,
      alarm_enabled,
      high_active_enabled,
      low_active_enabled,
      message_enabled,
      email_enabled,
      output_enabled
    } = body

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'deviceId is required'
      }, { status: 400 })
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE pattern
    await queryGe(`
      INSERT INTO device_notifications
        (device_id, alarm_enabled, high_active_enabled, low_active_enabled,
         message_enabled, email_enabled, output_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        alarm_enabled = VALUES(alarm_enabled),
        high_active_enabled = VALUES(high_active_enabled),
        low_active_enabled = VALUES(low_active_enabled),
        message_enabled = VALUES(message_enabled),
        email_enabled = VALUES(email_enabled),
        output_enabled = VALUES(output_enabled),
        updated_at = NOW()
    `, [
      deviceId,
      alarm_enabled !== undefined ? (alarm_enabled ? 1 : 0) : 1,
      high_active_enabled !== undefined ? (high_active_enabled ? 1 : 0) : 0,
      low_active_enabled !== undefined ? (low_active_enabled ? 1 : 0) : 0,
      message_enabled !== undefined ? (message_enabled ? 1 : 0) : 0,
      email_enabled !== undefined ? (email_enabled ? 1 : 0) : 0,
      output_enabled !== undefined ? (output_enabled ? 1 : 0) : 0
    ])

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully'
    })
  } catch (err: any) {
    console.error('Update notification settings error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to update notification settings'
    }, { status: 500 })
  }
}
