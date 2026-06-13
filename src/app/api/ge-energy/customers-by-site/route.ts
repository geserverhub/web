import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'
import { normalizeCustomerDisplayName } from '@/lib/ge-energy/customer-display'
import { deviceSiteFilterSql } from '@/lib/ge-energy/customer-scope'
import { getDevicesColumnSet, resolveMeterIdColumn } from '@/lib/ge-energy/devices-schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await queryGe(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [tableName],
  )
  return rows.length > 0
}

/**
 * GET /api/ge-energy/customers-by-site?site=thailand
 *
 * Lists customers that have at least one device on the selected site.
 * deviceIds / deviceCount include every meter for that customer (all sites),
 * grouped by customer_id when set, otherwise by customerName.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const site = searchParams.get('site') || 'thailand'

    const deviceColumns = await getDevicesColumnSet()
    const meterIdCol = resolveMeterIdColumn(deviceColumns)
    const hasCustomerId = deviceColumns.has('customer_id')
    const hasEqCustomers = hasCustomerId && (await tableExists('eq_customers'))
    const siteFilter = deviceSiteFilterSql(site, meterIdCol)

    const customerKeyExpr = hasCustomerId
      ? `COALESCE(CAST(d.customer_id AS CHAR) COLLATE utf8mb4_unicode_ci, NULLIF(TRIM(d.customerName COLLATE utf8mb4_unicode_ci), ''))`
      : `NULLIF(TRIM(d.customerName COLLATE utf8mb4_unicode_ci), '')`

    const nameExpr = hasEqCustomers
      ? `COALESCE(NULLIF(TRIM(ec.customer_name COLLATE utf8mb4_unicode_ci), ''), NULLIF(TRIM(d.customerName COLLATE utf8mb4_unicode_ci), ''))`
      : `NULLIF(TRIM(d.customerName COLLATE utf8mb4_unicode_ci), '')`

    // Customers visible on this site (at least one device here)
    const visibleRows = await queryGe(
      `SELECT DISTINCT ${customerKeyExpr} AS customer_key
       FROM devices d
       ${hasEqCustomers ? 'LEFT JOIN eq_customers ec ON ec.id = d.customer_id' : ''}
       WHERE (${siteFilter.sql})
         AND (${customerKeyExpr}) IS NOT NULL`,
      siteFilter.params,
    )

    const keys = (visibleRows as { customer_key?: string | null }[])
      .map((r) => String(r.customer_key || '').trim())
      .filter(Boolean)

    if (!keys.length) {
      return NextResponse.json({ success: true, site, count: 0, customers: [] })
    }

    const placeholders = keys.map(() => '?').join(',')
    const customers = await queryGe(
      `SELECT
        ${nameExpr} AS customerName,
        ${hasCustomerId ? 'MAX(d.customer_id) AS customer_id,' : ''}
        COUNT(DISTINCT d.deviceID) AS deviceCount,
        GROUP_CONCAT(DISTINCT d.deviceID ORDER BY d.deviceID) AS deviceIds,
        GROUP_CONCAT(DISTINCT d.deviceName ORDER BY d.deviceID SEPARATOR '|') AS deviceNames
       FROM devices d
       ${hasEqCustomers ? 'LEFT JOIN eq_customers ec ON ec.id = d.customer_id' : ''}
       WHERE (${customerKeyExpr}) IN (${placeholders})
       GROUP BY ${hasCustomerId ? 'COALESCE(d.customer_id, 0),' : ''} ${nameExpr}
       ORDER BY customerName ASC`,
      keys,
    )

    const formattedCustomers = (customers as Record<string, unknown>[]).map((c) => {
      const rawName = String(c.customerName || '')
      return {
        customerName: normalizeCustomerDisplayName(rawName) || rawName,
        customer_id: c.customer_id != null ? Number(c.customer_id) : null,
        site,
        deviceCount: parseInt(String(c.deviceCount), 10) || 0,
        deviceIds: c.deviceIds
          ? String(c.deviceIds).split(',').map((id) => id.trim())
          : [],
        deviceNames: c.deviceNames
          ? String(c.deviceNames).split('|').map((name) => name.trim())
          : [],
      }
    })

    return NextResponse.json({
      success: true,
      site,
      count: formattedCustomers.length,
      customers: formattedCustomers,
    })
  } catch (err: unknown) {
    console.error('Customers by site API error:', err)
    const message = err instanceof Error ? err.message : 'Failed to fetch customers'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
