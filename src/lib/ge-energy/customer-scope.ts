import { queryGe } from '@/lib/mysql-ge'

export type CustomerScopeInput = {
  userId?: string | null
  clientId?: string | null
  email?: string | null
  phone?: string | null
  username?: string | null
}

export type MeterChannelInfo = {
  channel: 'ch1' | 'ch2'
  label: string
  role: 'input' | 'output'
  meterNo: string | null
}

export type CustomerMeter = {
  deviceId: number
  deviceName: string
  GEsaveID: string | null
  seriesNo: string | null
  meterId: string | null
  meterNo: string | null
  ch1MeterNo: string | null
  ch2MeterNo: string | null
  channels: MeterChannelInfo[]
  site: string
  locationName: string | null
  label: string
}

function buildMeterChannels(ch1: string | null, ch2: string | null): MeterChannelInfo[] {
  return [
    { channel: 'ch1', label: 'CH1', role: 'input', meterNo: ch1 },
    { channel: 'ch2', label: 'CH2', role: 'output', meterNo: ch2 },
  ]
}

function mapDeviceRowToCustomerMeter(row: {
  device_id: number
  device_name: string
  gesave_id?: string | null
  series_no?: string | null
  meter_id?: string | null
  meter_no?: string | null
  location_name?: string | null
  meter_site?: string | null
  display_name?: string | null
  before_meter_no?: string | null
  metrics_meter_no?: string | null
}): CustomerMeter {
  const site = resolveDeviceSite(row.meter_site, row.gesave_id, row.location_name)
  const ch1 = row.before_meter_no ? String(row.before_meter_no).trim() : null
  const ch2 = row.metrics_meter_no ? String(row.metrics_meter_no).trim() : null
  const locationName = formatDeviceLocation(
    site,
    row.location_name ? String(row.location_name) : null,
  )
  const seriesNo = row.series_no ? String(row.series_no).trim() : null
  const GEsaveID = row.gesave_id ? String(row.gesave_id).trim() : null
  return {
    deviceId: Number(row.device_id),
    deviceName: String(row.device_name || ''),
    GEsaveID,
    seriesNo,
    meterId: row.meter_id ? String(row.meter_id) : null,
    meterNo: row.meter_no ? String(row.meter_no) : null,
    ch1MeterNo: ch1,
    ch2MeterNo: ch2,
    channels: buildMeterChannels(ch1, ch2),
    site,
    locationName,
    label:
      [row.display_name, seriesNo, GEsaveID, row.meter_no, row.meter_id].filter(Boolean).join(' · ') ||
      `Device ${row.device_id}`,
  }
}

const SITE_RATES: Record<string, number> = {
  korea: Number(process.env.KOREA_ELECTRICITY_RATE || 140),
  thailand: Number(process.env.THAILAND_ELECTRICITY_RATE || 3.88),
  vietnam: Number(process.env.VIETNAM_ELECTRICITY_RATE || 2500),
  malaysia: Number(process.env.MALAYSIA_ELECTRICITY_RATE || 0.45),
}

/** GE-KR-0001 → korea, GE-TH-0001 → thailand (meter ID prefix = site). */
const METER_PREFIX_TO_SITE: Record<string, string> = {
  KR: 'korea',
  TH: 'thailand',
  VN: 'vietnam',
  MY: 'malaysia',
}

export function inferSiteFromMeterId(meterId: string | null | undefined): string | null {
  const match = String(meterId || '').trim().toUpperCase().match(/^GE-([A-Z]{2})-/)
  if (!match) return null
  return METER_PREFIX_TO_SITE[match[1]] ?? null
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

/** Prefer site encoded in GEsaveID (GE-KR / GE-TH), then devices.site, then location. */
export function resolveDeviceSite(
  site: string | null | undefined,
  meterId?: string | null | undefined,
  location?: string | null | undefined,
): string {
  const fromMeter = inferSiteFromMeterId(meterId)
  if (fromMeter) return fromMeter
  if (String(site || '').trim()) return normalizeSiteKey(site)
  return normalizeSiteKey(location)
}

/** SQL expression: effective site from meter ID prefix or devices.site/location. */
export function effectiveDeviceSiteSql(meterIdColumn: string | null, deviceAlias = 'd'): string {
  if (!meterIdColumn) {
    return `LOWER(COALESCE(${deviceAlias}.site, ${deviceAlias}.location, 'thailand'))`
  }
  const col = `UPPER(COALESCE(${deviceAlias}.${meterIdColumn}, ''))`
  return `COALESCE(
    NULLIF(CASE
      WHEN ${col} LIKE 'GE-KR-%' THEN 'korea'
      WHEN ${col} LIKE 'GE-TH-%' THEN 'thailand'
      WHEN ${col} LIKE 'GE-VN-%' THEN 'vietnam'
      WHEN ${col} LIKE 'GE-MY-%' THEN 'malaysia'
      ELSE NULL
    END, NULL),
    LOWER(COALESCE(${deviceAlias}.site, ${deviceAlias}.location, 'thailand'))
  )`
}

export function deviceSiteFilterSql(
  site: string,
  meterIdColumn: string | null,
  deviceAlias = 'd',
): { sql: string; params: string[] } {
  if (site === 'all') return { sql: '1=1', params: [] }
  return {
    sql: `${effectiveDeviceSiteSql(meterIdColumn, deviceAlias)} = ?`,
    params: [normalizeSiteKey(site)],
  }
}

/** Display name for device / meter location (Korea site → KOREA). */
export function formatDeviceLocation(
  site: string | null | undefined,
  location: string | null | undefined,
): string | null {
  const raw = String(location || '').trim()
  const siteKey = normalizeSiteKey(site)
  if (siteKey === 'korea') {
    // Collapse every Korea variant (Korea / KOREA / Republic (of) Korea /
    // South Korea / 대한민국 / 한국 / Seongnam / Research Institute / empty)
    // into one canonical location label.
    if (
      !raw ||
      /korea/i.test(raw) ||
      /대한민국/.test(raw) ||
      /한국/.test(raw) ||
      /seongnam/i.test(raw) ||
      /research\s*institute/i.test(raw)
    ) {
      return 'KOREA'
    }
  }
  return raw || null
}

export { resolveMeterIdColumn } from '@/lib/ge-energy/devices-schema'

/** Best available installation/site label for a device row. */
export function buildInstallationLocationExpr(opts: {
  hasEqSites: boolean
  hasCarbonLoc: boolean
  hasMomoge: boolean
  hasCustomerAddress: boolean
}): string {
  const parts: string[] = []
  if (opts.hasEqSites) parts.push("MAX(NULLIF(TRIM(es.location), ''))")
  if (opts.hasCarbonLoc && opts.hasMomoge) parts.push("MAX(NULLIF(TRIM(cl.locationName), ''))")
  parts.push("NULLIF(TRIM(d.location), '')")
  if (opts.hasCustomerAddress) parts.push("NULLIF(TRIM(d.customerAddress), '')")
  return `COALESCE(${parts.join(', ')})`
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

let momogeUserIdEnsured = false
let momogeUserIdAvailable = false

/** Legacy DBs may lack momoge_cus.user_id — add column once. */
async function ensureMomogeUserIdColumn() {
  if (momogeUserIdEnsured) return momogeUserIdAvailable
  try {
    let hasColumn = await columnExists('momoge_cus', 'user_id')
    if (!hasColumn) {
      await queryGe(
        `ALTER TABLE momoge_cus
         ADD COLUMN user_id varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL`,
      )
      try {
        await queryGe(`ALTER TABLE momoge_cus ADD INDEX idx_momoge_cus_user_id (user_id)`)
      } catch {
        /* index may already exist */
      }
      hasColumn = await columnExists('momoge_cus', 'user_id')
    }
    momogeUserIdAvailable = hasColumn
  } catch (err) {
    console.warn('[customer-scope] momoge_cus.user_id unavailable:', err)
    momogeUserIdAvailable = false
  } finally {
    momogeUserIdEnsured = true
  }
  return momogeUserIdAvailable
}

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
      '(LOWER(TRIM(d.U_email)) = ? OR LOWER(TRIM(d.P_email)) = ? OR LOWER(TRIM(d.GEsaveID)) = ?)',
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
      '(LOWER(TRIM(d.GEsaveID)) = LOWER(?) OR LOWER(TRIM(d.deviceName)) = LOWER(?) OR LOWER(TRIM(d.U_email)) = LOWER(?))',
    )
    params.push(username, username, username)
  }
  if (userId) {
    conditions.push('LOWER(TRIM(d.GEsaveID)) = LOWER(?)')
    params.push(userId)
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
  const hasMomogeUserId = hasMomoge && (await ensureMomogeUserIdColumn())
  const hasDevicesClientId = devicesClientIdAvailable || (await columnExists('devices', 'client_id'))
  const hasCarbonLoc = await tableExists('carbon_locations')
  const hasCarbonMeter = await tableExists('carbon_meters')
  const hasBeforeMeterNo = await columnExists('devices', 'beforeMeterNo')
  const hasMetricsMeterNo = await columnExists('devices', 'metricsMeterNo')
  const hasSeriesNo = await columnExists('devices', 'series_no')

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
    conditions.push('(LOWER(TRIM(mc.nameEN)) = ? OR LOWER(TRIM(d.GEsaveID)) = ?)')
    params.push(email, email)
  }
  if (hasMomoge && username) {
    conditions.push(
      '(LOWER(TRIM(mc.serailID)) = LOWER(?) OR LOWER(TRIM(d.GEsaveID)) = LOWER(?) OR LOWER(TRIM(mc.nameEN)) = LOWER(?))',
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
      NULLIF(TRIM(d.GEsaveID), '') AS gesave_id,
      ${hasSeriesNo ? 'NULLIF(TRIM(d.series_no), "") AS series_no,' : 'NULL AS series_no,'}
      ${hasMomoge ? 'mc.meterID AS meter_id,' : 'NULL AS meter_id,'}
      ${hasCarbonMeter ? 'cm.meterNo AS meter_no,' : 'NULL AS meter_no,'}
      ${hasCarbonLoc ? 'COALESCE(NULLIF(TRIM(cl.locationName), ""), NULLIF(TRIM(d.location), "")) AS location_name,' : 'NULLIF(TRIM(d.location), "") AS location_name,'}
      ${siteExpr} AS meter_site,
      ${hasBeforeMeterNo ? 'NULLIF(TRIM(d.beforeMeterNo), "") AS before_meter_no,' : 'NULL AS before_meter_no,'}
      ${hasMetricsMeterNo ? 'NULLIF(TRIM(d.metricsMeterNo), "") AS metrics_meter_no,' : 'NULL AS metrics_meter_no,'}
      ${hasMomoge ? 'COALESCE(mc.nameTH, mc.nameEN, d.deviceName) AS display_name' : 'd.deviceName AS display_name'}
    FROM devices d
    ${joins}
    WHERE (${conditions.join(' OR ')})
    ORDER BY d.deviceID ASC
  `

  const rows = (await queryGe(sql, params)) as Array<{
    device_id: number
    device_name: string
    gesave_id?: string | null
    series_no?: string | null
    meter_id: string | null
    meter_no: string | null
    location_name: string | null
    meter_site: string | null
    display_name: string | null
    before_meter_no?: string | null
    metrics_meter_no?: string | null
  }>

  return rows.map((r) => mapDeviceRowToCustomerMeter(r))
}

/** Load device + dual-channel meter numbers directly from devices table. */
export async function loadCustomerMetersByDeviceIds(deviceIds: number[]): Promise<CustomerMeter[]> {
  if (!deviceIds.length) return []

  const hasBeforeMeterNo = await columnExists('devices', 'beforeMeterNo')
  const hasMetricsMeterNo = await columnExists('devices', 'metricsMeterNo')
  const hasSeriesNo = await columnExists('devices', 'series_no')
  const placeholders = deviceIds.map(() => '?').join(',')

  const rows = (await queryGe(
    `SELECT
      d.deviceID AS device_id,
      d.deviceName AS device_name,
      NULLIF(TRIM(d.GEsaveID), '') AS gesave_id,
      ${hasSeriesNo ? 'NULLIF(TRIM(d.series_no), "") AS series_no,' : 'NULL AS series_no,'}
      NULL AS meter_id,
      NULL AS meter_no,
      NULLIF(TRIM(d.location), '') AS location_name,
      COALESCE(NULLIF(LOWER(TRIM(d.site)), ''), NULLIF(LOWER(TRIM(d.location)), ''), 'thailand') AS meter_site,
      ${hasBeforeMeterNo ? 'NULLIF(TRIM(d.beforeMeterNo), "") AS before_meter_no,' : 'NULL AS before_meter_no,'}
      ${hasMetricsMeterNo ? 'NULLIF(TRIM(d.metricsMeterNo), "") AS metrics_meter_no,' : 'NULL AS metrics_meter_no,'}
      d.deviceName AS display_name
     FROM devices d
     WHERE d.deviceID IN (${placeholders})
     ORDER BY d.deviceID ASC`,
    deviceIds,
  )) as Array<{
    device_id: number
    device_name: string
    gesave_id?: string | null
    series_no?: string | null
    meter_id: string | null
    meter_no: string | null
    location_name: string | null
    meter_site: string | null
    display_name: string | null
    before_meter_no?: string | null
    metrics_meter_no?: string | null
  }>

  return rows.map((r) => mapDeviceRowToCustomerMeter(r))
}

export async function loadDeviceSitesByIds(deviceIds: number[]) {
  if (!deviceIds.length) return new Map<number, string>()
  const placeholders = deviceIds.map(() => '?').join(',')
  const rows = (await queryGe(
    `SELECT
      d.deviceID AS device_id,
      d.site,
      d.location,
      NULLIF(TRIM(d.GEsaveID), '') AS gesave_id
     FROM devices d
     WHERE d.deviceID IN (${placeholders})`,
    deviceIds,
  )) as Array<{ device_id: number; site: string | null; location: string | null; gesave_id: string | null }>

  const map = new Map<number, string>()
  for (const row of rows) {
    map.set(
      Number(row.device_id),
      resolveDeviceSite(row.site, row.gesave_id, row.location),
    )
  }
  return map
}

export function deviceFilterSql(deviceIds: number[]) {
  if (!deviceIds.length) return { sql: ' AND 1=0', params: [] as number[] }
  const placeholders = deviceIds.map(() => '?').join(',')
  return { sql: ` AND pr.device_id IN (${placeholders})`, params: deviceIds }
}
