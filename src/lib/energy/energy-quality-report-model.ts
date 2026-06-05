import { fmtA, fmtNum, type EqLocale } from './energy-quality-i18n';
import { reportT } from './energy-quality-report-i18n';

export type RiskLevel = 'good' | 'warning' | 'critical';
export type HarmonicRisk = 'acceptable' | 'caution' | 'high';

export type ReportChannel = {
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

export type DeviceReportInput = {
  deviceID: string;
  deviceName: string;
  geID?: string;
  location?: string;
  beforeMeterNo?: string;
  metricsMeterNo?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  owner?: string;
  ipAddress?: string;
  recordScope?: string;
};

export type HistoryPoint = {
  time: string;
  timestamp?: number;
  beforeL1?: number | null;
  beforeL2?: number | null;
  beforeL3?: number | null;
  beforeAvg?: number | null;
  afterL1?: number | null;
  afterL2?: number | null;
  afterL3?: number | null;
  afterAvg?: number | null;
};

export type BuildReportInput = {
  device: DeviceReportInput;
  site: string;
  lastUpdate: string;
  ch1: ReportChannel;
  ch2: ReportChannel;
  historyPoints: number;
  measurementStart?: string;
  measurementEnd?: string;
  chartData: HistoryPoint[];
  preparedBy?: string;
  locale: EqLocale;
};

export type ReportField = { label: string; value: string };
export type ReportRecommendation = { priority: number; title: string; description: string };
export type ReportAction = { horizon: string; items: string[] };

export type RiskMetricInput = {
  pf: number | null;
  thd: number | null;
  currentImbalance: number | null;
  voltageImbalance: number | null;
};

export type EnergyQualityReport = {
  reportId: string;
  reportDate: string;
  lastUpdate: string;
  overallRisk: RiskLevel;
  overallRiskLabel: string;
  harmonicRisk: HarmonicRisk;
  harmonicRiskLabel: string;
  /** Raw values used for Good / Warning / Critical scoring */
  statusMetrics: RiskMetricInput;
  customer: ReportField[];
  measurement: ReportField[];
  executive: ReportField[];
  energy: ReportField[];
  peak: ReportField[];
  powerFactor: ReportField[];
  balance: ReportField[];
  harmonic: ReportField[];
  equipment: ReportField[];
  financial: ReportField[];
  roi: ReportField[];
  recommendations: ReportRecommendation[];
  actionPlan: ReportAction[];
  conclusion: ReportField[];
  phaseTable: { phase: string; ch1: string; ch2: string }[];
};

function avg(vals: (number | null | undefined)[]): number | null {
  const n = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (!n.length) return null;
  return n.reduce((a, b) => a + b, 0) / n.length;
}

function max(vals: (number | null | undefined)[]): number | null {
  const n = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (!n.length) return null;
  return Math.max(...n);
}

function imbalancePct(vals: (number | null | undefined)[]): number | null {
  const a = avg(vals);
  const mx = max(vals);
  const mn = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (a == null || !mn.length || mx == null) return null;
  const min = Math.min(...mn);
  if (a === 0) return null;
  return ((mx - min) / a) * 100;
}

function sharePct(val: number | null, total: number | null): string {
  if (val == null || total == null || total === 0) return '—';
  return `${fmtNum((val / total) * 100, 1)}%`;
}

function riskFromMetrics(
  pf: number | null,
  thd: number | null,
  imbalance: number | null,
  t: ReturnType<typeof reportT>
): { level: RiskLevel; label: string } {
  let score = 0;
  if (imbalance != null && imbalance > 30) score += 2;
  else if (imbalance != null && imbalance > 15) score += 1;
  if (pf != null && pf < 0.85) score += 2;
  else if (pf != null && pf < 0.95) score += 1;
  if (thd != null && thd > 15) score += 2;
  else if (thd != null && thd > 8) score += 1;
  if (score >= 3) return { level: 'critical', label: t.statusCritical };
  if (score >= 1) return { level: 'warning', label: t.statusWarning };
  return { level: 'good', label: t.statusGood };
}

function harmonicRisk(thd: number | null, t: ReturnType<typeof reportT>): { level: HarmonicRisk; label: string } {
  if (thd == null) return { level: 'acceptable', label: t.riskAcceptable };
  if (thd > 15) return { level: 'high', label: t.riskHigh };
  if (thd > 8) return { level: 'caution', label: t.riskCaution };
  return { level: 'acceptable', label: t.riskAcceptable };
}

function display(v: number | null | undefined, unit = '', digits = 2): string {
  if (v == null || !Number.isFinite(v)) return '—';
  if (unit === 'A') return `${fmtA(v)} A`;
  if (unit === '%') return `${fmtNum(v, digits)}%`;
  if (unit === 'Hz') return `${fmtNum(v, digits)} Hz`;
  if (unit === 'kWh') return `${fmtNum(v, digits)} kWh`;
  if (unit === 'kW') return `${fmtNum(v, digits)} kW`;
  return fmtNum(v, digits);
}

function field(label: string, value: string): ReportField {
  return { label, value: value || '—' };
}

function formatPaybackPeriod(
  monthlySaving: number,
  investment: number,
  t: ReturnType<typeof reportT>,
): string {
  if (monthlySaving <= 0) return '—';
  const months = investment / monthlySaving;
  const years = months / 12;
  return `${fmtNum(months, 1)} ${t.paybackMonthsUnit} (${fmtNum(years, 1)} ${t.paybackYearsUnit})`;
}

function patchField(fields: ReportField[], label: string, value: string): ReportField[] {
  return fields.map((f) => (f.label === label ? { ...f, value } : f));
}

export type ReportDbCustomer = {
  customer_name: string;
  business_type: string | null;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
};

export type ReportDbSite = {
  site_name: string;
  location: string | null;
};

export function enrichEnergyQualityReport(
  report: EnergyQualityReport,
  ctx: {
    customer: ReportDbCustomer | null;
    site: ReportDbSite | null;
    thdvAvg?: number | null;
  },
  t: Pick<
    ReturnType<typeof reportT>,
    | 'f_customerName'
    | 'f_siteName'
    | 'f_location'
    | 'f_businessType'
    | 'f_contact'
    | 'f_thdv'
    | 'f_thdvAvg'
    | 'f_thdvL1'
    | 'f_thdvL2'
    | 'f_thdvL3'
    | 'businessTypeDefault'
  >,
): EnergyQualityReport {
  let next = report;

  if (ctx.customer) {
    let customer = next.customer;
    customer = patchField(customer, t.f_customerName, ctx.customer.customer_name);
    customer = patchField(
      customer,
      t.f_businessType,
      ctx.customer.business_type || t.businessTypeDefault,
    );
    customer = patchField(
      customer,
      t.f_location,
      ctx.site?.location || ctx.customer.address || '—',
    );
    customer = patchField(
      customer,
      t.f_contact,
      ctx.customer.phone || ctx.customer.contact_person || '—',
    );
    if (ctx.site?.site_name) {
      customer = patchField(customer, t.f_siteName, ctx.site.site_name);
    }
    next = { ...next, customer };
  }

  if (ctx.thdvAvg != null && Number.isFinite(ctx.thdvAvg)) {
    const v = `${ctx.thdvAvg.toFixed(1)}%`;
    let harmonic = patchField(next.harmonic, t.f_thdvL1, v);
    harmonic = patchField(harmonic, t.f_thdvL2, v);
    harmonic = patchField(harmonic, t.f_thdvL3, v);
    harmonic = patchField(harmonic, t.f_thdvAvg, v);
    next = {
      ...next,
      executive: patchField(next.executive, t.f_thdv, v),
      harmonic,
    };
  }

  return next;
}

export type BuildDisplayReportInput = BuildReportInput & {
  /** True while meter selected but live metrics not received yet */
  livePending?: boolean;
  /** No meter selected — show empty shell */
  noMeter?: boolean;
};

export function buildDisplayEnergyQualityReport(input: BuildDisplayReportInput): EnergyQualityReport {
  const t = reportT(input.locale);
  const pending = Boolean(input.livePending || input.noMeter);
  const report = buildEnergyQualityReport(input);

  if (!pending) return report;

  const waitingLabel = input.noMeter ? t.selectMeterHint : t.waitingLive;
  const pendingRecs = input.noMeter
    ? [{ priority: 1, title: t.selectMeterHint, description: t.aiNote }]
    : [{ priority: 1, title: t.waitingLive, description: t.aiNote }];

  return {
    ...report,
    lastUpdate: input.noMeter ? t.selectMeterHint : input.lastUpdate || t.waitingLive,
    overallRisk: 'good',
    overallRiskLabel: t.statusPending,
    harmonicRisk: 'acceptable',
    harmonicRiskLabel: t.statusPending,
    statusMetrics: { pf: null, thd: null, currentImbalance: null, voltageImbalance: null },
    recommendations: pendingRecs,
    actionPlan: [
      { horizon: t.immediate, items: [waitingLabel] },
      { horizon: t.shortTerm, items: ['—'] },
      { horizon: t.mediumTerm, items: ['—'] },
      { horizon: t.longTerm, items: ['—'] },
    ],
    conclusion: [
      field(t.f_currentProblem, t.statusPending),
      field(t.f_technicalRisk, t.statusPending),
      field(t.f_financialImpact, '—'),
      field(t.f_recommendedSolution, '—'),
      field(t.f_expectedSaving, '—'),
      field(t.f_payback, '—'),
      field(t.f_nextStep, t.selectMeterHint),
    ],
  };
}

export function buildEnergyQualityReport(input: BuildReportInput): EnergyQualityReport {
  const t = reportT(input.locale);
  const { device, ch1, ch2, chartData } = input;
  const now = new Date();
  const reportId = `GE-EQ-${device.deviceID}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const reportDate = now.toLocaleString();

  const i1 = ch1.current[0];
  const i2 = ch1.current[1];
  const i3 = ch1.current[2];
  const avgI = avg(ch1.current);
  const maxI = max(ch1.current);
  const curImb = imbalancePct(ch1.current);
  const voltImb = imbalancePct(ch1.voltage);
  const thdAvg = ch1.thd;
  const pf = ch1.powerFactor;
  const freq = ch1.frequency;
  const energy = ch1.energyKwh;
  const apparent = ch1.apparentPower;

  const totalI = [i1, i2, i3].filter((v): v is number => v != null).reduce((a, b) => a + b, 0) || null;

  let peakVal: number | null = null;
  let peakTime = '—';
  for (const row of chartData) {
    const v = row.afterAvg ?? row.beforeAvg;
    if (v == null || !Number.isFinite(v)) continue;
    if (peakVal == null || v > peakVal) {
      peakVal = v;
      peakTime = row.time;
    }
  }
  if (peakVal == null) peakVal = maxI;

  const loadFactor =
    avgI != null && peakVal != null && peakVal > 0 ? (avgI / peakVal) * 100 : null;
  const peakRatio = avgI != null && peakVal != null && avgI > 0 ? peakVal / avgI : null;

  const risk = riskFromMetrics(pf, thdAvg, curImb, t);
  const hRisk = harmonicRisk(thdAvg, t);

  const estMonthlyKwh =
    energy != null ? energy : avgI != null ? avgI * 24 * 30 * 0.4 : null;
  const estMonthlyCost = estMonthlyKwh != null ? estMonthlyKwh * 4.2 : null;
  const penaltyCost = pf != null && pf < 0.95 && estMonthlyCost != null ? estMonthlyCost * 0.08 : null;
  const potentialSaving = penaltyCost != null ? penaltyCost * 0.65 : estMonthlyCost != null ? estMonthlyCost * 0.05 : null;

  const problems: string[] = [];
  if (curImb != null && curImb > 20) problems.push(`${t.f_currentImbalance}: ${fmtNum(curImb, 1)}%`);
  if (pf != null && pf < 0.95) problems.push(`${t.f_avgPf}: ${fmtNum(pf, 2)}`);
  if (thdAvg != null && thdAvg > 8) problems.push(`${t.f_thdi}: ${fmtNum(thdAvg, 1)}%`);

  const recommendations: ReportRecommendation[] = [];
  if (pf != null && pf < 0.95) {
    recommendations.push({
      priority: 1,
      title: t.recApfcTitle,
      description: t.recApfcDesc,
    });
  }
  if (curImb != null && curImb > 15) {
    recommendations.push({
      priority: recommendations.length + 1,
      title: t.recRedistributeTitle,
      description: t.recRedistributeDesc,
    });
  }
  if (peakVal != null && avgI != null && peakVal > avgI * 1.5) {
    recommendations.push({
      priority: recommendations.length + 1,
      title: t.recPeakTitle,
      description: t.recPeakDesc.replace('{time}', peakTime),
    });
  }
  recommendations.push({
    priority: recommendations.length + 1,
    title: t.recMonitorTitle,
    description: t.recMonitorDesc,
  });

  return {
    reportId,
    reportDate,
    lastUpdate: input.lastUpdate,
    overallRisk: risk.level,
    overallRiskLabel: risk.label,
    harmonicRisk: hRisk.level,
    harmonicRiskLabel: hRisk.label,
    statusMetrics: {
      pf,
      thd: thdAvg,
      currentImbalance: curImb,
      voltageImbalance: voltImb,
    },
    customer: [
      field(t.f_customerName, device.customerName || device.deviceName),
      field(t.f_siteName, device.deviceName),
      field(t.f_location, device.location || device.customerAddress || '—'),
      field(t.f_businessType, t.businessTypeDefault),
      field(t.f_contact, device.customerPhone || device.owner || '—'),
      field(
        t.f_period,
        input.measurementStart && input.measurementEnd
          ? `${input.measurementStart} – ${input.measurementEnd}`
          : t.periodLiveSession,
      ),
      field(t.f_reportDate, reportDate),
      field(t.f_preparedBy, input.preparedBy || t.preparedByDefault),
    ],
    measurement: [
      field(t.f_meterId, device.geID || device.beforeMeterNo || device.deviceID),
      field(t.f_gatewayId, device.ipAddress || device.deviceID),
      field(t.f_measurementPoint, `${device.deviceName} · ${t.ch1Label}`),
      field(t.f_voltageSystem, t.threePhase400V),
      field(t.f_resolution, t.realtimeResolution),
      field(t.f_totalRecords, String(input.historyPoints)),
      field(t.f_startDate, input.measurementStart || input.lastUpdate),
      field(t.f_endDate, input.measurementEnd || input.lastUpdate),
    ],
    executive: [
      field(t.f_totalEnergy, display(energy, 'kWh')),
      field(t.f_avgLoad, display(avgI, 'A')),
      field(t.f_maxDemand, display(peakVal, 'A')),
      field(t.f_loadFactor, loadFactor != null ? `${fmtNum(loadFactor, 1)}%` : '—'),
      field(t.f_avgPf, display(pf)),
      field(t.f_currentImbalance, curImb != null ? `${fmtNum(curImb, 1)}%` : '—'),
      field(t.f_voltageImbalance, voltImb != null ? `${fmtNum(voltImb, 1)}%` : '—'),
      field(t.f_thdi, display(thdAvg, '%')),
      field(t.f_thdv, '—'),
      field(t.f_riskLevel, risk.label),
    ],
    energy: [
      field(t.f_totalEnergy, display(energy, 'kWh')),
      field(t.f_dailyAvgKwh, estMonthlyKwh != null ? display(estMonthlyKwh / 30, 'kWh') : '—'),
      field(t.f_monthlyEstKwh, display(estMonthlyKwh, 'kWh')),
      field(t.f_annualEstKwh, estMonthlyKwh != null ? display(estMonthlyKwh * 12, 'kWh') : '—'),
      field(t.f_monthlyCost, estMonthlyCost != null ? `${fmtNum(estMonthlyCost, 0)} THB` : '—'),
    ],
    peak: [
      field(t.f_peakDemand, display(peakVal, 'A')),
      field(t.f_peakTime, peakTime),
      field(t.f_avgLoad, display(avgI, 'A')),
      field(t.f_peakRatio, peakRatio != null ? fmtNum(peakRatio, 2) : '—'),
      field(t.f_demandChargeImpact, peakRatio != null && peakRatio > 1.3 ? t.statusWarning : t.statusGood),
    ],
    powerFactor: [
      field(t.f_avgPf, display(pf)),
      field(t.f_minPf, display(pf)),
      field(t.f_timeBelow095, pf != null && pf < 0.95 ? t.statusWarning : t.statusGood),
      field(t.f_penaltyCost, penaltyCost != null ? `${fmtNum(penaltyCost, 0)} THB` : '—'),
      field(
        t.f_apfcRecommendation,
        pf != null && pf < 0.95 ? t.apfcRecommended : t.withinTarget,
      ),
    ],
    balance: [
      field(t.f_l1Current, display(i1, 'A')),
      field(t.f_l2Current, display(i2, 'A')),
      field(t.f_l3Current, display(i3, 'A')),
      field(t.f_l1Share, sharePct(i1, totalI)),
      field(t.f_l2Share, sharePct(i2, totalI)),
      field(t.f_l3Share, sharePct(i3, totalI)),
      field(t.f_currentImbalance, curImb != null ? `${fmtNum(curImb, 1)}%` : '—'),
      field(t.f_voltageImbalance, voltImb != null ? `${fmtNum(voltImb, 1)}%` : '—'),
    ],
    harmonic: [
      field(t.f_thdiL1, display(thdAvg, '%')),
      field(t.f_thdiL2, display(thdAvg, '%')),
      field(t.f_thdiL3, display(thdAvg, '%')),
      field(t.f_thdiAvg, display(thdAvg, '%')),
      field(t.f_thdvL1, '—'),
      field(t.f_thdvL2, '—'),
      field(t.f_thdvL3, '—'),
      field(t.f_thdvAvg, '—'),
      field(t.f_harmonicRisk, hRisk.label),
    ],
    equipment: [
      field(t.f_motorCompressor, risk.level === 'critical' ? t.statusCritical : risk.label),
      field(t.f_mainBreaker, curImb != null && curImb > 25 ? t.statusWarning : t.statusGood),
      field(t.f_transformer, voltImb != null && voltImb > 5 ? t.statusWarning : t.statusGood),
      field(t.f_maintenance, t.maintenanceNote),
    ],
    financial: [
      field(t.f_monthlyCost, estMonthlyCost != null ? `${fmtNum(estMonthlyCost, 0)} THB` : '—'),
      field(t.f_penaltyCost, penaltyCost != null ? `${fmtNum(penaltyCost, 0)} THB` : '—'),
      field(t.f_potentialSaving, potentialSaving != null ? `${fmtNum(potentialSaving, 0)} THB` : '—'),
      field(t.f_annualSaving, potentialSaving != null ? `${fmtNum(potentialSaving * 12, 0)} THB` : '—'),
    ],
    roi: [
      field(t.f_solution, t.solutionApfc),
      field(t.f_investment, t.investmentDefault),
      field(t.f_potentialSaving, potentialSaving != null ? `${fmtNum(potentialSaving, 0)} THB/mo` : '—'),
      field(
        t.f_payback,
        potentialSaving != null && potentialSaving > 0
          ? formatPaybackPeriod(potentialSaving, 200000, t)
          : '—',
      ),
      field(t.f_roi, potentialSaving != null && potentialSaving > 0 ? `${fmtNum((potentialSaving * 12 * 100) / 200000, 0)}%` : '—'),
    ],
    recommendations,
    actionPlan: [
      { horizon: t.immediate, items: [t.actVerifyPhase, t.actReviewPeak] },
      { horizon: t.shortTerm, items: [t.actInstallApfc, t.actRebalance] },
      { horizon: t.mediumTerm, items: [t.actHarmonic, t.actDemand] },
      { horizon: t.longTerm, items: [t.actIotMonitor, t.actAnnualAudit] },
    ],
    conclusion: [
      field(t.f_currentProblem, problems.length ? problems.join('; ') : t.statusGood),
      field(t.f_technicalRisk, risk.label),
      field(t.f_financialImpact, estMonthlyCost != null ? `${fmtNum(estMonthlyCost, 0)} THB/mo` : '—'),
      field(t.f_recommendedSolution, recommendations[0]?.title || t.continueMonitoring),
      field(t.f_expectedSaving, potentialSaving != null ? `${fmtNum(potentialSaving, 0)} THB/mo` : '—'),
      field(
        t.f_payback,
        potentialSaving != null && potentialSaving > 0
          ? formatPaybackPeriod(potentialSaving, 200000, t)
          : '—',
      ),
      field(t.f_nextStep, t.nextStepReview),
    ],
    phaseTable: [
      { phase: t.phaseL1, ch1: display(ch1.current[0], 'A'), ch2: display(ch2.current[0], 'A') },
      { phase: t.phaseL2, ch1: display(ch1.current[1], 'A'), ch2: display(ch2.current[1], 'A') },
      { phase: t.phaseL3, ch1: display(ch1.current[2], 'A'), ch2: display(ch2.current[2], 'A') },
      { phase: t.phaseAvg, ch1: display(avg(ch1.current), 'A'), ch2: display(avg(ch2.current), 'A') },
    ],
  };
}

function fieldsGridHtml(fields: ReportField[]): string {
  return fields
    .map(
      (f) =>
        `<div class="cell"><label>${f.label}</label><strong>${f.value}</strong></div>`,
    )
    .join('');
}

function sectionHtml(title: string, fields: ReportField[], extra = ''): string {
  return `<div class="sec"><h2>${title}</h2><div class="grid">${fieldsGridHtml(fields)}</div>${extra}</div>`;
}

export function buildReportPrintHtml(
  report: EnergyQualityReport,
  rt: ReturnType<typeof reportT>,
  ch1Label: string,
  ch2Label: string,
): string {
  const phaseRows = report.phaseTable
    .map(
      (r) =>
        `<tr><td>${r.phase}</td><td>${r.ch1}</td><td>${r.ch2}</td></tr>`,
    )
    .join('');
  const recs = report.recommendations
    .map(
      (r) =>
        `<li><strong>P${r.priority}: ${r.title}</strong><br/>${r.description}</li>`,
    )
    .join('');
  const actions = report.actionPlan
    .map((a) => `<div class="act"><h4>${a.horizon}</h4><ul>${a.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`)
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${rt.companyName} — ${report.reportId}</title>
<style>
@page{size:A4;margin:14mm}
body{font-family:'Sarabun','Noto Sans',Arial,sans-serif;font-size:9pt;color:#1e293b;line-height:1.5}
.cover{background:linear-gradient(135deg,#065f46,#16a34a);color:#fff;padding:20px;border-radius:10px;margin-bottom:14px}
.cover h1{font-size:16pt;margin:0 0 6px}
.cover p{margin:0;opacity:.9;font-size:9pt}
.sec{margin-bottom:12px;page-break-inside:avoid}
.sec h2{font-size:10pt;color:#047857;border-left:4px solid #10b981;padding:4px 8px;margin:0 0 8px;background:#f0fdf4}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.cell{border:1px solid #e2e8f0;border-radius:6px;padding:6px 8px;background:#fafafa}
.cell label{display:block;font-size:7pt;color:#64748b;margin-bottom:2px}
.cell strong{font-size:9pt;color:#0f172a}
table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:8px}
th{background:#047857;color:#fff;padding:5px 6px;text-align:left}
td{padding:5px 6px;border-bottom:1px solid #e5e7eb}
.rec{padding-left:18px;margin:0}
.rec li{margin-bottom:6px}
.act{border:1px solid #d1fae5;border-radius:6px;padding:8px;margin-bottom:6px;background:#f0fdf4}
.act h4{margin:0 0 4px;font-size:8.5pt;color:#047857}
.note{font-size:7.5pt;color:#64748b;margin:8px 0}
.footer{text-align:center;font-size:7pt;color:#94a3b8;margin-top:16px}
</style></head><body>
<div class="cover"><h1>${rt.companyName}</h1><p>${rt.platformTitle}</p>
<p><b>${report.reportId}</b> · ${report.reportDate} · ${rt.liveBadge}</p>
<p>${rt.f_endDate}: ${report.lastUpdate}</p></div>
<p class="note">${rt.aiNote}</p>
${sectionHtml(rt.sec1, report.customer)}
${sectionHtml(rt.sec2, report.measurement)}
${sectionHtml(
  rt.sec3,
  report.executive,
  `<table><thead><tr><th>Phase</th><th>${ch1Label}</th><th>${ch2Label}</th></tr></thead><tbody>${phaseRows}</tbody></table>`,
)}
${sectionHtml(rt.sec4, report.energy)}
${sectionHtml(rt.sec5, report.peak)}
${sectionHtml(rt.sec6, report.powerFactor)}
${sectionHtml(rt.sec7, report.balance)}
${sectionHtml(rt.sec8, report.harmonic)}
${sectionHtml(rt.sec9, report.equipment)}
${sectionHtml(rt.sec10, report.financial)}
${sectionHtml(rt.sec11, report.roi)}
<div class="sec"><h2>${rt.sec12}</h2><ol class="rec">${recs}</ol></div>
<div class="sec"><h2>${rt.sec13}</h2>${actions}</div>
${sectionHtml(rt.sec14, report.conclusion)}
<p class="footer">${rt.companyName} · ${rt.platformTitle}</p>
<script>setTimeout(function(){window.print()},600)</script>
</body></html>`;
}
