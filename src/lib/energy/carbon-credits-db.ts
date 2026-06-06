import { queryGe } from '@/lib/mysql-ge';
import {
  buildCarbonReportIdBase,
  nextCarbonReportNumberFromExisting,
} from './carbon-credits-report-id';

const TABLE_CHECK = 'cc_reports';

export type PersistCarbonReportInput = {
  site: string;
  periodDays: number;
  locale: string;
  deviceIds: number[];
  meterCount: number;
  totalEnergySavedKwh: number;
  totalCo2Kg: number;
  carbonCreditsTonnes: number;
  estimatedValue: number;
  currency: string;
  preparedBy?: string;
};

export type PersistCarbonReportResult = {
  dbReportId: number;
  reportNumber: string;
};

async function insertReturningId(sql: string, values: unknown[]): Promise<number> {
  await queryGe(sql, values);
  const rows = await queryGe('SELECT LAST_INSERT_ID() AS id');
  return Number((rows[0] as { id?: number })?.id ?? 0);
}

export async function carbonReportTablesReady(): Promise<boolean> {
  try {
    const rows = await queryGe(
      `SELECT COUNT(*) AS c FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [TABLE_CHECK],
    );
    return Number((rows[0] as { c?: number })?.c) > 0;
  } catch {
    return false;
  }
}

export async function peekNextCarbonReportNumber(at: Date = new Date()): Promise<string> {
  const base = buildCarbonReportIdBase(at);
  const rows = await queryGe(
    `SELECT report_number FROM cc_reports
     WHERE report_number = ? OR report_number LIKE ?`,
    [base, `${base}-%`],
  );
  const existing = rows.map((r) => String((r as { report_number: string }).report_number));
  return nextCarbonReportNumberFromExisting(existing, at);
}

export async function persistCarbonReport(
  input: PersistCarbonReportInput,
): Promise<PersistCarbonReportResult> {
  const deviceIdsJson = JSON.stringify(input.deviceIds);
  let insertedId: number | undefined;
  let reportNumber = '';

  for (let attempt = 0; attempt < 8; attempt++) {
    reportNumber = await peekNextCarbonReportNumber();
    try {
      insertedId = await insertReturningId(
        `INSERT INTO cc_reports (
          report_number, site, period_days, locale, device_ids, meter_count,
          total_energy_saved_kwh, total_co2_kg, carbon_credits_tonnes,
          estimated_value, currency, prepared_by, report_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'printed')`,
        [
          reportNumber,
          input.site,
          input.periodDays,
          input.locale,
          deviceIdsJson,
          input.meterCount,
          input.totalEnergySavedKwh,
          input.totalCo2Kg,
          input.carbonCreditsTonnes,
          input.estimatedValue,
          input.currency,
          input.preparedBy || 'GE Energy Tech',
        ],
      );
      break;
    } catch (err) {
      const errno = (err as { errno?: number })?.errno;
      if (errno === 1062 && attempt < 7) continue;
      throw err;
    }
  }

  if (insertedId == null) {
    throw new Error('Could not allocate unique carbon report number');
  }

  return { dbReportId: insertedId, reportNumber };
}
