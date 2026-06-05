import { fmtA, fmtNum } from './energy-quality-i18n';
import type { DbChartPoint } from './energy-quality-current-analysis';
import type { ReportStrings } from './energy-quality-report-i18n';

export type PhaseTableRow = {
  phase: string;
  ch1: string;
  ch2: string;
  analysis: string;
};

function fillTpl(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), template);
}

function avg(vals: (number | null | undefined)[]): number | null {
  const n = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (!n.length) return null;
  return n.reduce((a, b) => a + b, 0) / n.length;
}

function imbalancePct(vals: (number | null | undefined)[]): number | null {
  const n = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (n.length < 2) return null;
  const mean = n.reduce((a, b) => a + b, 0) / n.length;
  if (mean === 0) return null;
  return ((Math.max(...n) - Math.min(...n)) / mean) * 100;
}

function avgPhaseFromHistory(
  points: DbChartPoint[],
  key: 'beforeL1' | 'beforeL2' | 'beforeL3',
): number | null {
  return avg(points.map((p) => p[key]));
}

function display(value: number | null, unit = 'A'): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return unit === 'A' ? fmtA(value) : `${fmtNum(value, 2)} ${unit}`;
}

function phaseRank(
  value: number | null,
  phases: Array<{ label: string; value: number | null }>,
): 'max' | 'min' | 'mid' | null {
  const valid = phases.filter((p) => p.value != null) as Array<{ label: string; value: number }>;
  if (valid.length < 2 || value == null) return null;
  const max = Math.max(...valid.map((p) => p.value));
  const min = Math.min(...valid.map((p) => p.value));
  if (max === min) return 'mid';
  if (value === max) return 'max';
  if (value === min) return 'min';
  return 'mid';
}

function analyzePhaseRow(
  phaseLabel: string,
  value: number | null,
  avgN: number | null,
  rank: 'max' | 'min' | 'mid' | null,
  t: ReportStrings,
): string {
  if (value == null) return t.phaseAnalysisNoData;
  const valStr = display(value);
  if (avgN == null || avgN <= 0) {
    return fillTpl(t.phaseAnalysisValueOnly, { phase: phaseLabel, value: valStr });
  }

  const deltaPct = ((value - avgN) / avgN) * 100;
  const deltaStr = fmtNum(Math.abs(deltaPct), 1);
  const avgStr = display(avgN);
  let base: string;
  if (Math.abs(deltaPct) < 1) {
    base = fillTpl(t.phaseAnalysisNearAvg, { phase: phaseLabel, value: valStr, avgN: avgStr });
  } else if (deltaPct > 0) {
    base = fillTpl(t.phaseAnalysisAboveAvg, {
      phase: phaseLabel,
      value: valStr,
      avgN: avgStr,
      delta: deltaStr,
    });
  } else {
    base = fillTpl(t.phaseAnalysisBelowAvg, {
      phase: phaseLabel,
      value: valStr,
      avgN: avgStr,
      delta: deltaStr,
    });
  }

  if (rank === 'max') return `${base} ${t.phaseAnalysisHeaviest}`;
  if (rank === 'min') return `${base} ${t.phaseAnalysisLightest}`;
  return base;
}

function analyzeOverallN(
  avgN: number | null,
  phases: Array<{ label: string; value: number | null }>,
  imbalancePct: number | null,
  t: ReportStrings,
): string {
  if (avgN == null) return t.phaseAnalysisNoData;
  const valid = phases.filter((p) => p.value != null) as Array<{ label: string; value: number }>;
  if (!valid.length) {
    return fillTpl(t.phaseAnalysisOverallN, {
      value: display(avgN),
      imb: '—',
      maxPhase: '—',
      maxVal: '—',
      minPhase: '—',
      minVal: '—',
    });
  }

  const maxEntry = valid.reduce((a, b) => (b.value > a.value ? b : a));
  const minEntry = valid.reduce((a, b) => (b.value < a.value ? b : a));
  return fillTpl(t.phaseAnalysisOverallN, {
    value: display(avgN),
    imb: imbalancePct != null ? fmtNum(imbalancePct, 1) : '—',
    maxPhase: maxEntry.label,
    maxVal: display(maxEntry.value),
    minPhase: minEntry.label,
    minVal: display(minEntry.value),
  });
}

export function buildCh1PhaseTable(input: {
  t: ReportStrings;
  histPoints: DbChartPoint[];
  snapshot: {
    l1: number | null;
    l2: number | null;
    l3: number | null;
    j1: number | null;
    j2: number | null;
    j3: number | null;
  };
  ch1Only: boolean;
}): PhaseTableRow[] {
  const { t, histPoints, snapshot, ch1Only } = input;
  const l1 = avgPhaseFromHistory(histPoints, 'beforeL1') ?? snapshot.l1;
  const l2 = avgPhaseFromHistory(histPoints, 'beforeL2') ?? snapshot.l2;
  const l3 = avgPhaseFromHistory(histPoints, 'beforeL3') ?? snapshot.l3;
  const avgN = avg([l1, l2, l3]);
  const phaseImbalance = imbalancePct([l1, l2, l3]);

  const phaseDefs = [
    { label: t.phaseL1, value: l1, ch2: snapshot.j1 },
    { label: t.phaseL2, value: l2, ch2: snapshot.j2 },
    { label: t.phaseL3, value: l3, ch2: snapshot.j3 },
  ];

  const rows: PhaseTableRow[] = phaseDefs.map((p) => ({
    phase: p.label,
    ch1: display(p.value),
    ch2: ch1Only ? '—' : display(p.ch2),
    analysis: analyzePhaseRow(p.label, p.value, avgN, phaseRank(p.value, phaseDefs), t),
  }));

  rows.push({
    phase: t.phaseAvgN,
    ch1: display(avgN),
    ch2: ch1Only ? '—' : display(avg([snapshot.j1, snapshot.j2, snapshot.j3])),
    analysis: analyzeOverallN(
      avgN,
      phaseDefs.map((p) => ({ label: p.label, value: p.value })),
      phaseImbalance,
      t,
    ),
  });

  return rows;
}
