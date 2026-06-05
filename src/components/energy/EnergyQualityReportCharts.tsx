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

export default function EnergyQualityReportCharts({
  rt,
  ui,
  chartData,
  stats,
  insights,
  pending,
}: {
  rt: ReportStrings;
  ui: { l1: string; l2: string; l3: string; noChart: string };
  chartData: DbChartPoint[];
  stats: CurrentHistoryStats | null;
  insights: TechnicalInsight[];
  pending?: boolean;
}) {
  const chartLines = buildEqCurrentChartLines(ui);
  const hasChart = chartData.length > 0;

  return (
    <section id="sec-charts" className="eq-report-section eq-report-charts-section">
      <h3 className="eq-report-section-title">
        <span className="eq-report-section-num">
          <BarChart3 className="w-3.5 h-3.5" strokeWidth={2.5} />
        </span>
        {rt.secCharts}
      </h3>

      <p className="eq-report-charts-source">{rt.secChartsSource}</p>

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

      <div className={`eq-report-chart-panel${pending && !hasChart ? ' eq-report-chart-panel--empty' : ''}`}>
        {hasChart ? (
          <>
            <p className="eq-report-chart-caption">
              <Activity className="w-3.5 h-3.5" />
              {rt.chartCaption}
            </p>
            <div className="eq-report-chart-canvas">
              <EqCurrentHistoryChart data={chartData as Record<string, unknown>[]} lines={chartLines} height={300} />
            </div>
          </>
        ) : (
          <p className="eq-report-chart-empty">{pending ? rt.waitingLive : ui.noChart}</p>
        )}
      </div>

      <h4 className="eq-report-tech-title">{rt.secTechnical}</h4>
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
