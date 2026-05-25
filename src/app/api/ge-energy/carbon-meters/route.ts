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
        `SELECT deviceID, deviceName, geID, site, location, ipAddress
         FROM devices ORDER BY deviceName ASC`
      )) as Row[];
      return NextResponse.json({
        success: true,
        devices: listRows.map((r) => ({
          deviceId: Number(r.deviceID),
          deviceName: String(r.deviceName || ''),
          geID: String(r.geID || ''),
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
        d.geID       AS ge_id,
        d.site,
        d.location,
        d.ipAddress  AS ip_address,
        SUM(pr.energy_reduction) AS energy_saved,
        SUM(pr.co2_reduction)    AS co2_kg,
        COUNT(*)                 AS records,
        MIN(pr.record_time)      AS first_record,
        MAX(pr.record_time)      AS last_record
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       WHERE pr.record_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ${whereExtra}
       GROUP BY d.deviceID, d.deviceName, d.geID, d.site, d.location, d.ipAddress
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
        geID: String(r.ge_id || ''),
        site: String(r.site || r.location || ''),
        ipAddress: String(r.ip_address || ''),
        records: Number(r.records) || 0,
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
        records: acc.records + m.records,
      }),
      { energySavedKwh: 0, co2Kg: 0, carbonCreditsTonnes: 0, estimatedValueKRW: 0, estimatedValueTHB: 0, records: 0 }
    );

    return NextResponse.json({ success: true, meters, totals, count: meters.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch carbon meters';
    console.error('carbon-meters error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
