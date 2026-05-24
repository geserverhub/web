import { NextResponse } from 'next/server'
import { getAllDevices } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const devices = await getAllDevices()
    return NextResponse.json({ success: true, devices })
  } catch (error: unknown) {
    console.error('devices API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch devices',
      },
      { status: 500 }
    )
  }
}
