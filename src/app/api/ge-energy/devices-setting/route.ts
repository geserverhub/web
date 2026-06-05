import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'
import { normalizeCustomerDisplayName } from '@/lib/ge-energy/customer-display'
import {
  buildInstallationLocationExpr,
  deviceSiteFilterSql,
  formatDeviceLocation,
  inferSiteFromMeterId,
  normalizeSiteKey,
  resolveDeviceSite,
} from '@/lib/ge-energy/customer-scope'
import {
  ensureDevicesSchema,
  getDevicesColumnSet,
  meterIdGroupBySql,
  meterIdSelectSql,
  resolveMeterIdColumn,
} from '@/lib/ge-energy/devices-schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await queryGe(
    `SELECT 1 AS ok
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName],
  )
  return rows.length > 0
}

async function isDeviceIdAutoIncrement(): Promise<boolean> {
  const rows = await queryGe(
    `SELECT EXTRA
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'devices'
       AND COLUMN_NAME = 'deviceID'
     LIMIT 1`
  )

  const extra = String((rows as any[])[0]?.EXTRA || '').toLowerCase()
  return extra.includes('auto_increment')
}

/**
 * GET /api/ge-energy/devices-setting
 * ???????????????????????????? realtime
 * Query params:
 *   - site: thailand | korea | all
 */
export async function GET(req: NextRequest) {
  try {
    await ensureDevicesSchema()
    const { searchParams } = new URL(req.url)
    const site = searchParams.get('site') || 'thailand'
    const deviceIdParam = searchParams.get('deviceId')
    const deviceColumns = await getDevicesColumnSet()
    const hasCustomerName = deviceColumns.has('customerName')
    const hasCustomerPhone = deviceColumns.has('customerPhone')
    const hasCustomerAddress = deviceColumns.has('customerAddress')
    const hasCustomerId = deviceColumns.has('customer_id')
    const hasBeforeMeterNo = deviceColumns.has('beforeMeterNo')
    const hasMetricsMeterNo = deviceColumns.has('metricsMeterNo')
    const hasRecordScope = deviceColumns.has('record_scope')
    const meterIdCol = resolveMeterIdColumn(deviceColumns)
    const meterIdSelect = meterIdCol ? `d.${meterIdCol} AS GEsaveID` : 'NULL AS GEsaveID'
    const hasEqSites = await tableExists('eq_device_sites') && await tableExists('eq_sites')
    const hasMomoge = await tableExists('momoge_cus')
    const hasCarbonLoc = await tableExists('carbon_locations')
    const hasPreinstall = await tableExists('power_records_preinstall')
    const installationLocationExpr = buildInstallationLocationExpr({
      hasEqSites,
      hasCarbonLoc,
      hasMomoge,
      hasCustomerAddress,
    })
    const locationJoins = [
      hasEqSites
        ? `LEFT JOIN eq_device_sites ds ON ds.device_id = d.deviceID
       LEFT JOIN eq_sites es ON es.id = ds.site_id`
        : '',
      hasMomoge && hasCarbonLoc
        ? `LEFT JOIN momoge_cus mc ON mc.device_id = d.deviceID
       LEFT JOIN carbon_locations cl ON cl.locationID = mc.LocationID`
        : '',
    ]
      .filter(Boolean)
      .join('\n      ')
    const lastUpdateExpr = hasPreinstall
      ? `GREATEST(COALESCE(MAX(p.record_time), '1970-01-01'), COALESCE(MAX(p_pre.record_time), '1970-01-01'))`
      : 'MAX(p.record_time)'
    const preinstallJoin = hasPreinstall
      ? 'LEFT JOIN power_records_preinstall p_pre ON d.deviceID = p_pre.device_id'
      : ''

    const customerSelectFields = [
      hasCustomerId ? 'd.customer_id,' : '',
      hasCustomerName ? 'd.customerName,' : '',
      hasCustomerPhone ? 'd.customerPhone,' : '',
      hasCustomerAddress ? 'd.customerAddress,' : '',
      hasBeforeMeterNo ? 'd.beforeMeterNo,' : '',
      hasMetricsMeterNo ? 'd.metricsMeterNo,' : '',
      hasRecordScope ? 'd.record_scope,' : '',
    ]
      .filter(Boolean)
      .join('\n        ')

    const customerGroupByFields = [
      hasCustomerId ? 'd.customer_id,' : '',
      hasCustomerName ? 'd.customerName,' : '',
      hasCustomerPhone ? 'd.customerPhone,' : '',
      hasCustomerAddress ? 'd.customerAddress,' : '',
      hasBeforeMeterNo ? 'd.beforeMeterNo,' : '',
      hasMetricsMeterNo ? 'd.metricsMeterNo,' : '',
      hasRecordScope ? 'd.record_scope,' : '',
    ]
      .filter(Boolean)
      .join('\n               ')

    const deviceIdFilter = deviceIdParam && /^\d+$/.test(deviceIdParam)
    const siteFilter = deviceSiteFilterSql(site, meterIdCol)
    const whereClause = deviceIdFilter
      ? 'WHERE d.deviceID = ?'
      : `WHERE (${siteFilter.sql})`
    const whereParams = deviceIdFilter
      ? [Number(deviceIdParam)]
      : siteFilter.params

    const devices = await queryGe(`
      SELECT
        d.deviceID,
        d.deviceName,
        ${meterIdSelect},
        d.U_email as owner,
        ${customerSelectFields}
        d.location,
        ${installationLocationExpr} AS installation_location,
        d.latitude,
        d.longitude,
        d.ipAddress,
        d.site,
        d.phone,
        d.created_at as registerDate,
        ${lastUpdateExpr} as lastUpdate,
        TIMESTAMPDIFF(SECOND, ${lastUpdateExpr}, NOW()) as secondsSinceUpdate,
        CASE
          WHEN ${lastUpdateExpr} >= NOW() - INTERVAL 20 MINUTE THEN 'ONLINE'
          ELSE 'OFFLINE'
        END as connection
      FROM devices d
      LEFT JOIN power_records p ON d.deviceID = p.device_id
      ${preinstallJoin}
      ${locationJoins}
      ${whereClause}
      GROUP BY d.deviceID, d.deviceName, ${meterIdCol ? `d.${meterIdCol},` : ''} d.U_email,
               ${customerGroupByFields}
               d.location, d.latitude, d.longitude, d.ipAddress, d.site, d.phone, d.created_at
               ${hasCustomerAddress ? ', d.customerAddress' : ''}
      ORDER BY d.deviceName ASC
    `, whereParams)

    const formattedDevices = devices.map((d: Record<string, unknown>) => {
      const meterSite = resolveDeviceSite(
        d.site as string,
        d.GEsaveID as string,
        String(d.installation_location || d.location || ''),
      )
      const rawLocation = String(d.installation_location || d.location || '').trim()
      return {
        ...d,
        customerName: d.customerName
          ? normalizeCustomerDisplayName(d.customerName as string, d.deviceName as string)
          : d.customerName,
        site: meterSite,
        location: formatDeviceLocation(meterSite, rawLocation),
        timeSinceUpdate: d.secondsSinceUpdate ? formatTimeSince(Number(d.secondsSinceUpdate)) : 'N/A',
        lastUpdate: d.lastUpdate || null,
        registerDate: d.registerDate
          ? new Date(String(d.registerDate)).toISOString().split('T')[0]
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      count: formattedDevices.length,
      devices: formattedDevices
    })
  } catch (err: any) {
    console.error('Devices setting API error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to fetch devices'
    }, { status: 500 })
  }
}

/**
 * PUT /api/ge-energy/devices-setting
 * ??????????????????????????? * Body: { deviceId, deviceName?, location?, owner?, ipAddress?, latitude?, longitude? }
 */
export async function PUT(req: NextRequest) {
  try {
    await ensureDevicesSchema()
    const body = await req.json()
    const { deviceId, deviceName, location, owner, ipAddress, latitude, longitude, customerName, customerPhone, customerAddress, customerId } = body
    const deviceColumns = await getDevicesColumnSet()
    const missingCustomerColumns: string[] = []
    const hasCustomerId = deviceColumns.has('customer_id')

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'deviceId is required'
      }, { status: 400 })
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: any[] = []

    if (deviceName !== undefined) {
      updates.push('deviceName = ?')
      params.push(deviceName)
    }
    if (location !== undefined) {
      updates.push('location = ?')
      params.push(location)
    }
    if (owner !== undefined) {
      updates.push('U_email = ?')
      params.push(owner)
    }
    if (ipAddress !== undefined) {
      updates.push('ipAddress = ?')
      params.push(ipAddress)
    }
    if (latitude !== undefined) {
      updates.push('latitude = ?')
      params.push(latitude)
    }
    if (longitude !== undefined) {
      updates.push('longitude = ?')
      params.push(longitude)
    }
    if (customerName !== undefined) {
      if (deviceColumns.has('customerName')) {
        updates.push('customerName = ?')
        params.push(customerName)
      } else {
        missingCustomerColumns.push('customerName')
      }
    }
    if (customerPhone !== undefined) {
      if (deviceColumns.has('customerPhone')) {
        updates.push('customerPhone = ?')
        params.push(customerPhone)
      } else {
        missingCustomerColumns.push('customerPhone')
      }
    }
    if (customerAddress !== undefined) {
      if (deviceColumns.has('customerAddress')) {
        updates.push('customerAddress = ?')
        params.push(customerAddress)
      } else {
        missingCustomerColumns.push('customerAddress')
      }
    }
    if (customerId !== undefined && customerId !== null && customerId !== '') {
      if (hasCustomerId) {
        updates.push('customer_id = ?')
        params.push(customerId)
      } else if (Number(customerId) > 0) {
        missingCustomerColumns.push('customer_id')
      }
    } else if (hasCustomerId && customerId !== undefined) {
      updates.push('customer_id = ?')
      params.push(null)
    }

    if (missingCustomerColumns.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing column(s) in devices table: ${missingCustomerColumns.join(', ')}`,
        hint: 'Run database_schemas/alter_devices_add_customer_info.sql on GE Energy database'
      }, { status: 400 })
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No fields to update'
      }, { status: 400 })
    }

    updates.push('updated_at = NOW()')
    params.push(deviceId)

    await queryGe(`
      UPDATE devices
      SET ${updates.join(', ')}
      WHERE deviceID = ?
    `, params)

    return NextResponse.json({
      success: true,
      message: 'Device updated successfully'
    })
  } catch (err: any) {
    console.error('Update device error:', err)

    // Handle duplicate GE ID error
    if (err.code === 'ER_DUP_ENTRY' && err.message?.includes('unique_GEsaveID')) {
      return NextResponse.json({
        success: false,
        error: 'GE ID already exists. Please use a unique GE ID.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to update device'
    }, { status: 500 })
  }
}

/**
 * POST /api/ge-energy/devices-setting
 * ??????????????????? * Body: { deviceName, GEsaveID?, location?, site?, owner?, ipAddress?, customerName?, customerPhone?, customerAddress? }
 */
export async function POST(req: NextRequest) {
  try {
    await ensureDevicesSchema()
    const body = await req.json()
    const {
      deviceName,
      GEsaveID,
      location,
      site,
      owner,
      ipAddress,
      latitude,
      longitude,
      customerName,
      customerPhone,
      customerAddress,
      phone,
      passPhone,
      seriesNo,
      status,
      customerId
    } = body

    if (!deviceName || !String(deviceName).trim()) {
      return NextResponse.json({
        success: false,
        error: 'deviceName is required'
      }, { status: 400 })
    }
    if (!seriesNo || !String(seriesNo).trim()) {
      return NextResponse.json({
        success: false,
        error: 'seriesNo is required'
      }, { status: 400 })
    }

    const deviceColumns = await getDevicesColumnSet()
    const hasCustomerName = deviceColumns.has('customerName')
    const hasCustomerPhone = deviceColumns.has('customerPhone')
    const hasCustomerAddress = deviceColumns.has('customerAddress')
    const hasSeriesNo = deviceColumns.has('series_no')
    const hasLatitude = deviceColumns.has('latitude')
    const hasLongitude = deviceColumns.has('longitude')
    const hasCreateBy = deviceColumns.has('create_by')
    const hasCustomerId = deviceColumns.has('customer_id')
    const missingColumns: string[] = []
    const autoIncrementDeviceId = await isDeviceIdAutoIncrement()

    const meterIdValue = String(GEsaveID || '').trim() || String(deviceName).trim()
    const normalizedSite =
      inferSiteFromMeterId(meterIdValue) ||
      String(site || 'thailand').trim() ||
      'thailand'
    const normalizedOwner = String(owner || '').trim() || 'no-reply@ge.local'
    const normalizedPhone = String(phone ?? customerPhone ?? '-').trim() || '-'
    const normalizedPassPhone = String(passPhone ?? normalizedPhone).trim() || normalizedPhone
    const normalizedLocation = String(location || '').trim() || (
      normalizedSite === 'korea'
        ? 'Korea'
        : normalizedSite === 'vietnam'
          ? 'Vietnam'
          : normalizedSite === 'malaysia'
            ? 'Malaysia'
            : 'Thailand'
    )

    const columns: string[] = []
    const values: any[] = []
    let newDeviceId: number | null = null

    if (!autoIncrementDeviceId) {
      const nextIdRows = await queryGe('SELECT COALESCE(MAX(deviceID), 0) + 1 AS nextId FROM devices')
      newDeviceId = Number((nextIdRows as any[])[0]?.nextId || 1)
      columns.push('deviceID')
      values.push(newDeviceId)
    }

    columns.push('deviceName')
    values.push(String(deviceName).trim())

    const meterIdCol = resolveMeterIdColumn(deviceColumns)
    if (!meterIdCol) {
      return NextResponse.json({
        success: false,
        error: 'devices table has no GEsaveID column (run ensureDevicesSchema or migrate-rename-gesave-id.sql)',
      }, { status: 500 })
    }
    columns.push(meterIdCol)
    values.push(meterIdValue)

    if (hasSeriesNo && seriesNo !== undefined) {
      columns.push('series_no')
      values.push(seriesNo)
    }

    const duplicateRows = await queryGe(
      `SELECT deviceID
       FROM devices
       WHERE LOWER(TRIM(COALESCE(series_no, ''))) = LOWER(TRIM(?))
         AND LOWER(TRIM(COALESCE(deviceName, ''))) = LOWER(TRIM(?))
       LIMIT 1`,
      [String(seriesNo).trim(), String(deviceName).trim()]
    )
    if ((duplicateRows as any[]).length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Device serial and model already exists'
      }, { status: 409 })
    }

    columns.push('ipAddress')
    values.push(String(ipAddress || '').trim() || null)

    columns.push('location')
    values.push(normalizedLocation)

    columns.push('site')
    values.push(normalizedSite)

    columns.push('status')
    values.push(String(status || 'inactive'))

    columns.push('U_email')
    values.push(normalizedOwner)

    columns.push('P_email')
    values.push(normalizedOwner)

    columns.push('phone')
    values.push(normalizedPhone)

    columns.push('pass_phone')
    values.push(normalizedPassPhone)

    if (hasCreateBy) {
      columns.push('create_by')
      values.push('administrator')
    }

    if (hasLatitude && latitude !== undefined) {
      columns.push('latitude')
      values.push(latitude)
    }

    if (hasLongitude && longitude !== undefined) {
      columns.push('longitude')
      values.push(longitude)
    }

    if (hasCustomerName && customerName !== undefined) {
      columns.push('customerName')
      values.push(customerName)
    } else if (customerName !== undefined && !hasCustomerName) {
      missingColumns.push('customerName')
    }
    if (hasCustomerPhone && customerPhone !== undefined) {
      columns.push('customerPhone')
      values.push(customerPhone)
    } else if (customerPhone !== undefined && !hasCustomerPhone) {
      missingColumns.push('customerPhone')
    }
    if (hasCustomerAddress && customerAddress !== undefined) {
      columns.push('customerAddress')
      values.push(customerAddress)
    } else if (customerAddress !== undefined && !hasCustomerAddress) {
      missingColumns.push('customerAddress')
    }
    if (hasCustomerId && customerId !== undefined) {
      columns.push('customer_id')
      values.push(customerId || null)
    } else if (
      customerId !== undefined &&
      customerId !== null &&
      customerId !== '' &&
      Number(customerId) > 0 &&
      !hasCustomerId
    ) {
      missingColumns.push('customer_id')
    }

    if (missingColumns.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing column(s) in devices table: ${missingColumns.join(', ')}`,
        hint: 'Run database_schemas/alter_devices_add_customer_info.sql and alter_devices_add_customer_fk_and_power_records_fk.sql on GE Energy database'
      }, { status: 400 })
    }

    await queryGe(
      `INSERT INTO devices (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values
    )

    if (autoIncrementDeviceId) {
      const latestRows = await queryGe('SELECT MAX(deviceID) AS lastId FROM devices')
      newDeviceId = Number((latestRows as any[])[0]?.lastId || 0)
    }

    const customerSelectFields = [
      hasCustomerName ? 'customerName,' : '',
      hasCustomerPhone ? 'customerPhone,' : '',
      hasCustomerAddress ? 'customerAddress,' : ''
    ]
      .filter(Boolean)
      .join('\n        ')

    const createdDeviceRows = await queryGe(
      `SELECT
        deviceID,
        deviceName,
        GEsaveID,
        U_email as owner,
        ${customerSelectFields}
        location,
        ipAddress,
        site,
        created_at as registerDate,
        'OFFLINE' as connection
      FROM devices
      WHERE deviceID = ?
      LIMIT 1`,
      [newDeviceId]
    )

    return NextResponse.json({
      success: true,
      message: 'Device created successfully',
      device: (createdDeviceRows as any[])[0] || null
    })
  } catch (err: any) {
    console.error('Create device error:', err)

    // Handle duplicate GE ID error
    if (err.code === 'ER_DUP_ENTRY' && err.message?.includes('unique_GEsaveID')) {
      return NextResponse.json({
        success: false,
        error: 'GE ID already exists. Please use a unique GE ID.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to create device'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/ge-energy/devices-setting
 * Delete a device. Query params: deviceId
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'deviceId is required'
      }, { status: 400 })
    }

    await queryGe('DELETE FROM devices WHERE deviceID = ?', [deviceId])

    return NextResponse.json({
      success: true,
      message: 'Device deleted successfully'
    })
  } catch (err: any) {
    console.error('Delete device error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to delete device'
    }, { status: 500 })
  }
}

// Helper function to format time difference
function formatTimeSince(seconds: number): string {
  if (seconds < 60) return `${seconds} secs ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} mins ago`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) return `${hours}:${String(mins).padStart(2, '0')} hrs. ago`
  const days = Math.floor(hours / 24)
  const hrs = hours % 24
  return `${days}d ${hrs}:${String(mins % 60).padStart(2, '0')} hrs. ago`
}
