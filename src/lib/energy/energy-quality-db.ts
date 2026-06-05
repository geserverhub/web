import { queryGe } from '@/lib/mysql-ge';
import type { EnergyQualityReport } from './energy-quality-report-model';

export type EqCustomerRow = {
  id: number;
  customer_name: string;
  business_type: string | null;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
};

export type EqSiteRow = {
  id: number;
  customer_id: number;
  site_name: string;
  location: string | null;
  site_region: string | null;
  transformer_size: string | null;
  contract_demand: number | null;
  voltage_system: string | null;
};

export type PersistReportInput = {
  deviceId: string;
  siteRegion: string;
  device?: {
    deviceID: string;
    deviceName?: string;
    location?: string;
    site?: string;
    geID?: string;
    ipAddress?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    client_id?: string;
  };
  report: EnergyQualityReport;
  ch1: {
    voltage: (number | null)[];
    current: (number | null)[];
    activePower: number | null;
    reactivePower: number | null;
    apparentPower: number | null;
    powerFactor: number | null;
    thd: number | null;
    frequency: number | null;
    energyKwh: number | null;
  };
  measurementStart?: string;
  measurementEnd?: string;
  locale: string;
  preparedBy?: string;
};

const TABLE_CHECK = `eq_customers`;

async function insertReturningId(sql: string, values: unknown[]): Promise<number> {
  await queryGe(sql, values);
  const rows = await queryGe('SELECT LAST_INSERT_ID() AS id');
  return Number((rows[0] as { id?: number })?.id ?? 0);
}

export async function energyQualityTablesReady(): Promise<boolean> {
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

export async function ensureCustomerSiteForDevice(device: {
  deviceID: string;
  deviceName?: string;
  location?: string;
  site?: string;
  geID?: string;
  ipAddress?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  client_id?: string;
}): Promise<{ customerId: number; siteId: number }> {
  const deviceId = Number(device.deviceID);
  const linked = await queryGe(
    `SELECT s.id AS site_id, s.customer_id
     FROM eq_device_sites ds
     JOIN eq_sites s ON s.id = ds.site_id
     WHERE ds.device_id = ? LIMIT 1`,
    [deviceId],
  );
  if (linked.length) {
    const row = linked[0] as { site_id: number; customer_id: number };
    return { customerId: row.customer_id, siteId: row.site_id };
  }

  const name = String(device.customerName || device.deviceName || `Device ${deviceId}`).trim();
  const customerId = await insertReturningId(
    `INSERT INTO eq_customers (customer_name, business_type, address, contact_person, phone, legacy_client_id)
     VALUES (?, 'Industrial / Commercial', ?, ?, ?, ?)`,
    [
      name,
      device.customerAddress || device.location || null,
      name,
      device.customerPhone || null,
      device.client_id || null,
    ],
  );

  const siteId = await insertReturningId(
    `INSERT INTO eq_sites (customer_id, site_name, location, site_region, voltage_system)
     VALUES (?, ?, ?, ?, '3-Phase 400V')`,
    [
      customerId,
      device.deviceName || name,
      device.location || null,
      device.site || 'thailand',
    ],
  );

  await queryGe(
    `INSERT INTO eq_device_sites (device_id, site_id, measurement_point, gateway_id)
     VALUES (?, ?, ?, ?)`,
    [deviceId, siteId, device.deviceName || null, device.geID || device.ipAddress || null],
  );

  return { customerId, siteId };
}

export async function insertEnergySnapshot(
  deviceId: string,
  ch1: PersistReportInput['ch1'],
  recordedAt: Date = new Date(),
): Promise<void> {
  await queryGe(
    `INSERT INTO eq_energy_data (
      device_id, recorded_at,
      voltage_l1, voltage_l2, voltage_l3,
      current_l1, current_l2, current_l3,
      power_kw, energy_kwh, power_factor, frequency,
      thdi_l1, thdi_l2, thdi_l3,
      thdv_l1, thdv_l2, thdv_l3,
      reactive_kvar, apparent_kva, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live')`,
    [
      Number(deviceId),
      recordedAt,
      ch1.voltage[0],
      ch1.voltage[1],
      ch1.voltage[2],
      ch1.current[0],
      ch1.current[1],
      ch1.current[2],
      ch1.activePower,
      ch1.energyKwh,
      ch1.powerFactor,
      ch1.frequency,
      ch1.thd,
      ch1.thd,
      ch1.thd,
      null,
      null,
      null,
      ch1.reactivePower,
      ch1.apparentPower,
    ],
  );
}

export async function persistEnergyQualityReport(input: PersistReportInput): Promise<number> {
  const deviceId = Number(input.deviceId);
  const dev = input.device ?? { deviceID: input.deviceId, site: input.siteRegion };
  const { customerId, siteId } = await ensureCustomerSiteForDevice({
    ...dev,
    site: dev.site || input.siteRegion,
  });

  await insertEnergySnapshot(input.deviceId, input.ch1);

  const reportNumber = input.report.reportId;
  const existing = await queryGe(
    `SELECT id FROM eq_reports WHERE report_number = ? LIMIT 1`,
    [reportNumber],
  );
  let reportId: number;
  if (existing.length) {
    reportId = Number((existing[0] as { id: number }).id);
    await queryGe(
      `UPDATE eq_reports SET
        customer_id = ?, site_id = ?, measurement_start = ?, measurement_end = ?,
        prepared_by = ?, report_status = 'analyzed', locale = ?, updated_at = NOW(6)
       WHERE id = ?`,
      [
        customerId,
        siteId,
        input.measurementStart || null,
        input.measurementEnd || null,
        input.preparedBy || 'GE Energy Tech',
        input.locale,
        reportId,
      ],
    );
  } else {
    reportId = await insertReturningId(
      `INSERT INTO eq_reports (
        report_number, customer_id, site_id, device_id,
        measurement_start, measurement_end, prepared_by, report_status, locale
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'analyzed', ?)`,
      [
        reportNumber,
        customerId,
        siteId,
        deviceId,
        input.measurementStart || null,
        input.measurementEnd || null,
        input.preparedBy || 'GE Energy Tech',
        input.locale,
      ],
    );
  }

  const thdiAvg = parseThdFromHarmonic(input.report);
  const analysisValues = [
    siteId,
    reportId,
    deviceId,
    parseNumField(input.report.energy, 'Total Energy'),
    parseNumField(input.report.executive, 'Average Load'),
    parseNumField(input.report.executive, 'Peak Demand'),
    parseNumField(input.report.executive, 'Load Factor'),
    parseNumField(input.report.executive, 'Average Power Factor'),
    parseNumField(input.report.executive, 'Current Imbalance'),
    parseNumField(input.report.executive, 'Voltage Imbalance'),
    thdiAvg,
    parseThdvFromHarmonic(input.report),
    input.report.overallRisk,
    parseNumField(input.report.peak, 'Peak Demand'),
    input.report.peak.find((p) => p.label.includes('Peak Time'))?.value || null,
    parseNumField(input.report.peak, 'Peak / Average'),
    parseMoneyField(input.report.financial, 'Est. Monthly Cost'),
    parseMoneyField(input.report.financial, 'Est. PF Penalty'),
    parseMoneyField(input.report.financial, 'Potential Monthly Saving'),
    JSON.stringify(input.report),
  ];

  const analysisExists = await queryGe(
    `SELECT id FROM eq_analysis_results WHERE report_id = ? LIMIT 1`,
    [reportId],
  );
  if (analysisExists.length) {
    await queryGe(
      `UPDATE eq_analysis_results SET
        site_id = ?, device_id = ?,
        total_energy = ?, average_load = ?, max_demand = ?, load_factor = ?, average_pf = ?,
        current_imbalance = ?, voltage_imbalance = ?, thdi_avg = ?, thdv_avg = ?, risk_level = ?,
        peak_demand = ?, peak_time = ?, peak_ratio = ?,
        monthly_cost_est = ?, penalty_cost_est = ?, potential_saving = ?,
        snapshot_json = ?
       WHERE report_id = ?`,
      [...analysisValues, reportId],
    );
  } else {
    await queryGe(
      `INSERT INTO eq_analysis_results (
        site_id, report_id, device_id,
        total_energy, average_load, max_demand, load_factor, average_pf,
        current_imbalance, voltage_imbalance, thdi_avg, thdv_avg, risk_level,
        peak_demand, peak_time, peak_ratio,
        monthly_cost_est, penalty_cost_est, potential_saving,
        snapshot_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      analysisValues,
    );
  }

  await queryGe(`DELETE FROM eq_recommendations WHERE report_id = ?`, [reportId]);
  for (const rec of input.report.recommendations) {
    await queryGe(
      `INSERT INTO eq_recommendations (report_id, priority, title, description)
       VALUES (?, ?, ?, ?)`,
      [reportId, rec.priority, rec.title, rec.description],
    );
  }

  return reportId;
}

function parseNumField(fields: { label: string; value: string }[], keyPart: string): number | null {
  const row = fields.find((f) => f.label.includes(keyPart));
  if (!row?.value || row.value === '—') return null;
  const n = parseFloat(row.value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseMoneyField(fields: { label: string; value: string }[], keyPart: string): number | null {
  const row = fields.find((f) => f.label.includes(keyPart));
  if (!row?.value || row.value === '—') return null;
  const n = parseFloat(row.value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseThdFromHarmonic(report: EnergyQualityReport): number | null {
  const row = report.harmonic.find((f) => f.label.includes('THDI') && f.label.includes('เฉลี่ย')) 
    || report.harmonic.find((f) => f.label.toLowerCase().includes('average'));
  if (!row?.value || row.value === '—') return null;
  const n = parseFloat(row.value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseThdvFromHarmonic(report: EnergyQualityReport): number | null {
  const row = report.harmonic.find((f) => f.label.includes('THDV') && (f.label.includes('เฉลี่ย') || f.label.toLowerCase().includes('average')));
  if (!row?.value || row.value === '—') return null;
  const n = parseFloat(row.value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export async function loadLatestReportSnapshot(
  deviceId: string,
): Promise<EnergyQualityReport | null> {
  const rows = await queryGe(
    `SELECT ar.snapshot_json
     FROM eq_analysis_results ar
     WHERE ar.device_id = ?
     ORDER BY ar.created_at DESC
     LIMIT 1`,
    [Number(deviceId)],
  );
  if (!rows.length) return null;
  const raw = (rows[0] as { snapshot_json?: string | EnergyQualityReport }).snapshot_json;
  if (!raw) return null;
  if (typeof raw === 'object') return raw as EnergyQualityReport;
  try {
    return JSON.parse(raw as string) as EnergyQualityReport;
  } catch {
    return null;
  }
}

export async function loadCustomerSiteForDevice(deviceId: string): Promise<{
  customer: EqCustomerRow | null;
  site: EqSiteRow | null;
}> {
  const rows = await queryGe(
    `SELECT c.id, c.customer_name, c.business_type, c.address, c.contact_person, c.phone, c.email,
            s.id AS site_id, s.customer_id, s.site_name, s.location, s.site_region,
            s.transformer_size, s.contract_demand, s.voltage_system
     FROM eq_device_sites ds
     JOIN eq_sites s ON s.id = ds.site_id
     JOIN eq_customers c ON c.id = s.customer_id
     WHERE ds.device_id = ? LIMIT 1`,
    [Number(deviceId)],
  );
  if (!rows.length) return { customer: null, site: null };
  const r = rows[0] as Record<string, unknown>;
  return {
    customer: {
      id: Number(r.id),
      customer_name: String(r.customer_name),
      business_type: r.business_type as string | null,
      address: r.address as string | null,
      contact_person: r.contact_person as string | null,
      phone: r.phone as string | null,
      email: r.email as string | null,
    },
    site: {
      id: Number(r.site_id),
      customer_id: Number(r.customer_id),
      site_name: String(r.site_name),
      location: r.location as string | null,
      site_region: r.site_region as string | null,
      transformer_size: r.transformer_size as string | null,
      contract_demand: r.contract_demand != null ? Number(r.contract_demand) : null,
      voltage_system: r.voltage_system as string | null,
    },
  };
}

export async function loadLatestEnergyMetrics(deviceId: string): Promise<{
  thdv_avg: number | null;
  thdi_avg: number | null;
  energy_kwh: number | null;
} | null> {
  const rows = await queryGe(
    `SELECT thdi_l1, thdi_l2, thdi_l3, thdv_l1, thdv_l2, thdv_l3, energy_kwh, power_factor
     FROM eq_energy_data
     WHERE device_id = ?
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [Number(deviceId)],
  );
  if (!rows.length) return null;
  const r = rows[0] as Record<string, number | null>;
  const thdi = [r.thdi_l1, r.thdi_l2, r.thdi_l3].filter((v) => v != null && Number.isFinite(v)) as number[];
  const thdv = [r.thdv_l1, r.thdv_l2, r.thdv_l3].filter((v) => v != null && Number.isFinite(v)) as number[];
  return {
    thdi_avg: thdi.length ? thdi.reduce((a, b) => a + b, 0) / thdi.length : null,
    thdv_avg: thdv.length ? thdv.reduce((a, b) => a + b, 0) / thdv.length : null,
    energy_kwh: r.energy_kwh ?? null,
  };
}
