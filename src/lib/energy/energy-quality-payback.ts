import { fmtNum } from './energy-quality-i18n';
import type { ReportStrings } from './energy-quality-report-i18n';

/** Payback ≤ this many months is rated excellent (เยี่ยม / 우수). */
export const PAYBACK_EXCELLENT_MAX_MONTHS = 18;

export function computePaybackMonths(
  investment: number,
  monthlySaving: number,
): number | null {
  if (!Number.isFinite(investment) || !Number.isFinite(monthlySaving) || monthlySaving <= 0) {
    return null;
  }
  return investment / monthlySaving;
}

export type PaybackRating = {
  label: string;
  severity: 'info' | 'warning' | 'critical';
  riskLevel: 'good' | 'warning' | 'critical';
};

export function paybackRatingForMonths(months: number, t: ReportStrings): PaybackRating {
  if (months <= PAYBACK_EXCELLENT_MAX_MONTHS) {
    return { label: t.paybackRatingExcellent, severity: 'info', riskLevel: 'good' };
  }
  if (months <= 36) {
    return { label: t.paybackRatingAcceptable, severity: 'info', riskLevel: 'good' };
  }
  if (months <= 60) {
    return { label: t.paybackRatingCaution, severity: 'warning', riskLevel: 'warning' };
  }
  return { label: t.paybackRatingPoor, severity: 'critical', riskLevel: 'critical' };
}

export function formatPaybackPeriod(
  monthlySaving: number,
  investment: number,
  t: ReportStrings,
): string {
  const months = computePaybackMonths(investment, monthlySaving);
  if (months == null) return '—';
  const years = months / 12;
  const rating = paybackRatingForMonths(months, t);
  return `${fmtNum(months, 1)} ${t.paybackMonthsUnit} (${fmtNum(years, 1)} ${t.paybackYearsUnit}) · ${rating.label}`;
}

export function riskLevelFromPaybackValue(
  value: string,
  t: ReportStrings,
): 'good' | 'warning' | 'critical' | null {
  const v = value.trim();
  if (!v.includes('·')) return null;
  if (v.includes(t.paybackRatingPoor)) return 'critical';
  if (v.includes(t.paybackRatingCaution)) return 'warning';
  if (v.includes(t.paybackRatingExcellent) || v.includes(t.paybackRatingAcceptable)) return 'good';
  return null;
}
