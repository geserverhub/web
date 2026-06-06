import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { getDevicesColumnSet, meterIdGroupBySql, meterIdSelectSql } from '@/lib/ge-energy/devices-schema';
import {
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
    const meterGroup = meterIdGroupBySql(deviceColumns);
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

    const params: unknown[] = [period];
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
    const ch1PrCol = prHasBeforeMeterNo ? 'NULLIF(TRIM(pr.before_meter_no), \'\')' : 'NULL';
    const ch2PrCol = prHasMetricsMeterNo ? 'NULLIF(TRIM(pr.metrics_meter_no), \'\')' : 'NULL';

    // LEFT JOIN so every selected device appears even without telemetry in the period.
    // Use latest cumulative kWh readings (not SUM) — summing cumulative registers inflates totals.
    const rows = (await queryGeserverhub(
      `SELECT
        d.deviceID   AS device_id,
        d.deviceName AS device_name,
        ${meterSelect.replace('AS GEsaveID', 'AS gesave_id')},
        d.site,
        d.location,
        d.ipAddress  AS ip_address,
        COALESCE(SUM(pr.energy_reduction), 0) AS energy_saved,
        COALESCE(SUM(pr.co2_reduction), 0)    AS co2_kg,
        COALESCE(
          CAST(
            SUBSTRING_INDEX(
              GROUP_CONCAT(CAST(pr.before_kWh AS CHAR) ORDER BY pr.record_time DESC SEPARATOR '|'),
              '|', 1
            ) AS DECIMAL(20, 4)
          ),
          0
        ) AS total_kwh_ch1_before,
        COALESCE(
          CAST(
            SUBSTRING_INDEX(
              GROUP_CONCAT(CAST(pr.metrics_kWh AS CHAR) ORDER BY pr.record_time DESC SEPARATOR '|'),
              '|', 1
            ) AS DECIMAL(20, 4)
          ),
          0
        ) AS total_kwh_ch2_after,
        COALESCE(${ch1DeviceCol}, MAX(${ch1PrCol})) AS ch1_before,
        COALESCE(${ch2DeviceCol}, MAX(${ch2PrCol})) AS ch2_after,
        COUNT(pr.id)         AS record_count,
        MIN(pr.record_time)  AS first_record,
        MAX(pr.record_time)  AS last_record
       FROM devices d
       LEFT JOIN power_records pr
         ON pr.device_id = d.deviceID
        AND pr.record_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ${deviceWhere}
       GROUP BY d.deviceID, d.deviceName, ${meterGroup}, d.site, d.location, d.ipAddress
       ORDER BY co2_kg DESC, d.deviceName ASC`,
      params,
    )) as Row[];

    const meters = rows.map((r, idx) => {
      const co2Kg = Math.round((Number(r.co2_kg) || 0) * 100) / 100;
      const carbonCreditsTonnes = Math.round((co2Kg / 1000) * 10000) / 10000;
      const ch1Raw = String(r.ch1_before || '').trim();
      const ch2Raw = String(r.ch2_after || '').trim();
      return {
        rank: idx + 1,
        deviceId: Number(r.device_id),
        deviceName: String(r.device_name || ''),
        GEsaveID: String(r.gesave_id || ''),
        site: String(r.site || r.location || ''),
        ipAddress: String(r.ip_address || ''),
        ch1Before: ch1Raw ? (ch1Raw.startsWith('#') ? ch1Raw : `# ${ch1Raw}`) : '—',
        ch2After: ch2Raw ? (ch2Raw.startsWith('#') ? ch2Raw : `# ${ch2Raw}`) : '—',
        totalKwhCh1Before: Math.round((Number(r.total_kwh_ch1_before) || 0) * 100) / 100,
        totalKwhCh2After: Math.round((Number(r.total_kwh_ch2_after) || 0) * 100) / 100,
        recordCount: Number(r.record_count) || 0,
        firstRecord: r.first_record,
        lastRecord: r.last_record,
        energySavedKwh: Math.round((Number(r.energy_saved) || 0) * 100) / 100,
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
