import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  DEFAULT_CREDIT_PRICE_KRW_PER_TONNE,
  DEFAULT_CREDIT_PRICE_THB_PER_TONNE,
} from '@/lib/energy/carbon-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = Math.min(365, Math.max(1, parseInt(searchParams.get('period') || '30', 10)));
    const site = (searchParams.get('site') || 'thailand').toLowerCase();
    const validSites = ['thailand', 'korea', 'vietnam', 'malaysia'];
    const safeSite = validSites.includes(site) ? site : 'thailand';
    const deviceIdsParam = searchParams.get('deviceIds'); // comma-separated e.g. "4,7,12"
    const allDevices = searchParams.get('all') === 'true';

    // --- All-devices list (no power_records join) for the picker ---
    if (searchParams.get('list') === 'true') {
      const listRows = (await queryGeserverhub(
        `SELECT deviceID, deviceName, GEsaveID, site, location, ipAddress
         FROM devices ORDER BY deviceName ASC`
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

    // --- Carbon calculation query ---
    const params: unknown[] = [period];
    let whereExtra = '';

    if (deviceIdsParam) {
      const ids = deviceIdsParam.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length > 0) {
        whereExtra = `AND d.deviceID IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      }
    } else if (!allDevices) {
      whereExtra = `AND LOWER(COALESCE(d.site, d.location, '')) LIKE ?`;
      params.push(`%${safeSite}%`);
    }

    const rows = (await queryGeserverhub(
      `SELECT
        d.deviceID   AS device_id,
        d.deviceName AS device_name,
        d.GEsaveID       AS gesave_id,
        d.site,
        d.location,
        d.ipAddress  AS ip_address,
        SUM(pr.energy_reduction) AS energy_saved,
        SUM(pr.co2_reduction)    AS co2_kg,
        SUM(pr.before_kWh)       AS total_kwh_ch1_before,
        SUM(pr.metrics_kWh)      AS total_kwh_ch2_after,
        COALESCE(MAX(d.beforeMeterNo), MAX(pr.before_meter_no))   AS ch1_before,
        COALESCE(MAX(d.metricsMeterNo), MAX(pr.metrics_meter_no)) AS ch2_after,
        MIN(pr.record_time)      AS first_record,
        MAX(pr.record_time)      AS last_record
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       WHERE pr.record_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ${whereExtra}
       GROUP BY d.deviceID, d.deviceName, d.GEsaveID, d.site, d.location, d.ipAddress
       ORDER BY co2_kg DESC`,
      params
    )) as Row[];

    const meters = rows.map((r, idx) => {
      const co2Kg = Math.round((Number(r.co2_kg) || 0) * 100) / 100;
      const carbonCreditsTonnes = Math.round((co2Kg / 1000) * 10000) / 10000;
      return {
        rank: idx + 1,
        deviceId: Number(r.device_id),
        deviceName: String(r.device_name || ''),
        GEsaveID: String(r.gesave_id || ''),
        site: String(r.site || r.location || ''),
        ipAddress: String(r.ip_address || ''),
        ch1Before: String(r.ch1_before || '—'),
        ch2After: String(r.ch2_after || '—'),
        totalKwhCh1Before: Math.round((Number(r.total_kwh_ch1_before) || 0) * 100) / 100,
        totalKwhCh2After: Math.round((Number(r.total_kwh_ch2_after) || 0) * 100) / 100,
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
      { energySavedKwh: 0, co2Kg: 0, carbonCreditsTonnes: 0, estimatedValueKRW: 0, estimatedValueTHB: 0, totalKwhCh1Before: 0, totalKwhCh2After: 0 }
    );

    return NextResponse.json({ success: true, meters, totals, count: meters.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch carbon meters';
    console.error('carbon-meters error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
