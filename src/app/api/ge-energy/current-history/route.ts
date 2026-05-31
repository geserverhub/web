import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RecordScope = 'installed' | 'pre_install'

type CurrentHistoryRow = {
  record_time: string | Date
  before_current_L1?: string | number | null
  before_current_L2?: string | number | null
  before_current_L3?: string | number | null
  metrics_L1?: string | number | null
  metrics_L2?: string | number | null
  metrics_L3?: string | number | null
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

/**
 * Get historical current data for a device
 * Shows before and after current trends over time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const hours = parseInt(searchParams.get('hours') || '24')
    const scope = normalizeRecordScope(searchParams.get('scope')) ?? 'installed'
    const targetTable = SCOPE_TO_TABLE[scope]

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'Device ID is required'
      }, { status: 400 })
    }

    const targetTableExists = await tableExists(targetTable)
    if (!targetTableExists) {
      return NextResponse.json({
        success: false,
        error: `Target table '${targetTable}' not found. Please run migration to enable ${scope} storage.`
      }, { status: 500 })
    }

    // Get historical data
    const records = (await queryGe(
      `SELECT
        record_time,
        before_current_L1,
        before_current_L2,
        before_current_L3,
        metrics_L1,
        metrics_L2,
        metrics_L3
       FROM ${targetTable}
       WHERE device_id = ?
         AND record_time >= NOW() - INTERVAL ? HOUR
       ORDER BY record_time ASC`,
      [deviceId, hours]
    )) as CurrentHistoryRow[]

    // Format data for chart
    const chartData = records.map((record) => {
      const time = new Date(record.record_time)
      return {
        time: time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        timestamp: time.getTime(),
        // Before values
        beforeL1: toFloat(record.before_current_L1),
        beforeL2: toFloat(record.before_current_L2),
        beforeL3: toFloat(record.before_current_L3),
        beforeAvg: [record.before_current_L1, record.before_current_L2, record.before_current_L3].every(Boolean)
          ? ([toFloat(record.before_current_L1), toFloat(record.before_current_L2), toFloat(record.before_current_L3)] as number[]).reduce((a, b) => a + b, 0) / 3
          : null,
        // After values
        afterL1: toFloat(record.metrics_L1),
        afterL2: toFloat(record.metrics_L2),
        afterL3: toFloat(record.metrics_L3),
        afterAvg: [record.metrics_L1, record.metrics_L2, record.metrics_L3].every(Boolean)
          ? ([toFloat(record.metrics_L1), toFloat(record.metrics_L2), toFloat(record.metrics_L3)] as number[]).reduce((a, b) => a + b, 0) / 3
          : null
      }
    })

    // Calculate statistics
    const latestRecord = records[records.length - 1]
    const stats = latestRecord ? {
      currentBefore: {
        L1: toFloat(latestRecord.before_current_L1),
        L2: toFloat(latestRecord.before_current_L2),
        L3: toFloat(latestRecord.before_current_L3)
      },
      currentAfter: {
        L1: toFloat(latestRecord.metrics_L1),
        L2: toFloat(latestRecord.metrics_L2),
        L3: toFloat(latestRecord.metrics_L3)
      }
    } : null

    return NextResponse.json({
      success: true,
      data: {
        deviceId,
        scope,
        period: `${hours} hours`,
        dataPoints: chartData.length,
        chartData,
        stats
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Current history error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch current history'
    }, { status: 500 })
  }
}
