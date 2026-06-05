'use client';

import { Activity, AlertTriangle, BarChart3, Info } from 'lucide-react';
import EqCurrentHistoryChart, { buildEqCurrentChartLines } from '@/components/energy/EqCurrentHistoryChart';
import type { DbChartPoint, CurrentHistoryStats, TechnicalInsight } from '@/lib/energy/energy-quality-current-analysis';
import { fmtA, fmtNum } from '@/lib/energy/energy-quality-i18n';
import type { ReportStrings } from '@/lib/energy/energy-quality-report-i18n';

function InsightIcon({ severity }: { severity: TechnicalInsight['severity'] }) {
  if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-red-600" strokeWidth={2.5} />;
  if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={2.5} />;
  return <Info className="w-4 h-4 text-sky-600" strokeWidth={2.5} />;
}

export function ReportCurrentChartPanel({
  rt,
  ui,
  chartData,
  stats,
  pending,
  compact,
  ch1Only = true,
}: {
  rt: ReportStrings;
  ui: { l1: string; l2: string; l3: string; noChart: string };
  chartData: DbChartPoint[];
  stats: CurrentHistoryStats | null;
  pending?: boolean;
  compact?: boolean;
  ch1Only?: boolean;
}) {
  const chartLines = buildEqCurrentChartLines(ui, ch1Only);
  const hasChart = chartData.length > 0;

  return (
    <>
      {stats && (
        <div className="eq-report-chart-stats">
          <div>
            <span>{rt.chartStatRecords}</span>
            <strong>{stats.dataPoints}</strong>
          </div>
          <div>
            <span>{rt.chartStatPeriod}</span>
            <strong>{stats.periodLabel}</strong>
          </div>
          {stats.peakCh1 != null && (
            <div>
              <span>{rt.chartStatPeak}</span>
              <strong>
                {fmtA(stats.peakCh1)} A
                {stats.peakCh1Time ? ` @ ${stats.peakCh1Time}` : ''}
              </strong>
            </div>
          )}
          {stats.avgCh1 != null && (
            <div>
              <span>{rt.chartStatAvg}</span>
              <strong>{fmtA(stats.avgCh1)} A</strong>
            </div>
          )}
          {stats.maxImbalancePct != null && stats.maxImbalancePct > 0 && (
            <div>
              <span>{rt.chartStatImbalance}</span>
              <strong>{fmtNum(stats.maxImbalancePct, 1)}%</strong>
            </div>
          )}
        </div>
      )}

      <div
        className={`eq-report-chart-panel${compact ? ' eq-report-chart-panel--compact' : ''}${pending && !hasChart ? ' eq-report-chart-panel--empty' : ''}`}
      >
        {hasChart ? (
          <>
            <p className="eq-report-chart-caption">
              <Activity className="w-3.5 h-3.5" />
              {rt.chartCaption}
            </p>
            <div className="eq-report-chart-canvas">
              <EqCurrentHistoryChart
                data={chartData as Record<string, unknown>[]}
                lines={chartLines}
                height={compact ? 240 : 300}
              />
            </div>
          </>
        ) : (
          <p className="eq-report-chart-empty">{pending ? rt.waitingLive : ui.noChart}</p>
        )}
      </div>
    </>
  );
}

export default function EnergyQualityReportCharts({
  rt,
  ui,
  chartData,
  stats,
  insights,
  pending,
  technicalOnly = false,
  sectionIndex,
}: {
  rt: ReportStrings;
  ui: { l1: string; l2: string; l3: string; noChart: string };
  chartData: DbChartPoint[];
  stats: CurrentHistoryStats | null;
  insights: TechnicalInsight[];
  pending?: boolean;
  technicalOnly?: boolean;
  sectionIndex?: number;
}) {
  return (
    <section id="sec-charts" className="eq-report-section eq-report-charts-section">
      <h3 className="eq-report-section-title">
        <span className="eq-report-section-num">
          {sectionIndex != null ? (
            sectionIndex
          ) : (
            <BarChart3 className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
        </span>
        {technicalOnly ? rt.secTechnical : rt.secCharts}
      </h3>

      {!technicalOnly ? <p className="eq-report-charts-source">{rt.secChartsSource}</p> : null}

      {!technicalOnly ? (
        <ReportCurrentChartPanel
          rt={rt}
          ui={ui}
          chartData={chartData}
          stats={stats}
          pending={pending}
        />
      ) : null}

      {!technicalOnly ? <h4 className="eq-report-tech-title">{rt.secTechnical}</h4> : null}
      <ul className="eq-report-tech-list">
        {insights.map((ins, i) => (
          <li
            key={`${ins.title}-${i}`}
            className={`eq-report-tech-item eq-report-tech-item--${ins.severity}`}
          >
            <InsightIcon severity={ins.severity} />
            <div>
              <strong>{ins.title}</strong>
              <p>{ins.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
