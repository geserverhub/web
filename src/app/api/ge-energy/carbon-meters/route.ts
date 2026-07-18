import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { getDevicesColumnSet, meterIdSelectSql } from '@/lib/ge-energy/devices-schema';
import {
  CO2_KG_PER_KWH,
  DEFAULT_CREDIT_PRICE_KRW_PER_TONNE,
  DEFAULT_CREDIT_PRICE_THB_PER_TONNE,
} from '@/lib/energy/carbon-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

async function powerRecordsHasColumn(columnName: string): Promise<boolean> {
  const rows = await queryGeserverhub(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records' AND COLUMN_NAME = ?
     LIMIT 1`,
    [columnName],
  );
  return rows.length > 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = Math.min(365, Math.max(1, parseInt(searchParams.get('period') || '30', 10)));
    const site = (searchParams.get('site') || 'thailand').toLowerCase();
    const validSites = ['thailand', 'korea', 'vietnam', 'malaysia'];
    const safeSite = validSites.includes(site) ? site : 'thailand';
    const deviceIdsParam = searchParams.get('deviceIds');
    const allDevices = searchParams.get('all') === 'true';

    const deviceColumns = await getDevicesColumnSet();
    const meterSelect = meterIdSelectSql(deviceColumns);
    const meterSelectBare = meterIdSelectSql(deviceColumns, '');
    const hasBeforeMeterNo = deviceColumns.has('beforeMeterNo');
    const hasMetricsMeterNo = deviceColumns.has('metricsMeterNo');
    const prHasBeforeMeterNo = await powerRecordsHasColumn('before_meter_no');
    const prHasMetricsMeterNo = await powerRecordsHasColumn('metrics_meter_no');

    // --- All-devices list (no power_records join) for the picker ---
    if (searchParams.get('list') === 'true') {
      const listRows = (await queryGeserverhub(
        `SELECT deviceID, deviceName, ${meterSelectBare}, site, location, ipAddress
         FROM devices ORDER BY deviceName ASC`,
      )) as Row[];
      return NextResponse.json({
        success: true,
        devices: listRows.map((r) => ({
          deviceId: Number(r.deviceID),
          deviceName: String(r.deviceName || ''),
          GEsaveID: String(r.GEsaveID || ''),
          site: String(r.site || r.location || ''),
        })),
      });
    }

    const params: unknown[] = [period, period];
    let deviceWhere = '';

    if (deviceIdsParam) {
      const ids = deviceIdsParam.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length > 0) {
        deviceWhere = `WHERE d.deviceID IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      }
    } else if (!allDevices) {
      deviceWhere = `WHERE LOWER(COALESCE(d.site, d.location, '')) LIKE ?`;
      params.push(`%${safeSite}%`);
    }

    const ch1DeviceCol = hasBeforeMeterNo ? 'NULLIF(TRIM(d.beforeMeterNo), \'\')' : 'NULL';
    const ch2DeviceCol = hasMetricsMeterNo ? 'NULLIF(TRIM(d.metricsMeterNo), \'\')' : 'NULL';
    const ch1PrCol = prHasBeforeMeterNo ? 'NULLIF(TRIM(latest_pr.before_meter_no), \'\')' : 'NULL';
    const ch2PrCol = prHasMetricsMeterNo ? 'NULLIF(TRIM(latest_pr.metrics_meter_no), \'\')' : 'NULL';

    // LEFT JOIN so every selected device appears even without telemetry in the period.
    // `latest_pr` is the single most recent record where BOTH before_kWh and metrics_kWh
    // are present — a genuine paired CH1/CH2 reading. Other tables (e.g. the Energy
    // Quality Report's seed data) write CH1-only rows against the same device_id, so
    // picking "latest non-null before_kWh" and "latest non-null metrics_kWh" independently
    // can mix two different dates; requiring both non-null on the same row avoids that.
    const rows = (await queryGeserverhub(
      `SELECT
        d.deviceID   AS device_id,
        d.deviceName AS device_name,
        ${meterSelect.replace('AS GEsaveID', 'AS gesave_id')},
        d.site,
        d.location,
        d.ipAddress  AS ip_address,
        COALESCE(latest_pr.before_kWh, 0)  AS total_kwh_ch1_before,
        COALESCE(latest_pr.metrics_kWh, 0) AS total_kwh_ch2_after,
        COALESCE(${ch1DeviceCol}, ${ch1PrCol}) AS ch1_before,
        COALESCE(${ch2DeviceCol}, ${ch2PrCol}) AS ch2_after,
        COALESCE(agg.record_count, 0) AS record_count,
        agg.first_record,
        agg.last_record
       FROM devices d
       LEFT JOIN (
         SELECT pr.*
         FROM power_records pr
         INNER JOIN (
           SELECT device_id, MAX(record_time) AS max_time
           FROM power_records
           WHERE before_kWh IS NOT NULL
             AND metrics_kWh IS NOT NULL
             AND record_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
           GROUP BY device_id
         ) mx ON mx.device_id = pr.device_id AND mx.max_time = pr.record_time
       ) latest_pr ON latest_pr.device_id = d.deviceID
       LEFT JOIN (
         SELECT device_id,
                COUNT(*)          AS record_count,
                MIN(record_time)  AS first_record,
                MAX(record_time)  AS last_record
         FROM power_records
         WHERE record_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY device_id
       ) agg ON agg.device_id = d.deviceID
       ${deviceWhere}
       ORDER BY (COALESCE(latest_pr.before_kWh, 0) - COALESCE(latest_pr.metrics_kWh, 0)) DESC, d.deviceName ASC`,
      params,
    )) as Row[];

    const meters = rows.map((r, idx) => {
      const ch1Raw = String(r.ch1_before || '').trim();
      const ch2Raw = String(r.ch2_after || '').trim();
      const totalKwhCh1Before = Math.round((Number(r.total_kwh_ch1_before) || 0) * 100) / 100;
      const totalKwhCh2After = Math.round((Number(r.total_kwh_ch2_after) || 0) * 100) / 100;
      // kWh Saved = latest CH1 (before) reading − latest CH2 (after) reading.
      // Do NOT sum per-record energy_reduction — before_kWh/metrics_kWh are
      // cumulative registers, so summing the generated column across many
      // readings double/triple-counts the same gap and inflates totals.
      const energySavedKwh = Math.round((totalKwhCh1Before - totalKwhCh2After) * 100) / 100;
      const co2Kg = Math.round(energySavedKwh * CO2_KG_PER_KWH * 100) / 100;
      const carbonCreditsTonnes = Math.round((co2Kg / 1000) * 10000) / 10000;
      return {
        rank: idx + 1,
        deviceId: Number(r.device_id),
        deviceName: String(r.device_name || ''),
        GEsaveID: String(r.gesave_id || ''),
        site: String(r.site || r.location || ''),
        ipAddress: String(r.ip_address || ''),
        ch1Before: ch1Raw ? (ch1Raw.startsWith('#') ? ch1Raw : `# ${ch1Raw}`) : '—',
        ch2After: ch2Raw ? (ch2Raw.startsWith('#') ? ch2Raw : `# ${ch2Raw}`) : '—',
        totalKwhCh1Before,
        totalKwhCh2After,
        recordCount: Number(r.record_count) || 0,
        firstRecord: r.first_record,
        lastRecord: r.last_record,
        energySavedKwh,
        co2Kg,
        carbonCreditsTonnes,
        estimatedValueKRW: Math.round(carbonCreditsTonnes * DEFAULT_CREDIT_PRICE_KRW_PER_TONNE),
        estimatedValueTHB: Math.round(carbonCreditsTonnes * DEFAULT_CREDIT_PRICE_THB_PER_TONNE),
      };
    });

    const totals = meters.reduce(
      (acc, m) => ({
        energySavedKwh: Math.round((acc.energySavedKwh + m.energySavedKwh) * 100) / 100,
        co2Kg: Math.round((acc.co2Kg + m.co2Kg) * 100) / 100,
        carbonCreditsTonnes: Math.round((acc.carbonCreditsTonnes + m.carbonCreditsTonnes) * 10000) / 10000,
        estimatedValueKRW: acc.estimatedValueKRW + m.estimatedValueKRW,
        estimatedValueTHB: acc.estimatedValueTHB + m.estimatedValueTHB,
        totalKwhCh1Before: Math.round((acc.totalKwhCh1Before + m.totalKwhCh1Before) * 100) / 100,
        totalKwhCh2After: Math.round((acc.totalKwhCh2After + m.totalKwhCh2After) * 100) / 100,
      }),
      {
        energySavedKwh: 0,
        co2Kg: 0,
        carbonCreditsTonnes: 0,
        estimatedValueKRW: 0,
        estimatedValueTHB: 0,
        totalKwhCh1Before: 0,
        totalKwhCh2After: 0,
      },
    );

    return NextResponse.json({ success: true, meters, totals, count: meters.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch carbon meters';
    console.error('carbon-meters error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
