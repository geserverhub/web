'use client';

import type {
  EnergyQualityReport,
  ReportChannel,
  RiskLevel,
} from '@/lib/energy/energy-quality-report-model';
import type { ReportStrings } from '@/lib/energy/energy-quality-report-i18n';
import { fmtNum } from '@/lib/energy/energy-quality-i18n';
import EnergyQualityLiveSnapshot from '@/components/energy/EnergyQualityLiveSnapshot';
import EnergyQualityReportCharts from '@/components/energy/EnergyQualityReportCharts';
import type {
  CurrentHistoryStats,
  DbChartPoint,
  TechnicalInsight,
} from '@/lib/energy/energy-quality-current-analysis';
import { Activity, AlertTriangle, CheckCircle2, FileText, Loader2, Radio } from 'lucide-react';

const REPORT_SECTIONS = [
  { id: 'sec-customer', key: 'sec1' as const },
  { id: 'sec-measurement', key: 'sec2' as const },
  { id: 'sec-executive', key: 'sec3' as const },
  { id: 'sec-charts', key: 'secCharts' as const },
  { id: 'sec-energy', key: 'sec4' as const },
  { id: 'sec-peak', key: 'sec5' as const },
  { id: 'sec-pf', key: 'sec6' as const },
  { id: 'sec-balance', key: 'sec7' as const },
  { id: 'sec-harmonic', key: 'sec8' as const },
  { id: 'sec-equipment', key: 'sec9' as const },
  { id: 'sec-financial', key: 'sec10' as const },
  { id: 'sec-roi', key: 'sec11' as const },
  { id: 'sec-ai', key: 'sec12' as const },
  { id: 'sec-action', key: 'sec13' as const },
  { id: 'sec-conclusion', key: 'sec14' as const },
] as const;

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

function valueToRiskLevel(value: string, rt: ReportStrings): RiskLevel | null {
  const v = value.trim();
  if (v === rt.statusCritical || v === 'Critical' || v.includes('วิกฤต')) return 'critical';
  if (v === rt.statusWarning || v === 'Warning' || v.includes('เตือน') || v === 'Caution' || v === 'High Risk') {
    return 'warning';
  }
  if (v === rt.statusGood || v === 'Good' || v.includes('ดี') || v === 'Acceptable') return 'good';
  return null;
}

export function RiskBadge({ level, label }: { level: string; label: string }) {
  const cls =
    level === 'pending'
      ? 'eq-risk eq-risk--pending'
      : level === 'critical'
        ? 'eq-risk eq-risk--critical'
        : level === 'warning'
          ? 'eq-risk eq-risk--warning'
          : 'eq-risk eq-risk--good';
  const Icon = level === 'good' ? CheckCircle2 : level === 'pending' ? Radio : AlertTriangle;
  return (
    <span className={cls}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
      {label}
    </span>
  );
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

function ReportSection({
  id,
  title,
  index,
  fields,
  children,
  rt,
  livePending,
}: {
  id: string;
  title: string;
  index: number;
  fields: { label: string; value: string }[];
  children?: React.ReactNode;
  rt: ReportStrings;
  livePending?: boolean;
}) {
  return (
    <section id={id} className="eq-report-section">
      <h3 className="eq-report-section-title">
        <span className="eq-report-section-num">{index}</span>
        {title}
      </h3>
      <div className="eq-report-fields">
        {fields.map((f) => (
          <div key={`${id}-${f.label}`} className="eq-report-field">
            <span className="eq-report-field-label">{f.label}</span>
            <FieldValue value={f.value} rt={rt} livePending={livePending} />
          </div>
        ))}
      </div>
      {children}
    </section>
  );
}

function StatusMetricCard({
  label,
  value,
  level,
  statusLabel,
}: {
  label: string;
  value: string;
  level: RiskLevel;
  statusLabel: string;
}) {
  return (
    <div className={`eq-status-metric eq-status-metric--${level}`}>
      <span className="eq-status-metric-label">{label}</span>
      <strong className="eq-status-metric-value">{value}</strong>
      <RiskBadge level={level} label={statusLabel} />
    </div>
  );
}

export default function EnergyQualityReportView({
  report,
  rt,
  ch1Label,
  ch2Label,
  ch1,
  snapshotUi,
  livePending = false,
  noMeter = false,
  isRefreshing = false,
  dbChartData = [],
  dbStats = null,
  technicalInsights = [],
  chartUi,
}: {
  report: EnergyQualityReport;
  rt: ReportStrings;
  ch1Label: string;
  ch2Label: string;
  ch1?: ReportChannel;
  snapshotUi?: {
    lastUpdate: string;
    l1: string;
    l2: string;
    l3: string;
    avg: string;
    thd: string;
    powerFactor: string;
    frequency: string;
  };
  livePending?: boolean;
  noMeter?: boolean;
  isRefreshing?: boolean;
  dbChartData?: DbChartPoint[];
  dbStats?: CurrentHistoryStats | null;
  technicalInsights?: TechnicalInsight[];
  chartUi?: { l1: string; l2: string; l3: string; noChart: string };
}) {
  const pending = livePending || noMeter;
  const m = report.statusMetrics ?? {
    pf: null,
    thd: null,
    currentImbalance: null,
    voltageImbalance: null,
  };
  const formatPf = pending ? '—' : m.pf != null ? fmtNum(m.pf, 3) : rt.statusNoData;
  const formatThd = pending ? '—' : m.thd != null ? `${fmtNum(m.thd, 1)}%` : rt.statusNoData;
  const formatCur = pending ? '—' : m.currentImbalance != null ? `${fmtNum(m.currentImbalance, 1)}%` : rt.statusNoData;
  const formatVolt = pending ? '—' : m.voltageImbalance != null ? `${fmtNum(m.voltageImbalance, 1)}%` : rt.statusNoData;
  const pfLevel = pending ? 'good' : riskLevelForPf(m.pf);
  const thdLevel = pending ? 'good' : riskLevelForThd(m.thd);
  const curLevel = pending ? 'good' : riskLevelForImbalance(m.currentImbalance);
  const voltLevel = pending ? 'good' : riskLevelForImbalance(m.voltageImbalance);
  const statusLabel = (level: RiskLevel) => (pending ? rt.statusPending : riskLabel(level, rt));

  return (
    <article
      className={`eq-report-doc${pending ? ' eq-report-doc--pending' : ''}${isRefreshing ? ' eq-report-doc--refreshing' : ''}`}
    >
      {(pending || isRefreshing) && (
        <div className="eq-report-live-banner" role="status">
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
          ) : (
            <Radio className="w-4 h-4 shrink-0 eq-report-live-banner-icon" aria-hidden />
          )}
          <span>
            {noMeter ? rt.selectMeterHint : isRefreshing ? rt.waitingLive : rt.waitingLive}
          </span>
        </div>
      )}
      <header className="eq-report-cover">
        <div className="eq-report-cover-brand">
          <FileText className="w-8 h-8" strokeWidth={2} />
          <div>
            <p className="eq-report-company">{rt.companyName}</p>
            <h2 className="eq-report-platform">{rt.platformTitle}</h2>
          </div>
        </div>
        <div className="eq-report-cover-meta">
          <div>
            <span className="eq-report-meta-lbl">{rt.f_reportId}</span>
            <strong>{report.reportId}</strong>
          </div>
          <div>
            <span className="eq-report-meta-lbl">{rt.f_reportDate}</span>
            <strong>{report.reportDate}</strong>
          </div>
          <div>
            <span className="eq-report-meta-lbl">{rt.reportStatus}</span>
            <strong>{rt.statusDraft}</strong>
          </div>
          <div className="eq-report-live">
            <Activity className="w-4 h-4" />
            {rt.liveBadge}
          </div>
        </div>
        <p className="eq-report-last-update">
          {rt.f_endDate}: <strong>{report.lastUpdate}</strong>
        </p>
        <div className="eq-report-cover-risks">
          <RiskBadge
            level={pending ? 'pending' : report.overallRisk}
            label={report.overallRiskLabel}
          />
          <RiskBadge
            level={
              pending
                ? 'pending'
                : report.harmonicRisk === 'high'
                  ? 'critical'
                  : report.harmonicRisk === 'caution'
                    ? 'warning'
                    : 'good'
            }
            label={`${rt.f_harmonicRisk}: ${report.harmonicRiskLabel}`}
          />
        </div>
      </header>

      <p className="eq-report-ai-note">{rt.aiNote}</p>

      {snapshotUi && ch1 ? (
        <EnergyQualityLiveSnapshot
          ch1={ch1}
          lastUpdate={report.lastUpdate}
          ui={snapshotUi}
          pending={pending}
        />
      ) : null}

      <nav className="eq-report-toc" aria-label={rt.reportTocTitle}>
        <p className="eq-report-toc-title">{rt.reportTocTitle}</p>
        <ol className="eq-report-toc-list">
          {REPORT_SECTIONS.map((sec, i) => (
            <li key={sec.id}>
              <a href={`#${sec.id}`} className="eq-report-toc-link">
                <span className="eq-report-toc-num">{i + 1}</span>
                {rt[sec.key]}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section className="eq-report-status-panel" aria-labelledby="eq-status-panel-title">
        <h3 id="eq-status-panel-title" className="eq-report-status-panel-title">
          {rt.statusPanelTitle}
        </h3>
        <div className="eq-report-status-overall">
          <span className="eq-report-status-overall-lbl">{rt.statusOverall}</span>
          <RiskBadge
            level={pending ? 'pending' : report.overallRisk}
            label={report.overallRiskLabel}
          />
        </div>
        <div className="eq-report-status-metrics">
          <StatusMetricCard
            label={rt.statusMetricPf}
            value={formatPf}
            level={pfLevel}
            statusLabel={statusLabel(pfLevel)}
          />
          <StatusMetricCard
            label={rt.statusMetricThd}
            value={formatThd}
            level={thdLevel}
            statusLabel={statusLabel(thdLevel)}
          />
          <StatusMetricCard
            label={rt.statusMetricCurImb}
            value={formatCur}
            level={curLevel}
            statusLabel={statusLabel(curLevel)}
          />
          <StatusMetricCard
            label={rt.statusMetricVoltImb}
            value={formatVolt}
            level={voltLevel}
            statusLabel={statusLabel(voltLevel)}
          />
        </div>
      </section>

      <ReportSection
        id="sec-customer"
        index={1}
        title={rt.sec1}
        fields={report.customer}
        rt={rt}
        livePending={pending}
      />
      <ReportSection
        id="sec-measurement"
        index={2}
        title={rt.sec2}
        fields={report.measurement}
        rt={rt}
        livePending={pending}
      />

      <ReportSection
        id="sec-executive"
        index={3}
        title={rt.sec3}
        fields={report.executive}
        rt={rt}
        livePending={pending}
      >
        <div className="eq-report-phase-table-wrap">
          <table className="eq-report-table">
            <thead>
              <tr>
                <th>{rt.phaseCol}</th>
                <th>{ch1Label}</th>
                <th>{ch2Label}</th>
              </tr>
            </thead>
            <tbody>
              {report.phaseTable.map((row) => (
                <tr key={row.phase}>
                  <td>{row.phase}</td>
                  <td>{row.ch1}</td>
                  <td>{row.ch2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {chartUi ? (
        <EnergyQualityReportCharts
          rt={rt}
          ui={chartUi}
          chartData={dbChartData}
          stats={dbStats}
          insights={technicalInsights}
          pending={pending}
        />
      ) : null}

      <ReportSection id="sec-energy" index={4} title={rt.sec4} fields={report.energy} rt={rt} livePending={pending} />
      <ReportSection id="sec-peak" index={5} title={rt.sec5} fields={report.peak} rt={rt} livePending={pending} />
      <ReportSection id="sec-pf" index={6} title={rt.sec6} fields={report.powerFactor} rt={rt} livePending={pending} />
      <ReportSection id="sec-balance" index={7} title={rt.sec7} fields={report.balance} rt={rt} livePending={pending} />
      <ReportSection id="sec-harmonic" index={8} title={rt.sec8} fields={report.harmonic} rt={rt} livePending={pending} />
      <ReportSection id="sec-equipment" index={9} title={rt.sec9} fields={report.equipment} rt={rt} livePending={pending} />
      <ReportSection id="sec-financial" index={10} title={rt.sec10} fields={report.financial} rt={rt} livePending={pending} />
      <ReportSection id="sec-roi" index={11} title={rt.sec11} fields={report.roi} rt={rt} livePending={pending} />

      <section id="sec-ai" className="eq-report-section">
        <h3 className="eq-report-section-title">
          <span className="eq-report-section-num">12</span>
          {rt.sec12}
        </h3>
        <ol className="eq-report-rec-list">
          {report.recommendations.map((rec) => (
            <li key={rec.priority} className="eq-report-rec-item">
              <span className="eq-report-rec-priority">
                {rt.priority} {rec.priority}
              </span>
              <strong>{rec.title}</strong>
              <p>{rec.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="sec-action" className="eq-report-section">
        <h3 className="eq-report-section-title">
          <span className="eq-report-section-num">13</span>
          {rt.sec13}
        </h3>
        <div className="eq-report-action-grid">
          {report.actionPlan.map((block) => (
            <div key={block.horizon} className="eq-report-action-card">
              <h4>{block.horizon}</h4>
              <ul>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <ReportSection
        id="sec-conclusion"
        index={14}
        title={rt.sec14}
        fields={report.conclusion}
        rt={rt}
        livePending={pending}
      />
    </article>
  );
}
