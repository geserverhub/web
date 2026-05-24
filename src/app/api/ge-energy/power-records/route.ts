import { NextRequest, NextResponse } from 'next/server';
import { queryGe } from '@/lib/mysql-ge';

export { POST } from '../power-record/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DbRow = Record<string, unknown>;

function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function avgVoltage(l1: unknown, l2: unknown, l3: unknown): number | null {
  const values = [l1, l2, l3].map(num).filter((v): v is number => v != null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function mapRow(row: DbRow) {
  const deviceKey = String(row.geID ?? row.deviceName ?? row.device_id ?? '');
  const status = String(row.device_status ?? '').toUpperCase();
  const ok = status === 'ON' || status === 'OK';

  const before = {
    current: avgVoltage(row.before_L1, row.before_L2, row.before_L3),
    I: avgVoltage(row.before_L1, row.before_L2, row.before_L3),
    P: num(row.before_P),
    Q: num(row.before_Q),
    S: num(row.before_S),
    PF: num(row.before_PF),
    THD: num(row.before_THD),
    F: num(row.before_F),
  };

  const metrics = {
    current: avgVoltage(row.metrics_L1, row.metrics_L2, row.metrics_L3),
    I: avgVoltage(row.metrics_L1, row.metrics_L2, row.metrics_L3),
    P: num(row.metrics_P),
    Q: num(row.metrics_Q),
    S: num(row.metrics_S),
    PF: num(row.metrics_PF),
    THD: num(row.metrics_THD),
    F: num(row.metrics_F),
  };

  return {
    device: deviceKey,
    ksave: row.geID ?? deviceKey,
    time: row.record_time,
    location: row.location ?? row.site,
    site: row.site,
    series_no: row.series_no,
    seriesNo: row.series_no,
    ipAddress: row.ipAddress,
    phone: row.phone,
    beforeMeterNo: row.beforeMeterNo,
    metricsMeterNo: row.metricsMeterNo,
    ok,
    current: metrics.current,
    _value: metrics.current,
    P: metrics.P,
    Q: metrics.Q,
    S: metrics.S,
    PF: metrics.PF,
    THD: metrics.THD,
    F: metrics.F,
    power_before: before,
    before,
    power_metrics: metrics,
    metrics,
  };
}

/**
 * GET /api/ge-energy/power-records?limit=100&site=thailand
 * Latest power_records per device for Compare Monitoring (no device_id required).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10) || 100, 1), 500);
    const site = searchParams.get('site');

    let sql = `
      SELECT
        pr.id,
        pr.device_id,
        pr.record_time,
        pr.before_L1, pr.before_L2, pr.before_L3,
        pr.before_P, pr.before_Q, pr.before_S, pr.before_PF, pr.before_THD, pr.before_F,
        pr.metrics_L1, pr.metrics_L2, pr.metrics_L3,
        pr.metrics_P, pr.metrics_Q, pr.metrics_S, pr.metrics_PF, pr.metrics_THD, pr.metrics_F,
        pr.before_kWh, pr.metrics_kWh,
        d.deviceName,
        d.geID,
        d.series_no,
        d.ipAddress,
        d.location,
        d.site,
        d.status AS device_status,
        d.beforeMeterNo,
        d.metricsMeterNo,
        d.phone
      FROM power_records pr
      INNER JOIN devices d ON d.deviceID = pr.device_id
      INNER JOIN (
        SELECT device_id, MAX(record_time) AS max_time
        FROM power_records
        GROUP BY device_id
      ) latest ON latest.device_id = pr.device_id AND latest.max_time = pr.record_time
    `;

    const params: unknown[] = [];
    if (site && site !== 'All') {
      sql += ' WHERE d.site = ?';
      params.push(site);
    }
    sql += ' ORDER BY pr.record_time DESC LIMIT ?';
    params.push(limit);

    const records = (await queryGe(sql, params)) as DbRow[];
    const rows = records.map(mapRow);

    return NextResponse.json({
      success: true,
      count: rows.length,
      rows,
    });
  } catch (err: unknown) {
    console.error('power-records list error:', err);
    const message = err instanceof Error ? err.message : 'Failed to load power records';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
