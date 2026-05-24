import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RecordScope = 'installed' | 'pre_install'

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
  return Number(rows?.[0]?.total || 0) > 0
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
    const records = await queryGe(
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
    )

    // Format data for chart
    const chartData = records.map((record: any) => {
      const time = new Date(record.record_time)
      return {
        time: time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        timestamp: time.getTime(),
        // Before values
        beforeL1: record.before_current_L1 ? parseFloat(record.before_current_L1) : null,
        beforeL2: record.before_current_L2 ? parseFloat(record.before_current_L2) : null,
        beforeL3: record.before_current_L3 ? parseFloat(record.before_current_L3) : null,
        beforeAvg: record.before_current_L1 && record.before_current_L2 && record.before_current_L3
          ? (parseFloat(record.before_current_L1) + parseFloat(record.before_current_L2) + parseFloat(record.before_current_L3)) / 3
          : null,
        // After values
        afterL1: record.metrics_L1 ? parseFloat(record.metrics_L1) : null,
        afterL2: record.metrics_L2 ? parseFloat(record.metrics_L2) : null,
        afterL3: record.metrics_L3 ? parseFloat(record.metrics_L3) : null,
        afterAvg: record.metrics_L1 && record.metrics_L2 && record.metrics_L3
          ? (parseFloat(record.metrics_L1) + parseFloat(record.metrics_L2) + parseFloat(record.metrics_L3)) / 3
          : null
      }
    })

    // Calculate statistics
    const latestRecord = records[records.length - 1]
    const stats = latestRecord ? {
      currentBefore: {
        L1: latestRecord.before_current_L1 ? parseFloat(latestRecord.before_current_L1) : null,
        L2: latestRecord.before_current_L2 ? parseFloat(latestRecord.before_current_L2) : null,
        L3: latestRecord.before_current_L3 ? parseFloat(latestRecord.before_current_L3) : null
      },
      currentAfter: {
        L1: latestRecord.metrics_L1 ? parseFloat(latestRecord.metrics_L1) : null,
        L2: latestRecord.metrics_L2 ? parseFloat(latestRecord.metrics_L2) : null,
        L3: latestRecord.metrics_L3 ? parseFloat(latestRecord.metrics_L3) : null
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
