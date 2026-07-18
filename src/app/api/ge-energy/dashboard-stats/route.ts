import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import { normalizeCustomerDisplayName } from '@/lib/ge-energy/customer-display'
import { effectiveDeviceSiteSql, normalizeSiteKey } from '@/lib/ge-energy/customer-scope'
import { getDevicesColumnSet, meterIdSelectSql, resolveMeterIdColumn } from '@/lib/ge-energy/devices-schema'
import {
  isLikelyVoltageReading,
  pickCh1CurrentColumns,
  pickCh1VoltageColumns,
  pickCh2CurrentColumns,
  readCh1Currents,
  readCh2Currents,
  toFiniteNumber,
} from '@/lib/energy/power-record-fields'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RawRecentDevice = {
  deviceID: string
  deviceName: string
  record_scope: string | null
  customerName: string | null
  customerNameEn: string | null
  customerPhone: string | null
  customerAddress: string | null
  series_no: string | null
  metricsMeterNo: string | null
  beforeMeterNo: string | null
  location: string | null
  ipAddress: string | null
  GEsaveID: string | null
  record_time: string | Date | null
  before_L1: number | string | null
  before_L2: number | string | null
  before_L3: number | string | null
  before_current_L1: number | string | null
  before_current_L2: number | string | null
  before_current_L3: number | string | null
  metrics_L1: number | string | null
  metrics_L2: number | string | null
  metrics_L3: number | string | null
  metrics_P: number | string | null
  metrics_Q: number | string | null
  metrics_S: number | string | null
  metrics_PF: number | string | null
  metrics_F: number | string | null
  metrics_kWh: number | string | null
  before_kWh: number | string | null
  before_P: number | string | null
  before_Q: number | string | null
  before_S: number | string | null
  before_PF: number | string | null
  before_F: number | string | null
  before_THD: number | string | null
  metrics_THD: number | string | null
  energy_reduction: number | string | null
  co2_reduction: number | string | null
}

type ColumnNameRow = {
  COLUMN_NAME: string
}

async function tableExists(tableName: string) {
  const rows = await queryGe(
    `SELECT COUNT(*) as count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  )
  const row = rows[0] as { count?: number | string } | undefined
  return Number(row?.count || 0) > 0
}

export async function GET(request: NextRequest) {
  try {
    // Get site parameter from query string
    const { searchParams } = new URL(request.url)
    const site = searchParams.get('site') || 'thailand'
    const safeSite = normalizeSiteKey(site)
    const deviceColumns = await getDevicesColumnSet()
    const meterIdCol = resolveMeterIdColumn(deviceColumns)
    const siteExpr = effectiveDeviceSiteSql(meterIdCol, 'd')
    // site=all → show every meter in the database (no site filter).
    const isAllSites = String(site).toLowerCase() === 'all'
    const siteCond = isAllSites ? '1=1' : `${siteExpr} = ?`
    const siteArgs: string[] = isAllSites ? [] : [safeSite]

    // 1. Get total devices count for selected site
    const totalDevicesResult = await queryGe(
      `SELECT COUNT(*) as count FROM devices d WHERE ${siteCond}`,
      [...siteArgs]
    )
    const totalDevices = totalDevicesResult[0]?.count || 0

    // 2. Online/offline counts are computed from latest-per-device rows below

    // 3. Get total energy saved this month (kWh) for selected site
    const energySavedResult = await queryGe(
      `SELECT SUM(pr.energy_reduction) as total_energy
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       WHERE ${siteCond}
       AND MONTH(pr.record_time) = MONTH(NOW())
       AND YEAR(pr.record_time) = YEAR(NOW())`,
      [...siteArgs]
    )
    const energySaved = Math.round(energySavedResult[0]?.total_energy || 0)

    const hasPreInstallTable = await tableExists('power_records_preinstall')

    // 4. Get latest record for all devices in the selected site
    // Some environments may still run an older power_records schema.
    // Build a safe SELECT list that falls back to NULL for missing columns.
    const selectablePowerColumns = [
      'record_time',
      'before_L1',
      'before_L2',
      'before_L3',
      'metrics_L1',
      'metrics_L2',
      'metrics_L3',
      'before_current_L1',
      'before_current_L2',
      'before_current_L3',
      'metrics_current_L1',
      'metrics_current_L2',
      'metrics_current_L3',
      'before_THD',
      'metrics_THD',
      'metrics_P',
      'metrics_Q',
      'metrics_S',
      'metrics_PF',
      'metrics_F',
      'metrics_kWh',
      'before_kWh',
      'before_P',
      'before_Q',
      'before_S',
      'before_PF',
      'before_F',
      'energy_reduction',
      'co2_reduction'
    ]
    const placeholders = selectablePowerColumns.map(() => '?').join(', ')
    const availableColumnsRows = await queryGe(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'power_records'
         AND COLUMN_NAME IN (${placeholders})`,
      selectablePowerColumns
    )
    const availableColumns = new Set(
      (availableColumnsRows as ColumnNameRow[]).map((row) => row.COLUMN_NAME)
    )

    let availablePreinstallColumns = new Set<string>()
    if (hasPreInstallTable) {
      const preinstallColumnRows = await queryGe(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'power_records_preinstall'
           AND COLUMN_NAME IN (${placeholders})`,
        selectablePowerColumns
      )
      availablePreinstallColumns = new Set(
        (preinstallColumnRows as ColumnNameRow[]).map((row) => row.COLUMN_NAME)
      )
    }
    // Check optional columns in devices table
    const optionalDeviceColumns = ['customerNameEn', 'customerPhone', 'customerAddress', 'series_no', 'metricsMeterNo', 'beforeMeterNo', 'location', 'ipAddress', 'GEsaveID', 'geID', 'record_scope']
    const devicePlaceholders = optionalDeviceColumns.map(() => '?').join(', ')
    const availableDeviceColumnsRows = await queryGe(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'devices'
         AND COLUMN_NAME IN (${devicePlaceholders})`,
      optionalDeviceColumns
    )
    const availableDeviceColumns = new Set(
      (availableDeviceColumnsRows as ColumnNameRow[]).map((row) => row.COLUMN_NAME)
    )
    const meterIdSql = meterIdSelectSql(availableDeviceColumns)
    const selectOptionalDeviceColumn = (columnName: string) => (
      availableDeviceColumns.has(columnName)
        ? `d.${columnName}`
        : `NULL AS ${columnName}`
    )

    const hasRecordScope = availableDeviceColumns.has('record_scope')
    const scopeExpr = hasRecordScope ? "COALESCE(d.record_scope, 'installed')" : "'installed'"

    const preinstallExpr = (columnName: string): string => {
      if (availablePreinstallColumns.has(columnName)) {
        return `p_pre.${columnName}`
      }
      if (
        columnName === 'energy_reduction' &&
        availablePreinstallColumns.has('before_kWh') &&
        availablePreinstallColumns.has('metrics_kWh')
      ) {
        return '(p_pre.before_kWh - p_pre.metrics_kWh)'
      }
      if (
        columnName === 'co2_reduction' &&
        availablePreinstallColumns.has('before_kWh') &&
        availablePreinstallColumns.has('metrics_kWh')
      ) {
        return '((p_pre.before_kWh - p_pre.metrics_kWh) * 0.5135)'
      }
      return 'NULL'
    }

    const selectedColumn = (columnName: string) => {
      const installedExpr = availableColumns.has(columnName) ? `p_inst.${columnName}` : 'NULL'
      if (!hasPreInstallTable) {
        return `${installedExpr} AS ${columnName}`
      }
      const preExpr = preinstallExpr(columnName)
      if (installedExpr === 'NULL' && preExpr === 'NULL') {
        return `NULL AS ${columnName}`
      }
      return `CASE WHEN ${scopeExpr} = 'pre_install' THEN ${preExpr} ELSE ${installedExpr} END AS ${columnName}`
    }

    const recentDevices = await queryGe(
      `SELECT
        d.deviceID,
        d.deviceName,
        ${scopeExpr} AS record_scope,
        d.customerName,
        ${selectOptionalDeviceColumn('customerNameEn')},
        ${selectOptionalDeviceColumn('customerPhone')},
        ${selectOptionalDeviceColumn('customerAddress')},
        ${selectOptionalDeviceColumn('series_no')},
        COALESCE(
          ${availableDeviceColumns.has('series_no') ? "NULLIF(TRIM(d.series_no), '')" : 'NULL'},
          ${availableColumns.has('series_no') ? "NULLIF(TRIM(p_inst.series_no), '')" : 'NULL'},
          ${availablePreinstallColumns.has('series_no') ? "NULLIF(TRIM(p_pre.series_no), '')" : 'NULL'}
        ) AS resolved_series_no,
        ${selectOptionalDeviceColumn('metricsMeterNo')},
        ${selectOptionalDeviceColumn('beforeMeterNo')},
        ${selectOptionalDeviceColumn('location')},
        ${selectOptionalDeviceColumn('ipAddress')},
        ${meterIdSql},
        ${selectedColumn('record_time')},
        p_inst.record_time AS record_time_installed,
        p_pre.record_time AS record_time_preinstall,
        ${selectedColumn('before_L1')},
        ${selectedColumn('before_L2')},
        ${selectedColumn('before_L3')},
        ${selectedColumn('before_current_L1')},
        ${selectedColumn('before_current_L2')},
        ${selectedColumn('before_current_L3')},
        ${selectedColumn('metrics_L1')},
        ${selectedColumn('metrics_L2')},
        ${selectedColumn('metrics_L3')},
        ${selectedColumn('metrics_P')},
        ${selectedColumn('metrics_Q')},
        ${selectedColumn('metrics_S')},
        ${selectedColumn('metrics_PF')},
        ${selectedColumn('metrics_F')},
        ${selectedColumn('metrics_kWh')},
        ${selectedColumn('before_kWh')},
        ${selectedColumn('before_P')},
        ${selectedColumn('before_Q')},
        ${selectedColumn('before_S')},
        ${selectedColumn('before_PF')},
        ${selectedColumn('before_F')},
        ${selectedColumn('before_THD')},
        ${selectedColumn('metrics_THD')},
        ${selectedColumn('energy_reduction')},
        ${selectedColumn('co2_reduction')}
       FROM devices d
       LEFT JOIN power_records p_inst ON p_inst.id = (
         SELECT pr.id
         FROM power_records pr
         WHERE pr.device_id = d.deviceID
         ORDER BY pr.record_time DESC, pr.id DESC
         LIMIT 1
       )
       ${hasPreInstallTable ? `LEFT JOIN power_records_preinstall p_pre ON p_pre.id = (
         SELECT pp.id
         FROM power_records_preinstall pp
         WHERE pp.device_id = d.deviceID
         ORDER BY pp.record_time DESC, pp.id DESC
         LIMIT 1
       )` : `LEFT JOIN power_records p_pre ON 1 = 0`}
       WHERE ${siteCond}
       ORDER BY record_time DESC, d.deviceID ASC`,
      [...siteArgs]
    )

    // 5. Calculate connection status for each device
    const toNullableNumber = (value: number | string | null | undefined) => {
      if (value === null || value === undefined) return null
      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? numericValue : null
    }

    const powerMetricColumns = new Set([...availableColumns, ...availablePreinstallColumns])

    const devicesWithStatus = (recentDevices as RawRecentDevice[]).map((device: any) => {
      const lastUpdate = device.record_time ? new Date(device.record_time) : null
      const beforeLastUpdate = device.record_time_preinstall ? device.record_time_preinstall : null
      const now = new Date()
      const isOnline = lastUpdate && (now.getTime() - lastUpdate.getTime()) < 20 * 60 * 1000 // 20 minutes

      const row = device as Record<string, unknown>
      const vCols = pickCh1VoltageColumns(powerMetricColumns)
      const c1Cols = pickCh1CurrentColumns(powerMetricColumns)
      const c2Cols = pickCh2CurrentColumns(powerMetricColumns)
      const beforeCurrentABC = readCh1Currents(row, c1Cols, vCols)
      const currentABC = readCh2Currents(row, c2Cols)

      const voltageLL = [
        isLikelyVoltageReading(toFiniteNumber(device.before_L1)) ? toFiniteNumber(device.before_L1) : null,
        isLikelyVoltageReading(toFiniteNumber(device.before_L2)) ? toFiniteNumber(device.before_L2) : null,
        isLikelyVoltageReading(toFiniteNumber(device.before_L3)) ? toFiniteNumber(device.before_L3) : null,
      ]

      const validCurrents = currentABC.filter((value): value is number => value !== null)
      const validBeforeCurrents = beforeCurrentABC.filter((value): value is number => value !== null)
      const avgCurrent = validCurrents.length > 0
        ? Number((validCurrents.reduce((sum, value) => sum + value, 0) / validCurrents.length).toFixed(1))
        : null
      const avgBeforeCurrent = validBeforeCurrents.length > 0
        ? Number((validBeforeCurrents.reduce((sum, value) => sum + value, 0) / validBeforeCurrents.length).toFixed(1))
        : null
      const currentReduction = avgBeforeCurrent && avgCurrent
        ? Number((((avgBeforeCurrent - avgCurrent) / avgBeforeCurrent) * 100).toFixed(1))
        : null
      const maxCurrent = validCurrents.length > 0 ? Math.max(...validCurrents) : null
      const minCurrent = validCurrents.length > 0 ? Math.min(...validCurrents) : null
      const imbalancePercent = maxCurrent && minCurrent !== null
        ? Number((((maxCurrent - minCurrent) / maxCurrent) * 100).toFixed(1))
        : null

      // Process THD values
      const metricsTHD = toNullableNumber(device.metrics_THD)
      const avgThd = metricsTHD !== null ? Number(metricsTHD.toFixed(1)) : null
      // Use average THD for each phase as approximation (since we don't have per-phase THD in DB)
      const thdABC = avgThd !== null ? [avgThd, avgThd, avgThd] : [null, null, null]

      return {
        deviceID: device.deviceID,
        deviceName: device.deviceName,
        recordScope: (device.record_scope || 'installed'),
        customerName: normalizeCustomerDisplayName(device.customerName, device.deviceName),
        customerNameEn: normalizeCustomerDisplayName(device.customerNameEn, device.deviceName),
        customerPhone: device.customerPhone,
        customerAddress: device.customerAddress,
        seriesNo: device.resolved_series_no || device.series_no,
        metricsMeterNo: device.metricsMeterNo,
        beforeMeterNo: device.beforeMeterNo,
        location: device.location,
        ipAddress: device.ipAddress,
        GEsaveID: device.GEsaveID,
        isOnline,
        lastUpdate: device.record_time,
        beforeLastUpdate: beforeLastUpdate,
        voltageLL,
        currentABC: [...currentABC],
        beforeCurrentABC: [...beforeCurrentABC],
        avgCurrent,
        avgBeforeCurrent,
        currentReduction,
        imbalancePercent,
        avgThd,
        thdABC,
        activePower:    toNullableNumber(device.metrics_P),
        reactivePower:  toNullableNumber(device.metrics_Q),
        apparentPower:  toNullableNumber(device.metrics_S),
        powerFactor:    toNullableNumber(device.metrics_PF),
        frequency:      toNullableNumber(device.metrics_F),
        energyKwh:      toNullableNumber(device.metrics_kWh),
        beforeKwh:      toNullableNumber(device.before_kWh),
        beforeActivePower:    toNullableNumber(device.before_P),
        beforeReactivePower:  toNullableNumber(device.before_Q),
        beforeApparentPower:  toNullableNumber(device.before_S),
        beforePowerFactor:    toNullableNumber(device.before_PF),
        beforeFrequency:      toNullableNumber(device.before_F),
        beforeThd:            toNullableNumber(device.before_THD),
        energyReduction: toNullableNumber(device.energy_reduction),
        co2Reduction:   toNullableNumber(device.co2_reduction)
      }
    })

    const onlineDevices = devicesWithStatus.filter((device) => device.isOnline).length
    const offlineDevices = totalDevices - onlineDevices

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalDevices,
          onlineDevices,
          offlineDevices,
          energySaved
        },
        recentDevices: devicesWithStatus
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
    }, { status: 500 })
  }
}
