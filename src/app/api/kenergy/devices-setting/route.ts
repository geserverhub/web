import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getDevicesColumnSet(): Promise<Set<string>> {
  const rows = await queryGe(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'devices'`
  )

  return new Set((rows as any[]).map((row) => String(row.COLUMN_NAME)))
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
 * GET /api/kenergy/devices-setting
 * ???????????????????????????? realtime
 * Query params:
 *   - site: thailand | korea | all
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const site = searchParams.get('site') || 'thailand'
    const deviceColumns = await getDevicesColumnSet()
    const hasCustomerName = deviceColumns.has('customerName')
    const hasCustomerPhone = deviceColumns.has('customerPhone')
    const hasCustomerAddress = deviceColumns.has('customerAddress')
    const hasCustomerId = deviceColumns.has('customer_id')

    const customerSelectFields = [
      hasCustomerId ? 'd.customer_id,' : '',
      hasCustomerName ? 'd.customerName,' : '',
      hasCustomerPhone ? 'd.customerPhone,' : '',
      hasCustomerAddress ? 'd.customerAddress,' : ''
    ]
      .filter(Boolean)
      .join('\n        ')

    const customerGroupByFields = [
      hasCustomerId ? 'd.customer_id,' : '',
      hasCustomerName ? 'd.customerName,' : '',
      hasCustomerPhone ? 'd.customerPhone,' : '',
      hasCustomerAddress ? 'd.customerAddress,' : ''
    ]
      .filter(Boolean)
      .join('\n               ')

    const devices = await queryGe(`
      SELECT
        d.deviceID,
        d.deviceName,
        d.geID,
        d.U_email as owner,
        ${customerSelectFields}
        d.location,
        d.latitude,
        d.longitude,
        d.ipAddress,
        d.site,
        d.phone,
        d.created_at as registerDate,
        MAX(p.record_time) as lastUpdate,
        TIMESTAMPDIFF(SECOND, MAX(p.record_time), NOW()) as secondsSinceUpdate,
        CASE
          WHEN MAX(p.record_time) >= NOW() - INTERVAL 20 MINUTE THEN 'ONLINE'
          ELSE 'OFFLINE'
        END as connection
      FROM devices d
      LEFT JOIN power_records p ON d.deviceID = p.device_id
      WHERE d.location LIKE ? OR ? = 'all'
      GROUP BY d.deviceID, d.deviceName, d.geID, d.U_email,
               ${customerGroupByFields}
               d.location, d.latitude, d.longitude, d.ipAddress, d.site, d.phone, d.created_at
      ORDER BY d.deviceName ASC
    `, [
      site === 'thailand' ? '%Thailand%'
        : site === 'korea' ? '%Korea%'
        : site === 'vietnam' ? '%Vietnam%'
        : site === 'malaysia' ? '%Malaysia%'
        : '%',
      site
    ])

    // Format time since update
    const formattedDevices = devices.map((d: any) => ({
      ...d,
      type: 'Energy 3-Ph', // Default type
      rssi: 0, // Not available yet
      ramData: false, // Not available yet
      timeSinceUpdate: d.secondsSinceUpdate ? formatTimeSince(d.secondsSinceUpdate) : 'N/A',
      lastUpdate: d.lastUpdate || null,
      registerDate: d.registerDate ? new Date(d.registerDate).toISOString().split('T')[0] : null
    }))

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
 * PUT /api/kenergy/devices-setting
 * ??????????????????????????? * Body: { deviceId, deviceName?, location?, owner?, ipAddress?, latitude?, longitude? }
 */
export async function PUT(req: NextRequest) {
  try {
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
    if (customerId !== undefined) {
      if (hasCustomerId) {
        updates.push('customer_id = ?')
        params.push(customerId || null)
      } else {
        missingCustomerColumns.push('customer_id')
      }
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

    // Handle duplicate KSAVE ID error
    if (err.code === 'ER_DUP_ENTRY' && err.message?.includes('unique_geID')) {
      return NextResponse.json({
        success: false,
        error: 'KSAVE ID already exists. Please use a unique KSAVE ID.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to update device'
    }, { status: 500 })
  }
}

/**
 * POST /api/kenergy/devices-setting
 * ??????????????????? * Body: { deviceName, geID?, location?, site?, owner?, ipAddress?, customerName?, customerPhone?, customerAddress? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      deviceName,
      geID,
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

    const normalizedSite = String(site || 'thailand').trim() || 'thailand'
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

    columns.push('geID')
    values.push(String(geID || '').trim() || String(deviceName).trim())

    if (hasSeriesNo && seriesNo !== undefined) {
      columns.push('series_no')
      values.push(seriesNo)
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
    } else if (customerId !== undefined && !hasCustomerId) {
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
        geID,
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

    // Handle duplicate KSAVE ID error
    if (err.code === 'ER_DUP_ENTRY' && err.message?.includes('unique_geID')) {
      return NextResponse.json({
        success: false,
        error: 'KSAVE ID already exists. Please use a unique KSAVE ID.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to create device'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/kenergy/devices-setting
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
