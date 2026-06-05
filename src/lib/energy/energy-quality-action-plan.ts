import type { ReportAction } from './energy-quality-report-model';
import type { ReportStrings } from './energy-quality-report-i18n';

export function buildActionPlan(input: {
  t: ReportStrings;
  pf: number | null;
  curImb: number | null;
  thd: number | null;
  peakRatio: number | null;
  peakVal: number | null;
  avgI: number | null;
}): ReportAction[] {
  const { t, pf, curImb, thd, peakRatio, peakVal, avgI } = input;

  const immediate: string[] = [t.actVerifyPhase];
  const shortTerm: string[] = [];
  const mediumTerm: string[] = [];
  const longTerm: string[] = [t.actIotMonitor, t.actAnnualAudit];

  const hasPeakIssue =
    (peakRatio != null && peakRatio > 1.3) ||
    (peakVal != null && avgI != null && avgI > 0 && peakVal / avgI > 1.3);

  if (hasPeakIssue) immediate.push(t.actReviewPeak);
  if (pf != null && pf < 0.95) shortTerm.push(t.actInstallApfc);
  if (curImb != null && curImb > 15) shortTerm.push(t.actRebalance);
  if (thd != null && thd > 8) mediumTerm.push(t.actHarmonic);
  if (hasPeakIssue) mediumTerm.push(t.actDemand);

  return [
    { horizon: t.immediate, items: immediate },
    { horizon: t.shortTerm, items: shortTerm },
    { horizon: t.mediumTerm, items: mediumTerm },
    { horizon: t.longTerm, items: longTerm },
  ];
}

/** Short x-axis label, e.g. "0–30 วัน" from "ทันที (0–30 วัน)". */
export function actionHorizonChartLabel(horizon: string): string {
  const m = horizon.match(/\(([^)]+)\)/);
  return m?.[1]?.trim() ?? horizon;
}

export function countActionItems(items: string[]): number {
  return items.filter((item) => {
    const s = item.trim();
    return s.length > 0 && s !== '—' && s !== '-';
  }).length;
}

export type ActionPlanChartPoint = {
  label: string;
  value: number;
  fullLabel?: string;
  /** Tasks in this horizon (tooltip detail). */
  taskCount?: number;
};

type HorizonKind = 'immediate' | 'short' | 'medium' | 'long';

/** Share of total monthly savings attributable to each horizon (GE action plan). */
const OUTCOME_SHARE: Record<HorizonKind, number> = {
  immediate: 0.15,
  short: 0.45,
  medium: 0.28,
  long: 0.12,
};

function resolveHorizonKind(horizon: string, t: ReportStrings): HorizonKind {
  if (horizon === t.immediate) return 'immediate';
  if (horizon === t.shortTerm) return 'short';
  if (horizon === t.mediumTerm) return 'medium';
  return 'long';
}

/** Bar chart: task counts per horizon (legacy). */
export function actionPlanChartData(plan: ReportAction[]): ActionPlanChartPoint[] {
  return plan.map((block) => ({
    label: actionHorizonChartLabel(block.horizon),
    fullLabel: block.horizon,
    value: countActionItems(block.items),
    taskCount: countActionItems(block.items),
  }));
}

/**
 * Bar chart Y-axis: estimated monthly savings (outcome forecast) per plan horizon.
 * Falls back to task count when savings are unknown.
 */
export function actionPlanOutcomeChartData(input: {
  plan: ReportAction[];
  monthlySaving: number | null;
  t: ReportStrings;
}): ActionPlanChartPoint[] {
  const { plan, monthlySaving, t } = input;
  const hasSaving = monthlySaving != null && monthlySaving > 0;

  return plan.map((block) => {
    const taskCount = countActionItems(block.items);
    const kind = resolveHorizonKind(block.horizon, t);
    const share = OUTCOME_SHARE[kind];
    const activeFactor = taskCount > 0 ? 1 : 0.12;
    const value = hasSaving
      ? Math.round(monthlySaving! * share * activeFactor)
      : taskCount;

    return {
      label: actionHorizonChartLabel(block.horizon),
      fullLabel: block.horizon,
      value,
      taskCount,
    };
  });
}
