import type { ReportChannel, EnergyQualityReport, ReportField } from './energy-quality-report-model';
import { fmtA, fmtNum, type EqLocale } from './energy-quality-i18n';
import { reportT, type ReportStrings } from './energy-quality-report-i18n';
import {
  buildReportSectionPacks,
  type SectionAnalysisPack,
} from './energy-quality-section-analysis';
import { chartDataCh1Only } from './energy-quality-current-analysis';
import type {
  CurrentHistoryStats,
  DbChartPoint,
  TechnicalInsight,
} from './energy-quality-current-analysis';
import {
  getReportStandards,
  type ReportSectionRefKey,
  type ReportStandardsPack,
} from './energy-quality-report-standards';
import { buildEnergyQualityPrintCss } from './energy-quality-report-print.css';
import type { ProfessionalReportContent } from './energy-quality-professional-analysis';
import {
  buildCh1Ch2PhaseLines,
  buildCh1PhaseLines,
} from './eq-chart-palette';
import { svgBarChart, svgHistoryChart, svgMultiLineChart } from './energy-quality-print-charts';

export type PrintSnapshotLabels = {
  lastUpdate: string;
  l1: string;
  l2: string;
  l3: string;
  avg: string;
  thd: string;
  powerFactor: string;
  frequency: string;
};

export type PrintReportInput = {
  report: EnergyQualityReport;
  locale: EqLocale;
  ch1Label: string;
  ch2Label: string;
  ch1: ReportChannel;
  ch2: ReportChannel;
  chartData: DbChartPoint[];
  historyPeriod: string;
  historyPoints: number;
  measurementStart?: string;
  measurementEnd?: string;
  deviceName?: string;
  meterId?: string;
  chartStats: CurrentHistoryStats | null;
  technicalInsights: TechnicalInsight[];
  snapshotLabels?: PrintSnapshotLabels;
  /** Pre-install: CH1 only — omit CH2 from charts and tables. */
  ch1Only?: boolean;
  /** Absolute or root-relative logo URL for print header/footer */
  logoUrl?: string;
};

/** Company logo used on energy quality print reports (same as energy dashboard sidebar). */
export const ENERGY_QUALITY_PRINT_LOGO_PATH = '/momoge/Logo-brand.png';

function printLogoUrl(input: PrintReportInput): string {
  return input.logoUrl ?? ENERGY_QUALITY_PRINT_LOGO_PATH;
}

function printLogoBlock(logoUrl: string, companyName: string, compact = false): string {
  const cls = compact ? 'print-logo print-logo--sm' : 'print-logo';
  return `<img class="${cls}" src="${esc(logoUrl)}" alt="${esc(companyName)}" />`;
}

type RiskLevel = 'good' | 'warning' | 'critical';

function riskLevelForPf(pf: number | null): RiskLevel {
  if (pf == null || !Number.isFinite(pf)) return 'good';
  if (pf < 0.85) return 'critical';
  if (pf < 0.95) return 'warning';
  return 'good';
}

function riskLevelForThd(thd: number | null): RiskLevel {
  if (thd == null || !Number.isFinite(thd)) return 'good';
  if (thd > 15) return 'critical';
  if (thd > 8) return 'warning';
  return 'good';
}

function riskLevelForImbalance(imb: number | null): RiskLevel {
  if (imb == null || !Number.isFinite(imb)) return 'good';
  if (imb > 30) return 'critical';
  if (imb > 15) return 'warning';
  return 'good';
}

function riskLabel(level: RiskLevel, rt: ReportStrings): string {
  if (level === 'critical') return rt.statusCritical;
  if (level === 'warning') return rt.statusWarning;
  return rt.statusGood;
}

function displaySnapshotVal(v: number | null | undefined, unit: 'A' | 'Hz' | '%' | ''): string {
  if (v == null || !Number.isFinite(v)) return '—';
  if (unit === 'A') return fmtA(v);
  if (unit === 'Hz') return fmtNum(v, 2);
  if (unit === '%') return fmtNum(v, 1);
  return fmtNum(v, 3);
}

function avgCurrent(phases: (number | null)[]): number | null {
  const n = phases.filter((v): v is number => v != null && Number.isFinite(v));
  if (!n.length) return null;
  return n.reduce((a, b) => a + b, 0) / n.length;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fieldsGridHtml(fields: ReportField[]): string {
  const cols = fields.length > 6 ? 'grid grid-3' : 'grid';
  return `<div class="${cols}">${fields
    .map(
      (f) =>
        `<div class="cell"><label>${esc(f.label)}</label><strong>${esc(f.value)}</strong></div>`,
    )
    .join('')}</div>`;
}

function samplePoints<T>(items: T[], max = 20): T[] {
  if (items.length <= max) return items;
  const step = Math.ceil(items.length / max);
  const out: T[] = [];
  for (let i = 0; i < items.length; i += step) out.push(items[i]);
  if (out[out.length - 1] !== items[items.length - 1]) out.push(items[items.length - 1]);
  return out;
}

function fmtAmp(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toLocaleString('en-US', { maximumFractionDigits: 2 })} A`;
}

function lineHistoryTableHtml(
  data: DbChartPoint[],
  caption: string,
  ch1Label: string,
  ch2Label: string,
  timeCol: string,
): string {
  if (!data.length) return '';
  const rows = samplePoints(data, 20)
    .map((row) => {
      const time = String(row.time ?? '—');
      return `<tr><td>${esc(time)}</td><td>${esc(fmtAmp(row.beforeAvg))}</td><td>${esc(fmtAmp(row.afterAvg))}</td></tr>`;
    })
    .join('');
  return `<h3>${esc(caption)}</h3><table class="chart-data"><thead><tr><th>${esc(timeCol)}</th><th>${esc(ch1Label)}</th><th>${esc(ch2Label)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function chartPrintHtml(
  pack: SectionAnalysisPack,
  caption: string,
  lineOpts?: { ch1Label: string; ch2Label: string; timeCol: string },
): string {
  if (!pack.chartData.length || pack.chartKind === 'none') return '';

  const title = `<h3 class="print-chart-title">${esc(caption)}</h3>`;

  if (pack.chartKind === 'bar') {
    const key = pack.chartLines?.[0]?.dataKey ?? 'value';
    const bars = pack.chartData
      .map((row) => ({
        label: String(row.fullLabel ?? row.label ?? row.time ?? '—'),
        value: Number(row[key] ?? row.value ?? 0),
      }))
      .filter((b) => Number.isFinite(b.value));
    if (!bars.length) return '';
    return `${title}${svgBarChart({
      data: bars,
      color: pack.chartLines?.[0]?.stroke ?? '#047857',
      unit: pack.chartUnit ?? '',
    })}`;
  }

  const isHistory =
    pack.chartData.some((row) => row.beforeAvg != null || row.afterAvg != null || row.time != null) &&
    pack.chartLines?.length;

  if (pack.chartKind === 'line' && isHistory && pack.chartLines) {
    if (lineOpts && pack.chartData.some((row) => row.beforeAvg != null || row.afterAvg != null)) {
      const lines = pack.chartLines.filter(
        (l) => l.dataKey === 'beforeAvg' || l.dataKey === 'afterAvg',
      );
      if (lines.length) {
        return `${title}${svgHistoryChart({
          data: pack.chartData as DbChartPoint[],
          lines,
        })}`;
      }
    }
    return `${title}${svgMultiLineChart({
      data: pack.chartData,
      lines: pack.chartLines,
      xKey: pack.chartData[0]?.time != null ? 'time' : 'label',
      unit: pack.chartUnit ?? ' A',
    })}`;
  }

  if (pack.chartKind === 'line' && pack.chartLines?.length) {
    return `${title}${svgMultiLineChart({
      data: pack.chartData,
      lines: pack.chartLines,
      xKey: 'label',
      unit: pack.chartUnit ?? '',
    })}`;
  }

  return chartTableHtml(pack, caption, '', '');
}

function chartTableHtml(
  pack: SectionAnalysisPack,
  caption: string,
  colItem: string,
  colValue: string,
  lineOpts?: { ch1Label: string; ch2Label: string; timeCol: string },
): string {
  if (!pack.chartData.length) return '';
  const hasDualChannelHistory =
    lineOpts &&
    pack.chartData.some((row) => row.beforeAvg != null || row.afterAvg != null);
  if (hasDualChannelHistory && lineOpts) {
    return lineHistoryTableHtml(
      pack.chartData as DbChartPoint[],
      caption,
      lineOpts.ch1Label,
      lineOpts.ch2Label,
      lineOpts.timeCol,
    );
  }
  const unit = pack.chartUnit ?? '';
  const key = pack.chartLines?.[0]?.dataKey ?? 'value';
  const rows = pack.chartData
    .slice(0, 20)
    .map((row) => {
      const label = String(row.fullLabel ?? row.label ?? row.time ?? '—');
      const val = row[key] ?? row.beforeAvg ?? row.afterAvg;
      const display =
        val != null && Number.isFinite(Number(val))
          ? `${Number(val).toLocaleString('en-US', { maximumFractionDigits: 2 })}${unit || (key === 'beforeAvg' || key === 'afterAvg' ? ' A' : '')}`
          : '—';
      return `<tr><td>${esc(label)}</td><td>${esc(display)}</td></tr>`;
    })
    .join('');
  return `<h3>${esc(caption)}</h3><table class="chart-data"><thead><tr><th>${esc(colItem)}</th><th>${esc(colValue)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function fieldsOnlySection(
  index: number,
  title: string,
  fields: ReportField[],
  rt: ReportStrings,
  extra = '',
): string {
  return `<section class="print-sec">
    <h2><span class="num">${index}</span> ${esc(title)}</h2>
    ${fieldsGridHtml(fields)}
    ${extra}
    <p class="note">${esc(rt.printMethodology)}</p>
  </section>`;
}

function recsHtml(pack: SectionAnalysisPack, rt: ReportStrings): string {
  return `<h3>${esc(rt.secRecommendTitle)}</h3><ol class="recs">${pack.recommendations
    .map(
      (r) => `<li><strong>${esc(r.title)}</strong>${esc(r.description)}</li>`,
    )
    .join('')}</ol>`;
}

function sectionRefHtml(standards: ReportStandardsPack, key?: ReportSectionRefKey): string {
  const note = key ? standards.sectionNotes[key] : undefined;
  if (!note) return '';
  return `<p class="sec-ref"><strong>${esc(standards.titles.sectionRef)}:</strong> ${esc(note)}</p>`;
}

function standardsBlockHtml(standards: ReportStandardsPack): string {
  const agencies = standards.agencies
    .map((a) => `<li><strong>${esc(a.name)}</strong> — ${esc(a.role)}</li>`)
    .join('');
  const research = standards.research
    .map((r) => `<li><strong>${esc(r.citation)}</strong><br/><span>${esc(r.application)}</span></li>`)
    .join('');
  const criteria = standards.criteria
    .map(
      (c) =>
        `<tr><td>${esc(c.metric)}</td><td>${esc(c.threshold)}</td><td>${esc(c.standard)}</td></tr>`,
    )
    .join('');
  return `<section class="standards-block">
    <h2>${esc(standards.titles.block)} <span class="country-tag">${esc(standards.countryName)}</span></h2>
    <p class="note standards-intro">${esc(standards.introduction)}</p>
    <h3>${esc(standards.titles.agencies)}</h3>
    <ul class="std-list">${agencies}</ul>
    <h3>${esc(standards.titles.research)}</h3>
    <ul class="std-research">${research}</ul>
    <h3>${esc(standards.titles.criteria)}</h3>
    <table class="criteria-table">
      <thead><tr><th>${esc(standards.titles.criteriaMetric)}</th><th>${esc(standards.titles.criteriaThreshold)}</th><th>${esc(standards.titles.criteriaReference)}</th></tr></thead>
      <tbody>${criteria}</tbody>
    </table>
  </section>`;
}

function liveSnapshotInner(ch1: ReportChannel, labels: PrintSnapshotLabels, lastUpdate: string): string {
  const avg = avgCurrent(ch1.current);
  const cells = [
    [labels.l1, displaySnapshotVal(ch1.current[0], 'A'), 'A'],
    [labels.l2, displaySnapshotVal(ch1.current[1], 'A'), 'A'],
    [labels.l3, displaySnapshotVal(ch1.current[2], 'A'), 'A'],
    [labels.avg, displaySnapshotVal(avg, 'A'), 'A'],
    [labels.thd, displaySnapshotVal(ch1.thd, '%'), '%'],
    [labels.powerFactor, displaySnapshotVal(ch1.powerFactor ?? null, ''), ''],
    [labels.frequency, displaySnapshotVal(ch1.frequency, 'Hz'), 'Hz'],
  ]
    .map(
      ([lbl, val, unit]) =>
        `<div class="snap-cell"><label>${esc(String(lbl))}</label><strong>${esc(String(val))}</strong>${unit ? `<span class="unit">${esc(String(unit))}</span>` : ''}</div>`,
    )
    .join('');
  return `<p class="note snap-updated">${esc(labels.lastUpdate)}: <strong>${esc(lastUpdate || '—')}</strong></p><div class="snapshot-grid">${cells}</div>`;
}

function chartStatsHtml(stats: CurrentHistoryStats, rt: ReportStrings): string {
  const items = [
    [rt.chartStatRecords, String(stats.dataPoints)],
    [rt.chartStatPeriod, stats.periodLabel],
    stats.peakCh1 != null
      ? [rt.chartStatPeak, `${fmtA(stats.peakCh1)} A${stats.peakCh1Time ? ` @ ${stats.peakCh1Time}` : ''}`]
      : null,
    stats.peakTimeAnalysis?.peakPeriod
      ? [rt.f_peakPeriod, stats.peakTimeAnalysis.peakPeriod]
      : null,
    stats.peakTimeAnalysis?.dominantWindows
      ? [rt.f_peakWindows, stats.peakTimeAnalysis.dominantWindows]
      : null,
    stats.avgCh1 != null ? [rt.chartStatAvg, `${fmtA(stats.avgCh1)} A`] : null,
    stats.maxImbalancePct != null && stats.maxImbalancePct > 0
      ? [rt.chartStatImbalance, `${fmtNum(stats.maxImbalancePct, 1)}%`]
      : null,
  ]
    .filter((x): x is [string, string] => x != null)
    .map(([lbl, val]) => `<div class="stat-cell"><label>${esc(lbl)}</label><strong>${esc(val)}</strong></div>`)
    .join('');
  return `<div class="chart-stats-row">${items}</div>`;
}

function professionalExecutiveHtml(pro: ProfessionalReportContent | null, rt: ReportStrings): string {
  if (!pro) return '';
  const rows = pro.keyFindings
    .map(
      (r) =>
        `<tr><td>${esc(r.parameter)}</td><td><strong>${esc(r.measured)}</strong></td><td>${esc(r.standard)}</td><td>${esc(r.assessmentLabel)}</td></tr>`,
    )
    .join('');
  const narrative = pro.executiveNarrative.map((p) => `<p class="note">${esc(p)}</p>`).join('');
  return `
    <p class="note pro-subtitle">${esc(pro.reportSubtitle)}</p>
    <h3>${esc(rt.proKeyFindingsTableTitle)}</h3>
    <p class="note">${esc(pro.keyFindingsIntro)}</p>
    <table class="data-table">
      <thead><tr>
        <th>${esc(rt.proTableParameter)}</th>
        <th>${esc(rt.proTableMeasured)}</th>
        <th>${esc(rt.proTableStandard)}</th>
        <th>${esc(rt.proTableAssessment)}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="note"><strong>${esc(rt.statusOverall)}:</strong> ${esc(pro.overallTechnicalRisk)}</p>
    ${narrative}`;
}

function professionalRecsHtml(pro: ProfessionalReportContent | null, rt: ReportStrings): string {
  if (!pro) return '';
  const interpret = pro.interpretationBullets
    .map((b) => `<li>${esc(b)}</li>`)
    .join('');
  const phases = pro.phasedRecommendations
    .map(
      (p) =>
        `<div class="phase-card"><h4>${esc(p.phase)} — ${esc(p.title)}</h4><p class="note">${esc(p.priority)}</p><ul>${p.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul><p><strong>${esc(rt.proExpectedOutcome)}:</strong> ${esc(p.expectedOutcome)}</p></div>`,
    )
    .join('');
  return `
    <h3>${esc(pro.interpretationTitle)}</h3>
    <ul class="bullets">${interpret}</ul>
    <h3>${esc(pro.phasedTitle)}</h3>
    ${pro.recommendedModel ? `<p class="note">${esc(rt.proRecommendedModel)}: <strong>${esc(pro.recommendedModel)}</strong></p>` : ''}
    ${phases}`;
}

function technicalInsightsHtml(
  title: string,
  insights: TechnicalInsight[],
  rt: ReportStrings,
  stats: CurrentHistoryStats | null,
): string {
  if (!insights.length && !stats) return '';
  const statsBlock = stats ? chartStatsHtml(stats, rt) : '';
  const list = insights.length
    ? `<ul class="insights">${insights
        .map((ins) => {
          const cls = ins.severity === 'critical' ? 'crit' : ins.severity === 'warning' ? 'warn' : '';
          return `<li class="${cls}"><strong>${esc(ins.title)}</strong><p>${esc(ins.detail)}</p></li>`;
        })
        .join('')}</ul>`
    : '';
  return `<section class="technical-block">
    <h2>${esc(title)}</h2>
    <p class="note">${esc(rt.secChartsSource)}</p>
    ${statsBlock}
    ${list}
  </section>`;
}

function statusBadge(level: RiskLevel, label: string): string {
  return `<span class="risk-badge risk-badge--${level}">${esc(label)}</span>`;
}

function richSection(
  index: number,
  title: string,
  pack: SectionAnalysisPack,
  rt: ReportStrings,
  standards: ReportStandardsPack,
  extra = '',
  lineOpts?: { ch1Label: string; ch2Label: string },
  sectionRefKey?: ReportSectionRefKey,
): string {
  const analysisTitle = rt.secAnalysisTitle;
  const chartBlock = chartPrintHtml(
    pack,
    pack.chartCaption,
    pack.chartKind === 'line' && lineOpts
      ? { ...lineOpts, timeCol: rt.printColTime }
      : undefined,
  );
  return `<section class="print-sec">
    <h2><span class="num">${index}</span> ${esc(title)}</h2>
    ${fieldsGridHtml(pack.fields)}
    ${extra}
    ${chartBlock}
    <h3>${esc(analysisTitle)}</h3>
    <ul class="insights">${pack.insights
      .map((ins) => {
        const cls = ins.severity === 'critical' ? 'crit' : ins.severity === 'warning' ? 'warn' : '';
        return `<li class="${cls}"><strong>${esc(ins.title)}</strong><p>${esc(ins.detail)}</p></li>`;
      })
      .join('')}</ul>
    ${recsHtml(pack, rt)}
    ${sectionRefHtml(standards, sectionRefKey)}
  </section>`;
}

export function buildReportPrintHtml(input: PrintReportInput): string {
  const rt = reportT(input.locale);
  const standards = getReportStandards(input.locale);
  const { report } = input;
  const ch1Only = input.ch1Only ?? true;
  const chartData = ch1Only ? chartDataCh1Only(input.chartData) : input.chartData;
  const packs = buildReportSectionPacks({
    report,
    chartData,
    ch1: input.ch1,
    ch2: ch1Only ? input.ch1 : input.ch2,
    periodLabel: input.historyPeriod,
    locale: input.locale,
    chartUi: { l1: 'L1', l2: 'L2', l3: 'L3' },
    ch1Only,
  });

  const phaseRows = report.phaseTable
    .map(
      (r) =>
        `<tr class="${r.phase === rt.phaseAvgN ? 'phase-row-avg' : ''}"><td>${esc(r.phase)}</td><td class="phase-val">${esc(r.ch1)}</td>${ch1Only ? '' : `<td class="phase-val">${esc(r.ch2)}</td>`}<td class="phase-analysis">${esc(r.analysis)}</td></tr>`,
    )
    .join('');

  const tocItems = [
    rt.sec1,
    rt.sec2,
    rt.sec3,
    rt.sec4,
    rt.sec5,
    rt.sec6,
    rt.sec7,
    rt.sec8,
    rt.sec9,
    rt.sec10,
    rt.sec11,
    rt.sec12,
    rt.sec13,
    rt.sec14,
  ]
    .map((t, i) => `<li>${i + 1}. ${esc(t)}</li>`)
    .join('');

  const m = report.statusMetrics;
  const pfLevel = riskLevelForPf(m.pf);
  const thdLevel = riskLevelForThd(m.thd);
  const curLevel = riskLevelForImbalance(m.currentImbalance);
  const voltLevel = riskLevelForImbalance(m.voltageImbalance);
  const statusCells = [
    [rt.statusMetricPf, m.pf != null ? fmtNum(m.pf, 3) : '—', pfLevel],
    [rt.statusMetricThd, m.thd != null ? `${fmtNum(m.thd, 1)}%` : '—', thdLevel],
    [
      rt.statusMetricCurImb,
      m.currentImbalance != null ? `${fmtNum(m.currentImbalance, 1)}%` : '—',
      curLevel,
    ],
    [
      rt.statusMetricVoltImb,
      m.voltageImbalance != null ? `${fmtNum(m.voltageImbalance, 1)}%` : '—',
      voltLevel,
    ],
  ]
    .map(
      ([lbl, val, level]) =>
        `<div class="status-cell status-cell--${level}"><label>${esc(String(lbl))}</label><strong>${esc(String(val))}</strong>${statusBadge(level as RiskLevel, riskLabel(level as RiskLevel, rt))}</div>`,
    )
    .join('');

  const execChartLines = ch1Only
    ? buildCh1PhaseLines({ l1: 'L1', l2: 'L2', l3: 'L3' }, input.ch1Label)
    : buildCh1Ch2PhaseLines({ l1: 'L1', l2: 'L2', l3: 'L3' }).map((line) => {
        const isCh2 = line.dataKey.startsWith('after');
        const phase = line.dataKey.replace(/^(before|after)/, '');
        return {
          ...line,
          name: `${isCh2 ? input.ch2Label : input.ch1Label} ${phase}`,
        };
      });

  const aiRecs = report.recommendations
    .map(
      (r) =>
        `<li><span class="pri">${esc(rt.priority)} ${r.priority}</span><strong>${esc(r.title)}</strong><p>${esc(r.description)}</p></li>`,
    )
    .join('');

  const actions = report.actionPlan
    .map(
      (a) =>
        `<div class="act-card"><h4>${esc(a.horizon)}</h4><ul>${a.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`,
    )
    .join('');

  const evidenceSources = [
    `${rt.printSourceMeter}: ${esc(input.meterId ?? report.reportId)}`,
    `${rt.printSourcePeriod}: ${esc(input.measurementStart ?? '—')} – ${esc(input.measurementEnd ?? '—')} (${esc(input.historyPeriod)})`,
    `${rt.printSourceRecords}: ${input.historyPoints} ${rt.insightRecordsUnit}`,
    input.chartStats?.peakCh1 != null
      ? `${rt.printSourcePeak}: ${input.chartStats.peakCh1.toFixed(2)} A @ ${input.chartStats.peakCh1Time ?? '—'}${input.chartStats.peakTimeAnalysis?.peakPeriod ? ` · ${input.chartStats.peakTimeAnalysis.peakPeriod}` : ''}`
      : '',
  ]
    .filter(Boolean)
    .map((line) => `<li>${line}</li>`)
    .join('');

  const execPack: SectionAnalysisPack = {
    fields: report.executiveKpis.length ? report.executiveKpis : report.executive,
    insights: packs.peak.insights.slice(0, 3),
    recommendations: packs.peak.recommendations.slice(0, 2),
    chartKind: chartData.length ? 'line' : 'none',
    chartCaption: rt.execChartTitle,
    chartData,
    chartLines: execChartLines,
  };

  const hasSnapshot =
    input.snapshotLabels != null &&
    (input.ch1.current.some((v) => v != null) ||
      input.ch1.powerFactor != null ||
      input.ch1.thd != null);
  const snapshotBlock = hasSnapshot
    ? `<section class="print-sec print-sec--snapshot"><h2>${esc(standards.titles.liveSnapshot)}</h2>${liveSnapshotInner(input.ch1, input.snapshotLabels!, report.lastUpdate)}</section>`
    : '';

  const technicalBlock = technicalInsightsHtml(
    standards.titles.technical,
    input.technicalInsights,
    rt,
    input.chartStats,
  );

  const sec3ChartStats = input.chartStats ? chartStatsHtml(input.chartStats, rt) : '';
  const sec3ChartSvg = chartData.length ? chartPrintHtml(execPack, rt.execChartTitle) : '';
  const sec3Extra = `
    ${professionalExecutiveHtml(report.professional, rt)}
    <h3>${esc(rt.execSummaryTitle)}</h3>
    <ul class="bullets">${report.executiveBullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    <p class="note">${esc(rt.secChartsSource)}</p>
    ${sec3ChartStats}
    ${sec3ChartSvg}
    <h3>${esc(rt.execPhaseTableTitle)}</h3>
    <table class="data-table data-table--phase">
      <thead><tr><th>${esc(rt.phaseCol)}</th><th>${esc(input.ch1Label)}</th>${ch1Only ? '' : `<th>${esc(input.ch2Label)}</th>`}<th>${esc(rt.phaseAnalysisCol)}</th></tr></thead>
      <tbody>${phaseRows}</tbody>
    </table>`;

  const body = `
<div class="doc">
  <section class="sheet sheet--cover">
    <header class="cover">
      <div class="cover-head">
        <div class="cover-brand">
          ${printLogoBlock(printLogoUrl(input), rt.companyName)}
          <div class="cover-brand-text">
            <h1>${esc(rt.companyName)}</h1>
            <p class="platform">${esc(rt.platformTitle)}</p>
          </div>
        </div>
      </div>
      <dl class="cover-meta">
        <dt>${esc(rt.f_reportId)}</dt><dd>${esc(report.reportId)}</dd>
        <dt>${esc(rt.f_reportDate)}</dt><dd>${esc(report.reportDate)}</dd>
        <dt>${esc(rt.f_customerName)}</dt><dd>${esc(report.customer[0]?.value ?? '—')}</dd>
        <dt>${esc(rt.f_siteName)}</dt><dd>${esc(input.deviceName ?? report.customer[1]?.value ?? '—')}</dd>
        <dt>${esc(rt.f_preparedBy)}</dt><dd>${esc(report.customer.find((f) => f.label === rt.f_preparedBy)?.value ?? rt.preparedByDefault)}</dd>
        <dt>${esc(rt.reportStatus)}</dt><dd>${esc(rt.statusDraft)} · ${esc(report.overallRiskLabel)}</dd>
        <dt>${esc(rt.f_endDate)}</dt><dd>${esc(report.lastUpdate)}</dd>
        <dt>${esc(rt.f_riskLevel)}</dt><dd>${esc(report.overallRiskLabel)}</dd>
        <dt>${esc(rt.f_harmonicRisk)}</dt><dd>${esc(report.harmonicRiskLabel)}</dd>
        <dt>${esc(rt.liveBadge)}</dt><dd>${esc(rt.liveBadge)}</dd>
      </dl>
    </header>

    <section class="evidence">
      <h2>${esc(rt.printEvidenceTitle)}</h2>
      <ul>${evidenceSources}</ul>
      <p class="note">${esc(rt.printMethodology)}</p>
    </section>
  </section>

  ${standardsBlockHtml(standards)}

  <section class="sheet sheet--toc">
    <nav class="toc">
      <h2>${esc(rt.reportTocTitle)}</h2>
      <ol>${tocItems}</ol>
    </nav>
  </section>

  ${snapshotBlock}

  <section class="status-panel">
    <h2>${esc(rt.statusPanelTitle)}</h2>
    <div class="status-overall">
      <span>${esc(rt.statusOverall)}</span>
      ${statusBadge(report.overallRisk === 'critical' ? 'critical' : report.overallRisk === 'warning' ? 'warning' : 'good', report.overallRiskLabel)}
      <span class="status-harmonic">${esc(rt.f_harmonicRisk)}: ${esc(report.harmonicRiskLabel)}</span>
    </div>
    <div class="status-box">${statusCells}</div>
  </section>

  ${technicalBlock}

  <p class="note">${esc(rt.aiNote)}</p>

  ${fieldsOnlySection(1, rt.sec1, report.customer, rt)}
  ${fieldsOnlySection(2, rt.sec2, report.measurement, rt)}
  ${richSection(3, rt.sec3, { ...execPack, chartKind: 'none', chartData: [] }, rt, standards, sec3Extra, ch1Only ? undefined : { ch1Label: input.ch1Label, ch2Label: input.ch2Label })}

  ${richSection(4, rt.sec4, packs.energy, rt, standards, '', undefined, 'sec4')}
  ${richSection(5, rt.sec5, packs.peak, rt, standards, '', ch1Only ? undefined : { ch1Label: input.ch1Label, ch2Label: input.ch2Label }, 'sec5')}
  ${richSection(6, rt.sec6, packs.pf, rt, standards, '', undefined, 'sec6')}
  ${richSection(7, rt.sec7, packs.balance, rt, standards, '', ch1Only ? undefined : { ch1Label: input.ch1Label, ch2Label: input.ch2Label }, 'sec7')}
  ${richSection(8, rt.sec8, packs.harmonic, rt, standards, '', undefined, 'sec8')}
  ${richSection(9, rt.sec9, packs.equipment, rt, standards, '', undefined, 'sec9')}
  ${richSection(10, rt.sec10, packs.financial, rt, standards, '', undefined, 'sec10')}
  ${richSection(11, rt.sec11, packs.roi, rt, standards, '', undefined, 'sec11')}

  <section class="print-sec">
    <h2><span class="num">12</span> ${esc(rt.sec12)}</h2>
    ${professionalRecsHtml(report.professional, rt)}
    ${fieldsGridHtml(packs.ai.fields)}
    <ol class="ai-rec">${aiRecs}</ol>
    ${chartPrintHtml(packs.ai, packs.ai.chartCaption)}
    <h3>${esc(rt.secAnalysisTitle)}</h3>
    <ul class="insights">${packs.ai.insights.map((ins) => `<li><strong>${esc(ins.title)}</strong><p>${esc(ins.detail)}</p></li>`).join('')}</ul>
    ${recsHtml(packs.ai, rt)}
    ${sectionRefHtml(standards, 'sec12')}
  </section>

  <section class="print-sec">
    <h2><span class="num">13</span> ${esc(rt.sec13)}</h2>
    ${fieldsGridHtml(packs.action.fields)}
    <div class="act-grid">${actions}</div>
    ${chartPrintHtml(packs.action, packs.action.chartCaption)}
    <h3>${esc(rt.secAnalysisTitle)}</h3>
    <ul class="insights">${packs.action.insights.map((ins) => `<li><strong>${esc(ins.title)}</strong><p>${esc(ins.detail)}</p></li>`).join('')}</ul>
    ${recsHtml(packs.action, rt)}
    ${sectionRefHtml(standards, 'sec13')}
  </section>

  ${richSection(14, rt.sec14, packs.conclusion, rt, standards, '', undefined, 'sec14')}

  <footer class="doc-footer">
    ${printLogoBlock(printLogoUrl(input), rt.companyName, true)}
    <p><strong>${esc(rt.companyName)}</strong> — ${esc(rt.platformTitle)}</p>
    <p>${esc(report.reportId)} · ${esc(rt.printFooterLegal)}</p>
  </footer>
</div>`;

  return `<!DOCTYPE html>
<html lang="${input.locale === 'th' ? 'th' : input.locale === 'cn' ? 'zh-CN' : 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(rt.companyName)} — ${esc(report.reportId)}</title>
<style>${buildEnergyQualityPrintCss(rt)}</style>
</head>
<body>${body}
<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)});</script>
</body></html>`;
}
