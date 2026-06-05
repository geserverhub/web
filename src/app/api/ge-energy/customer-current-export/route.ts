import { NextRequest, NextResponse } from 'next/server';
import { queryGe } from '@/lib/mysql-ge';
import * as XLSX from 'xlsx';
import {
  assertCustomerDeviceAccess,
  requireCustomerDashboardAuth,
} from '@/lib/customer-dashboard-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ColumnRow = { COLUMN_NAME: string };
type DataRow = Record<string, unknown>;

const toNum = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtNum = (v: unknown, digits = 3) => {
  const n = toNum(v);
  return n == null ? '' : n.toFixed(digits);
};

async function availableColumns(table: string, names: string[]) {
  if (names.length === 0) return new Set<string>();
  const placeholders = names.map(() => '?').join(', ');
  const rows = (await queryGe(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME IN (${placeholders})`,
    [table, ...names]
  )) as ColumnRow[];
  return new Set(rows.map((r) => r.COLUMN_NAME));
}

function pickCol(available: Set<string>, candidates: string[]) {
  return candidates.find((c) => available.has(c)) ?? null;
}

function parseDateTime(raw: string | null, fallback: Date): Date {
  if (!raw?.trim()) return fallback;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function resolveIntervalSeconds(raw: string | null) {
  const n = parseInt(raw || '60', 10);
  if (!Number.isFinite(n)) return 60;
  return Math.min(Math.max(n, 1), 3600);
}

function resolveFormat(raw: string | null): 'xlsx' | 'csv' | 'xls' {
  const f = (raw || 'xlsx').toLowerCase();
  if (f === 'csv') return 'csv';
  if (f === 'xls') return 'xls';
  return 'xlsx';
}

const MIME: Record<string, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv; charset=utf-8',
};

/**
 * GET /api/ge-energy/customer-current-export
 * ?deviceId=1&from=ISO&to=ISO&intervalSeconds=60&format=xlsx
 */
export async function GET(request: NextRequest) {
  try {
    const auth = requireCustomerDashboardAuth(request);
    if (auth.ok === false) return auth.response;

    const params = request.nextUrl.searchParams;
    const deviceId = params.get('deviceId');
    if (!deviceId) {
      return NextResponse.json({ success: false, error: 'deviceId required' }, { status: 400 });
    }

    const deviceDenied = await assertCustomerDeviceAccess(auth.scope, deviceId);
    if (deviceDenied) return deviceDenied;

    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 60 * 60 * 1000);
    const fromDate = parseDateTime(params.get('from'), defaultFrom);
    const toDate = parseDateTime(params.get('to'), now);

    if (toDate.getTime() <= fromDate.getTime()) {
      return NextResponse.json({ success: false, error: 'Invalid date range' }, { status: 400 });
    }

    const maxSpanMs = 7 * 24 * 60 * 60 * 1000;
    if (toDate.getTime() - fromDate.getTime() > maxSpanMs) {
      return NextResponse.json(
        { success: false, error: 'Date range cannot exceed 7 days' },
        { status: 400 }
      );
    }

    const intervalSec = resolveIntervalSeconds(params.get('intervalSeconds'));
    const format = resolveFormat(params.get('format'));

    const powerCols = await availableColumns('power_records', [
      'metrics_L1',
      'metrics_L2',
      'metrics_L3',
      'before_L1',
      'before_L2',
      'before_L3',
      'before_current_L1',
      'before_current_L2',
      'before_current_L3',
      'before_P',
      'before_Q',
      'metrics_P',
      'metrics_Q',
      'metrics_PF',
      'metrics_F',
      'record_time',
    ]);

    if (!powerCols.has('record_time')) {
      return NextResponse.json({ success: false, error: 'No power_records table' }, { status: 500 });
    }

    const inL1 = pickCol(powerCols, ['before_current_L1']);
    const inL2 = pickCol(powerCols, ['before_current_L2']);
    const inL3 = pickCol(powerCols, ['before_current_L3']);
    const outL1 = pickCol(powerCols, ['metrics_L1']);
    const outL2 = pickCol(powerCols, ['metrics_L2']);
    const outL3 = pickCol(powerCols, ['metrics_L3']);
    const powerInCol = pickCol(powerCols, ['before_P']);
    const powerOutCol = pickCol(powerCols, ['metrics_P']);
    const reactiveInCol = pickCol(powerCols, ['before_Q']);
    const reactiveOutCol = pickCol(powerCols, ['metrics_Q']);
    const pfCol = pickCol(powerCols, ['metrics_PF']);
    const freqCol = pickCol(powerCols, ['metrics_F']);

    const avgParts: string[] = ['MIN(record_time) AS record_time'];
    if (inL1) avgParts.push(`AVG(${inL1}) AS in_L1`);
    if (inL2) avgParts.push(`AVG(${inL2}) AS in_L2`);
    if (inL3) avgParts.push(`AVG(${inL3}) AS in_L3`);
    if (outL1) avgParts.push(`AVG(${outL1}) AS out_L1`);
    if (outL2) avgParts.push(`AVG(${outL2}) AS out_L2`);
    if (outL3) avgParts.push(`AVG(${outL3}) AS out_L3`);
    if (powerInCol) avgParts.push(`AVG(${powerInCol}) AS power_in`);
    if (powerOutCol) avgParts.push(`AVG(${powerOutCol}) AS power_out`);
    if (reactiveInCol) avgParts.push(`AVG(${reactiveInCol}) AS reactive_in`);
    if (reactiveOutCol) avgParts.push(`AVG(${reactiveOutCol}) AS reactive_out`);
    if (pfCol) avgParts.push(`AVG(${pfCol}) AS pf`);
    if (freqCol) avgParts.push(`AVG(${freqCol}) AS frequency`);

    if (avgParts.length <= 1) {
      return NextResponse.json({ success: false, error: 'No exportable columns' }, { status: 500 });
    }

    const fromSql = fromDate.toISOString().slice(0, 19).replace('T', ' ');
    const toSql = toDate.toISOString().slice(0, 19).replace('T', ' ');

    const rows = (await queryGe(
      `SELECT
         ${avgParts.join(',\n         ')}
       FROM power_records
       WHERE device_id = ?
         AND record_time >= ?
         AND record_time <= ?
       GROUP BY FLOOR(UNIX_TIMESTAMP(record_time) / ?)
       ORDER BY MIN(record_time) ASC
       LIMIT 50000`,
      [deviceId, fromSql, toSql, intervalSec]
    )) as DataRow[];

    const sheetData = rows.map((r) => {
      const t = r.record_time ? new Date(String(r.record_time)) : null;
      return {
        'Record Time': t ? t.toISOString() : '',
        'INPUT L1 (A)': fmtNum(r.in_L1),
        'INPUT L2 (A)': fmtNum(r.in_L2),
        'INPUT L3 (A)': fmtNum(r.in_L3),
        'OUTPUT L1 (A)': fmtNum(r.out_L1),
        'OUTPUT L2 (A)': fmtNum(r.out_L2),
        'OUTPUT L3 (A)': fmtNum(r.out_L3),
        'Power IN (kW)': fmtNum(r.power_in),
        'Power OUT (kW)': fmtNum(r.power_out),
        'Reactive IN (kVAr)': fmtNum(r.reactive_in),
        'Reactive OUT (kVAr)': fmtNum(r.reactive_out),
        'Power Factor': fmtNum(r.pf, 4),
        'Frequency (Hz)': fmtNum(r.frequency, 2),
      };
    });

    const devRows = (await queryGe(
      `SELECT deviceName, GEsaveID FROM devices WHERE deviceID = ? LIMIT 1`,
      [deviceId]
    )) as { deviceName?: string; GEsaveID?: string }[];
    const devLabel = (devRows[0]?.deviceName || devRows[0]?.GEsaveID || deviceId)
      .toString()
      .replace(/[^\w.-]+/g, '_');

    const dateTag = now.toISOString().slice(0, 10);
    const baseName = `current_${devLabel}_${dateTag}`;

    if (sheetData.length === 0) {
      return NextResponse.json({ success: false, error: 'No data in selected range' }, { status: 404 });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Current');

    const bookType = format === 'csv' ? 'csv' : format === 'xls' ? 'xls' : 'xlsx';
    const buf = XLSX.write(wb, { type: 'buffer', bookType });
    const ext = format === 'csv' ? 'csv' : format === 'xls' ? 'xls' : 'xlsx';

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': MIME[format],
        'Content-Disposition': `attachment; filename="${baseName}.${ext}"`,
        'Content-Length': String(buf.length),
        'X-Export-Rows': String(sheetData.length),
        'X-Export-Interval-Seconds': String(intervalSec),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    console.error('customer-current-export error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
