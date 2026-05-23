import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  buildRuleBasedInsights,
  computeCarbonSummary,
  getSiteCreditPricing,
} from '@/lib/energy/carbon-credits';
import { resolveAiCredentials } from '@/lib/energy/ai-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

async function generateAiNarrative(
  summary: ReturnType<typeof computeCarbonSummary>,
  topDevices: { deviceName: string; co2Kg: number; creditsTonnes: number }[],
  locale: string,
  userId?: string | null
): Promise<{ text: string | null; source: string }> {
  const creds = await resolveAiCredentials(userId);
  if (!creds.apiKey) return { text: null, source: creds.source };
  const apiKey = creds.apiKey;

  const lang =
    locale === 'th' || locale.startsWith('th')
      ? 'Thai'
      : locale === 'ko' || locale.startsWith('ko')
        ? 'Korean'
        : 'English';

  const system = `You are an energy & carbon analyst for GE Energy Tech. Analyze IoT/MQTT meter data already stored in MySQL power_records. Be concise (max 6 short bullets). Mention carbon credits (tCO2e), CO2 kg, kWh saved, and 1 actionable recommendation. Respond in ${lang} only. Do not invent data beyond the JSON provided.`;

  const user = JSON.stringify({
    summary,
    topDevices: topDevices.slice(0, 5),
    note: 'Carbon credits estimated as tonnes CO2e avoided (1 t ≈ 1 voluntary credit).',
  });

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: creds.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 450,
        temperature: 0.3,
      }),
    });

    if (!resp.ok) return { text: null, source: creds.source };
    const data = await resp.json();
    return {
      text: data.choices?.[0]?.message?.content?.trim() || null,
      source: creds.source,
    };
  } catch (err) {
    console.error('AI carbon narrative error:', err);
    return { text: null, source: creds.source };
  }
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
    const validSites = ['thailand', 'korea', 'vietnam', 'malaysia'];
    const safeSite = validSites.includes(site) ? site : 'thailand';
    const pricing = getSiteCreditPricing(safeSite);

    const overridePrice = Number(searchParams.get('creditPrice'));
    if (Number.isFinite(overridePrice) && overridePrice > 0) {
      pricing.creditPricePerTonne = overridePrice;
    }

    let whereClause = `WHERE pr.record_time >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`;
    const params: unknown[] = [`%${safeSite}%`];
    whereClause += " AND LOWER(COALESCE(d.site, d.location, '')) LIKE ?";

    if (deviceId) {
      whereClause += ' AND pr.device_id = ?';
      params.push(deviceId);
    }

    const summaryRows = (await queryGeserverhub(
      `SELECT
        SUM(pr.energy_reduction) AS total_energy_saved,
        SUM(pr.co2_reduction) AS total_co2_saved,
        AVG(pr.before_kWh) AS avg_before,
        AVG(pr.metrics_kWh) AS avg_after,
        COUNT(*) AS record_count,
        COUNT(DISTINCT pr.device_id) AS device_count
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       ${whereClause}`,
      params
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
        d.geID AS ge_id,
        SUM(pr.energy_reduction) AS energy_saved,
        SUM(pr.co2_reduction) AS co2_kg
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       ${whereClause}
       GROUP BY d.deviceID, d.deviceName, d.geID
       ORDER BY co2_kg DESC
       LIMIT 8`,
      params
    )) as Row[];

    const ruleBased = buildRuleBasedInsights(
      summary,
      pricing,
      locale,
      Number(s.device_count) || 0
    );

    const topForAi = topDevices.map((r) => ({
      deviceName: String(r.device_name || r.ge_id || r.device_id),
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
            geID: r.ge_id,
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
