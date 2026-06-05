'use client';

import type { ReactNode } from 'react';
import { Activity, AlertTriangle, Info } from 'lucide-react';
import EqCurrentHistoryChart from '@/components/energy/EqCurrentHistoryChart';
import EqReportLineChart from '@/components/energy/EqReportLineChart';
import type { SectionAnalysisPack } from '@/lib/energy/energy-quality-section-analysis';
import type { TechnicalInsight } from '@/lib/energy/energy-quality-current-analysis';
import type { ReportStrings } from '@/lib/energy/energy-quality-report-i18n';
import { riskLevelFromPaybackValue } from '@/lib/energy/energy-quality-payback';
import { RiskBadge } from '@/components/energy/EnergyQualityReportView';

function valueToRiskLevel(value: string, rt: ReportStrings): 'good' | 'warning' | 'critical' | null {
  const paybackRisk = riskLevelFromPaybackValue(value, rt);
  if (paybackRisk) return paybackRisk;
  const v = value.trim();
  if (v === rt.statusCritical || v.includes('วิกฤต')) return 'critical';
  if (v === rt.statusWarning || v.includes('เตือน') || v === rt.riskCaution || v === rt.riskHigh) {
    return 'warning';
  }
  if (v === rt.statusGood || v.includes('ดี') || v === rt.riskAcceptable) return 'good';
  return null;
}

function FieldValue({
  value,
  rt,
  livePending,
}: {
  value: string;
  rt: ReportStrings;
  livePending?: boolean;
}) {
  const isEmpty = value === '—' || value === rt.statusNoData || value === rt.statusPending;
  if (livePending && isEmpty) {
    return <span className="eq-report-field-value eq-report-field-value--pending">—</span>;
  }
  const risk = valueToRiskLevel(value, rt);
  if (risk) {
    return <RiskBadge level={risk} label={value} />;
  }
  return <strong className="eq-report-field-value">{value}</strong>;
}

function InsightIcon({ severity }: { severity: TechnicalInsight['severity'] }) {
  if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-red-600" strokeWidth={2.5} />;
  if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={2.5} />;
  return <Info className="w-4 h-4 text-sky-600" strokeWidth={2.5} />;
}

export default function EnergyQualityReportSectionBlock({
  id,
  index,
  title,
  pack,
  rt,
  pending,
  primaryContent,
}: {
  id: string;
  index: number;
  title: string;
  pack: SectionAnalysisPack;
  rt: ReportStrings;
  pending?: boolean;
  primaryContent?: ReactNode;
}) {
  const hasChart = pack.chartData.length > 0 && pack.chartKind !== 'none';
  const showChartArea = pack.chartKind !== 'none';

  return (
    <section id={id} className="eq-report-section eq-report-section-rich">
      <h3 className="eq-report-section-title">
        <span className="eq-report-section-num">{index}</span>
        {title}
      </h3>

      <div className="eq-report-fields">
        {pack.fields.map((f) => (
          <div key={`${id}-${f.label}`} className="eq-report-field">
            <span className="eq-report-field-label">{f.label}</span>
            <FieldValue value={f.value} rt={rt} livePending={pending} />
          </div>
        ))}
      </div>

      {primaryContent}

      {showChartArea ? (
      <div
        className={`eq-report-chart-panel eq-report-chart-panel--compact${pending && !hasChart ? ' eq-report-chart-panel--empty' : ''}`}
      >
        {hasChart && pack.chartKind === 'line' && pack.chartLines ? (
          <>
            <p className="eq-report-chart-caption">
              <Activity className="w-3.5 h-3.5" />
              {pack.chartCaption}
            </p>
            <div className="eq-report-chart-canvas">
              {pack.chartData[0]?.time != null ? (
                <EqCurrentHistoryChart
                  data={pack.chartData}
                  lines={pack.chartLines}
                  height={240}
                />
              ) : (
                <EqReportLineChart
                  data={pack.chartData}
                  lines={pack.chartLines}
                  xAxisKey="label"
                  unit={pack.chartUnit ?? ''}
                  height={240}
                />
              )}
            </div>
          </>
        ) : (
          <p className="eq-report-chart-empty">{pending ? rt.waitingLive : rt.insightNoDbDataDetail}</p>
        )}
      </div>
      ) : null}

      <h4 className="eq-report-exec-subtitle">{rt.secAnalysisTitle}</h4>
      <ul className="eq-report-tech-list">
        {pack.insights.map((ins, i) => (
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

      <h4 className="eq-report-exec-subtitle">{rt.secRecommendTitle}</h4>
      <ol className="eq-report-sec-rec-list">
        {pack.recommendations.map((rec, i) => (
          <li key={`${rec.title}-${i}`} className="eq-report-rec-item">
            <strong>{rec.title}</strong>
            <p>{rec.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
