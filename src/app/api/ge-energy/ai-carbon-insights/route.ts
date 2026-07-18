import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  CO2_KG_PER_KWH,
  buildRuleBasedInsights,
  computeCarbonSummary,
  getSiteCreditPricing,
} from '@/lib/energy/carbon-credits';
import { callAiText, resolveAiCredentials } from '@/lib/energy/ai-settings';
import { getDevicesColumnSet, meterIdSelectSql } from '@/lib/ge-energy/devices-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

async function generateAiNarrative(
  summary: ReturnType<typeof computeCarbonSummary>,
  topDevices: { deviceName: string; co2Kg: number; creditsTonnes: number }[],
  locale: string,
  userId?: string | null
): Promise<{ text: string | null; source: string }> {
  const lang =
    locale === 'th' || locale.startsWith('th')
      ? 'Thai'
      : locale === 'ko' || locale.startsWith('ko')
        ? 'Korean'
        : 'English';

  const system = `You are an energy & carbon analyst for GE Energy Tech. Analyze IoT/MQTT meter data from power_records. Be concise (max 6 short bullets). Mention carbon credits (tCO2e), CO2 kg, kWh saved, and 1 actionable recommendation. Respond in ${lang} only. Do not invent data beyond the JSON provided.`;

  const user = JSON.stringify({
    summary,
    topDevices: topDevices.slice(0, 5),
    note: 'Carbon credits estimated as tonnes CO2e avoided (1 t ≈ 1 voluntary credit).',
  });

  const result = await callAiText(system, user, { maxTokens: 450, temperature: 0.3, userId: userId ?? undefined });
  return { text: result.text, source: result.source };
}

/**
 * GET /api/ge-energy/ai-carbon-insights?site=thailand&period=30&locale=th
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = Math.min(365, Math.max(1, parseInt(searchParams.get('period') || '30', 10)));
    const site = (searchParams.get('site') || 'thailand').toLowerCase();
    const locale = searchParams.get('locale') || 'th';
    const userId = searchParams.get('userId');
    const deviceId = searchParams.get('deviceId');
    const deviceIdsParam = searchParams.get('deviceIds');
    const validSites = ['thailand', 'korea', 'vietnam', 'malaysia'];
    const safeSite = validSites.includes(site) ? site : 'thailand';
    const pricing = getSiteCreditPricing(safeSite);

    const overridePrice = Number(searchParams.get('creditPrice'));
    if (Number.isFinite(overridePrice) && overridePrice > 0) {
      pricing.creditPricePerTonne = overridePrice;
    }

    // Trend query still filters raw telemetry by record_time (each grouped day already
    // isolates one snapshot per device, so summing per day is safe).
    let whereClause = `WHERE pr.record_time >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`;
    const params: unknown[] = [];

    const parsedDeviceIds = deviceIdsParam
      ? deviceIdsParam.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [];

    if (parsedDeviceIds.length > 0) {
      whereClause += ` AND d.deviceID IN (${parsedDeviceIds.map(() => '?').join(',')})`;
      params.push(...parsedDeviceIds);
    } else if (deviceId) {
      whereClause += ' AND pr.device_id = ?';
      params.push(deviceId);
    } else {
      params.push(`%${safeSite}%`);
      whereClause += " AND LOWER(COALESCE(d.site, d.location, '')) LIKE ?";
    }

    // Scope filter applied to `devices` for the per-device "latest paired reading" queries
    // below (summary + topDevices) — kept separate from whereClause because it has no
    // pr.record_time term (that lives inside the latest_pr subquery instead).
    let deviceScopeWhere = '';
    const deviceScopeParams: unknown[] = [];
    if (parsedDeviceIds.length > 0) {
      deviceScopeWhere = `WHERE d.deviceID IN (${parsedDeviceIds.map(() => '?').join(',')})`;
      deviceScopeParams.push(...parsedDeviceIds);
    } else if (deviceId) {
      deviceScopeWhere = 'WHERE d.deviceID = ?';
      deviceScopeParams.push(deviceId);
    } else {
      deviceScopeWhere = `WHERE LOWER(COALESCE(d.site, d.location, '')) LIKE ?`;
      deviceScopeParams.push(`%${safeSite}%`);
    }

    const deviceColumns = await getDevicesColumnSet();
    const meterSelect = meterIdSelectSql(deviceColumns);

    // `latest_pr` = each device's single most recent record where BOTH before_kWh and
    // metrics_kWh are present (a genuine paired CH1/CH2 reading). Do NOT sum
    // energy_reduction/co2_reduction across records — those are snapshot diffs of
    // cumulative registers, so summing many readings for the same meter inflates
    // totals. Saved kWh = latest CH1 (before) − latest CH2 (after), summed across
    // *different* meters (which is a legitimate sum).
    const perDeviceLatestSql = `
       FROM devices d
       INNER JOIN (
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
       ${deviceScopeWhere}`;

    const summaryRows = (await queryGeserverhub(
      `SELECT
        SUM(latest_pr.before_kWh - latest_pr.metrics_kWh) AS total_energy_saved,
        SUM((latest_pr.before_kWh - latest_pr.metrics_kWh) * ${CO2_KG_PER_KWH}) AS total_co2_saved,
        AVG(latest_pr.before_kWh) AS avg_before,
        AVG(latest_pr.metrics_kWh) AS avg_after,
        COUNT(*) AS record_count,
        COUNT(DISTINCT d.deviceID) AS device_count
       ${perDeviceLatestSql}`,
      [period, ...deviceScopeParams]
    )) as Row[];

    const s = summaryRows[0] || {};
    const summary = computeCarbonSummary(
      {
        totalEnergySavedKwh: Number(s.total_energy_saved) || 0,
        totalCo2Kg: Number(s.total_co2_saved) || 0,
        avgBeforeKwh: Number(s.avg_before) || 0,
        avgAfterKwh: Number(s.avg_after) || 0,
      },
      pricing
    );

    const dailyTrend = (await queryGeserverhub(
      `SELECT
        DATE(pr.record_time) AS date,
        SUM(pr.energy_reduction) AS energy_saved,
        SUM(pr.co2_reduction) AS co2_kg
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       ${whereClause}
       GROUP BY DATE(pr.record_time)
       ORDER BY date ASC`,
      params
    )) as Row[];

    const topDevices = (await queryGeserverhub(
      `SELECT
        d.deviceID AS device_id,
        d.deviceName AS device_name,
        ${meterSelect.replace('AS GEsaveID', 'AS gesave_id')},
        (latest_pr.before_kWh - latest_pr.metrics_kWh) AS energy_saved,
        (latest_pr.before_kWh - latest_pr.metrics_kWh) * ${CO2_KG_PER_KWH} AS co2_kg
       ${perDeviceLatestSql}
       ORDER BY co2_kg DESC
       ${parsedDeviceIds.length > 0 ? '' : 'LIMIT 8'}`,
      [period, ...deviceScopeParams]
    )) as Row[];

    const ruleBased = buildRuleBasedInsights(
      summary,
      pricing,
      locale,
      Number(s.device_count) || 0
    );

    const topForAi = topDevices.map((r) => ({
      deviceName: String(r.device_name || r.gesave_id || r.device_id),
      co2Kg: Math.round((Number(r.co2_kg) || 0) * 100) / 100,
      creditsTonnes: Math.round(((Number(r.co2_kg) || 0) / 1000) * 10000) / 10000,
    }));

    const aiResult = await generateAiNarrative(summary, topForAi, locale, userId);
    const credsForStatus = await resolveAiCredentials(userId);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ...summary,
          recordCount: Number(s.record_count) || 0,
          deviceCount: Number(s.device_count) || 0,
          pricing: {
            market: pricing.market,
            currency: pricing.currency,
            creditPricePerTonne: pricing.creditPricePerTonne,
          },
        },
        dailyTrend: dailyTrend.map((r) => {
          const co2Kg = Number(r.co2_kg) || 0;
          return {
            date: r.date,
            energySavedKwh: Math.round((Number(r.energy_saved) || 0) * 100) / 100,
            co2Kg: Math.round(co2Kg * 100) / 100,
            carbonCreditsTonnes: Math.round((co2Kg / 1000) * 10000) / 10000,
          };
        }),
        topDevices: topDevices.map((r) => {
          const co2Kg = Number(r.co2_kg) || 0;
          return {
            deviceId: r.device_id,
            deviceName: r.device_name,
            GEsaveID: r.gesave_id,
            energySavedKwh: Math.round((Number(r.energy_saved) || 0) * 100) / 100,
            co2Kg: Math.round(co2Kg * 100) / 100,
            carbonCreditsTonnes: Math.round((co2Kg / 1000) * 10000) / 10000,
          };
        }),
        insights: {
          ruleBased,
          aiNarrative: aiResult.text,
          aiAvailable: Boolean(credsForStatus.apiKey),
          aiKeySource: credsForStatus.source,
        },
        periodDays: period,
        site: safeSite,
        dataSource: 'mqtt_power_records',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to compute carbon insights';
    console.error('ai-carbon-insights error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
