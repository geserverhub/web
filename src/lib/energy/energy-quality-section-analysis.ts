import { fmtA, fmtNum, type EqLocale } from './energy-quality-i18n';
import {
  computeCurrentHistoryStats,
  getLatestChartPhases,
  type CurrentHistoryStats,
  type DbChartPoint,
  type TechnicalInsight,
} from './energy-quality-current-analysis';
import { hourlyProfileChartData } from './energy-quality-peak-time-analysis';
import type { ReportChannel, ReportField, EnergyQualityReport } from './energy-quality-report-model';
import { reportT, type ReportStrings } from './energy-quality-report-i18n';
import {
  computePaybackMonths,
  formatPaybackPeriod,
  paybackRatingForMonths,
  PAYBACK_EXCELLENT_MAX_MONTHS,
} from './energy-quality-payback';
import {
  defaultReportInvestment,
  fmtReportMoney,
  parseReportMoney,
  reportCurrency,
} from './energy-quality-currency';
import {
  geCompareInsightBalance,
  geCompareInsightConclusion,
  geCompareInsightEnergy,
  geCompareInsightEquipment,
  geCompareInsightFinancial,
  geCompareInsightHarmonic,
  geCompareInsightPeak,
  geCompareInsightPf,
  geCompareInsightRoi,
  geCompareInsightVoltage,
  geSolutionRecommendation,
  needsGeSolutionComparison,
  type GeSolutionMetrics,
} from './energy-quality-ge-solution';
import {
  buildCh1PhaseLines,
  EQ_CH1_STROKE,
  EQ_CH2_STROKE,
  EQ_LINE_WIDTH,
  type EqChartLineSpec,
} from '@/lib/energy/eq-chart-palette';
import { actionPlanOutcomeChartData, countActionItems } from './energy-quality-action-plan';

export type ReportSectionKey =
  | 'energy'
  | 'peak'
  | 'pf'
  | 'balance'
  | 'harmonic'
  | 'equipment'
  | 'financial'
  | 'roi'
  | 'ai'
  | 'action'
  | 'conclusion';

export type SectionRecommendation = { title: string; description: string };

function fillTpl(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), template);
}

export type SectionAnalysisPack = {
  fields: ReportField[];
  insights: TechnicalInsight[];
  recommendations: SectionRecommendation[];
  chartKind: 'line' | 'bar' | 'none';
  chartCaption: string;
  chartData: Record<string, unknown>[];
  chartLines?: EqChartLineSpec[];
  chartUnit?: string;
  /** When false, Y-axis allows decimals (e.g. currency savings). */
  chartIntegerAxis?: boolean;
};

function metricLine(
  name: string,
  dataKey: string,
  stroke: string,
  unit = '',
): { chartLines: EqChartLineSpec[]; chartUnit: string } {
  return {
    chartLines: [{ dataKey, name, stroke, width: EQ_LINE_WIDTH.metric }],
    chartUnit: unit,
  };
}

function parseKwh(value: string): number | null {
  const m = value.replace(/,/g, '').match(/([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

function riskScoreFromLabel(value: string, t: ReportStrings): number {
  if (value === t.statusCritical || value.includes('วิกฤต') || value === t.riskHigh) return 3;
  if (value === t.statusWarning || value.includes('เตือน') || value === t.riskCaution) return 2;
  return 1;
}

function patchField(fields: ReportField[], label: string, value: string): ReportField[] {
  return fields.map((f) => (f.label === label ? { ...f, value } : f));
}

function imbalancePct(vals: (number | null | undefined)[]): number | null {
  const n = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (n.length < 2) return null;
  const a = n.reduce((x, y) => x + y, 0) / n.length;
  const mx = Math.max(...n);
  const mn = Math.min(...n);
  if (a === 0) return null;
  return ((mx - mn) / a) * 100;
}

export function buildReportSectionPacks(input: {
  report: EnergyQualityReport;
  chartData: DbChartPoint[];
  ch1: ReportChannel;
  ch2: ReportChannel;
  periodLabel: string;
  locale: EqLocale;
  chartUi: { l1: string; l2: string; l3: string };
  ch1Only?: boolean;
}): Record<ReportSectionKey, SectionAnalysisPack> {
  const { report, chartData, ch1, periodLabel, locale, chartUi } = input;
  const ch1Only = input.ch1Only ?? true;
  const t = reportT(locale);
  const stats = chartData.length ? computeCurrentHistoryStats(chartData, periodLabel) : null;
  const latest = getLatestChartPhases(chartData);

  const l1 = ch1.current[0] ?? latest?.beforeL1 ?? null;
  const l2 = ch1.current[1] ?? latest?.beforeL2 ?? null;
  const l3 = ch1.current[2] ?? latest?.beforeL3 ?? null;
  const pf = ch1.powerFactor;
  const thd = ch1.thd;
  const voltImb = imbalancePct(ch1.voltage);

  const totalEnergyField = report.energy.find((f) => f.label === t.f_totalEnergy);
  const totalKwh = totalEnergyField ? parseKwh(totalEnergyField.value) : null;
  const dailyField = report.energy.find((f) => f.label === t.f_dailyAvgKwh);
  const monthlyField = report.energy.find((f) => f.label === t.f_monthlyEstKwh);
  const annualField = report.energy.find((f) => f.label === t.f_annualEstKwh);
  const dailyKwh = dailyField ? parseKwh(dailyField.value) : null;
  const monthlyKwh = monthlyField ? parseKwh(monthlyField.value) : totalKwh;
  const annualKwh = annualField ? parseKwh(annualField.value) : null;

  const energyInsights: TechnicalInsight[] = [];
  if (totalKwh != null) {
    energyInsights.push({
      severity: 'info',
      title: t.secEnergyInsightTotal,
      detail: fillTpl(t.secEnergyInsightTotalDetail, { value: `${fmtNum(totalKwh, 2)} kWh` }),
    });
  }
  if (monthlyKwh != null) {
    const costField = report.energy.find((f) => f.label === t.f_monthlyCost);
    energyInsights.push({
      severity: 'info',
      title: t.secEnergyInsightMonthly,
      detail: fillTpl(t.secEnergyInsightMonthlyDetail, {
        kwh: `${fmtNum(monthlyKwh, 0)} kWh`,
        cost: costField?.value ?? '—',
      }),
    });
  }
  if (stats?.avgCh1 != null) {
    energyInsights.push({
      severity: 'info',
      title: t.secEnergyInsightLoad,
      detail: fillTpl(t.secEnergyInsightLoadDetail, {
        avg: `${fmtA(stats.avgCh1)} A`,
        period: stats.periodLabel,
      }),
    });
  }
  if (!energyInsights.length) {
    energyInsights.push({
      severity: 'info',
      title: t.insightNoDbData,
      detail: t.insightNoDbDataDetail,
    });
  }

  const energyRecs: SectionRecommendation[] = [
    { title: t.secEnergyRecMonitor, description: t.secEnergyRecMonitorDesc },
  ];
  if (stats?.loadFactor != null && stats.loadFactor < 40) {
    energyRecs.push({
      title: t.secEnergyRecTou,
      description: t.secEnergyRecTouDesc,
    });
  }

  const energyBarData =
    dailyKwh != null || monthlyKwh != null || annualKwh != null
      ? [
          { label: t.secEnergyBarDaily, value: dailyKwh ?? 0 },
          { label: t.secEnergyBarMonthly, value: monthlyKwh ?? 0 },
          { label: t.secEnergyBarAnnual, value: annualKwh ?? 0 },
        ]
      : [];

  const peakFields = patchPeakFields(report.peak, stats, t);
  const peakInsights: TechnicalInsight[] = [];
  if (stats?.peakCh1 != null) {
    peakInsights.push({
      severity: stats.peakCh1 > (stats.avgCh1 ?? 0) * 1.5 ? 'warning' : 'info',
      title: t.insightPeakLoad,
      detail: `${fmtA(stats.peakCh1)} A @ ${stats.peakCh1Time ?? '—'} · ${t.insightAvg} ${fmtA(stats.avgCh1)} A`,
    });
    const pt = stats.peakTimeAnalysis;
    if (pt?.peakPeriod) {
      peakInsights.push({
        severity: 'info',
        title: t.insightPeakPeriod,
        detail: pt.peakPeriod,
      });
    }
    if (pt?.dominantWindows) {
      peakInsights.push({
        severity: pt.dominantWindows.includes(',') ? 'warning' : 'info',
        title: t.insightPeakWindows,
        detail: pt.dominantWindows,
      });
    }
    if (pt?.onPeakAvgA != null && pt.offPeakAvgA != null) {
      peakInsights.push({
        severity: pt.onPeakAvgA > pt.offPeakAvgA * 1.15 ? 'warning' : 'info',
        title: t.insightOnPeakLoad,
        detail: `On-peak ${fmtA(pt.onPeakAvgA)} A · Off-peak ${fmtA(pt.offPeakAvgA)} A`,
      });
    }
    if (stats.loadFactor != null) {
      peakInsights.push({
        severity: stats.loadFactor < 40 ? 'warning' : 'info',
        title: t.insightLoadFactor,
        detail: `${fmtNum(stats.loadFactor, 1)}%`,
      });
    }
  } else {
    peakInsights.push({ severity: 'info', title: t.insightNoDbData, detail: t.insightNoDbDataDetail });
  }
  const peakRecs: SectionRecommendation[] = [
    {
      title: t.recPeakTitle,
      description:
        stats?.peakTimeAnalysis?.peakPeriod != null
          ? t.recPeakDesc.replace('{time}', stats.peakTimeAnalysis.peakPeriod)
          : stats?.peakCh1Time != null
            ? t.recPeakDesc.replace('{time}', stats.peakCh1Time)
            : t.recPeakDesc.replace('{time}', '—'),
    },
    { title: t.actReviewPeak, description: t.insightPeakSpikeAction },
  ];

  const pfVal = pf != null && Number.isFinite(pf) ? pf : null;
  const pfFields = patchField(
    report.powerFactor,
    t.f_avgPf,
    pfVal != null ? fmtNum(pfVal, 3) : report.powerFactor.find((f) => f.label === t.f_avgPf)?.value ?? '—',
  );
  const pfInsights: TechnicalInsight[] = [];
  if (pfVal != null) {
    pfInsights.push({
      severity: pfVal < 0.85 ? 'critical' : pfVal < 0.95 ? 'warning' : 'info',
      title: t.secPfInsightStatus,
      detail: fillTpl(t.secPfInsightStatusDetail, { value: fmtNum(pfVal, 3) }),
    });
  } else {
    pfInsights.push({ severity: 'info', title: t.secPfInsightNoData, detail: t.secPfInsightNoDataDetail });
  }
  const pfRecs: SectionRecommendation[] =
    pfVal != null && pfVal < 0.95
      ? [
          { title: t.recApfcTitle, description: t.recApfcDesc },
          { title: t.actInstallApfc, description: t.apfcRecommended },
        ]
      : [{ title: t.withinTarget, description: t.secPfRecMaintain }];

  const balanceFields = patchBalanceFields(report.balance, l1, l2, l3, voltImb, t);
  const imb = imbalancePct([l1, l2, l3]) ?? stats?.maxImbalancePct ?? null;
  const balanceInsights: TechnicalInsight[] = [];
  if (imb != null && imb > 15) {
    balanceInsights.push({
      severity: imb > 30 ? 'critical' : 'warning',
      title: t.insightPhaseImbalance,
      detail: `${t.insightMaxImbalance} ${fmtNum(imb, 1)}% — ${t.insightPhaseImbalanceAction}`,
    });
  } else if (l1 != null || l2 != null || l3 != null) {
    balanceInsights.push({
      severity: 'info',
      title: t.secBalanceInsightOk,
      detail: t.secBalanceInsightOkDetail,
    });
  } else {
    balanceInsights.push({ severity: 'info', title: t.insightNoDbData, detail: t.insightNoDbDataDetail });
  }
  const balanceRecs: SectionRecommendation[] =
    imb != null && imb > 15
      ? [
          { title: t.recRedistributeTitle, description: t.recRedistributeDesc },
          { title: t.actRebalance, description: t.insightPhaseImbalanceAction },
        ]
      : [{ title: t.secBalanceRecOk, description: t.secBalanceRecOkDesc }];

  const thdVal = thd != null && Number.isFinite(thd) ? thd : null;
  const harmonicFields = patchHarmonicFields(report.harmonic, thdVal, t);
  const harmonicInsights: TechnicalInsight[] = [];
  if (thdVal != null) {
    harmonicInsights.push({
      severity: thdVal > 15 ? 'critical' : thdVal > 8 ? 'warning' : 'info',
      title: t.secHarmonicInsightThd,
      detail: fillTpl(t.secHarmonicInsightThdDetail, { value: `${fmtNum(thdVal, 1)}%` }),
    });
  } else {
    harmonicInsights.push({
      severity: 'info',
      title: t.secHarmonicInsightNoData,
      detail: t.secHarmonicInsightNoDataDetail,
    });
  }
  const harmonicRecs: SectionRecommendation[] =
    thdVal != null && thdVal > 8
      ? [
          { title: t.actHarmonic, description: t.secHarmonicRecFilter },
          { title: t.recMonitorTitle, description: t.recMonitorDesc },
        ]
      : [{ title: t.secHarmonicRecOk, description: t.secHarmonicRecOkDesc }];

  const phaseLines: EqChartLineSpec[] = buildCh1PhaseLines(chartUi);

  const peakLines: EqChartLineSpec[] = ch1Only
    ? [{ dataKey: 'beforeAvg', name: `${t.ch1Label} avg`, stroke: EQ_CH1_STROKE.avg, width: EQ_LINE_WIDTH.avg }]
    : [
        { dataKey: 'beforeAvg', name: `${t.ch1Label} avg`, stroke: EQ_CH1_STROKE.avg, width: EQ_LINE_WIDTH.avg },
        { dataKey: 'afterAvg', name: `${t.ch2Label} avg`, stroke: EQ_CH2_STROKE.avg, width: EQ_LINE_WIDTH.l2 },
      ];

  const peakHourlyBar =
    stats?.peakTimeAnalysis?.hourlyProfile.length &&
    stats.peakTimeAnalysis.hourlyProfile.length >= 2
      ? hourlyProfileChartData(stats.peakTimeAnalysis.hourlyProfile)
      : [];

  const geMetrics: GeSolutionMetrics = {
    locale,
    pf: pfVal,
    thd: thdVal,
    curImb: imb,
    voltImb: voltImb,
    peakA: stats?.peakCh1 ?? null,
    avgA: stats?.avgCh1 ?? null,
    monthlySaving: parseReportMoney(
      report.financial.find((f) => f.label === t.f_potentialSaving)?.value ?? '',
    ),
  };
  const currency = reportCurrency(locale);
  const money = (amount: number | null, perMonth = false) =>
    amount != null ? fmtReportMoney(locale, amount, { perMonth }) : '—';
  const geRec = needsGeSolutionComparison(geMetrics) ? geSolutionRecommendation(t) : null;

  const geEnergy = geCompareInsightEnergy(geMetrics, t);
  if (geEnergy && needsGeSolutionComparison(geMetrics)) energyInsights.push(geEnergy);
  if (geRec) energyRecs.unshift(geRec);

  const gePeak = geCompareInsightPeak(geMetrics, t);
  if (gePeak) peakInsights.push(gePeak);
  if (geRec) peakRecs.unshift(geRec);

  const gePf = geCompareInsightPf(geMetrics, t);
  if (gePf) pfInsights.push(gePf);
  if (geRec && pfVal != null && pfVal < 0.95) pfRecs.unshift(geRec);

  const geBalance = geCompareInsightBalance(geMetrics, t);
  if (geBalance) balanceInsights.push(geBalance);
  const geVoltage = geCompareInsightVoltage(geMetrics, t);
  if (geVoltage) balanceInsights.push(geVoltage);
  if (geRec && imb != null && imb > 15) balanceRecs.unshift(geRec);

  const geHarmonic = geCompareInsightHarmonic(geMetrics, t);
  if (geHarmonic) harmonicInsights.push(geHarmonic);
  if (geRec && thdVal != null && thdVal > 8) harmonicRecs.unshift(geRec);

  return {
    energy: {
      fields: report.energy,
      insights: energyInsights,
      recommendations: energyRecs,
      chartKind: energyBarData.length || chartData.length ? 'line' : 'none',
      chartCaption: t.secEnergyChartCaption,
      chartData: energyBarData.length ? energyBarData : chartData,
      chartLines: energyBarData.length
        ? [{ dataKey: 'value', name: 'kWh', stroke: '#047857', width: EQ_LINE_WIDTH.metric }]
        : phaseLines,
      chartUnit: energyBarData.length ? ' kWh' : ' A',
    },
    peak: {
      fields: peakFields,
      insights: peakInsights,
      recommendations: peakRecs,
      chartKind: peakHourlyBar.length ? 'bar' : 'line',
      chartCaption: peakHourlyBar.length ? t.secPeakHourlyChartCaption : t.secPeakChartCaption,
      chartData: peakHourlyBar.length ? peakHourlyBar : chartData,
      chartLines: peakHourlyBar.length
        ? [{ dataKey: 'value', name: t.f_avgLoad, stroke: '#b45309', width: 1.75 }]
        : peakLines,
      chartUnit: ' A',
      chartIntegerAxis: false,
    },
    pf: {
      fields: pfFields,
      insights: pfInsights,
      recommendations: pfRecs,
      chartKind: pfVal != null ? 'line' : 'none',
      chartCaption: t.secPfChartCaption,
      chartData: pfVal != null
        ? [
            { label: t.f_avgPf, value: pfVal },
            { label: t.secPfTarget, value: 0.95 },
            { label: t.secPfIdeal, value: 1 },
          ]
        : [],
      ...metricLine('PF', 'value', '#6d28d9'),
    },
    balance: {
      fields: balanceFields,
      insights: balanceInsights,
      recommendations: balanceRecs,
      chartKind: 'line',
      chartCaption: t.secBalanceChartCaption,
      chartData: chartData.length ? chartData : [],
      chartLines: phaseLines,
    },
    harmonic: {
      fields: harmonicFields,
      insights: harmonicInsights,
      recommendations: harmonicRecs,
      chartKind: thdVal != null ? 'line' : 'none',
      chartCaption: t.secHarmonicChartCaption,
      chartData:
        thdVal != null
          ? [
              { label: chartUi.l1, value: thdVal },
              { label: chartUi.l2, value: thdVal },
              { label: chartUi.l3, value: thdVal },
            ]
          : [],
      ...metricLine('THDI %', 'value', '#b45309', '%'),
    },
    equipment: buildEquipmentPack(report, t, geMetrics),
    financial: buildFinancialPack(report, t, geMetrics, locale, currency, money),
    roi: buildRoiPack(report, t, geMetrics, locale, currency, money),
    ai: buildAiPack(report, t),
    action: buildActionPack(report, t, locale, currency),
    conclusion: buildConclusionPack(report, t, geMetrics),
  };
}

function buildEquipmentPack(
  report: EnergyQualityReport,
  t: ReportStrings,
  geMetrics: GeSolutionMetrics,
): SectionAnalysisPack {
  const motor = report.equipment.find((f) => f.label === t.f_motorCompressor)?.value ?? '—';
  const breaker = report.equipment.find((f) => f.label === t.f_mainBreaker)?.value ?? '—';
  const transformer = report.equipment.find((f) => f.label === t.f_transformer)?.value ?? '—';
  const maintenance = report.equipment.find((f) => f.label === t.f_maintenance)?.value ?? '—';

  const insights: TechnicalInsight[] = [
    {
      severity: riskScoreFromLabel(motor, t) >= 3 ? 'critical' : riskScoreFromLabel(motor, t) >= 2 ? 'warning' : 'info',
      title: t.f_motorCompressor,
      detail: fillTpl(t.secEquipmentInsightMotor, { status: motor }),
    },
    {
      severity: riskScoreFromLabel(breaker, t) >= 2 ? 'warning' : 'info',
      title: t.f_mainBreaker,
      detail: fillTpl(t.secEquipmentInsightBreaker, { status: breaker }),
    },
    {
      severity: riskScoreFromLabel(transformer, t) >= 2 ? 'warning' : 'info',
      title: t.f_transformer,
      detail: fillTpl(t.secEquipmentInsightTransformer, { status: transformer }),
    },
    {
      severity: 'info',
      title: t.f_maintenance,
      detail: maintenance,
    },
  ];
  const geEquip = geCompareInsightEquipment(geMetrics, t, motor);
  if (geEquip) insights.push(geEquip);

  const equipmentRecs: SectionRecommendation[] = [
    { title: t.secEquipmentRecInspect, description: t.secEquipmentRecInspectDesc },
    { title: t.actAnnualAudit, description: t.maintenanceNote },
  ];
  if (needsGeSolutionComparison(geMetrics)) {
    equipmentRecs.unshift(geSolutionRecommendation(t));
  }

  return {
    fields: report.equipment,
    insights,
    recommendations: equipmentRecs,
    chartKind: 'line',
    chartCaption: t.secEquipmentChartCaption,
    chartData: [
      { label: t.f_motorCompressor, value: riskScoreFromLabel(motor, t) },
      { label: t.f_mainBreaker, value: riskScoreFromLabel(breaker, t) },
      { label: t.f_transformer, value: riskScoreFromLabel(transformer, t) },
    ],
    ...metricLine(t.secEquipmentRiskAxis, 'value', '#b91c1c'),
  };
}

function buildFinancialPack(
  report: EnergyQualityReport,
  t: ReportStrings,
  geMetrics: GeSolutionMetrics,
  locale: EqLocale,
  currency: ReturnType<typeof reportCurrency>,
  money: (amount: number | null, perMonth?: boolean) => string,
): SectionAnalysisPack {
  const monthly = parseReportMoney(report.financial.find((f) => f.label === t.f_monthlyCost)?.value ?? '');
  const penalty = parseReportMoney(report.financial.find((f) => f.label === t.f_penaltyCost)?.value ?? '');
  const saving = parseReportMoney(report.financial.find((f) => f.label === t.f_potentialSaving)?.value ?? '');
  const annual = parseReportMoney(report.financial.find((f) => f.label === t.f_annualSaving)?.value ?? '');

  const insights: TechnicalInsight[] = [];
  if (monthly != null) {
    insights.push({
      severity: 'info',
      title: t.secFinancialInsightCost,
      detail: fillTpl(t.secFinancialInsightCostDetail, { value: money(monthly) }),
    });
  }
  if (penalty != null && penalty > 0) {
    insights.push({
      severity: 'warning',
      title: t.f_penaltyCost,
      detail: fillTpl(t.secFinancialInsightPenaltyDetail, { value: money(penalty) }),
    });
  } else {
    insights.push({
      severity: 'info',
      title: t.f_penaltyCost,
      detail: t.secFinancialInsightNoPenalty,
    });
  }
  if (saving != null) {
    insights.push({
      severity: saving > 3000 ? 'info' : 'warning',
      title: t.secFinancialInsightSaving,
      detail: fillTpl(t.secFinancialInsightSavingDetail, {
        monthly: money(saving),
        annual: money(annual),
      }),
    });
  }
  const geFinancial = geCompareInsightFinancial(geMetrics, t);
  if (geFinancial) insights.push(geFinancial);

  const barData = [
    monthly != null ? { label: t.f_monthlyCost, value: monthly } : null,
    penalty != null && penalty > 0 ? { label: t.f_penaltyCost, value: penalty } : null,
    saving != null ? { label: t.f_potentialSaving, value: saving } : null,
    annual != null ? { label: t.f_annualSaving, value: annual } : null,
  ].filter((x): x is { label: string; value: number } => x != null);

  const financialRecs: SectionRecommendation[] = [
    { title: t.secFinancialRecReview, description: t.secFinancialRecReviewDesc },
    { title: t.recApfcTitle, description: t.secFinancialRecApfcDesc },
  ];
  if (needsGeSolutionComparison(geMetrics)) {
    financialRecs.unshift(geSolutionRecommendation(t));
  }

  return {
    fields: report.financial,
    insights,
    recommendations: financialRecs,
    chartKind: barData.length ? 'line' : 'none',
    chartCaption: fillTpl(t.secFinancialChartCaption, { currency: currency.code }),
    chartData: barData,
    ...metricLine(currency.code, 'value', '#0f766e', currency.chartUnit),
  };
}

function buildRoiPack(
  report: EnergyQualityReport,
  t: ReportStrings,
  geMetrics: GeSolutionMetrics,
  locale: EqLocale,
  currency: ReturnType<typeof reportCurrency>,
  money: (amount: number | null, perMonth?: boolean) => string,
): SectionAnalysisPack {
  const investment =
    parseReportMoney(report.roi.find((f) => f.label === t.f_investment)?.value ?? '') ??
    defaultReportInvestment(locale);
  const monthlySave = parseReportMoney(report.roi.find((f) => f.label === t.f_potentialSaving)?.value ?? '');
  const roiPct = report.roi.find((f) => f.label === t.f_roi)?.value ?? '—';
  const solution = report.roi.find((f) => f.label === t.f_solution)?.value ?? '—';

  const insights: TechnicalInsight[] = [
    {
      severity: 'info',
      title: t.secRoiInsightSolution,
      detail: fillTpl(t.secRoiInsightSolutionDetail, { solution }),
    },
    {
      severity: 'info',
      title: t.secRoiPaybackBenchmark,
      detail: t.secRoiPaybackBenchmarkDetail,
    },
    geCompareInsightRoi(geMetrics, t),
  ];
  if (monthlySave != null && monthlySave > 0) {
    const months = computePaybackMonths(investment, monthlySave)!;
    const payback = formatPaybackPeriod(monthlySave, investment, t);
    const rating = paybackRatingForMonths(months, t);
    insights.push({
      severity: rating.severity,
      title: t.secRoiInsightPayback,
      detail: fillTpl(t.secRoiInsightPaybackDetail, {
        payback,
        rating: rating.label,
        roi: roiPct,
        benchmark: String(PAYBACK_EXCELLENT_MAX_MONTHS),
      }),
    });
    insights.push({
      severity: 'info',
      title: t.secRoiInsightReturn,
      detail: fillTpl(t.secRoiInsightReturnDetail, {
        monthly: money(monthlySave),
        annual: money(monthlySave * 12),
      }),
    });
  } else {
    insights.push({
      severity: 'warning',
      title: t.secRoiInsightPending,
      detail: t.secRoiInsightPendingDetail,
    });
  }

  const barData = [
    { label: t.f_investment, value: investment },
    monthlySave != null ? { label: t.f_potentialSaving, value: monthlySave * 12 } : null,
  ].filter((x): x is { label: string; value: number } => x != null);

  const recommendations: SectionAnalysisPack['recommendations'] = [];
  if (monthlySave != null && monthlySave > 0) {
    const months = computePaybackMonths(investment, monthlySave)!;
    if (months > PAYBACK_EXCELLENT_MAX_MONTHS) {
      recommendations.push({ title: t.secRoiRecOptimize, description: t.secRoiRecOptimizeDesc });
    } else {
      recommendations.push({ title: t.secRoiRecApprove, description: t.secRoiRecApproveDesc });
    }
  } else {
    recommendations.push({ title: t.secRoiRecApprove, description: t.secRoiRecApproveDesc });
  }
  recommendations.push({ title: t.actInstallApfc, description: t.recApfcDesc });

  return {
    fields: report.roi,
    insights,
    recommendations,
    chartKind: barData.length ? 'line' : 'none',
    chartCaption: t.secRoiChartCaption,
    chartData: barData,
    ...metricLine(currency.code, 'value', '#4338ca', currency.chartUnit),
  };
}

function buildAiPack(report: EnergyQualityReport, t: ReportStrings): SectionAnalysisPack {
  const insights: TechnicalInsight[] = report.recommendations.map((rec) => ({
    severity: (rec.priority === 1 ? 'warning' : 'info') as TechnicalInsight['severity'],
    title: fillTpl(t.secAiInsightItem, { priority: String(rec.priority), title: rec.title }),
    detail: rec.description,
  }));
  if (!insights.length) {
    insights.push({
      severity: 'info',
      title: t.secAiInsightEmpty,
      detail: t.secAiInsightEmptyDetail,
    });
  }
  insights.unshift({
    severity: 'info',
    title: t.secAiInsightOverview,
    detail: fillTpl(t.secAiInsightOverviewDetail, { count: String(report.recommendations.length) }),
  });

  return {
    fields: [
      {
        label: t.secAiFieldCount,
        value: String(report.recommendations.length),
      },
      {
        label: t.f_recommendedSolution,
        value: report.recommendations[0]?.title ?? t.continueMonitoring,
      },
    ],
    insights,
    recommendations: [
      { title: t.nextStepReview, description: t.secAiRecReviewDesc },
      { title: t.recMonitorTitle, description: t.recMonitorDesc },
    ],
    chartKind: report.recommendations.length ? 'line' : 'none',
    chartCaption: t.secAiChartCaption,
    chartData: report.recommendations.map((rec) => ({
      label: `P${rec.priority}`,
      value: Math.max(1, 5 - rec.priority),
    })),
    ...metricLine(t.priority, 'value', '#047857'),
  };
}

function buildActionPack(
  report: EnergyQualityReport,
  t: ReportStrings,
  locale: EqLocale,
  currency: ReturnType<typeof reportCurrency>,
): SectionAnalysisPack {
  const totalItems = report.actionPlan.reduce((n, b) => n + countActionItems(b.items), 0);
  const monthlySaving = parseReportMoney(
    report.financial.find((f) => f.label === t.f_potentialSaving)?.value ?? '',
  );
  const outcomeUnit = `${currency.chartUnit}${currency.perMonth}`;
  const insights: TechnicalInsight[] = report.actionPlan.map((block) => ({
    severity: block.horizon === t.immediate ? 'warning' : 'info',
    title: block.horizon,
    detail:
      countActionItems(block.items) > 0
        ? block.items.filter((item) => item.trim() && item !== '—').join(' · ')
        : '—',
  }));
  insights.unshift({
    severity: 'info',
    title: t.secActionInsightOverview,
    detail: fillTpl(t.secActionInsightOverviewDetail, { count: String(totalItems) }),
  });

  return {
    fields: [
      { label: t.secActionFieldHorizons, value: String(report.actionPlan.length) },
      { label: t.secActionFieldTasks, value: String(totalItems) },
    ],
    insights,
    recommendations: [
      { title: t.secActionRecAssign, description: t.secActionRecAssignDesc },
      { title: t.secActionRecTrack, description: t.secActionRecTrackDesc },
    ],
    chartKind: 'bar',
    chartCaption: t.secActionChartCaption,
    chartData: actionPlanOutcomeChartData({
      plan: report.actionPlan,
      monthlySaving,
      t,
    }),
    chartIntegerAxis: false,
    ...metricLine(t.secActionOutcomeAxis, 'value', '#0369a1', outcomeUnit),
  };
}

function buildConclusionPack(
  report: EnergyQualityReport,
  t: ReportStrings,
  geMetrics: GeSolutionMetrics,
): SectionAnalysisPack {
  const problem = report.conclusion.find((f) => f.label === t.f_currentProblem)?.value ?? '—';
  const techRisk = report.conclusion.find((f) => f.label === t.f_technicalRisk)?.value ?? '—';
  const financial = report.conclusion.find((f) => f.label === t.f_financialImpact)?.value ?? '—';
  const solution = report.conclusion.find((f) => f.label === t.f_recommendedSolution)?.value ?? '—';
  const saving = report.conclusion.find((f) => f.label === t.f_expectedSaving)?.value ?? '—';
  const payback = report.conclusion.find((f) => f.label === t.f_payback)?.value ?? '—';

  const insights: TechnicalInsight[] = [
    {
      severity: riskScoreFromLabel(problem, t) >= 2 ? 'warning' : 'info',
      title: t.f_currentProblem,
      detail: fillTpl(t.secConclusionInsightProblem, { value: problem }),
    },
    {
      severity: riskScoreFromLabel(techRisk, t) >= 2 ? 'warning' : 'info',
      title: t.f_technicalRisk,
      detail: fillTpl(t.secConclusionInsightTech, { value: techRisk }),
    },
    {
      severity: 'info',
      title: t.f_financialImpact,
      detail: fillTpl(t.secConclusionInsightFinancial, { value: financial }),
    },
    {
      severity: 'info',
      title: t.secConclusionInsightDecision,
      detail: fillTpl(t.secConclusionInsightDecisionDetail, {
        solution,
        saving,
        payback,
      }),
    },
    geCompareInsightConclusion(geMetrics, t, problem, solution, saving),
  ];

  const conclusionRecs: SectionRecommendation[] = [
    { title: t.f_nextStep, description: t.nextStepReview },
    { title: t.secConclusionRecSignoff, description: t.secConclusionRecSignoffDesc },
  ];
  if (needsGeSolutionComparison(geMetrics)) {
    conclusionRecs.unshift(geSolutionRecommendation(t));
  }

  return {
    fields: report.conclusion,
    insights,
    recommendations: conclusionRecs,
    chartKind: 'line',
    chartCaption: t.secConclusionChartCaption,
    chartData: [
      { label: t.f_currentProblem, value: riskScoreFromLabel(problem, t) },
      { label: t.f_technicalRisk, value: riskScoreFromLabel(techRisk, t) },
      {
        label: t.f_financialImpact,
        value:
          parseReportMoney(financial) != null
            ? Math.min(3, parseReportMoney(financial)! / (defaultReportInvestment(geMetrics.locale) / 13))
            : 1,
      },
    ],
    ...metricLine(t.secConclusionScoreAxis, 'value', '#047857'),
  };
}

function displayA(val: number | null): string {
  return val != null && Number.isFinite(val) ? `${fmtA(val)} A` : '—';
}

function displayPct(val: number | null): string {
  return val != null && Number.isFinite(val) ? `${fmtNum(val, 1)}%` : '—';
}

function patchPeakFields(
  fields: ReportField[],
  stats: CurrentHistoryStats | null,
  t: ReportStrings,
): ReportField[] {
  if (!stats) return fields;
  let next = fields;
  if (stats.peakCh1 != null) {
    next = patchField(next, t.f_peakDemand, `${fmtA(stats.peakCh1)} A`);
    next = patchField(next, t.f_peakTime, stats.peakCh1Time ?? '—');
  }
  const pt = stats.peakTimeAnalysis;
  if (pt?.peakPeriod) next = patchField(next, t.f_peakPeriod, pt.peakPeriod);
  if (pt?.dominantWindows) next = patchField(next, t.f_peakWindows, pt.dominantWindows);
  if (pt?.onPeakAvgA != null) next = patchField(next, t.f_onPeakAvg, `${fmtA(pt.onPeakAvgA)} A`);
  if (pt?.offPeakAvgA != null) next = patchField(next, t.f_offPeakAvg, `${fmtA(pt.offPeakAvgA)} A`);
  if (stats.avgCh1 != null) {
    next = patchField(next, t.f_avgLoad, `${fmtA(stats.avgCh1)} A`);
  }
  if (stats.peakCh1 != null && stats.avgCh1 != null && stats.avgCh1 > 0) {
    next = patchField(next, t.f_peakRatio, fmtNum(stats.peakCh1 / stats.avgCh1, 2));
  }
  if (stats.loadFactor != null) {
    const impact = stats.loadFactor < 40 ? t.statusWarning : t.statusGood;
    next = patchField(next, t.f_demandChargeImpact, impact);
  }
  return next;
}

function patchBalanceFields(
  fields: ReportField[],
  l1: number | null,
  l2: number | null,
  l3: number | null,
  voltImb: number | null,
  t: ReportStrings,
): ReportField[] {
  let next = fields;
  next = patchField(next, t.f_l1Current, displayA(l1));
  next = patchField(next, t.f_l2Current, displayA(l2));
  next = patchField(next, t.f_l3Current, displayA(l3));
  const total = [l1, l2, l3].filter((v): v is number => v != null).reduce((a, b) => a + b, 0) || null;
  if (total != null && total > 0) {
    const share = (v: number | null) =>
      v != null ? `${fmtNum((v / total) * 100, 1)}%` : '—';
    next = patchField(next, t.f_l1Share, share(l1));
    next = patchField(next, t.f_l2Share, share(l2));
    next = patchField(next, t.f_l3Share, share(l3));
  }
  const imb = imbalancePct([l1, l2, l3]);
  if (imb != null) next = patchField(next, t.f_currentImbalance, displayPct(imb));
  if (voltImb != null) next = patchField(next, t.f_voltageImbalance, displayPct(voltImb));
  return next;
}

function patchHarmonicFields(
  fields: ReportField[],
  thd: number | null,
  t: ReportStrings,
): ReportField[] {
  if (thd == null) return fields;
  const v = `${fmtNum(thd, 1)}%`;
  let next = fields;
  next = patchField(next, t.f_thdiL1, v);
  next = patchField(next, t.f_thdiL2, v);
  next = patchField(next, t.f_thdiL3, v);
  next = patchField(next, t.f_thdiAvg, v);
  const risk =
    thd > 15 ? t.riskHigh : thd > 8 ? t.riskCaution : t.riskAcceptable;
  next = patchField(next, t.f_harmonicRisk, risk);
  return next;
}
