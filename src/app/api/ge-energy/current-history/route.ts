import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RecordScope = 'installed' | 'pre_install'

type ColumnRow = { COLUMN_NAME: string }

type HistoryRow = {
  record_time: string | Date
  ch1_L1?: string | number | null
  ch1_L2?: string | number | null
  ch1_L3?: string | number | null
  ch2_L1?: string | number | null
  ch2_L2?: string | number | null
  ch2_L3?: string | number | null
}

const toFloat = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n : null
}

const SCOPE_TO_TABLE: Record<RecordScope, string> = {
  installed: 'power_records',
  pre_install: 'power_records_preinstall'
}

const normalizeRecordScope = (scope?: string | null): RecordScope | null => {
  if (!scope) return null
  const normalized = String(scope).trim().toLowerCase()
  if (normalized === 'installed') return 'installed'
  if (normalized === 'pre_install' || normalized === 'pre-install' || normalized === 'preinstall') return 'pre_install'
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

async function loadHistoryRecords(
  deviceId: string,
  hours: number,
  scope: RecordScope
): Promise<{ records: HistoryRow[]; scope: RecordScope; table: string } | null> {
  const table = SCOPE_TO_TABLE[scope]
  if (!(await tableExists(table))) return null

  const powerCols = await availableColumns(table, [
    'record_time',
    'before_current_L1',
    'before_current_L2',
    'before_current_L3',
    'before_L1',
    'before_L2',
    'before_L3',
    'metrics_L1',
    'metrics_L2',
    'metrics_L3',
  ])

  const ch1L1 = pickCol(powerCols, ['before_current_L1', 'before_L1'])
  const ch1L2 = pickCol(powerCols, ['before_current_L2', 'before_L2'])
  const ch1L3 = pickCol(powerCols, ['before_current_L3', 'before_L3'])
  const ch2L1 = pickCol(powerCols, ['metrics_L1'])
  const ch2L2 = pickCol(powerCols, ['metrics_L2'])
  const ch2L3 = pickCol(powerCols, ['metrics_L3'])

  const selectParts = ['record_time']
  if (ch1L1) selectParts.push(`${ch1L1} AS ch1_L1`)
  if (ch1L2) selectParts.push(`${ch1L2} AS ch1_L2`)
  if (ch1L3) selectParts.push(`${ch1L3} AS ch1_L3`)
  if (ch2L1) selectParts.push(`${ch2L1} AS ch2_L1`)
  if (ch2L2) selectParts.push(`${ch2L2} AS ch2_L2`)
  if (ch2L3) selectParts.push(`${ch2L3} AS ch2_L3`)

  const records = (await queryGe(
    `SELECT ${selectParts.join(', ')}
     FROM ${table}
     WHERE device_id = ?
       AND record_time >= NOW() - INTERVAL ? HOUR
     ORDER BY record_time ASC`,
    [deviceId, hours]
  )) as HistoryRow[]

  return { records, scope, table }
}

/**
 * Get historical current data for a device
 * Shows before (CH1) and after (CH2) current trends over time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const hoursRaw = searchParams.get('hours') || '24'
    const hours = Math.max(0.01, parseFloat(hoursRaw) || 24)
    const scope = normalizeRecordScope(searchParams.get('scope')) ?? 'installed'

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'Device ID is required'
      }, { status: 400 })
    }

    const scopesToTry: RecordScope[] =
      scope === 'pre_install' ? ['pre_install', 'installed'] : ['installed', 'pre_install']

    let loaded: { records: HistoryRow[]; scope: RecordScope; table: string } | null = null
    for (const tryScope of scopesToTry) {
      loaded = await loadHistoryRecords(deviceId, hours, tryScope)
      if (loaded?.records.length) break
    }

    if (!loaded) {
      return NextResponse.json({
        success: true,
        data: {
          deviceId,
          scope,
          period: `${hours} hours`,
          dataPoints: 0,
          chartData: [],
          stats: null,
        },
        timestamp: new Date().toISOString(),
      })
    }

    const { records, scope: effectiveScope } = loaded

    const chartData = records.map((record) => {
      const time = new Date(record.record_time)
      const b1 = toFloat(record.ch1_L1)
      const b2 = toFloat(record.ch1_L2)
      const b3 = toFloat(record.ch1_L3)
      const a1 = toFloat(record.ch2_L1)
      const a2 = toFloat(record.ch2_L2)
      const a3 = toFloat(record.ch2_L3)
      const beforeVals = [b1, b2, b3].filter((v): v is number => v != null)
      const afterVals = [a1, a2, a3].filter((v): v is number => v != null)
      return {
        time: time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        timestamp: time.getTime(),
        beforeL1: b1,
        beforeL2: b2,
        beforeL3: b3,
        beforeAvg: beforeVals.length ? beforeVals.reduce((a, b) => a + b, 0) / beforeVals.length : null,
        afterL1: a1,
        afterL2: a2,
        afterL3: a3,
        afterAvg: afterVals.length ? afterVals.reduce((a, b) => a + b, 0) / afterVals.length : null,
      }
    })

    const latestRecord = records[records.length - 1]
    const stats = latestRecord ? {
      currentBefore: {
        L1: toFloat(latestRecord.ch1_L1),
        L2: toFloat(latestRecord.ch1_L2),
        L3: toFloat(latestRecord.ch1_L3)
      },
      currentAfter: {
        L1: toFloat(latestRecord.ch2_L1),
        L2: toFloat(latestRecord.ch2_L2),
        L3: toFloat(latestRecord.ch2_L3)
      }
    } : null

    return NextResponse.json({
      success: true,
      data: {
        deviceId,
        scope: effectiveScope,
        period: `${hours} hours`,
        dataPoints: chartData.length,
        chartData,
        stats
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch current history'
    console.error('Current history error:', error)
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 })
  }
}
