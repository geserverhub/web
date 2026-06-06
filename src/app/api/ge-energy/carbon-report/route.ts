import { NextRequest, NextResponse } from 'next/server';
import {
  carbonReportTablesReady,
  persistCarbonReport,
  peekNextCarbonReportNumber,
} from '@/lib/energy/carbon-credits-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const previewNext = req.nextUrl.searchParams.get('previewNext') === '1';
  if (!previewNext) {
    return NextResponse.json({ success: false, error: 'Use previewNext=1' }, { status: 400 });
  }

  const tablesReady = await carbonReportTablesReady();
  if (!tablesReady) {
    return NextResponse.json({
      success: true,
      tablesReady: false,
      nextReportNumber: null,
    });
  }

  const nextReportNumber = await peekNextCarbonReportNumber();
  return NextResponse.json({
    success: true,
    tablesReady: true,
    nextReportNumber,
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const tablesReady = await carbonReportTablesReady();
  if (!tablesReady) {
    return NextResponse.json(
      {
        success: false,
        error: 'Carbon report table not installed. Run: npm run db:migrate-carbon-credit-report',
      },
      { status: 503 },
    );
  }

  const site = String(body.site ?? 'all').trim() || 'all';
  const periodDays = Number(body.periodDays ?? 30);
  const locale = String(body.locale ?? 'th').trim() || 'th';
  const deviceIds = Array.isArray(body.deviceIds)
    ? body.deviceIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    : [];
  const meterCount = Number(body.meterCount ?? deviceIds.length);
  const summary = body.summary as Record<string, unknown> | undefined;

  if (!summary) {
    return NextResponse.json({ success: false, error: 'summary required' }, { status: 400 });
  }

  try {
    const result = await persistCarbonReport({
      site,
      periodDays: Number.isFinite(periodDays) ? periodDays : 30,
      locale,
      deviceIds,
      meterCount: Number.isFinite(meterCount) ? meterCount : deviceIds.length,
      totalEnergySavedKwh: Number(summary.totalEnergySavedKwh ?? 0),
      totalCo2Kg: Number(summary.totalCo2Kg ?? 0),
      carbonCreditsTonnes: Number(summary.carbonCreditsTonnes ?? 0),
      estimatedValue: Number(summary.estimatedValue ?? 0),
      currency: String(summary.currency ?? 'KRW'),
      preparedBy: typeof body.preparedBy === 'string' ? body.preparedBy : undefined,
    });

    return NextResponse.json({
      success: true,
      reportNumber: result.reportNumber,
      dbReportId: result.dbReportId,
    });
  } catch (err) {
    console.error('[POST /api/ge-energy/carbon-report]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save report' },
      { status: 500 },
    );
  }
}
