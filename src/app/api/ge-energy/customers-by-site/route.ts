import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ge-energy/customers-by-site?site=thailand
 *
 * Returns customers that have devices in the specified site
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const site = searchParams.get('site') || 'thailand'

    // Get customers with their device count for the selected site
    const customers = await queryGe(
      `SELECT
        d.customerName,
        d.site,
        COUNT(DISTINCT d.deviceID) as deviceCount,
        GROUP_CONCAT(DISTINCT d.deviceID ORDER BY d.deviceID) as deviceIds,
        GROUP_CONCAT(DISTINCT d.deviceName ORDER BY d.deviceID SEPARATOR '|') as deviceNames
       FROM devices d
       WHERE d.site = ?
         AND d.customerName IS NOT NULL
         AND d.customerName != ''
       GROUP BY d.customerName, d.site
       ORDER BY d.customerName ASC`,
      [site]
    )

    // Format response
    const formattedCustomers = customers.map((c: any) => ({
      customerName: c.customerName,
      site: c.site,
      deviceCount: parseInt(c.deviceCount) || 0,
      deviceIds: c.deviceIds ? c.deviceIds.split(',').map((id: string) => id.trim()) : [],
      deviceNames: c.deviceNames ? c.deviceNames.split('|').map((name: string) => name.trim()) : []
    }))

    return NextResponse.json({
      success: true,
      site,
      count: formattedCustomers.length,
      customers: formattedCustomers
    })

  } catch (err: any) {
    console.error('Customers by site API error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to fetch customers'
    }, { status: 500 })
  }
}
