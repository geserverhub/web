import { fmtA, fmtNum, type EqLocale } from './energy-quality-i18n';
import { reportT } from './energy-quality-report-i18n';
import {
  computePeakTimeAnalysis,
  type PeakTimeAnalysis,
} from './energy-quality-peak-time-analysis';

export type DbChartPoint = {
  time: string;
  timestamp?: number;
  beforeL1?: number | null;
  beforeL2?: number | null;
  beforeL3?: number | null;
  beforeAvg?: number | null;
  beforeKw?: number | null;
  beforePf?: number | null;
  beforeThd?: number | null;
  currentImbalancePct?: number | null;
  afterL1?: number | null;
  afterL2?: number | null;
  afterL3?: number | null;
  afterAvg?: number | null;
};

export type TechnicalInsight = {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
};

export type CurrentHistoryStats = {
  dataPoints: number;
  periodLabel: string;
  peakCh1: number | null;
  peakCh1Time: string | null;
  avgCh1: number | null;
  peakCh2: number | null;
  avgCh2: number | null;
  maxImbalancePct: number | null;
  loadFactor: number | null;
  peakTimeAnalysis: PeakTimeAnalysis | null;
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

/** Strip CH2 (after-install) series — pre-install meters are CH1 only. */
export function chartDataCh1Only(points: DbChartPoint[]): DbChartPoint[] {
  return points.map((p) => ({
    ...p,
    afterL1: null,
    afterL2: null,
    afterL3: null,
    afterAvg: null,
  }));
}

export function computeCurrentHistoryStats(
  points: DbChartPoint[],
  periodLabel: string,
): CurrentHistoryStats {
  let peakCh1: number | null = null;
  let peakCh1Time: string | null = null;
  const ch1Avgs: number[] = [];
  const ch2Avgs: number[] = [];
  let maxImb = 0;

  for (const p of points) {
    const b = p.beforeAvg;
    const a = p.afterAvg;
    if (b != null && Number.isFinite(b)) {
      ch1Avgs.push(b);
      if (peakCh1 == null || b > peakCh1) {
        peakCh1 = b;
        peakCh1Time = p.time;
      }
    }
    if (a != null && Number.isFinite(a)) ch2Avgs.push(a);

    const imb = imbalancePct([p.beforeL1, p.beforeL2, p.beforeL3]);
    if (imb != null && imb > maxImb) maxImb = imb;
  }

  const avgCh1 = ch1Avgs.length ? ch1Avgs.reduce((x, y) => x + y, 0) / ch1Avgs.length : null;
  const avgCh2 = ch2Avgs.length ? ch2Avgs.reduce((x, y) => x + y, 0) / ch2Avgs.length : null;
  const peakCh2 = ch2Avgs.length ? Math.max(...ch2Avgs) : null;
  const loadFactor =
    avgCh1 != null && peakCh1 != null && peakCh1 > 0 ? (avgCh1 / peakCh1) * 100 : null;

  const peakTimeAnalysis = points.length >= 2 ? computePeakTimeAnalysis(points) : null;

  return {
    dataPoints: points.length,
    periodLabel,
    peakCh1,
    peakCh1Time,
    avgCh1,
    peakCh2,
    avgCh2,
    maxImbalancePct: points.length ? maxImb : null,
    loadFactor,
    peakTimeAnalysis,
  };
}

export function analyzeCurrentHistory(
  points: DbChartPoint[],
  opts: {
    locale: EqLocale;
    ch1Label: string;
    ch2Label: string;
    periodLabel?: string;
    ch1Only?: boolean;
  },
): { insights: TechnicalInsight[]; stats: CurrentHistoryStats | null } {
  const t = reportT(opts.locale);
  const periodLabel = opts.periodLabel ?? '—';

  if (!points.length) {
    return {
      insights: [
        {
          severity: 'info',
          title: t.insightNoDbData,
          detail: t.insightNoDbDataDetail,
        },
      ],
      stats: null,
    };
  }

  const stats = computeCurrentHistoryStats(points, periodLabel);
  const insights: TechnicalInsight[] = [];

  insights.push({
    severity: 'info',
    title: t.insightDbRecords,
    detail: `${stats.dataPoints} ${t.insightRecordsUnit} · ${stats.periodLabel}`,
  });

  if (stats.peakCh1 != null && stats.avgCh1 != null) {
    insights.push({
      severity: 'info',
      title: t.insightPeakLoad,
      detail: `${fmtA(stats.peakCh1)} A @ ${stats.peakCh1Time ?? '—'} · ${t.insightAvg} ${fmtA(stats.avgCh1)} A`,
    });
    const pt = stats.peakTimeAnalysis;
    if (pt?.peakPeriod) {
      insights.push({
        severity: 'info',
        title: t.insightPeakPeriod,
        detail: pt.peakPeriod,
      });
    }
    if (pt?.dominantWindows) {
      insights.push({
        severity: pt.dominantWindows.includes(',') ? 'warning' : 'info',
        title: t.insightPeakWindows,
        detail: pt.dominantWindows,
      });
    }
    if (pt?.onPeakAvgA != null && pt.offPeakAvgA != null) {
      insights.push({
        severity: pt.onPeakAvgA > pt.offPeakAvgA * 1.15 ? 'warning' : 'info',
        title: t.insightOnPeakLoad,
        detail: `On-peak ${fmtA(pt.onPeakAvgA)} A · Off-peak ${fmtA(pt.offPeakAvgA)} A`,
      });
    }
    if (stats.peakCh1 > stats.avgCh1 * 1.5) {
      insights.push({
        severity: 'warning',
        title: t.insightPeakSpike,
        detail: `${t.insightPeakRatio} ${fmtNum(stats.peakCh1 / stats.avgCh1, 2)}× — ${t.insightPeakSpikeAction}`,
      });
    }
  }

  if (stats.loadFactor != null) {
    const lf = stats.loadFactor;
    insights.push({
      severity: lf < 40 ? 'warning' : 'info',
      title: t.insightLoadFactor,
      detail: `${fmtNum(lf, 1)}% ${lf < 40 ? `— ${t.insightLowLoadFactor}` : ''}`,
    });
  }

  if (stats.maxImbalancePct != null && stats.maxImbalancePct > 15) {
    insights.push({
      severity: stats.maxImbalancePct > 30 ? 'critical' : 'warning',
      title: t.insightPhaseImbalance,
      detail: `${t.insightMaxImbalance} ${fmtNum(stats.maxImbalancePct, 1)}% — ${t.insightPhaseImbalanceAction}`,
    });
  }

  const latest = points[points.length - 1];
  const lastPhases = [latest.beforeL1, latest.beforeL2, latest.beforeL3];
  const active = lastPhases.filter((v) => v != null && v > 0.5);
  if (active.length === 1) {
    const idx = lastPhases.findIndex((v) => v != null && v > 0.5);
    const phase = idx === 0 ? 'L1' : idx === 1 ? 'L2' : 'L3';
    insights.push({
      severity: 'critical',
      title: t.insightSinglePhase,
      detail: `${t.insightSinglePhaseDetail} (${phase}) — ${opts.ch1Label}`,
    });
  }

  if (!opts.ch1Only && stats.avgCh2 != null && stats.avgCh1 != null && stats.avgCh2 > 0.1) {
    const ratio = stats.avgCh1 / stats.avgCh2;
    insights.push({
      severity: 'info',
      title: t.insightChCompare,
      detail: `${opts.ch1Label} / ${opts.ch2Label} ≈ ${fmtNum(ratio, 2)}× (${fmtA(stats.avgCh1)} / ${fmtA(stats.avgCh2)} A)`,
    });
  }

  const zeroRuns = points.filter(
    (p) =>
      (p.beforeL2 == null || p.beforeL2 < 0.5) &&
      (p.beforeL3 == null || p.beforeL3 < 0.5) &&
      p.beforeL1 != null &&
      p.beforeL1 > 1,
  ).length;
  if (zeroRuns > points.length * 0.7 && points.length >= 3) {
    insights.push({
      severity: 'warning',
      title: t.insightL23Idle,
      detail: t.insightL23IdleDetail,
    });
  }

  if (insights.length === 1) {
    insights.push({
      severity: 'info',
      title: t.insightStable,
      detail: t.insightStableDetail,
    });
  }

  return { insights, stats };
}

/** Latest row with phase current data (for executive phase table fallback). */
export function getLatestChartPhases(points: DbChartPoint[]): DbChartPoint | null {
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    const hasBefore = [p.beforeL1, p.beforeL2, p.beforeL3].some(
      (v) => v != null && Number.isFinite(v),
    );
    const hasAfter = [p.afterL1, p.afterL2, p.afterL3].some(
      (v) => v != null && Number.isFinite(v),
    );
    if (hasBefore || hasAfter) return p;
  }
  return null;
}
