import { queryGeserverhub } from '@/lib/geserverhub-db';

export { GE_MQTT_PAYLOAD_EXAMPLE } from './mqtt-payload';

export type RecordScope = 'installed' | 'pre_install';

export type PowerRecordPayload = {
  device_id: number;
  record_scope?: RecordScope;
  before_meter_no?: string;
  metrics_meter_no?: string;
  record_time?: string;
  before_L1?: number;
  before_L2?: number;
  before_L3?: number;
  before_current_L1?: number;
  before_current_L2?: number;
  before_current_L3?: number;
  before_kWh?: number;
  before_P?: number;
  before_Q?: number;
  before_S?: number;
  before_PF?: number;
  before_THD?: number;
  before_F?: number;
  metrics_L1?: number;
  metrics_L2?: number;
  metrics_L3?: number;
  metrics_current_L1?: number;
  metrics_current_L2?: number;
  metrics_current_L3?: number;
  metrics_kWh?: number;
  metrics_P?: number;
  metrics_Q?: number;
  metrics_S?: number;
  metrics_PF?: number;
  metrics_THD?: number;
  metrics_F?: number;
};

const SCOPE_TO_TABLE: Record<RecordScope, string> = {
  installed: 'power_records',
  pre_install: 'power_records_preinstall',
};

const OPTIONAL_FIELDS: (keyof PowerRecordPayload)[] = [
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
  'metrics_current_L1',
  'metrics_current_L2',
  'metrics_current_L3',
  'metrics_kWh',
  'metrics_P',
  'metrics_Q',
  'metrics_S',
  'metrics_PF',
  'metrics_THD',
  'metrics_F',
];

export function normalizeRecordScope(scope?: string | null): RecordScope | null {
  if (!scope) return null;
  const normalized = String(scope).trim().toLowerCase();
  if (normalized === 'installed') return 'installed';
  if (normalized === 'pre_install' || normalized === 'pre-install' || normalized === 'preinstall') {
    return 'pre_install';
  }
  return null;
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await queryGeserverhub(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );
  const row = rows[0] as { total?: number | string } | undefined;
  return Number(row?.total || 0) > 0;
}

async function devicesHasRecordScopeColumn(): Promise<boolean> {
  const rows = await queryGeserverhub(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'devices'
       AND COLUMN_NAME = 'record_scope'
     LIMIT 1`
  );
  const row = rows[0] as { total?: number | string } | undefined;
  return Number(row?.total || 0) > 0;
}

async function resolveRecordScope(deviceId: number, payloadScope?: string | null): Promise<RecordScope> {
  const normalizedPayloadScope = normalizeRecordScope(payloadScope);
  if (normalizedPayloadScope) return normalizedPayloadScope;

  const hasScopeColumn = await devicesHasRecordScopeColumn();
  if (!hasScopeColumn) return 'installed';

  const rows = await queryGeserverhub('SELECT record_scope FROM devices WHERE deviceID = ? LIMIT 1', [
    deviceId,
  ]);
  const deviceRow = rows[0] as { record_scope?: string | null } | undefined;
  return normalizeRecordScope(deviceRow?.record_scope ?? null) ?? 'installed';
}

export type SavePowerRecordResult =
  | {
      ok: true;
      record_id: number;
      device_id: number;
      record_scope: RecordScope;
      target_table: string;
      record_time: string;
    }
  | { ok: false; status: number; error: string };

export async function savePowerRecord(body: PowerRecordPayload): Promise<SavePowerRecordResult> {
  if (!body.device_id) {
    return { ok: false, status: 400, error: 'device_id is required' };
  }

  const deviceCheck = await queryGeserverhub(
    'SELECT deviceID, series_no FROM devices WHERE deviceID = ? LIMIT 1',
    [body.device_id]
  );
  if (!deviceCheck.length) {
    return { ok: false, status: 404, error: `Device ID ${body.device_id} not found` };
  }
  const deviceSeriesNo = (deviceCheck[0] as { series_no?: string | null }).series_no ?? null;

  const recordScope = await resolveRecordScope(body.device_id, body.record_scope);
  const targetTable = SCOPE_TO_TABLE[recordScope];

  if (!(await tableExists(targetTable))) {
    return {
      ok: false,
      status: 500,
      error: `Target table '${targetTable}' not found. Run energy migration.`,
    };
  }

  const recordTime = body.record_time || new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Let AUTO_INCREMENT assign id — avoids race conditions
  const columns: string[] = ['device_id', 'record_time'];
  const values: unknown[] = [body.device_id, recordTime];

  // Fill series_no from device if not in payload and table supports it
  if (targetTable === 'power_records') {
    columns.push('series_no');
    values.push(deviceSeriesNo);
  }

  OPTIONAL_FIELDS.forEach((field) => {
    if (body[field] !== undefined && body[field] !== null) {
      columns.push(field);
      values.push(body[field]);
    }
  });

  let insertId: number;
  try {
    const result = await queryGeserverhub(
      `INSERT INTO ${targetTable} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values
    ) as unknown as { insertId: number };
    insertId = result.insertId;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'ER_DUP_ENTRY') {
      return { ok: false, status: 409, error: 'Duplicate record' };
    }
    const message = err instanceof Error ? err.message : 'Failed to save power record';
    return { ok: false, status: 500, error: message };
  }

  // Update device_connectivity heartbeat
  await queryGeserverhub(
    `INSERT INTO device_connectivity (device_id, last_seen_at, last_record_id, online_status)
     VALUES (?, NOW(), ?, 1)
     ON DUPLICATE KEY UPDATE
       last_seen_at   = NOW(),
       last_record_id = VALUES(last_record_id),
       online_status  = 1`,
    [body.device_id, insertId]
  ).catch(() => { /* non-critical */ });

  return {
    ok: true,
    record_id: insertId,
    device_id: body.device_id,
    record_scope: recordScope,
    target_table: targetTable,
    record_time: recordTime,
  };
}

/** Resolve device_id from GEsaveID / deviceId aliases in MQTT JSON. */
export async function resolveDeviceIdFromPayload(raw: Record<string, unknown>): Promise<number | null> {
  const direct =
    raw.device_id ?? raw.deviceId ?? raw.deviceID ?? raw.id;
  if (direct != null && !Number.isNaN(Number(direct))) {
    return Number(direct);
  }

  const GEsaveID = raw.GEsaveID ?? raw.geID ?? raw.geId ?? raw.gesave_id;
  if (GEsaveID == null || String(GEsaveID).trim() === '') return null;

  const { getDevicesColumnSet, meterIdWhereSql } = await import('@/lib/ge-energy/devices-schema');
  const columns = await getDevicesColumnSet();
  const meterCol = meterIdWhereSql(columns, '');
  if (meterCol === 'NULL') return null;

  const rows = await queryGeserverhub(`SELECT deviceID FROM devices WHERE ${meterCol} = ? LIMIT 1`, [
    String(GEsaveID).trim(),
  ]);
  if (!rows.length) return null;
  return Number((rows[0] as { deviceID: number }).deviceID);
}

/** Read first matching numeric field (supports after_* → metrics_* aliases). */
export function numFromPayload(raw: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (v === undefined || v === null || v === '') continue;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function mqttPayloadToPowerRecord(
  raw: Record<string, unknown>,
  deviceId: number
): PowerRecordPayload {
  const recordTime = raw.record_time ?? raw.recordTime ?? raw.timestamp;
  const scope = raw.record_scope ?? raw.recordScope;

  return {
    device_id: deviceId,
    record_scope: normalizeRecordScope(scope as string) ?? undefined,
    record_time: recordTime ? String(recordTime).replace('T', ' ').slice(0, 19) : undefined,
    before_meter_no: raw.before_meter_no != null ? String(raw.before_meter_no) : undefined,
    metrics_meter_no: raw.metrics_meter_no != null ? String(raw.metrics_meter_no) : undefined,
    before_L1: numFromPayload(raw, 'before_L1'),
    before_L2: numFromPayload(raw, 'before_L2'),
    before_L3: numFromPayload(raw, 'before_L3'),
    before_current_L1: numFromPayload(raw, 'before_current_L1'),
    before_current_L2: numFromPayload(raw, 'before_current_L2'),
    before_current_L3: numFromPayload(raw, 'before_current_L3'),
    before_kWh: numFromPayload(raw, 'before_kWh'),
    before_P: numFromPayload(raw, 'before_P'),
    before_Q: numFromPayload(raw, 'before_Q'),
    before_S: numFromPayload(raw, 'before_S'),
    before_PF: numFromPayload(raw, 'before_PF'),
    before_THD: numFromPayload(raw, 'before_THD', 'before_thd'),
    before_F: numFromPayload(raw, 'before_F'),
    metrics_L1: numFromPayload(raw, 'metrics_L1', 'after_L1'),
    metrics_L2: numFromPayload(raw, 'metrics_L2', 'after_L2'),
    metrics_L3: numFromPayload(raw, 'metrics_L3', 'after_L3'),
    metrics_kWh: numFromPayload(raw, 'metrics_kWh', 'after_kWh'),
    metrics_P: numFromPayload(raw, 'metrics_P', 'after_P'),
    metrics_Q: numFromPayload(raw, 'metrics_Q', 'after_Q'),
    metrics_S: numFromPayload(raw, 'metrics_S', 'after_S'),
    metrics_PF: numFromPayload(raw, 'metrics_PF', 'after_PF'),
    metrics_THD: numFromPayload(raw, 'metrics_THD', 'after_THD', 'metrics_thd', 'after_thd'),
    metrics_F: numFromPayload(raw, 'metrics_F', 'after_F'),
  };
}
