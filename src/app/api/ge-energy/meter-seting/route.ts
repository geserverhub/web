import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const devices = await queryGe(`
      SELECT *
      FROM devices
      ORDER BY created_at DESC, deviceID DESC
    `)

    return NextResponse.json({
      success: true,
      devices,
      total: devices.length
    })
  } catch (error: unknown) {
    console.error('Meter setting API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch devices'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      deviceName, GEsaveID, series_no, ipAddress, location,
      site, status, beforeMeterNo, metricsMeterNo,
      U_email, P_email, phone, pass_phone,
      latitude, longitude, customerName, customerPhone, customerAddress,
    } = body

    if (!deviceName?.trim()) {
      return NextResponse.json({ success: false, error: 'deviceName is required' }, { status: 400 })
    }

    await queryGe(
      `INSERT INTO devices
        (deviceName, GEsaveID, series_no, ipAddress, location, site, status,
         beforeMeterNo, metricsMeterNo, U_email, P_email, phone, pass_phone,
         latitude, longitude, customerName, customerPhone, customerAddress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deviceName.trim(),
        GEsaveID?.trim() || null,
        series_no?.trim() || null,
        ipAddress?.trim() || null,
        location?.trim() || null,
        site || 'thailand',
        status || 'OK',
        beforeMeterNo?.trim() || '1',
        metricsMeterNo?.trim() || '2',
        U_email?.trim() || '',
        P_email?.trim() || '',
        phone?.trim() || '',
        pass_phone?.trim() || '',
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        customerName?.trim() || null,
        customerPhone?.trim() || null,
        customerAddress?.trim() || null,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Add machine API error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to add device'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
