import { NextRequest, NextResponse } from 'next/server';
import { queryGe } from '@/lib/mysql-ge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ColumnRow = { COLUMN_NAME: string };

type DeviceRow = {
  deviceID: number | string;
  deviceName?: string | null;
  geID?: string | null;
  site?: string | null;
  customerName?: string | null;
  status?: string | null;
  lastRecord?: string | Date | null;
};

type SeriesRow = {
  bucket?: string;
  record_time?: string | Date;
  metrics_L1?: number | string | null;
  metrics_L2?: number | string | null;
  metrics_L3?: number | string | null;
  before_L1?: number | string | null;
  before_L2?: number | string | null;
  before_L3?: number | string | null;
  metrics_P?: number | string | null;
};

type LatestRow = Record<string, unknown>;

const toNum = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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

function resolveWindowSeconds(searchParams: URLSearchParams) {
  const secondsParam = searchParams.get('seconds');
  if (secondsParam != null && secondsParam !== '') {
    return Math.min(Math.max(parseInt(secondsParam, 10) || 60, 10), 3600);
  }
  const minutesParam = searchParams.get('minutes');
  if (minutesParam != null && minutesParam !== '') {
    const minutes = Math.min(Math.max(parseInt(minutesParam, 10) || 30, 5), 180);
    return minutes * 60;
  }
  return 60;
}

/**
 * GET /api/ge-energy/customer-live-monitor?site=thailand&deviceId=1&seconds=60
 * Real-time monitoring — devices, snapshot, time series (window in seconds).
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const site = (params.get('site') || 'thailand').toLowerCase();
    const deviceId = params.get('deviceId');
    const seconds = resolveWindowSeconds(params);

    const siteSql =
      site === 'all'
        ? ''
        : "AND LOWER(COALESCE(d.site, '')) = ?";
    const siteBinds = site === 'all' ? [] : [site];

    const deviceRows = (await queryGe(
      `SELECT
        d.deviceID,
        d.deviceName,
        d.geID,
        d.site,
        d.customerName,
        d.status,
        (SELECT MAX(pr.record_time) FROM power_records pr WHERE pr.device_id = d.deviceID) AS lastRecord
       FROM devices d
       WHERE 1=1 ${siteSql}
       ORDER BY d.deviceName ASC`,
      siteBinds
    )) as DeviceRow[];

    const devices = deviceRows.map((d) => {
      const last = d.lastRecord ? new Date(d.lastRecord) : null;
      const isOnline = last ? Date.now() - last.getTime() < 20 * 60 * 1000 : false;
      return {
        deviceID: d.deviceID,
        deviceName: d.deviceName,
        geID: d.geID,
        site: d.site,
        customerName: d.customerName,
        status: d.status,
        isOnline,
        lastRecord: d.lastRecord,
      };
    });

    if (!deviceId) {
      return NextResponse.json({
        success: true,
        site,
        devices,
        snapshot: null,
        series: [],
        pollIntervalSec: 10,
        timestamp: new Date().toISOString(),
      });
    }

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
      'before_S',
      'metrics_P',
      'metrics_Q',
      'metrics_S',
      'metrics_PF',
      'metrics_F',
      'record_time',
    ]);

    const beforeL1 = pickCol(powerCols, ['before_current_L1', 'before_L1']);
    const beforeL2 = pickCol(powerCols, ['before_current_L2', 'before_L2']);
    const beforeL3 = pickCol(powerCols, ['before_current_L3', 'before_L3']);
    const outL1 = pickCol(powerCols, ['metrics_L1']);
    const outL2 = pickCol(powerCols, ['metrics_L2']);
    const outL3 = pickCol(powerCols, ['metrics_L3']);
    const voltL1 = pickCol(powerCols, ['before_L1']);
    const voltL2 = pickCol(powerCols, ['before_L2']);
    const voltL3 = pickCol(powerCols, ['before_L3']);
    const powerInCol = pickCol(powerCols, ['before_P']);
    const powerOutCol = pickCol(powerCols, ['metrics_P']);
    const reactiveInCol = pickCol(powerCols, ['before_Q']);
    const reactiveOutCol = pickCol(powerCols, ['metrics_Q']);
    const apparentInCol = pickCol(powerCols, ['before_S']);
    const apparentOutCol = pickCol(powerCols, ['metrics_S']);
    const pfCol = pickCol(powerCols, ['metrics_PF']);
    const freqCol = pickCol(powerCols, ['metrics_F']);

    const latestRows = (await queryGe(
      `SELECT * FROM power_records
       WHERE device_id = ?
       ORDER BY record_time DESC, id DESC
       LIMIT 1`,
      [deviceId]
    )) as LatestRow[];

    const latest = latestRows[0];
    const lastTime = latest?.record_time ? new Date(String(latest.record_time)) : null;
    const isOnline = lastTime ? Date.now() - lastTime.getTime() < 20 * 60 * 1000 : false;

    const snapshot = latest
      ? {
          isOnline,
          lastUpdate: lastTime?.toISOString() ?? null,
          currentInput: {
            L1: beforeL1 ? toNum(latest[beforeL1]) : null,
            L2: beforeL2 ? toNum(latest[beforeL2]) : null,
            L3: beforeL3 ? toNum(latest[beforeL3]) : null,
          },
          currentOutput: {
            L1: outL1 ? toNum(latest[outL1]) : null,
            L2: outL2 ? toNum(latest[outL2]) : null,
            L3: outL3 ? toNum(latest[outL3]) : null,
          },
          totalPowerKw: powerOutCol ? toNum(latest[powerOutCol]) : null,
          powerInputKw: powerInCol ? toNum(latest[powerInCol]) : null,
          reactiveInputKvar: reactiveInCol ? toNum(latest[reactiveInCol]) : null,
          reactiveOutputKvar: reactiveOutCol ? toNum(latest[reactiveOutCol]) : null,
          apparentInputKva: apparentInCol ? toNum(latest[apparentInCol]) : null,
          apparentOutputKva: apparentOutCol ? toNum(latest[apparentOutCol]) : null,
          powerFactor: pfCol ? toNum(latest[pfCol]) : null,
          frequency: freqCol ? toNum(latest[freqCol]) : null,
          voltage: {
            L1: voltL1 ? toNum(latest[voltL1]) : null,
            L2: voltL2 ? toNum(latest[voltL2]) : null,
            L3: voltL3 ? toNum(latest[voltL3]) : null,
          },
        }
      : null;

    const avgParts: string[] = [];
    if (beforeL1) avgParts.push(`AVG(${beforeL1}) AS before_L1`);
    if (beforeL2) avgParts.push(`AVG(${beforeL2}) AS before_L2`);
    if (beforeL3) avgParts.push(`AVG(${beforeL3}) AS before_L3`);
    if (outL1) avgParts.push(`AVG(${outL1}) AS metrics_L1`);
    if (outL2) avgParts.push(`AVG(${outL2}) AS metrics_L2`);
    if (outL3) avgParts.push(`AVG(${outL3}) AS metrics_L3`);
    if (voltL1) avgParts.push(`AVG(${voltL1}) AS voltage_L1`);
    if (voltL2) avgParts.push(`AVG(${voltL2}) AS voltage_L2`);
    if (voltL3) avgParts.push(`AVG(${voltL3}) AS voltage_L3`);
    if (powerInCol) avgParts.push(`AVG(${powerInCol}) AS before_P`);
    if (powerOutCol) avgParts.push(`AVG(${powerOutCol}) AS metrics_P`);
    if (reactiveInCol) avgParts.push(`AVG(${reactiveInCol}) AS before_Q`);
    if (reactiveOutCol) avgParts.push(`AVG(${reactiveOutCol}) AS metrics_Q`);
    if (pfCol) avgParts.push(`AVG(${pfCol}) AS metrics_PF`);
    if (freqCol) avgParts.push(`AVG(${freqCol}) AS metrics_F`);

    const mapSeriesRow = (row: SeriesRow & Record<string, unknown>, t: Date) => {
        const b1 = toNum(row.before_L1);
        const b2 = toNum(row.before_L2);
        const b3 = toNum(row.before_L3);
        const o1 = toNum(row.metrics_L1);
        const o2 = toNum(row.metrics_L2);
        const o3 = toNum(row.metrics_L3);
        const beforeVals = [b1, b2, b3].filter((v): v is number => v != null);
        const afterVals = [o1, o2, o3].filter((v): v is number => v != null);
        const v1 = toNum((row as SeriesRow & { voltage_L1?: unknown }).voltage_L1);
        const v2 = toNum((row as SeriesRow & { voltage_L2?: unknown }).voltage_L2);
        const v3 = toNum((row as SeriesRow & { voltage_L3?: unknown }).voltage_L3);
        const voltVals = [v1, v2, v3].filter((v): v is number => v != null);

        return {
          time: t.toISOString(),
          label: t.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
          beforeL1: b1,
          beforeL2: b2,
          beforeL3: b3,
          afterL1: o1,
          afterL2: o2,
          afterL3: o3,
          beforeAvg: beforeVals.length ? beforeVals.reduce((a, b) => a + b, 0) / beforeVals.length : null,
          afterAvg: afterVals.length ? afterVals.reduce((a, b) => a + b, 0) / afterVals.length : null,
          voltageL1: v1,
          voltageL2: v2,
          voltageL3: v3,
          voltageAvg: voltVals.length ? voltVals.reduce((a, b) => a + b, 0) / voltVals.length : null,
          powerInput: toNum((row as SeriesRow & { before_P?: unknown }).before_P),
          powerOutput: toNum(row.metrics_P),
          reactiveInput: toNum((row as SeriesRow & { before_Q?: unknown }).before_Q),
          reactiveOutput: toNum((row as SeriesRow & { metrics_Q?: unknown }).metrics_Q),
          powerFactor: toNum((row as SeriesRow & { metrics_PF?: unknown }).metrics_PF),
          frequency: toNum((row as SeriesRow & { metrics_F?: unknown }).metrics_F),
        };
    };

    let series: Array<Record<string, unknown>> = [];
    if (powerCols.has('record_time')) {
      const selectCols: string[] = ['record_time'];
      if (beforeL1) selectCols.push(`${beforeL1} AS before_L1`);
      if (beforeL2) selectCols.push(`${beforeL2} AS before_L2`);
      if (beforeL3) selectCols.push(`${beforeL3} AS before_L3`);
      if (outL1) selectCols.push(`${outL1} AS metrics_L1`);
      if (outL2) selectCols.push(`${outL2} AS metrics_L2`);
      if (outL3) selectCols.push(`${outL3} AS metrics_L3`);
      if (voltL1) selectCols.push(`${voltL1} AS voltage_L1`);
      if (voltL2) selectCols.push(`${voltL2} AS voltage_L2`);
      if (voltL3) selectCols.push(`${voltL3} AS voltage_L3`);
      if (powerInCol) selectCols.push(`${powerInCol} AS before_P`);
      if (powerOutCol) selectCols.push(`${powerOutCol} AS metrics_P`);
      if (reactiveInCol) selectCols.push(`${reactiveInCol} AS before_Q`);
      if (reactiveOutCol) selectCols.push(`${reactiveOutCol} AS metrics_Q`);
      if (pfCol) selectCols.push(`${pfCol} AS metrics_PF`);
      if (freqCol) selectCols.push(`${freqCol} AS metrics_F`);

      if (seconds <= 300 && selectCols.length > 1) {
        const rawRows = (await queryGe(
          `SELECT ${selectCols.join(', ')}
           FROM power_records
           WHERE device_id = ?
             AND record_time >= NOW() - INTERVAL ? SECOND
           ORDER BY record_time ASC
           LIMIT 500`,
          [deviceId, seconds]
        )) as SeriesRow[];

        series = rawRows.map((row) => {
          const t = row.record_time ? new Date(String(row.record_time)) : new Date();
          return mapSeriesRow(row as SeriesRow & Record<string, unknown>, t);
        });
      } else if (avgParts.length > 0) {
        const seriesRows = (await queryGe(
          `SELECT
            DATE_FORMAT(record_time, '%Y-%m-%d %H:%i') AS bucket,
            MIN(record_time) AS record_time,
            ${avgParts.join(',\n          ')}
           FROM power_records
           WHERE device_id = ?
             AND record_time >= NOW() - INTERVAL ? SECOND
           GROUP BY DATE_FORMAT(record_time, '%Y-%m-%d %H:%i')
           ORDER BY MIN(record_time) ASC`,
          [deviceId, seconds]
        )) as SeriesRow[];

        series = seriesRows.map((row) => {
          const t = row.record_time ? new Date(String(row.record_time)) : new Date();
          return mapSeriesRow(row as SeriesRow & Record<string, unknown>, t);
        });
      }
    }

    return NextResponse.json({
      success: true,
      site,
      deviceId,
      seconds,
      devices,
      snapshot,
      series,
      dataPoints: series.length,
      pollIntervalSec: 10,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('customer-live-monitor error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load live monitor data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
