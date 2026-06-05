import { fmtA, fmtNum } from './energy-quality-i18n';
import type { CurrentHistoryStats, DbChartPoint } from './energy-quality-current-analysis';
import type { ReportChannel, RiskLevel } from './energy-quality-report-model';
import type { ReportStrings } from './energy-quality-report-i18n';
import type { PeakTimeAnalysis } from './energy-quality-peak-time-analysis';
import { recommendGeEnergySaverKva } from './energy-quality-equipment-sizing';

export type FindingAssessment = 'excellent' | 'acceptable' | 'caution' | 'warning' | 'neutral';

export type KeyFindingRow = {
  parameter: string;
  measured: string;
  standard: string;
  assessment: FindingAssessment;
  assessmentLabel: string;
};

export type PhasedRecommendation = {
  phase: string;
  title: string;
  priority: string;
  bullets: string[];
  expectedOutcome: string;
};

export type PercentileRow = { label: string; value: string; line: string; hint: string };

export type ExceedanceLiveLevel = 'good' | 'warning' | 'critical' | 'neutral';

export type ExceedanceRow = {
  threshold: string;
  pct: string;
  liveStatus: string;
  liveLevel: ExceedanceLiveLevel;
  liveImbDisplay: string | null;
};

export type ProfessionalReportContent = {
  reportSubtitle: string;
  keyFindingsIntro: string;
  keyFindings: KeyFindingRow[];
  executiveNarrative: string[];
  interpretationTitle: string;
  interpretationBullets: string[];
  phasedTitle: string;
  phasedRecommendations: PhasedRecommendation[];
  peakPercentiles: PercentileRow[] | null;
  peakPercentileCaption: string;
  imbalanceExceedance: ExceedanceRow[] | null;
  imbalanceExceedanceCaption: string;
  loadProfileNarrative: string | null;
  overallTechnicalRisk: string;
  recommendedModel: string | null;
};

function fillTpl(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), template);
}

function assessmentLabel(t: ReportStrings, level: FindingAssessment): string {
  if (level === 'excellent') return t.assessExcellent;
  if (level === 'acceptable') return t.assessAcceptable;
  if (level === 'caution') return t.assessCaution;
  if (level === 'warning') return t.assessWarning;
  return t.assessNeutral;
}

function assessLoadFactor(lf: number | null): FindingAssessment {
  if (lf == null) return 'neutral';
  if (lf >= 60) return 'excellent';
  if (lf >= 40) return 'caution';
  return 'warning';
}

function assessPf(pf: number | null): FindingAssessment {
  if (pf == null) return 'neutral';
  if (pf >= 0.95) return 'excellent';
  if (pf >= 0.85) return 'caution';
  return 'warning';
}

function assessImbalance(imb: number | null, warn: number, crit: number): FindingAssessment {
  if (imb == null) return 'neutral';
  if (imb < warn * 0.5) return 'excellent';
  if (imb < warn) return 'acceptable';
  if (imb < crit) return 'caution';
  return 'warning';
}

function assessThd(thd: number | null): FindingAssessment {
  if (thd == null) return 'neutral';
  if (thd < 5) return 'excellent';
  if (thd < 8) return 'acceptable';
  if (thd < 15) return 'caution';
  return 'warning';
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function loadSeries(points: DbChartPoint[]): number[] {
  const kw = points.map((p) => p.beforeKw).filter((v): v is number => v != null && v > 0);
  if (kw.length >= 3) return kw;
  return points.map((p) => p.beforeAvg).filter((v): v is number => v != null && v > 0);
}

function loadUnit(points: DbChartPoint[]): 'kW' | 'A' {
  return points.some((p) => p.beforeKw != null && p.beforeKw > 0) ? 'kW' : 'A';
}

function fmtLoad(v: number, unit: 'kW' | 'A'): string {
  return unit === 'kW' ? `${fmtNum(v, 2)} kW` : `${fmtA(v)} A`;
}

/** 15-point rolling mean peak (proxy for 15-min peak on 1-min data). */
function rollingPeak15(values: number[], window = 15): number | null {
  if (values.length < window) return values.length ? Math.max(...values) : null;
  let maxRoll = 0;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    if (i >= window - 1) maxRoll = Math.max(maxRoll, sum / window);
  }
  return maxRoll;
}

function percentileHint(label: string, t: ReportStrings): string {
  if (label === 'P50') return t.pctHintP50;
  if (label === 'P75') return t.pctHintP75;
  if (label === 'P90') return t.pctHintP90;
  if (label === 'P95') return t.pctHintP95;
  if (label === 'P99') return t.pctHintP99;
  return '';
}

function percentileRow(
  label: string,
  value: number,
  unit: 'kW' | 'A',
  t: ReportStrings,
): PercentileRow {
  const formatted = fmtLoad(value, unit);
  const hint = percentileHint(label, t);
  return { label, value: formatted, line: `${label}  ${formatted}`, hint };
}

function computePercentiles(points: DbChartPoint[], t: ReportStrings): PercentileRow[] | null {
  const series = loadSeries(points).sort((a, b) => a - b);
  if (series.length < 5) return null;
  const unit = loadUnit(points);
  return [
    percentileRow('P50', percentile(series, 50), unit, t),
    percentileRow('P75', percentile(series, 75), unit, t),
    percentileRow('P90', percentile(series, 90), unit, t),
    percentileRow('P95', percentile(series, 95), unit, t),
    percentileRow('P99', percentile(series, 99), unit, t),
  ];
}

function liveExceedStatus(
  liveImb: number | null,
  threshold: number,
  t: ReportStrings,
): Pick<ExceedanceRow, 'liveStatus' | 'liveLevel' | 'liveImbDisplay'> {
  const liveImbDisplay =
    liveImb != null && Number.isFinite(liveImb) ? `${fmtNum(liveImb, 1)}%` : null;
  if (liveImb == null || !Number.isFinite(liveImb)) {
    return { liveStatus: t.statusNoData, liveLevel: 'neutral', liveImbDisplay };
  }
  if (liveImb > threshold) {
    if (threshold >= 50) {
      return { liveStatus: t.exceedLiveSevere, liveLevel: 'critical', liveImbDisplay };
    }
    if (threshold >= 20) {
      return { liveStatus: t.riskHigh, liveLevel: 'critical', liveImbDisplay };
    }
    return { liveStatus: t.statusWarning, liveLevel: 'warning', liveImbDisplay };
  }
  return { liveStatus: t.exceedLiveNormal, liveLevel: 'good', liveImbDisplay };
}

function computeImbalanceExceedance(
  points: DbChartPoint[],
  t: ReportStrings,
  liveImb: number | null,
): ExceedanceRow[] | null {
  const vals = points
    .map((p) => p.currentImbalancePct)
    .filter((v): v is number => v != null && Number.isFinite(v));
  if (vals.length < 5) return null;
  const pctAbove = (threshold: number) =>
    `${fmtNum((vals.filter((v) => v > threshold).length / vals.length) * 100, 1)}%`;
  const thresholds = [
    { label: t.exceedWarn10, pct: 10 },
    { label: t.exceedHigh20, pct: 20 },
    { label: t.exceedSevere50, pct: 50 },
  ] as const;
  return thresholds.map(({ label, pct }) => ({
    threshold: label,
    pct: pctAbove(pct),
    ...liveExceedStatus(liveImb, pct, t),
  }));
}

function pfBelowPct(points: DbChartPoint[], threshold: number): number | null {
  const vals = points.map((p) => p.beforePf).filter((v): v is number => v != null);
  if (vals.length < 3) return null;
  return (vals.filter((v) => v < threshold).length / vals.length) * 100;
}

function phaseShares(points: DbChartPoint[]): { l1: number; l2: number; l3: number } | null {
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;
  let n = 0;
  for (const p of points) {
    if (p.beforeL1 == null && p.beforeL2 == null && p.beforeL3 == null) continue;
    s1 += Math.abs(p.beforeL1 ?? 0);
    s2 += Math.abs(p.beforeL2 ?? 0);
    s3 += Math.abs(p.beforeL3 ?? 0);
    n++;
  }
  const total = s1 + s2 + s3;
  if (!n || total <= 0) return null;
  return { l1: (s1 / total) * 100, l2: (s2 / total) * 100, l3: (s3 / total) * 100 };
}

function buildLoadProfileNarrative(
  peakTime: PeakTimeAnalysis | null | undefined,
  t: ReportStrings,
): string | null {
  if (!peakTime?.dominantWindows) return null;
  return fillTpl(t.proLoadProfileNarrative, { windows: peakTime.dominantWindows });
}

function overallTechnicalRiskLabel(risk: RiskLevel, t: ReportStrings): string {
  if (risk === 'critical') return t.overallRiskCritical;
  if (risk === 'warning') return t.overallRiskCaution;
  return t.overallRiskGood;
}

export function buildProfessionalReportContent(input: {
  t: ReportStrings;
  points: DbChartPoint[];
  stats: CurrentHistoryStats | null;
  ch1: ReportChannel;
  historyPoints: number;
  historyPeriod: string;
  measurementStart?: string;
  measurementEnd?: string;
  overallRisk: RiskLevel;
  estMonthlyKwh: number | null;
  estAnnualKwh: number | null;
  potentialSaving: number | null;
  paybackLabel: string;
  peakVal: number | null;
  peakTime: string;
  loadFactor: number | null;
  pf: number | null;
  curImb: number | null;
  voltImb: number | null;
  thd: number | null;
  thdv: number | null;
}): ProfessionalReportContent {
  const {
    t,
    points,
    stats,
    ch1,
    historyPoints,
    historyPeriod,
    measurementStart,
    measurementEnd,
    overallRisk,
    estMonthlyKwh,
    estAnnualKwh,
    potentialSaving,
    paybackLabel,
    peakVal,
    peakTime,
    loadFactor,
    pf,
    curImb,
    voltImb,
    thd,
    thdv,
  } = input;

  const unit = loadUnit(points);
  const series = loadSeries(points);
  const rollPeak = rollingPeak15(series);
  const hourlyPeak = stats?.peakCh1 ?? peakVal;
  const peakDeltaPct =
    rollPeak != null && hourlyPeak != null && hourlyPeak > 0
      ? ((rollPeak - hourlyPeak) / hourlyPeak) * 100
      : null;

  const pfBelow085 = pfBelowPct(points, 0.85);
  const pfBelow095 = pfBelowPct(points, 0.95);
  const shares = phaseShares(points);
  const peakPercentiles = computePercentiles(points, t);
  const imbalanceExceedance = computeImbalanceExceedance(points, t, curImb);
  const loadProfileNarrative = buildLoadProfileNarrative(stats?.peakTimeAnalysis, t);

  const periodLabel =
    measurementStart && measurementEnd
      ? `${measurementStart} – ${measurementEnd}`
      : historyPeriod;

  const reportSubtitle = fillTpl(t.proReportSubtitle, {
    period: periodLabel,
    records: String(historyPoints),
    resolution: t.realtimeResolution,
  });

  const keyFindings: KeyFindingRow[] = [];

  const pushRow = (
    parameter: string,
    measured: string,
    standard: string,
    assessment: FindingAssessment,
  ) => {
    keyFindings.push({
      parameter,
      measured,
      standard,
      assessment,
      assessmentLabel: assessmentLabel(t, assessment),
    });
  };

  if (estMonthlyKwh != null) {
    pushRow(
      t.f_totalEnergy,
      estAnnualKwh != null
        ? `${fmtNum(estMonthlyKwh, 0)} kWh/mo · ~${fmtNum(estAnnualKwh, 0)} kWh/yr`
        : `${fmtNum(estMonthlyKwh, 0)} kWh/mo`,
      '—',
      'neutral',
    );
  }

  if (rollPeak != null || peakVal != null) {
    const peakDisplay = rollPeak != null ? fmtLoad(rollPeak, unit) : fmtLoad(peakVal!, unit);
    const at = peakTime !== '—' ? ` @ ${peakTime}` : '';
    pushRow(t.f_peakDemand, `${peakDisplay}${at}`, t.stdSiteSpecific, 'neutral');
  }

  pushRow(
    t.f_loadFactor,
    loadFactor != null ? `${fmtNum(loadFactor, 1)}%` : '—',
    t.stdLoadFactor,
    assessLoadFactor(loadFactor),
  );

  pushRow(
    t.f_avgPf,
    pf != null ? `${fmtNum(pf, 3)} (${t.pfLagging})` : '—',
    t.stdPf,
    assessPf(pf),
  );

  pushRow(
    t.f_voltageImbalance,
    voltImb != null ? `${fmtNum(voltImb, 2)}%` : '—',
    t.stdVoltImb,
    assessImbalance(voltImb, 2, 5),
  );

  pushRow(
    t.f_currentImbalance,
    curImb != null ? `${fmtNum(curImb, 2)}%` : '—',
    t.stdCurImb,
    assessImbalance(curImb, 5, 15),
  );

  pushRow(
    t.f_thdi,
    thd != null ? `${fmtNum(thd, 1)}%` : '—',
    t.stdThdi,
    assessThd(thd),
  );

  pushRow(
    t.f_thdv,
    thdv != null ? `${fmtNum(thdv, 2)}%` : '—',
    t.stdThdv,
    assessThd(thdv),
  );

  const narrative: string[] = [];
  narrative.push(
    fillTpl(t.proNarrativeIntro, {
      period: periodLabel,
      records: String(historyPoints),
      resolution: t.realtimeResolution,
    }),
  );

  if (thd != null && pf != null) {
    narrative.push(
      fillTpl(t.proNarrativePfThd, {
        thd: fmtNum(thd, 1),
        pf: fmtNum(pf, 3),
        pfPenalty: pfBelow085 != null ? fmtNum(pfBelow085, 1) : '—',
      }),
    );
  }

  if (curImb != null && shares) {
    narrative.push(
      fillTpl(t.proNarrativeImbalance, {
        imb: fmtNum(curImb, 2),
        l1: fmtNum(shares.l1, 1),
      }),
    );
  }

  if (rollPeak != null && peakTime !== '—') {
    narrative.push(
      fillTpl(t.proNarrativePeak, {
        peak: fmtLoad(rollPeak, unit),
        time: peakTime,
        ratio: loadFactor != null ? fmtNum(100 / loadFactor, 1) : '—',
        delta: peakDeltaPct != null ? fmtNum(Math.abs(peakDeltaPct), 0) : '—',
      }),
    );
  }

  if (voltImb != null && thdv != null) {
    narrative.push(
      fillTpl(t.proNarrativeVoltage, {
        vi: fmtNum(voltImb, 2),
        thdv: fmtNum(thdv, 2),
      }),
    );
  }

  const interpretationBullets: string[] = [];
  if (peakDeltaPct != null && peakDeltaPct > 5) {
    interpretationBullets.push(
      fillTpl(t.proInterpPeakDelta, {
        fine: fmtLoad(rollPeak!, unit),
        coarse: hourlyPeak != null ? fmtLoad(hourlyPeak, unit) : '—',
        delta: fmtNum(peakDeltaPct, 0),
        window: stats?.peakTimeAnalysis?.dominantWindows ?? '—',
      }),
    );
  }
  if (curImb != null && curImb > 10) {
    interpretationBullets.push(fillTpl(t.proInterpImbalance, { imb: fmtNum(curImb, 2), l1: shares ? fmtNum(shares.l1, 1) : '—' }));
  }
  if (pf != null && pf < 0.95 && estAnnualKwh != null) {
    interpretationBullets.push(
      fillTpl(t.proInterpPfRoi, {
        pf: fmtNum(pf, 3),
        annual: fmtNum(estAnnualKwh, 0),
        payback: paybackLabel,
      }),
    );
  }
  if (thd != null && thd < 15) {
    interpretationBullets.push(fillTpl(t.proInterpApfcSafe, { thd: fmtNum(thd, 1) }));
  }
  if (voltImb != null && voltImb < 2) {
    interpretationBullets.push(fillTpl(t.proInterpVoltageOk, { vi: fmtNum(voltImb, 2) }));
  }
  if (!interpretationBullets.length) {
    interpretationBullets.push(t.proInterpStable);
  }

  const phased: PhasedRecommendation[] = [];

  if (pf != null && pf < 0.95) {
    phased.push({
      phase: t.proPhase1,
      title: t.proPhaseApfcTitle,
      priority: t.proPriorityHighest,
      bullets: [
        fillTpl(t.proPhaseApfcBullet1, { thd: thd != null ? fmtNum(thd, 1) : '—' }),
        fillTpl(t.proPhaseApfcBullet2, {
          peak: rollPeak != null ? fmtLoad(rollPeak, unit) : peakVal != null ? fmtLoad(peakVal, unit) : '—',
          avgI: stats?.avgCh1 != null ? fmtA(stats.avgCh1) : '—',
        }),
      ],
      expectedOutcome: fillTpl(t.proPhaseApfcOutcome, {
        pf: fmtNum(pf, 3),
        payback: paybackLabel,
      }),
    });
  }

  if (curImb != null && curImb > 10) {
    phased.push({
      phase: t.proPhase2,
      title: t.proPhaseBalanceTitle,
      priority: t.proPriorityHigh,
      bullets: [t.proPhaseBalanceBullet1, t.proPhaseBalanceBullet2],
      expectedOutcome: fillTpl(t.proPhaseBalanceOutcome, { imb: fmtNum(curImb, 2) }),
    });
  }

  if (stats?.peakTimeAnalysis?.dominantWindows) {
    phased.push({
      phase: t.proPhase3,
      title: t.proPhaseDemandTitle,
      priority: t.proPriorityHigh,
      bullets: [
        fillTpl(t.proPhaseDemandBullet1, {
          peak: rollPeak != null ? fmtLoad(rollPeak, unit) : '—',
          time: peakTime,
        }),
        t.proPhaseDemandBullet2,
      ],
      expectedOutcome: t.proPhaseDemandOutcome,
    });
  }

  phased.push({
    phase: t.proPhase4,
    title: t.proPhaseMonitorTitle,
    priority: t.proPriorityMedium,
    bullets: [t.proPhaseMonitorBullet1, t.proPhaseMonitorBullet2],
    expectedOutcome: t.proPhaseMonitorOutcome,
  });

  const peakKw = unit === 'kW' ? rollPeak : null;
  const recommendedModel = recommendGeEnergySaverKva(peakKw, stats?.peakCh1 ?? peakVal);

  return {
    reportSubtitle,
    keyFindingsIntro: fillTpl(t.proKeyFindingsIntro, {
      risk: overallTechnicalRiskLabel(overallRisk, t),
      saving: potentialSaving != null ? fmtNum(potentialSaving, 0) : '—',
    }),
    keyFindings,
    executiveNarrative: narrative,
    interpretationTitle: t.proInterpretationTitle,
    interpretationBullets,
    phasedTitle: t.proPhasedTitle,
    phasedRecommendations: phased,
    peakPercentiles,
    peakPercentileCaption: t.proPeakPercentileCaption,
    imbalanceExceedance,
    imbalanceExceedanceCaption: t.proImbalanceExceedCaption,
    loadProfileNarrative,
    overallTechnicalRisk: overallTechnicalRiskLabel(overallRisk, t),
    recommendedModel,
  };
}
