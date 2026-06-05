import { fmtA, fmtNum, type EqLocale } from './energy-quality-i18n';
import {
  computeCurrentHistoryStats,
  getLatestChartPhases,
  type DbChartPoint,
} from './energy-quality-current-analysis';
import { reportT } from './energy-quality-report-i18n';
import { isCh1OnlyScope } from './energy-quality-scope';
import { formatPaybackPeriod } from './energy-quality-payback';
import {
  defaultReportInvestment,
  fmtReportMoney,
  reportKwhTariff,
} from './energy-quality-currency';
import {
  avgLineVoltage,
  estimateActivePowerKw,
  estimateMonthlyKwh,
  estimatePotentialSaving,
} from './energy-quality-financial-estimate';
import { buildActionPlan } from './energy-quality-action-plan';
import {
  buildProfessionalReportContent,
  type ProfessionalReportContent,
} from './energy-quality-professional-analysis';
import { buildCh1PhaseTable } from './energy-quality-phase-analysis';
import { normalizeCustomerDisplayName } from '@/lib/ge-energy/customer-display';
import { eqDateLocale } from './energy-quality-i18n';
import { buildEnergyQualityReportId } from './energy-quality-report-id';
import {
  formatBreakerSize,
  recommendGeEnergySaverKva,
} from './energy-quality-equipment-sizing';

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
  GEsaveID?: string;
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
  /** Pre-install meters: analyze CH1 only (before install). */
  ch1Only?: boolean;
  historyPoints: number;
  measurementStart?: string;
  measurementEnd?: string;
  chartData: HistoryPoint[];
  historyPeriod?: string;
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
  phaseTable: { phase: string; ch1: string; ch2: string; analysis: string }[];
  executiveBullets: string[];
  executiveKpis: ReportField[];
  /** ZERA-style professional analysis (key findings table, interpretation, phased recs) */
  professional: ProfessionalReportContent | null;
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

function fillTpl(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    template,
  );
}

function pickCurrent(
  live: number | null | undefined,
  history: number | null | undefined,
): number | null {
  if (live != null && Number.isFinite(live)) return live;
  if (history != null && Number.isFinite(history)) return history;
  return null;
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

/** Apply allocated report number to report document fields. */
export function withReportNumber(
  report: EnergyQualityReport,
  reportNumber: string,
  reportIdLabel: string,
): EnergyQualityReport {
  return {
    ...report,
    reportId: reportNumber,
    customer: report.customer.map((row) =>
      row.label === reportIdLabel ? { ...row, value: reportNumber } : row,
    ),
  };
}

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
    customer = patchField(
      customer,
      t.f_customerName,
      normalizeCustomerDisplayName(ctx.customer.customer_name),
    );
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
    professional: null,
  };
}

export function buildEnergyQualityReport(input: BuildReportInput): EnergyQualityReport {
  const t = reportT(input.locale);
  const { device, ch1, ch2, chartData } = input;
  const ch1Only = input.ch1Only ?? isCh1OnlyScope(device.recordScope);
  const now = new Date();
  const reportId = buildEnergyQualityReportId(device.deviceID, now);
  const reportDate = now.toLocaleString(eqDateLocale(input.locale), { timeZone: 'Asia/Bangkok' });

  const histPoints = chartData as DbChartPoint[];
  const histStats = histPoints.length
    ? computeCurrentHistoryStats(histPoints, input.historyPeriod ?? '24h')
    : null;
  const latestChart = getLatestChartPhases(histPoints);

  const i1 = pickCurrent(ch1.current[0], latestChart?.beforeL1);
  const i2 = pickCurrent(ch1.current[1], latestChart?.beforeL2);
  const i3 = pickCurrent(ch1.current[2], latestChart?.beforeL3);
  const j1 = ch1Only ? null : pickCurrent(ch2.current[0], latestChart?.afterL1);
  const j2 = ch1Only ? null : pickCurrent(ch2.current[1], latestChart?.afterL2);
  const j3 = ch1Only ? null : pickCurrent(ch2.current[2], latestChart?.afterL3);

  const resolvedCh1: (number | null)[] = [i1, i2, i3];
  const resolvedCh2: (number | null)[] = ch1Only ? [null, null, null] : [j1, j2, j3];

  const avgILive = avg(ch1.current);
  const avgI =
    avgILive ??
    histStats?.avgCh1 ??
    avg(resolvedCh1);
  const maxI = max(resolvedCh1);
  const curImb = imbalancePct(resolvedCh1) ?? (histStats?.maxImbalancePct ?? null);
  const voltImb = imbalancePct(ch1.voltage);
  const thdAvg = ch1.thd;
  const pf = ch1.powerFactor;
  const energy = ch1.energyKwh;

  const totalI = [i1, i2, i3].filter((v): v is number => v != null).reduce((a, b) => a + b, 0) || null;

  let peakVal: number | null = histStats?.peakCh1 ?? null;
  let peakTime = histStats?.peakCh1Time ?? '—';
  if (peakVal == null) {
    for (const row of chartData) {
      const v = row.beforeAvg ?? (ch1Only ? null : row.afterAvg);
      if (v == null || !Number.isFinite(v)) continue;
      if (peakVal == null || v > peakVal) {
        peakVal = v;
        peakTime = row.time;
      }
    }
  }
  if (peakVal == null) peakVal = maxI;

  const loadFactor =
    histStats?.loadFactor ??
    (avgI != null && peakVal != null && peakVal > 0 ? (avgI / peakVal) * 100 : null);
  const peakRatio = avgI != null && peakVal != null && avgI > 0 ? peakVal / avgI : null;

  const avgFromHistory = avgILive == null && histStats?.avgCh1 != null;
  const peakFromHistory = max(ch1.current) == null && peakVal != null && histStats?.peakCh1 != null;

  const risk = riskFromMetrics(pf, thdAvg, curImb, t);
  const hRisk = harmonicRisk(thdAvg, t);

  const kwhRate = reportKwhTariff(input.locale);
  const investment = defaultReportInvestment(input.locale);
  const avgPowerKw = estimateActivePowerKw({
    avgCurrentA: avgI,
    powerFactor: pf,
    voltageLL: avgLineVoltage(ch1.voltage),
    activePowerKw: ch1.activePower,
  });
  const estMonthlyKwh = estimateMonthlyKwh(avgPowerKw);
  const estMonthlyCost = estMonthlyKwh != null ? estMonthlyKwh * kwhRate : null;
  const penaltyCost =
    pf != null && pf < 0.95 && estMonthlyCost != null ? estMonthlyCost * (0.95 - pf) * 1.5 : null;
  const potentialSaving =
    estMonthlyCost != null
      ? estimatePotentialSaving({
          monthlyCost: estMonthlyCost,
          pf,
          curImb: curImb,
          peakRatio,
        })
      : null;
  const money = (amount: number | null, perMonth = false) =>
    amount != null ? fmtReportMoney(input.locale, amount, { perMonth }) : '—';

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
    const peakRecTime =
      histStats?.peakTimeAnalysis?.peakPeriod ?? (peakTime !== '—' ? peakTime : '—');
    recommendations.push({
      priority: recommendations.length + 1,
      title: t.recPeakTitle,
      description: t.recPeakDesc.replace('{time}', peakRecTime),
    });
  }
  recommendations.push({
    priority: recommendations.length + 1,
    title: t.recMonitorTitle,
    description: t.recMonitorDesc,
  });

  const fmtWithHist = (value: string, fromHistory: boolean) =>
    fromHistory && value !== '—' ? `${value} (${t.execSourceHistory})` : value;

  const executiveBullets: string[] = [];
  if (energy != null) {
    executiveBullets.push(fillTpl(t.execLineEnergy, { value: display(energy, 'kWh') }));
  }
  if (avgI != null) {
    executiveBullets.push(
      fillTpl(t.execLineAvgCurrent, {
        value: fmtWithHist(display(avgI, 'A'), avgFromHistory),
      }),
    );
  }
  if (peakVal != null) {
    const pt = histStats?.peakTimeAnalysis;
    const peakLabel =
      peakTime !== '—'
        ? `${display(peakVal, 'A')} @ ${peakTime}${pt?.peakPeriod ? ` · ${pt.peakPeriod}` : ''}`
        : display(peakVal, 'A');
    executiveBullets.push(
      fillTpl(t.execLinePeakDemand, {
        value: fmtWithHist(peakLabel, peakFromHistory),
      }),
    );
  }
  if (loadFactor != null) {
    executiveBullets.push(
      fillTpl(t.execLineLoadFactor, { value: `${fmtNum(loadFactor, 1)}%` }),
    );
  }
  if (pf != null) {
    executiveBullets.push(fillTpl(t.execLinePowerFactor, { value: display(pf) }));
  }
  if (curImb != null) {
    executiveBullets.push(
      fillTpl(t.execLineImbalance, { value: `${fmtNum(curImb, 1)}%` }),
    );
  }
  executiveBullets.push(
    fillTpl(t.execLineOverallRisk, { status: risk.label }),
  );
  if (problems.length > 0) {
    executiveBullets.push(t.execLineGeSolution);
  }

  const executiveKpis = [
    field(t.f_totalEnergy, display(energy, 'kWh')),
    field(t.f_avgLoad, fmtWithHist(display(avgI, 'A'), avgFromHistory)),
    field(t.f_maxDemand, fmtWithHist(display(peakVal, 'A'), peakFromHistory)),
    field(t.f_riskLevel, risk.label),
  ];

  const peakKwForSizing = estimateActivePowerKw({
    avgCurrentA: peakVal,
    powerFactor: pf,
    voltageLL: avgLineVoltage(ch1.voltage),
    activePowerKw: ch1.activePower,
  });
  const breakerSizeDisplay = formatBreakerSize(peakVal) ?? '—';
  const recommendedInstallSize =
    recommendGeEnergySaverKva(peakKwForSizing, peakVal) ?? '—';

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
      field(t.f_reportId, reportId),
      field(
        t.f_customerName,
        normalizeCustomerDisplayName(device.customerName, device.deviceName),
      ),
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
      field(t.f_meterId, device.GEsaveID || device.beforeMeterNo || device.deviceID),
      field(t.f_gatewayId, device.ipAddress || device.deviceID),
      field(t.f_measurementPoint, `${device.deviceName} · ${t.ch1Label}`),
      field(t.f_voltageSystem, t.threePhase400V),
      field(t.f_breakerSize, breakerSizeDisplay),
      field(t.f_recommendedInstallSize, recommendedInstallSize),
      field(t.f_resolution, t.realtimeResolution),
      field(t.f_totalRecords, String(input.historyPoints)),
      field(t.f_startDate, input.measurementStart || input.lastUpdate),
      field(t.f_endDate, input.measurementEnd || input.lastUpdate),
    ],
    executive: [
      field(t.f_totalEnergy, display(energy, 'kWh')),
      field(t.f_avgLoad, fmtWithHist(display(avgI, 'A'), avgFromHistory)),
      field(t.f_maxDemand, fmtWithHist(display(peakVal, 'A'), peakFromHistory)),
      field(t.f_loadFactor, loadFactor != null ? `${fmtNum(loadFactor, 1)}%` : '—'),
      field(t.f_avgPf, display(pf)),
      field(t.f_currentImbalance, curImb != null ? `${fmtNum(curImb, 1)}%` : '—'),
      field(t.f_voltageImbalance, voltImb != null ? `${fmtNum(voltImb, 1)}%` : '—'),
      field(t.f_thdi, display(thdAvg, '%')),
      field(t.f_thdv, '—'),
      field(t.f_riskLevel, risk.label),
    ],
    executiveBullets,
    executiveKpis,
    energy: [
      field(t.f_totalEnergy, display(energy, 'kWh')),
      field(t.f_dailyAvgKwh, estMonthlyKwh != null ? display(estMonthlyKwh / 30, 'kWh') : '—'),
      field(t.f_monthlyEstKwh, display(estMonthlyKwh, 'kWh')),
      field(t.f_annualEstKwh, estMonthlyKwh != null ? display(estMonthlyKwh * 12, 'kWh') : '—'),
      field(t.f_monthlyCost, money(estMonthlyCost)),
    ],
    peak: [
      field(t.f_peakDemand, display(peakVal, 'A')),
      field(t.f_peakTime, peakTime),
      field(t.f_peakPeriod, histStats?.peakTimeAnalysis?.peakPeriod ?? '—'),
      field(t.f_peakWindows, histStats?.peakTimeAnalysis?.dominantWindows ?? '—'),
      field(
        t.f_onPeakAvg,
        histStats?.peakTimeAnalysis?.onPeakAvgA != null
          ? display(histStats.peakTimeAnalysis.onPeakAvgA, 'A')
          : '—',
      ),
      field(
        t.f_offPeakAvg,
        histStats?.peakTimeAnalysis?.offPeakAvgA != null
          ? display(histStats.peakTimeAnalysis.offPeakAvgA, 'A')
          : '—',
      ),
      field(t.f_avgLoad, display(avgI, 'A')),
      field(t.f_peakRatio, peakRatio != null ? fmtNum(peakRatio, 2) : '—'),
      field(t.f_demandChargeImpact, peakRatio != null && peakRatio > 1.3 ? t.statusWarning : t.statusGood),
    ],
    powerFactor: [
      field(t.f_avgPf, display(pf)),
      field(t.f_minPf, display(pf)),
      field(t.f_timeBelow095, pf != null && pf < 0.95 ? t.statusWarning : t.statusGood),
      field(t.f_penaltyCost, money(penaltyCost)),
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
      field(t.f_monthlyCost, money(estMonthlyCost)),
      field(t.f_penaltyCost, money(penaltyCost)),
      field(t.f_potentialSaving, money(potentialSaving)),
      field(t.f_annualSaving, money(potentialSaving != null ? potentialSaving * 12 : null)),
    ],
    roi: [
      field(t.f_solution, t.solutionApfc),
      field(t.f_investment, money(investment)),
      field(t.f_potentialSaving, money(potentialSaving, true)),
      field(
        t.f_payback,
        potentialSaving != null && potentialSaving > 0
          ? formatPaybackPeriod(potentialSaving, investment, t)
          : '—',
      ),
      field(
        t.f_roi,
        potentialSaving != null && potentialSaving > 0
          ? `${fmtNum((potentialSaving * 12 * 100) / investment, 0)}%`
          : '—',
      ),
    ],
    recommendations,
    actionPlan: buildActionPlan({
      t,
      pf,
      curImb,
      thd: thdAvg,
      peakRatio,
      peakVal,
      avgI,
    }),
    conclusion: [
      field(t.f_currentProblem, problems.length ? problems.join('; ') : t.statusGood),
      field(t.f_technicalRisk, risk.label),
      field(t.f_financialImpact, money(estMonthlyCost, true)),
      field(t.f_recommendedSolution, recommendations[0]?.title || t.continueMonitoring),
      field(t.f_expectedSaving, money(potentialSaving, true)),
      field(
        t.f_payback,
        potentialSaving != null && potentialSaving > 0
          ? formatPaybackPeriod(potentialSaving, investment, t)
          : '—',
      ),
      field(t.f_nextStep, t.nextStepReview),
    ],
    phaseTable: buildCh1PhaseTable({
      t,
      histPoints,
      snapshot: { l1: i1, l2: i2, l3: i3, j1, j2, j3 },
      ch1Only,
    }),
    professional: buildProfessionalReportContent({
      t,
      points: histPoints,
      stats: histStats,
      ch1,
      historyPoints: input.historyPoints,
      historyPeriod: input.historyPeriod ?? '24h',
      measurementStart: input.measurementStart,
      measurementEnd: input.measurementEnd,
      overallRisk: risk.level,
      estMonthlyKwh,
      estAnnualKwh: estMonthlyKwh != null ? estMonthlyKwh * 12 : null,
      potentialSaving,
      paybackLabel:
        potentialSaving != null && potentialSaving > 0
          ? formatPaybackPeriod(potentialSaving, investment, t)
          : '—',
      peakVal,
      peakTime,
      loadFactor,
      pf,
      curImb,
      voltImb,
      thd: thdAvg,
      thdv: null,
    }),
  };
}

export { buildEnergyQualityReportId, formatReportDateStamp } from './energy-quality-report-id';
export { buildReportPrintHtml } from './energy-quality-report-print';
export type { PrintReportInput } from './energy-quality-report-print';
