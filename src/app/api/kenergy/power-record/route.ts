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

interface PowerRecordPayload {
  device_id: number
  record_scope?: RecordScope
  before_meter_no?: string
  metrics_meter_no?: string
  record_time?: string // ISO datetime, defaults to NOW()

  // Before GE Energy readings (Input side)
  before_L1?: number // Voltage L1
  before_L2?: number // Voltage L2
  before_L3?: number // Voltage L3
  before_current_L1?: number // Current L1 (Ampere)
  before_current_L2?: number // Current L2 (Ampere)
  before_current_L3?: number // Current L3 (Ampere)
  before_kWh?: number
  before_P?: number // Active Power (kW)
  before_Q?: number // Reactive Power (kVAR)
  before_S?: number // Apparent Power (kVA)
  before_PF?: number // Power Factor
  before_THD?: number // Total Harmonic Distortion (%)
  before_F?: number // Frequency (Hz)

  // After GE Energy readings (Output side / Metrics)
  metrics_L1?: number // Voltage L1
  metrics_L2?: number // Voltage L2
  metrics_L3?: number // Voltage L3
  metrics_kWh?: number
  metrics_P?: number // Active Power (kW)
  metrics_Q?: number // Reactive Power (kVAR)
  metrics_S?: number // Apparent Power (kVA)
  metrics_PF?: number // Power Factor
  metrics_THD?: number // Total Harmonic Distortion (%)
  metrics_F?: number // Frequency (Hz)
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

async function devicesHasRecordScopeColumn(): Promise<boolean> {
  const rows = await queryGe(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'devices'
       AND COLUMN_NAME = 'record_scope'`
  )
  return Number(rows?.[0]?.total || 0) > 0
}

async function resolveRecordScope(deviceId: number, payloadScope?: string | null): Promise<RecordScope> {
  const normalizedPayloadScope = normalizeRecordScope(payloadScope)
  if (normalizedPayloadScope) return normalizedPayloadScope

  const hasScopeColumn = await devicesHasRecordScopeColumn()
  if (!hasScopeColumn) return 'installed'

  const rows = await queryGe(
    'SELECT record_scope FROM devices WHERE deviceID = ? LIMIT 1',
    [deviceId]
  )

  const scopeFromDevice = normalizeRecordScope(rows?.[0]?.record_scope ?? null)
  return scopeFromDevice ?? 'installed'
}

/**
 * POST /api/kenergy/power-record
 *
 * Receives power readings from GE Energy devices and stores them in power_records table.
 *
 * Request body:
 * {
 *   "device_id": 1,
 *   "before_L1": 220.5,
 *   "before_L2": 221.3,
 *   "before_L3": 219.8,
 *   "before_current_L1": 45.2,
 *   "before_current_L2": 46.1,
 *   "before_current_L3": 44.8,
 *   "before_P": 28.5,
 *   "before_PF": 0.92,
 *   "before_THD": 3.2,
 *   "metrics_L1": 220.1,
 *   "metrics_L2": 220.8,
 *   "metrics_L3": 219.5,
 *   "metrics_P": 22.8,
 *   "metrics_PF": 0.95,
 *   "metrics_THD": 1.8,
 *   "record_time": "2026-03-27T18:30:00"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Power record saved successfully",
 *   "record_id": 12345
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body: PowerRecordPayload = await req.json()

    // Validate required fields
    if (!body.device_id) {
      return NextResponse.json({
        success: false,
        error: 'device_id is required'
      }, { status: 400 })
    }

    // Verify device exists
    const deviceCheck = await queryGe(
      'SELECT deviceID FROM devices WHERE deviceID = ?',
      [body.device_id]
    )

    if (!deviceCheck || deviceCheck.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Device ID ${body.device_id} not found`
      }, { status: 404 })
    }

    const recordScope = await resolveRecordScope(body.device_id, body.record_scope)
    const targetTable = SCOPE_TO_TABLE[recordScope]

    const targetTableExists = await tableExists(targetTable)
    if (!targetTableExists) {
      return NextResponse.json({
        success: false,
        error: `Target table '${targetTable}' not found. Please run migration to enable ${recordScope} storage.`
      }, { status: 500 })
    }

    // Generate next ID
    const maxIdResult = await queryGe(
      `SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM ${targetTable}`
    )
    const nextId = maxIdResult[0]?.nextId || 1

    // Use provided record_time or current timestamp
    const recordTime = body.record_time || new Date().toISOString().slice(0, 19).replace('T', ' ')

    // Build dynamic INSERT query based on provided fields
    const columns: string[] = ['id', 'device_id', 'record_time']
    const values: any[] = [nextId, body.device_id, recordTime]

    // Add optional fields if provided
    const optionalFields: (keyof PowerRecordPayload)[] = [
      'before_meter_no',
      'metrics_meter_no',
      'before_L1',
      'before_L2',
      'before_L3',
      'before_current_L1',
      'before_current_L2',
      'before_current_L3',
      'before_kWh',
      'before_P',
      'before_Q',
      'before_S',
      'before_PF',
      'before_THD',
      'before_F',
      'metrics_L1',
      'metrics_L2',
      'metrics_L3',
      'metrics_kWh',
      'metrics_P',
      'metrics_Q',
      'metrics_S',
      'metrics_PF',
      'metrics_THD',
      'metrics_F'
    ]

    optionalFields.forEach(field => {
      if (body[field] !== undefined && body[field] !== null) {
        columns.push(field)
        values.push(body[field])
      }
    })

    // Execute INSERT
    await queryGe(
      `INSERT INTO ${targetTable} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values
    )

    return NextResponse.json({
      success: true,
      message: 'Power record saved successfully',
      record_id: nextId,
      device_id: body.device_id,
      record_scope: recordScope,
      target_table: targetTable,
      record_time: recordTime
    })

  } catch (err: any) {
    console.error('Power record API error:', err)

    // Check for duplicate key error
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        error: 'Duplicate record detected. This record may have already been saved.'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to save power record'
    }, { status: 500 })
  }
}

/**
 * GET /api/kenergy/power-record?device_id=1&limit=10
 *
 * Retrieves recent power records for a device
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('device_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const requestedScope = normalizeRecordScope(searchParams.get('scope')) ?? 'installed'
    const targetTable = SCOPE_TO_TABLE[requestedScope]

    if (!deviceId) {
      return NextResponse.json({
        success: false,
        error: 'device_id parameter is required'
      }, { status: 400 })
    }

    const targetTableExists = await tableExists(targetTable)
    if (!targetTableExists) {
      return NextResponse.json({
        success: false,
        error: `Target table '${targetTable}' not found. Please run migration to enable ${requestedScope} storage.`
      }, { status: 500 })
    }

    const records = await queryGe(
      `SELECT * FROM ${targetTable}
       WHERE device_id = ?
       ORDER BY record_time DESC
       LIMIT ?`,
      [deviceId, limit]
    )

    return NextResponse.json({
      success: true,
      record_scope: requestedScope,
      target_table: targetTable,
      count: records.length,
      records
    })

  } catch (err: any) {
    console.error('Get power records error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to retrieve power records'
    }, { status: 500 })
  }
}
