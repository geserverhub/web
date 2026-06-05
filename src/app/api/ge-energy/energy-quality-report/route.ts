import { NextRequest, NextResponse } from 'next/server';
import { queryGe } from '@/lib/mysql-ge';
import { getDevicesColumnSet, meterIdSelectSql } from '@/lib/ge-energy/devices-schema';
import {
  energyQualityTablesReady,
  loadCustomerSiteForDevice,
  loadLatestEnergyMetrics,
  loadLatestReportSnapshot,
  peekNextReportNumber,
  persistEnergyQualityReport,
  type PersistReportInput,
} from '@/lib/energy/energy-quality-db';
import { toMysqlDateTime } from '@/lib/energy/energy-quality-mysql-datetime';
import type { EnergyQualityReport } from '@/lib/energy/energy-quality-report-model';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DeviceRow = {
  deviceID: number;
  deviceName: string;
  GEsaveID: string | null;
  location: string | null;
  site: string | null;
  ipAddress: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  client_id: string | null;
};

async function loadDeviceRow(deviceId: string): Promise<DeviceRow | null> {
  const columns = await getDevicesColumnSet();
  const meterSelect = meterIdSelectSql(columns, '');
  const rows = await queryGe(
    `SELECT deviceID, deviceName, ${meterSelect}, location, site, ipAddress,
            customerName, customerPhone, customerAddress, client_id
     FROM devices WHERE deviceID = ? LIMIT 1`,
    [Number(deviceId)],
  );
  return (rows[0] as DeviceRow | undefined) ?? null;
}

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get('deviceId')?.trim();
  if (!deviceId) {
    return NextResponse.json({ success: false, error: 'deviceId required' }, { status: 400 });
  }

  const tablesReady = await energyQualityTablesReady();
  if (!tablesReady) {
    return NextResponse.json({
      success: true,
      tablesReady: false,
      customer: null,
      site: null,
      dbMetrics: null,
      snapshot: null,
    });
  }

  const previewNext = req.nextUrl.searchParams.get('previewNext') === '1';
  const [{ customer, site }, dbMetrics, snapshot, nextReportNumber] = await Promise.all([
    loadCustomerSiteForDevice(deviceId),
    loadLatestEnergyMetrics(deviceId),
    loadLatestReportSnapshot(deviceId),
    previewNext ? peekNextReportNumber(deviceId) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    success: true,
    tablesReady: true,
    customer,
    site,
    dbMetrics,
    snapshot,
    nextReportNumber: previewNext ? nextReportNumber : undefined,
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const deviceId = String(body.deviceId ?? '').trim();
  if (!deviceId) {
    return NextResponse.json({ success: false, error: 'deviceId required' }, { status: 400 });
  }

  const tablesReady = await energyQualityTablesReady();
  if (!tablesReady) {
    return NextResponse.json(
      {
        success: false,
        error: 'Energy quality tables not installed. Run: npm run db:migrate-energy-quality-report',
      },
      { status: 503 },
    );
  }

  const report = body.report as EnergyQualityReport | undefined;
  const ch1 = body.ch1 as PersistReportInput['ch1'] | undefined;
  if (!report || !ch1) {
    return NextResponse.json({ success: false, error: 'report and ch1 required' }, { status: 400 });
  }

  const locale = String(body.locale ?? 'en');
  const siteRegion = String(body.siteRegion ?? 'thailand');
  const deviceRow = await loadDeviceRow(deviceId);

  const assignNewReportNumber = body.assignNewReportNumber === true;
  const reportIdLabel =
    typeof body.reportIdLabel === 'string' ? body.reportIdLabel : undefined;

  const measurementStartRaw = body.measurementStart as string | undefined;
  const measurementEndRaw = body.measurementEnd as string | undefined;
  const measurementStart = toMysqlDateTime(measurementStartRaw) ?? undefined;
  const measurementEnd = toMysqlDateTime(measurementEndRaw) ?? undefined;

  const persisted = await persistEnergyQualityReport({
    deviceId,
    siteRegion,
    report,
    ch1,
    measurementStart,
    measurementEnd,
    locale,
    preparedBy: body.preparedBy as string | undefined,
    assignNewReportNumber,
    reportIdLabel,
    device: deviceRow
      ? {
          deviceID: String(deviceRow.deviceID),
          deviceName: deviceRow.deviceName,
          GEsaveID: deviceRow.GEsaveID ?? undefined,
          location: deviceRow.location ?? undefined,
          site: deviceRow.site ?? siteRegion,
          ipAddress: deviceRow.ipAddress ?? undefined,
          customerName: deviceRow.customerName ?? undefined,
          customerPhone: deviceRow.customerPhone ?? undefined,
          customerAddress: deviceRow.customerAddress ?? undefined,
          client_id: deviceRow.client_id ?? undefined,
        }
      : undefined,
  });

  return NextResponse.json({
    success: true,
    reportId: persisted.dbReportId,
    reportNumber: persisted.reportNumber,
  });
}
