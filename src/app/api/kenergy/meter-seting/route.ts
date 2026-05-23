import { NextResponse } from 'next/server'
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
