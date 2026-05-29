import { queryGe } from '@/lib/mysql-ge'

export type CustomerScopeInput = {
  userId?: string | null
  clientId?: string | null
  email?: string | null
  phone?: string | null
  username?: string | null
}

export type CustomerMeter = {
  deviceId: number
  deviceName: string
  meterId: string | null
  meterNo: string | null
  site: string
  locationName: string | null
  label: string
}

const SITE_RATES: Record<string, number> = {
  korea: Number(process.env.KOREA_ELECTRICITY_RATE || 140),
  thailand: Number(process.env.THAILAND_ELECTRICITY_RATE || 3.88),
  vietnam: Number(process.env.VIETNAM_ELECTRICITY_RATE || 2500),
  malaysia: Number(process.env.MALAYSIA_ELECTRICITY_RATE || 0.45),
}

export function normalizeSiteKey(raw: string | null | undefined): string {
  const s = String(raw || '').trim().toLowerCase()
  if (s.includes('korea') || s.includes('kr') || s === 'ko') return 'korea'
  if (s.includes('thai') || s === 'th') return 'thailand'
  if (s.includes('viet') || s === 'vn') return 'vietnam'
  if (s.includes('malay') || s === 'ms') return 'malaysia'
  if (s === 'korea' || s === 'thailand' || s === 'vietnam' || s === 'malaysia') return s
  return 'thailand'
}

export function resolveRate(site: string, override?: string | null) {
  const fromQuery = override ? Number(override) : NaN
  if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery
  return SITE_RATES[normalizeSiteKey(site)] ?? SITE_RATES.thailand
}

/** Configured electricity rates per site (THB/KRW/etc. per kWh). */
export function getSiteElectricityRates(): Record<string, number> {
  return { ...SITE_RATES }
}

async function tableExists(tableName: string) {
  const rows = await queryGe(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName],
  )
  const row = rows[0] as { count?: number | string } | undefined
  return Number(row?.count || 0) > 0
}

async function columnExists(tableName: string, columnName: string) {
  const rows = await queryGe(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  )
  const row = rows[0] as { count?: number | string } | undefined
  return Number(row?.count || 0) > 0
}

let devicesClientIdEnsured = false
let devicesClientIdAvailable = false

/** Legacy DBs may lack devices.client_id — add column and backfill demo rows once. */
async function ensureDevicesClientIdColumn() {
  if (devicesClientIdEnsured) return devicesClientIdAvailable

  try {
    let hasColumn = await columnExists('devices', 'client_id')
    if (!hasColumn) {
      await queryGe(
        `ALTER TABLE devices
         ADD COLUMN client_id varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL`,
      )
      try {
        await queryGe(`ALTER TABLE devices ADD INDEX idx_devices_client_id (client_id)`)
      } catch {
        /* index may already exist */
      }
      hasColumn = await columnExists('devices', 'client_id')
    }

    if (hasColumn) {
      await queryGe(
        `UPDATE devices d
         LEFT JOIN Client c ON c.slug = 'goeun-server-hub'
         SET d.client_id = c.id
         WHERE d.client_id IS NULL AND c.id IS NOT NULL`,
      )
    }

    devicesClientIdAvailable = hasColumn
  } catch (err) {
    console.warn('[customer-scope] devices.client_id unavailable:', err)
    devicesClientIdAvailable = false
  } finally {
    devicesClientIdEnsured = true
  }

  return devicesClientIdAvailable
}

function pushDeviceIdentityConditions(
  conditions: string[],
  params: unknown[],
  scope: { email?: string | null; phone?: string | null; username?: string | null; userId?: string | null },
) {
  const email = scope.email?.trim().toLowerCase() || null
  const phone = scope.phone?.trim() || null
  const username = scope.username?.trim() || null
  const userId = scope.userId?.trim() || null

  if (email) {
    conditions.push(
      '(LOWER(TRIM(d.U_email)) = ? OR LOWER(TRIM(d.P_email)) = ? OR LOWER(TRIM(d.geID)) = ?)',
    )
    params.push(email, email, email)
  }
  if (phone) {
    conditions.push(
      '(d.phone = ? OR d.customerPhone = ? OR REPLACE(REPLACE(d.phone, "-", ""), " ", "") = REPLACE(REPLACE(?, "-", ""), " ", ""))',
    )
    params.push(phone, phone, phone)
  }
  if (username) {
    conditions.push(
      '(LOWER(TRIM(d.geID)) = LOWER(?) OR LOWER(TRIM(d.deviceName)) = LOWER(?) OR LOWER(TRIM(d.U_email)) = LOWER(?))',
    )
    params.push(username, username, username)
  }
  if (userId) {
    conditions.push('(LOWER(TRIM(d.geID)) = LOWER(?) OR LOWER(TRIM(d.deviceName)) LIKE ?)')
    params.push(userId, `%${userId}%`)
  }
}

/** Resolve devices/meters owned by the logged-in customer. */
export async function resolveCustomerMeters(scope: CustomerScopeInput): Promise<CustomerMeter[]> {
  const userId = scope.userId?.trim() || null
  const clientId = scope.clientId?.trim() || null
  const email = scope.email?.trim().toLowerCase() || null
  const phone = scope.phone?.trim() || null
  const username = scope.username?.trim() || null

  if (!userId && !clientId && !email && !phone && !username) {
    return []
  }

  await ensureDevicesClientIdColumn()

  const hasMomoge = await tableExists('momoge_cus')
  const hasMomogeUserId = hasMomoge && (await columnExists('momoge_cus', 'user_id'))
  const hasDevicesClientId = devicesClientIdAvailable || (await columnExists('devices', 'client_id'))
  const hasCarbonLoc = await tableExists('carbon_locations')
  const hasCarbonMeter = await tableExists('carbon_meters')

  const joins = hasMomoge
    ? `LEFT JOIN momoge_cus mc ON mc.device_id = d.deviceID
       ${hasCarbonLoc ? 'LEFT JOIN carbon_locations cl ON mc.LocationID = cl.locationID' : ''}
       ${hasCarbonMeter ? 'LEFT JOIN carbon_meters cm ON mc.meterID = cm.meterID' : ''}`
    : ''

  const conditions: string[] = []
  const params: unknown[] = []

  if (clientId && hasDevicesClientId) {
    conditions.push('d.client_id = ?')
    params.push(clientId)
  }
  if (hasMomogeUserId && userId) {
    conditions.push('mc.user_id = ?')
    params.push(userId)
  }
  if (hasMomoge && phone) {
    conditions.push('(mc.phone = ? OR REPLACE(REPLACE(mc.phone, "-", ""), " ", "") = REPLACE(REPLACE(?, "-", ""), " ", ""))')
    params.push(phone, phone)
  }
  if (hasMomoge && email) {
    conditions.push('(LOWER(TRIM(mc.nameEN)) = ? OR LOWER(TRIM(d.geID)) = ?)')
    params.push(email, email)
  }
  if (hasMomoge && username) {
    conditions.push(
      '(LOWER(TRIM(mc.serailID)) = LOWER(?) OR LOWER(TRIM(d.geID)) = LOWER(?) OR LOWER(TRIM(mc.nameEN)) = LOWER(?))',
    )
    params.push(username, username, username)
  }

  pushDeviceIdentityConditions(conditions, params, { email, phone, username, userId })

  if (!conditions.length) return []

  const siteExpr = hasCarbonLoc
    ? `COALESCE(NULLIF(LOWER(TRIM(cl.site)), ''), NULLIF(LOWER(TRIM(d.site)), ''), NULLIF(LOWER(TRIM(d.location)), ''), 'thailand')`
    : `COALESCE(NULLIF(LOWER(TRIM(d.site)), ''), NULLIF(LOWER(TRIM(d.location)), ''), 'thailand')`

  const sql = `
    SELECT DISTINCT
      d.deviceID AS device_id,
      d.deviceName AS device_name,
      ${hasMomoge ? 'mc.meterID AS meter_id,' : 'NULL AS meter_id,'}
      ${hasCarbonMeter ? 'cm.meterNo AS meter_no,' : 'NULL AS meter_no,'}
      ${hasCarbonLoc ? 'cl.locationName AS location_name,' : 'NULL AS location_name,'}
      ${siteExpr} AS meter_site,
      ${hasMomoge ? 'COALESCE(mc.nameTH, mc.nameEN, d.deviceName) AS display_name' : 'd.deviceName AS display_name'}
    FROM devices d
    ${joins}
    WHERE (${conditions.join(' OR ')})
    ORDER BY d.deviceID ASC
  `

  const rows = (await queryGe(sql, params)) as Array<{
    device_id: number
    device_name: string
    meter_id: string | null
    meter_no: string | null
    location_name: string | null
    meter_site: string | null
    display_name: string | null
  }>

  return rows.map((r) => ({
    deviceId: Number(r.device_id),
    deviceName: String(r.device_name || ''),
    meterId: r.meter_id ? String(r.meter_id) : null,
    meterNo: r.meter_no ? String(r.meter_no) : null,
    site: normalizeSiteKey(r.meter_site),
    locationName: r.location_name ? String(r.location_name) : null,
    label: [r.display_name, r.meter_no, r.meter_id].filter(Boolean).join(' · ') || `Device ${r.device_id}`,
  }))
}

export async function loadDeviceSitesByIds(deviceIds: number[]) {
  if (!deviceIds.length) return new Map<number, string>()
  const placeholders = deviceIds.map(() => '?').join(',')
  const rows = (await queryGe(
    `SELECT
      d.deviceID AS device_id,
      COALESCE(NULLIF(LOWER(TRIM(d.site)), ''), NULLIF(LOWER(TRIM(d.location)), ''), 'thailand') AS meter_site
     FROM devices d
     WHERE d.deviceID IN (${placeholders})`,
    deviceIds,
  )) as Array<{ device_id: number; meter_site: string | null }>

  const map = new Map<number, string>()
  for (const row of rows) {
    map.set(Number(row.device_id), normalizeSiteKey(row.meter_site))
  }
  return map
}

export function deviceFilterSql(deviceIds: number[]) {
  if (!deviceIds.length) return { sql: ' AND 1=0', params: [] as number[] }
  const placeholders = deviceIds.map(() => '?').join(',')
  return { sql: ` AND pr.device_id IN (${placeholders})`, params: deviceIds }
}
