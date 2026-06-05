import { fmtA, fmtNum, type EqLocale } from './energy-quality-i18n';
import { fmtReportMoney } from './energy-quality-currency';
import type { TechnicalInsight } from './energy-quality-current-analysis';
import type { ReportStrings } from './energy-quality-report-i18n';

export type GeSolutionMetrics = {
  locale: EqLocale;
  pf: number | null;
  thd: number | null;
  curImb: number | null;
  voltImb: number | null;
  peakA: number | null;
  avgA: number | null;
  monthlySaving: number | null;
};

function fillTpl(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), template);
}

function fmtPf(pf: number | null): string {
  return pf != null ? fmtNum(pf, 3) : '—';
}

function fmtPct(v: number | null): string {
  return v != null ? `${fmtNum(v, 1)}%` : '—';
}

function fmtPeak(a: number | null): string {
  return a != null ? fmtA(a) : '—';
}

export function needsGeSolutionComparison(m: GeSolutionMetrics): boolean {
  return (
    (m.pf != null && m.pf < 0.95) ||
    (m.thd != null && m.thd > 8) ||
    (m.curImb != null && m.curImb > 15) ||
    (m.voltImb != null && m.voltImb > 5) ||
    (m.peakA != null && m.avgA != null && m.peakA > m.avgA * 1.3)
  );
}

export function geCompareInsightExecutive(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight {
  return {
    severity: needsGeSolutionComparison(m) ? 'warning' : 'info',
    title: t.geCompareExecutiveTitle,
    detail: fillTpl(t.geCompareExecutiveDetail, {
      pf: fmtPf(m.pf),
      imb: fmtPct(m.curImb),
      peak: fmtPeak(m.peakA),
      thd: fmtPct(m.thd),
      capabilities: t.geSolutionCapabilities,
    }),
  };
}

export function geCompareInsightPf(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight | null {
  if (m.pf == null || m.pf >= 0.95) return null;
  return {
    severity: m.pf < 0.85 ? 'critical' : 'warning',
    title: t.geComparePfTitle,
    detail: fillTpl(t.geComparePfDetail, { pf: fmtPf(m.pf), capabilities: t.geSolutionCapabilities }),
  };
}

export function geCompareInsightPeak(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight | null {
  if (m.peakA == null || m.avgA == null || m.peakA <= m.avgA * 1.3) return null;
  return {
    severity: 'warning',
    title: t.geComparePeakTitle,
    detail: fillTpl(t.geComparePeakDetail, { peak: fmtPeak(m.peakA), avg: fmtA(m.avgA) }),
  };
}

export function geCompareInsightBalance(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight | null {
  if (m.curImb == null || m.curImb <= 15) return null;
  return {
    severity: m.curImb > 30 ? 'critical' : 'warning',
    title: t.geCompareBalanceTitle,
    detail: fillTpl(t.geCompareBalanceDetail, { imb: fmtPct(m.curImb) }),
  };
}

export function geCompareInsightHarmonic(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight | null {
  if (m.thd == null || m.thd <= 8) return null;
  return {
    severity: m.thd > 15 ? 'critical' : 'warning',
    title: t.geCompareHarmonicTitle,
    detail: fillTpl(t.geCompareHarmonicDetail, { thd: fmtPct(m.thd) }),
  };
}

export function geCompareInsightVoltage(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight | null {
  if (m.voltImb == null || m.voltImb <= 5) return null;
  return {
    severity: m.voltImb > 15 ? 'warning' : 'info',
    title: t.geCompareVoltageTitle,
    detail: fillTpl(t.geCompareVoltageDetail, { volt: fmtPct(m.voltImb) }),
  };
}

export function geCompareInsightEnergy(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight | null {
  if (m.avgA == null) return null;
  return {
    severity: 'info',
    title: t.geCompareEnergyTitle,
    detail: fillTpl(t.geCompareEnergyDetail, { avg: fmtA(m.avgA) }),
  };
}

export function geCompareInsightFinancial(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight | null {
  if (m.monthlySaving == null || m.monthlySaving <= 0) return null;
  return {
    severity: 'info',
    title: t.geCompareFinancialTitle,
    detail: fillTpl(t.geCompareFinancialDetail, {
      saving: fmtReportMoney(m.locale, m.monthlySaving),
      capabilities: t.geSolutionCapabilities,
    }),
  };
}

export function geCompareInsightEquipment(m: GeSolutionMetrics, t: ReportStrings, status: string): TechnicalInsight | null {
  if (!needsGeSolutionComparison(m)) return null;
  return {
    severity: 'warning',
    title: t.geCompareEquipmentTitle,
    detail: fillTpl(t.geCompareEquipmentDetail, { status }),
  };
}

export function geCompareInsightRoi(m: GeSolutionMetrics, t: ReportStrings): TechnicalInsight {
  return {
    severity: 'info',
    title: t.geCompareRoiTitle,
    detail: fillTpl(t.geCompareRoiDetail, {
      solution: t.solutionApfc,
      capabilities: t.geSolutionCapabilities,
    }),
  };
}

export function geCompareInsightConclusion(
  m: GeSolutionMetrics,
  t: ReportStrings,
  problem: string,
  solution: string,
  saving: string,
): TechnicalInsight {
  return {
    severity: needsGeSolutionComparison(m) ? 'warning' : 'info',
    title: t.geCompareConclusionTitle,
    detail: fillTpl(t.geCompareConclusionDetail, {
      problem,
      solution,
      saving,
      capabilities: t.geSolutionCapabilities,
    }),
  };
}

export function geSolutionRecommendation(t: ReportStrings): { title: string; description: string } {
  return { title: t.recApfcTitle, description: t.recApfcDesc };
}
