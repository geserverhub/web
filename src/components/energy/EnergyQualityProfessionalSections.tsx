'use client';

import type {
  FindingAssessment,
  ProfessionalReportContent,
} from '@/lib/energy/energy-quality-professional-analysis';
import type { ReportStrings } from '@/lib/energy/energy-quality-report-i18n';
import { CheckCircle2, AlertTriangle, Minus, TrendingUp } from 'lucide-react';

function AssessmentBadge({
  assessment,
  label,
}: {
  assessment: FindingAssessment;
  label: string;
}) {
  const cls =
    assessment === 'excellent' || assessment === 'acceptable'
      ? 'eq-pro-assess eq-pro-assess--good'
      : assessment === 'caution'
        ? 'eq-pro-assess eq-pro-assess--caution'
        : assessment === 'warning'
          ? 'eq-pro-assess eq-pro-assess--warn'
          : 'eq-pro-assess eq-pro-assess--neutral';
  const Icon =
    assessment === 'excellent' || assessment === 'acceptable'
      ? CheckCircle2
      : assessment === 'caution' || assessment === 'warning'
        ? AlertTriangle
        : Minus;
  return (
    <span className={cls}>
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
      {label}
    </span>
  );
}

export function EnergyQualityKeyFindingsTable({
  pro,
  rt,
}: {
  pro: ProfessionalReportContent;
  rt: ReportStrings;
}) {
  if (!pro.keyFindings.length) return null;
  return (
    <div className="eq-pro-block">
      <h4 className="eq-report-exec-subtitle">{rt.proKeyFindingsTableTitle}</h4>
      <p className="eq-pro-intro">{pro.keyFindingsIntro}</p>
      <div className="eq-pro-table-wrap">
        <table className="eq-pro-table">
          <thead>
            <tr>
              <th>{rt.proTableParameter}</th>
              <th>{rt.proTableMeasured}</th>
              <th>{rt.proTableStandard}</th>
              <th>{rt.proTableAssessment}</th>
            </tr>
          </thead>
          <tbody>
            {pro.keyFindings.map((row) => (
              <tr key={row.parameter}>
                <td>{row.parameter}</td>
                <td>
                  <strong>{row.measured}</strong>
                </td>
                <td>{row.standard}</td>
                <td>
                  <AssessmentBadge assessment={row.assessment} label={row.assessmentLabel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="eq-pro-risk-line">
        <TrendingUp className="w-4 h-4" />
        {rt.statusOverall}: <strong>{pro.overallTechnicalRisk}</strong>
      </p>
    </div>
  );
}

export function EnergyQualityProfessionalNarrative({
  paragraphs,
}: {
  paragraphs: string[];
}) {
  if (!paragraphs.length) return null;
  return (
    <div className="eq-pro-narrative">
      {paragraphs.map((p) => (
        <p key={p.slice(0, 48)}>{p}</p>
      ))}
    </div>
  );
}

export function EnergyQualityInterpretationBlock({
  pro,
  rt,
}: {
  pro: ProfessionalReportContent;
  rt: ReportStrings;
}) {
  if (!pro.interpretationBullets.length) return null;
  return (
    <div className="eq-pro-block eq-pro-block--interpret">
      <h4 className="eq-report-exec-subtitle">{pro.interpretationTitle}</h4>
      <ul className="eq-pro-interpret-list">
        {pro.interpretationBullets.map((b) => (
          <li key={b.slice(0, 40)}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

export function EnergyQualityPhasedRecommendations({
  pro,
  rt,
}: {
  pro: ProfessionalReportContent;
  rt: ReportStrings;
}) {
  if (!pro.phasedRecommendations.length) return null;
  return (
    <div className="eq-pro-block">
      <h4 className="eq-report-exec-subtitle">{pro.phasedTitle}</h4>
      {pro.recommendedModel ? (
        <p className="eq-pro-model">
          {rt.proRecommendedModel}: <strong>{pro.recommendedModel}</strong>
        </p>
      ) : null}
      <div className="eq-pro-phase-grid">
        {pro.phasedRecommendations.map((phase) => (
          <article key={phase.phase} className="eq-pro-phase-card">
            <header>
              <span className="eq-pro-phase-num">{phase.phase}</span>
              <div>
                <strong>{phase.title}</strong>
                <span className="eq-pro-phase-priority">{phase.priority}</span>
              </div>
            </header>
            <ul>
              {phase.bullets.map((b) => (
                <li key={b.slice(0, 32)}>{b}</li>
              ))}
            </ul>
            <footer>
              <span className="eq-pro-outcome-lbl">{rt.proExpectedOutcome}</span>
              <p>{phase.expectedOutcome}</p>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

export function EnergyQualityAnalysisStats({
  pro,
  rt,
}: {
  pro: ProfessionalReportContent;
  rt: ReportStrings;
}) {
  const hasPeak = pro.peakPercentiles?.length;
  const hasImb = pro.imbalanceExceedance?.length;
  if (!hasPeak && !hasImb && !pro.loadProfileNarrative) return null;
  return (
    <div className="eq-pro-stats-row">
      {pro.loadProfileNarrative ? (
        <p className="eq-pro-load-narrative">{pro.loadProfileNarrative}</p>
      ) : null}
      {hasPeak ? (
        <div className="eq-pro-mini-table">
          <h5>{pro.peakPercentileCaption}</h5>
          <div className="eq-pro-pct-grid">
            {pro.peakPercentiles!.map((r) => (
              <div key={r.label} className="eq-pro-pct-cell">
                <span>{r.label}</span>
                <strong>{r.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {hasImb ? (
        <div className="eq-pro-mini-table">
          <h5>{pro.imbalanceExceedanceCaption}</h5>
          <table className="eq-pro-table eq-pro-table--compact">
            <tbody>
              {pro.imbalanceExceedance!.map((r) => (
                <tr key={r.threshold}>
                  <td>{r.threshold}</td>
                  <td>
                    <strong>{r.pct}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function EnergyQualityReportSubtitle({ text }: { text: string }) {
  return <p className="eq-pro-report-subtitle">{text}</p>;
}
