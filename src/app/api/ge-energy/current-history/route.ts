import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import {
  avgCurrent,
  pickCh1CurrentColumns,
  pickCh1VoltageColumns,
  pickCh2CurrentColumns,
  readCh1Currents,
  readCh2Currents,
} from '@/lib/energy/power-record-fields'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RecordScope = 'installed' | 'pre_install'

type ColumnRow = { COLUMN_NAME: string }

type HistoryRow = Record<string, unknown> & { record_time: string | Date }

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
): Promise<{ records: HistoryRow[]; scope: RecordScope; table: string; powerCols: Set<string> } | null> {
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
    'before_P',
    'before_PF',
    'before_THD',
    'before_kWh',
    'metrics_L1',
    'metrics_L2',
    'metrics_L3',
  ])

  const selectParts = ['record_time']
  for (const col of powerCols) {
    if (col !== 'record_time') selectParts.push(col)
  }

  const records = (await queryGe(
    `SELECT ${selectParts.join(', ')}
     FROM ${table}
     WHERE device_id = ?
       AND record_time >= NOW() - INTERVAL ? HOUR
     ORDER BY record_time ASC`,
    [deviceId, hours]
  )) as HistoryRow[]

  return { records, scope, table, powerCols }
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

    let loaded: { records: HistoryRow[]; scope: RecordScope; table: string; powerCols: Set<string> } | null = null
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

    const { records, scope: effectiveScope, powerCols } = loaded

    const ch1Only = effectiveScope === 'pre_install'

    const ch1CurrentCols = pickCh1CurrentColumns(powerCols)
    const ch1VoltageCols = pickCh1VoltageColumns(powerCols)
    const ch2CurrentCols = pickCh2CurrentColumns(powerCols)

    const chartData = records.map((record) => {
      const time = new Date(record.record_time)
      const [b1, b2, b3] = readCh1Currents(record, ch1CurrentCols, ch1VoltageCols)
      const [a1, a2, a3] = ch1Only
        ? [null, null, null]
        : readCh2Currents(record, ch2CurrentCols)
      const beforeVals = [b1, b2, b3].filter((v): v is number => v != null)
      const afterVals = [a1, a2, a3].filter((v): v is number => v != null)
      const beforeKwRaw = record.before_P
      const beforeKw =
        beforeKwRaw != null && beforeKwRaw !== '' && Number.isFinite(Number(beforeKwRaw))
          ? Number(beforeKwRaw)
          : null
      const beforePfRaw = record.before_PF
      const beforePf =
        beforePfRaw != null && beforePfRaw !== '' && Number.isFinite(Number(beforePfRaw))
          ? Number(beforePfRaw)
          : null
      const beforeThdRaw = record.before_THD
      const beforeThd =
        beforeThdRaw != null && beforeThdRaw !== '' && Number.isFinite(Number(beforeThdRaw))
          ? Number(beforeThdRaw)
          : null
      let currentImbalancePct: number | null = null
      if (beforeVals.length >= 2) {
        const avgI = beforeVals.reduce((a, b) => a + b, 0) / beforeVals.length
        const spread = Math.max(...beforeVals) - Math.min(...beforeVals)
        if (avgI > 0) currentImbalancePct = (spread / avgI) * 100
      }
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
        beforeKw,
        beforePf,
        beforeThd,
        currentImbalancePct,
        afterL1: a1,
        afterL2: a2,
        afterL3: a3,
        afterAvg: afterVals.length ? afterVals.reduce((a, b) => a + b, 0) / afterVals.length : null,
      }
    })

    const latestRecord = records[records.length - 1]
    const latestCh1 = latestRecord
      ? readCh1Currents(latestRecord, ch1CurrentCols, ch1VoltageCols)
      : [null, null, null]
    const latestCh2 = latestRecord && !ch1Only
      ? readCh2Currents(latestRecord, ch2CurrentCols)
      : [null, null, null]

    const stats = latestRecord ? {
      currentBefore: { L1: latestCh1[0], L2: latestCh1[1], L3: latestCh1[2] },
      currentAfter: ch1Only
        ? { L1: null, L2: null, L3: null }
        : { L1: latestCh2[0], L2: latestCh2[1], L3: latestCh2[2] },
      avgBefore: avgCurrent(latestCh1),
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
