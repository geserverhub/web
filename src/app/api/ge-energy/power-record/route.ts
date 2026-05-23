import { NextRequest, NextResponse } from 'next/server';
import { queryGe } from '@/lib/mysql-ge';
import {
  normalizeRecordScope,
  savePowerRecord,
  type PowerRecordPayload,
  type RecordScope,
} from '@/lib/energy/power-record-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE_TO_TABLE: Record<RecordScope, string> = {
  installed: 'power_records',
  pre_install: 'power_records_preinstall',
};

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await queryGe(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );
  const row = rows[0] as { total?: number | string } | undefined;
  return Number(row?.total || 0) > 0;
}

/**
 * POST /api/ge-energy/power-record
 */
export async function POST(req: NextRequest) {
  try {
    const body: PowerRecordPayload = await req.json();
    const result = await savePowerRecord(body);

    if (result.ok === false) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Power record saved successfully',
      record_id: result.record_id,
      device_id: result.device_id,
      record_scope: result.record_scope,
      target_table: result.target_table,
      record_time: result.record_time,
    });
  } catch (err: unknown) {
    console.error('Power record API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to save power record';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * GET /api/ge-energy/power-record?device_id=1&limit=10
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('device_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const requestedScope = normalizeRecordScope(searchParams.get('scope')) ?? 'installed';
    const targetTable = SCOPE_TO_TABLE[requestedScope];

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'device_id parameter is required' },
        { status: 400 }
      );
    }

    if (!(await tableExists(targetTable))) {
      return NextResponse.json(
        {
          success: false,
          error: `Target table '${targetTable}' not found. Please run migration to enable ${requestedScope} storage.`,
        },
        { status: 500 }
      );
    }

    const records = await queryGe(
      `SELECT * FROM ${targetTable}
       WHERE device_id = ?
       ORDER BY record_time DESC
       LIMIT ?`,
      [deviceId, limit]
    );

    return NextResponse.json({
      success: true,
      record_scope: requestedScope,
      target_table: targetTable,
      count: records.length,
      records,
    });
  } catch (err: unknown) {
    console.error('Get power records error:', err);
    const message = err instanceof Error ? err.message : 'Failed to retrieve power records';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
