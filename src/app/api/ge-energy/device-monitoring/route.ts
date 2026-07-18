import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import {
  pickCh1CurrentColumns,
  pickCh1VoltageColumns,
  pickCh2CurrentColumns,
  pickCh2VoltageColumns,
  readCh1Currents,
  readCh2Currents,
} from '@/lib/energy/power-record-fields'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ColumnRow = { COLUMN_NAME: string }
type RecordScope = 'installed' | 'pre_install'

const SCOPE_TO_TABLE: Record<RecordScope, string> = {
  installed: 'power_records',
  pre_install: 'power_records_preinstall',
}

const METRIC_COLUMN_CANDIDATES = [
  'before_L1',
  'before_L2',
  'before_L3',
  'before_current_L1',
  'before_current_L2',
  'before_current_L3',
  'metrics_L1',
  'metrics_L2',
  'metrics_L3',
  'metrics_current_L1',
  'metrics_current_L2',
  'metrics_current_L3',
  'before_P',
  'before_Q',
  'before_S',
  'before_PF',
  'before_THD',
  'before_F',
  'before_kWh',
  'metrics_P',
  'metrics_Q',
  'metrics_S',
  'metrics_F',
  'metrics_PF',
  'metrics_kWh',
  'metrics_THD',
  'energy_reduction',
  'co2_reduction',
  'record_time',
  'device_id',
]

const toNum = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function normalizeRecordScope(scope?: string | null): RecordScope | null {
  if (!scope) return null
  const normalized = String(scope).trim().toLowerCase()
  if (normalized === 'installed') return 'installed'
  if (normalized === 'pre_install' || normalized === 'pre-install' || normalized === 'preinstall') {
    return 'pre_install'
  }
  return null
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await queryGe(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  )
  const row = rows[0] as { total?: number | string } | undefined
  return Number(row?.total || 0) > 0
}

async function availableColumns(table: string, names: string[]) {
  if (names.length === 0) return new Set<string>()
  const placeholders = names.map(() => '?').join(', ')
  const rows = (await queryGe(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME IN (${placeholders})`,
    [table, ...names]
  )) as ColumnRow[]
  return new Set(rows.map((r) => r.COLUMN_NAME))
}

function pickCol(available: Set<string>, candidates: string[]) {
  return candidates.find((c) => available.has(c)) ?? null
}

type Em4374Channel = {
  voltage: (number | null)[]
  current: (number | null)[]
  activePower: number | null
  reactivePower: number | null
  apparentPower: number | null
  powerFactor: number | null
  thd: number | null
  frequency: number | null
  energyKwh: number | null
}

function buildChannel(
  voltage: (number | null)[],
  current: (number | null)[],
  prefix: 'before' | 'metrics',
  record: Record<string, unknown>
): Em4374Channel {
  const p = prefix
  return {
    voltage,
    current,
    activePower: toNum(record[`${p}_P`]),
    reactivePower: toNum(record[`${p}_Q`]),
    apparentPower: toNum(record[`${p}_S`]),
    powerFactor: toNum(record[`${p}_PF`]),
    thd: toNum(record[`${p}_THD`]),
    frequency: toNum(record[`${p}_F`]),
    energyKwh: toNum(record[`${p}_kWh`]),
  }
}

function recordHasCh2Data(record: Record<string, unknown>): boolean {
  return ['metrics_P', 'metrics_L1', 'metrics_L2', 'metrics_L3', 'metrics_kWh', 'metrics_THD'].some(
    (col) => toNum(record[col]) != null,
  )
}

function buildMonitoringPayload(
  record: Record<string, unknown>,
  columnSets: {
    ch1CurrentCols: (string | null)[]
    ch1VoltageCols: (string | null)[]
    ch2VoltageCols: (string | null)[]
    ch2CurrentCols: (string | null)[]
  },
) {
  const scope = record.record_scope as RecordScope | undefined
  const ch1Only = scope === 'pre_install' && !recordHasCh2Data(record)
  const ch1Voltage = columnSets.ch1VoltageCols.map((col) =>
    col ? toNum(record[col]) : null,
  )
  const ch1Current = readCh1Currents(record, columnSets.ch1CurrentCols, columnSets.ch1VoltageCols)
  const ch2Voltage = ch1Only
    ? [null, null, null]
    : columnSets.ch2VoltageCols.map((col) => (col ? toNum(record[col]) : null))
  const ch2Current = ch1Only
    ? [null, null, null]
    : readCh2Currents(record, columnSets.ch2CurrentCols)

  const ch1 = buildChannel(ch1Voltage, ch1Current, 'before', record)
  const ch2 = ch1Only
    ? buildChannel([null, null, null], [null, null, null], 'metrics', {})
    : buildChannel(ch2Voltage, ch2Current, 'metrics', record)

  return {
    deviceId: record.device_id,
    lastUpdate: record.record_time,
    recordScope: record.record_scope,
    metrics: {
      voltageLL: ch1Voltage.map((v) => v ?? 0),
      current: ch2Current.map((v) => v ?? 0),
      beforeCurrent: ch1Current,
      afterCurrent: ch2Current,
      channels: { ch1, ch2 },
      power: [
        ch2.activePower != null ? ch2.activePower / 3 : 0,
        ch2.activePower != null ? ch2.activePower / 3 : 0,
        ch2.activePower != null ? ch2.activePower / 3 : 0,
      ],
      totalPower: ch2.activePower ?? 0,
      reactivePower: ch2.reactivePower ?? 0,
      apparentPower: ch2.apparentPower ?? 0,
      frequency: ch1.frequency ?? ch2.frequency,
      powerFactor: ch1.powerFactor ?? (ch1Only ? null : ch2.powerFactor),
      energy: ch1Only ? (ch1.energyKwh ?? 0) : (ch2.energyKwh ?? 0),
      energySaved: ch1Only ? 0 : (record.energy_reduction ?? 0),
      co2Saved: ch1Only ? 0 : (record.co2_reduction ?? 0),
      beforeEnergy: ch1.energyKwh ?? 0,
      thdBefore: ch1.thd,
      thdAfter: ch1Only ? null : ch2.thd,
    },
  }
}

async function fetchLatestRecord(deviceId: string, table: string, scope: RecordScope) {
  const exists = await tableExists(table)
  if (!exists) return null

  const powerCols = await availableColumns(table, METRIC_COLUMN_CANDIDATES)
  const ch1V1 = pickCol(powerCols, ['before_L1'])
  const ch1V2 = pickCol(powerCols, ['before_L2'])
  const ch1V3 = pickCol(powerCols, ['before_L3'])
  const ch1I1 = pickCol(powerCols, ['before_current_L1'])
  const ch1I2 = pickCol(powerCols, ['before_current_L2'])
  const ch1I3 = pickCol(powerCols, ['before_current_L3'])
  const ch2L1 = pickCol(powerCols, ['metrics_L1'])
  const ch2L2 = pickCol(powerCols, ['metrics_L2'])
  const ch2L3 = pickCol(powerCols, ['metrics_L3'])
  const ch2I1 = pickCol(powerCols, ['metrics_current_L1'])
  const ch2I2 = pickCol(powerCols, ['metrics_current_L2'])
  const ch2I3 = pickCol(powerCols, ['metrics_current_L3'])

  // Select raw column names (no alias): buildMonitoringPayload / readCh1Currents
  // read the record by original column name (before_L1, metrics_L1, …), so
  // aliasing here would silently null out voltage/current.
  const selectParts = ['device_id', 'record_time']
  if (ch1V1) selectParts.push(ch1V1)
  if (ch1V2) selectParts.push(ch1V2)
  if (ch1V3) selectParts.push(ch1V3)
  if (ch1I1) selectParts.push(ch1I1)
  if (ch1I2) selectParts.push(ch1I2)
  if (ch1I3) selectParts.push(ch1I3)
  if (ch2L1) selectParts.push(ch2L1)
  if (ch2L2) selectParts.push(ch2L2)
  if (ch2L3) selectParts.push(ch2L3)
  if (ch2I1) selectParts.push(ch2I1)
  if (ch2I2) selectParts.push(ch2I2)
  if (ch2I3) selectParts.push(ch2I3)

  for (const col of [
    'before_P', 'before_Q', 'before_S', 'before_PF', 'before_THD', 'before_F', 'before_kWh',
    'metrics_P', 'metrics_Q', 'metrics_S', 'metrics_PF', 'metrics_THD', 'metrics_F', 'metrics_kWh',
    'energy_reduction', 'co2_reduction',
  ]) {
    if (powerCols.has(col)) selectParts.push(col)
  }

  const rows = await queryGe(
    `SELECT ${selectParts.join(', ')}
     FROM ${table}
     WHERE device_id = ?
     ORDER BY record_time DESC
     LIMIT 1`,
    [deviceId]
  )

  if (!rows.length) return null
  const record = rows[0] as Record<string, unknown>
  record.record_scope = scope
  return {
    record,
    ch1CurrentCols: pickCh1CurrentColumns(powerCols),
    ch1VoltageCols: pickCh1VoltageColumns(powerCols),
    ch2VoltageCols: pickCh2VoltageColumns(powerCols),
    ch2CurrentCols: pickCh2CurrentColumns(powerCols),
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get('deviceId')
    const scopeParam = normalizeRecordScope(searchParams.get('scope'))

    if (!deviceId) {
      return NextResponse.json({ success: false, error: 'Device ID is required' }, { status: 400 })
    }

    const tablesToTry: RecordScope[] =
      scopeParam === 'pre_install'
        ? ['pre_install', 'installed']
        : scopeParam === 'installed'
          ? ['installed', 'pre_install']
          : ['installed', 'pre_install']

    for (const scope of tablesToTry) {
      const table = SCOPE_TO_TABLE[scope]
      const loaded = await fetchLatestRecord(deviceId, table, scope)
      if (loaded) {
        // Recording span: first → latest record_time for this meter (real-time end).
        const spanRows = await queryGe(
          `SELECT MIN(record_time) AS first_rec, MAX(record_time) AS last_rec, COUNT(*) AS total
           FROM ${table} WHERE device_id = ?`,
          [deviceId]
        )
        const span = (spanRows[0] ?? {}) as { first_rec?: string | Date; last_rec?: string | Date; total?: number }
        return NextResponse.json({
          success: true,
          data: {
            ...buildMonitoringPayload(loaded.record, loaded),
            recordingStart: span.first_rec ?? null,
            recordingEnd: span.last_rec ?? null,
            recordingCount: Number(span.total ?? 0),
          },
          timestamp: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json(
      { success: false, error: 'No monitoring data found for this device' },
      { status: 404 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch monitoring data'
    console.error('Device monitoring error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
