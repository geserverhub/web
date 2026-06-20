import { NextRequest, NextResponse } from 'next/server';
import { queryGe } from '@/lib/mysql-ge';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  normalizeRecordScope,
  savePowerRecord,
  type PowerRecordPayload,
  type RecordScope,
} from '@/lib/energy/power-record-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function verifyApiKey(req: NextRequest): Promise<boolean> {
  const key = req.headers.get('x-api-key') || new URL(req.url).searchParams.get('api_key');
  if (!key) return false;
  const rows = await queryGeserverhub(
    `SELECT id FROM api_keys WHERE api_key = ? AND is_active = 1
     AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1`,
    [key]
  );
  if (!rows.length) return false;
  await queryGeserverhub('UPDATE api_keys SET last_used_at = NOW() WHERE api_key = ?', [key]);
  return true;
}

async function resolveDeviceId(raw: Record<string, unknown>): Promise<number | null> {
  const direct = raw.device_id ?? raw.deviceId ?? raw.deviceID;
  if (direct != null && !Number.isNaN(Number(direct))) return Number(direct);
  const gesaveId = raw.GEsaveID ?? raw.ge_id ?? raw.gesave_id;
  if (!gesaveId) return null;
  const rows = await queryGeserverhub(
    'SELECT deviceID FROM devices WHERE GEsaveID = ? LIMIT 1',
    [String(gesaveId).trim()]
  );
  return rows.length ? Number((rows[0] as { deviceID: number }).deviceID) : null;
}

/** Normalize T310 2-channel payload — maps ch1/ch2 aliases to before/metrics fields */
function normalizeChannelFields(raw: Record<string, unknown>): Record<string, unknown> {
  const CH1: Record<string, string> = {
    ch1_L1: 'before_L1', ch1_L2: 'before_L2', ch1_L3: 'before_L3',
    ch1_current_L1: 'before_current_L1', ch1_current_L2: 'before_current_L2', ch1_current_L3: 'before_current_L3',
    ch1_kWh: 'before_kWh', ch1_P: 'before_P', ch1_Q: 'before_Q', ch1_S: 'before_S',
    ch1_PF: 'before_PF', ch1_THD: 'before_THD', ch1_F: 'before_F', ch1_meter_no: 'before_meter_no',
    // aliases
    V1_ch1: 'before_L1', V2_ch1: 'before_L2', V3_ch1: 'before_L3',
    I1_ch1: 'before_current_L1', I2_ch1: 'before_current_L2', I3_ch1: 'before_current_L3',
  };
  const CH2: Record<string, string> = {
    ch2_L1: 'metrics_L1', ch2_L2: 'metrics_L2', ch2_L3: 'metrics_L3',
    ch2_current_L1: 'metrics_current_L1', ch2_current_L2: 'metrics_current_L2', ch2_current_L3: 'metrics_current_L3',
    ch2_kWh: 'metrics_kWh', ch2_P: 'metrics_P', ch2_Q: 'metrics_Q', ch2_S: 'metrics_S',
    ch2_PF: 'metrics_PF', ch2_THD: 'metrics_THD', ch2_F: 'metrics_F', ch2_meter_no: 'metrics_meter_no',
    // aliases
    V1_ch2: 'metrics_L1', V2_ch2: 'metrics_L2', V3_ch2: 'metrics_L3',
    I1_ch2: 'metrics_current_L1', I2_ch2: 'metrics_current_L2', I3_ch2: 'metrics_current_L3',
  };
  const aliasMap = { ...CH1, ...CH2 };
  const out: Record<string, unknown> = { ...raw };
  for (const [alias, canonical] of Object.entries(aliasMap)) {
    if (raw[alias] !== undefined && out[canonical] === undefined) {
      out[canonical] = raw[alias];
    }
  }
  return out;
}

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
 * T310 gateway sends: { GEsaveID, metrics_P, metrics_kWh, ... }
 * Auth: x-api-key header or ?api_key= query param
 */
export async function POST(req: NextRequest) {
  try {
    const authorized = await verifyApiKey(req);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Invalid or missing API key' }, { status: 401 });
    }

    const raw = normalizeChannelFields(await req.json() as Record<string, unknown>);

    const deviceId = await resolveDeviceId(raw);
    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'device_id or GEsaveID required and must match a known device' },
        { status: 400 }
      );
    }

    const body: PowerRecordPayload = { ...(raw as PowerRecordPayload), device_id: deviceId };
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
