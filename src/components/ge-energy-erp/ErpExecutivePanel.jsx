'use client';

import { useCallback, useEffect, useState } from 'react';
import { ERP_EXEC_COPY } from '@/lib/ge-energy-erp-i18n';
import { erpApiHeaders } from '@/lib/erp-api-auth';

function deptName(row, lang) {
  if (lang === 'en') return row.name_en || row.name_th;
  if (lang === 'ko') return row.name_en || row.name_th;
  return row.name_th || row.name_en;
}

function formatMetric(value, unit) {
  const n = Number(value);
  if (unit === 'KRW') return `₩${n.toLocaleString()}`;
  if (unit === 'THB') return `${n.toLocaleString()} THB`;
  if (unit === '%') return `${n}%`;
  return `${n.toLocaleString()}${unit ? ` ${unit}` : ''}`;
}

function trendLabel(t, dir) {
  if (dir === 'up') return t.trendUp;
  if (dir === 'down') return t.trendDown;
  return t.trendStable;
}

function maxScore(items) {
  if (!items?.length) return 1;
  const m = Math.max(...items.map((i) => Number(i.kpi_score || 0)));
  return m > 0 ? m : 1;
}

export default function ErpExecutivePanel({ lang, pageId }) {
  const t = ERP_EXEC_COPY[lang] || ERP_EXEC_COPY.th;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/ge-energy-erp/executive/${encodeURIComponent(pageId)}`,
        { headers: erpApiHeaders() }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Load failed');
      setData(json);
    } catch (err) {
      setError(err.message || 'Error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(approvalId, action) {
    setActing(approvalId);
    setError('');
    try {
      const res = await fetch(
        `/api/ge-energy-erp/executive/${encodeURIComponent(pageId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...erpApiHeaders() },
          body: JSON.stringify({ approvalId, action }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      setData(json);
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="geerp-exec">
      <div className="geerp-toolbar">
        <button type="button" className="geerp-tool-btn" onClick={load} disabled={loading}>
          {t.refreshData}
        </button>
      </div>

      {error ? <div className="geerp-dev-alert geerp-dev-alert--error">{error}</div> : null}
      {loading ? <p className="geerp-page-loading" role="status" /> : null}

      {!loading && data?.type === 'kpi' ? (
        <>
          <p className="geerp-exec-period">
            {t.period}: <strong>{data.periodKey}</strong>
          </p>
          <section className="geerp-exec-block">
            <h2 className="geerp-subtitle">{t.companyTotal}</h2>
            <div className="geerp-metrics">
              {(data.company || []).map((m) => (
                <div key={m.metric_key} className="geerp-metric-card geerp-metric-card--exec">
                  <span className="geerp-metric-label">{m.metric_label}</span>
                  <strong className="geerp-metric-value">
                    {formatMetric(m.metric_value, m.unit)}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <section className="geerp-exec-block">
            <h2 className="geerp-subtitle">{t.byDepartment}</h2>
            <div className="geerp-exec-dept-grid">
              {(data.departments || []).map((d) => (
                <article key={d.id} className="geerp-exec-dept-card">
                  <h3>{deptName(d, lang)}</h3>
                  <ul className="geerp-exec-kpi-list">
                    {(d.metrics || []).map((m) => (
                      <li key={m.metric_key}>
                        <span>{m.metric_label}</span>
                        <strong>{formatMetric(m.metric_value, m.unit)}</strong>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
          <section className="geerp-exec-block">
            <h2 className="geerp-subtitle">{t.reportCardsTitle}</h2>
            <div className="geerp-exec-report-grid">
              {(data.departments || []).map((d) => {
                const s = d.reportSummary || {};
                return (
                  <article key={`${d.id}-report`} className="geerp-exec-report-card">
                    <h3>{deptName(d, lang)}</h3>
                    <div className="geerp-exec-report-stats">
                      <p>
                        <span>{t.dailyReportCount}</span>
                        <strong>{Number(s.dailyCount || 0).toLocaleString()}</strong>
                      </p>
                      <p>
                        <span>{t.monthlySummaryCount}</span>
                        <strong>{Number(s.monthlyCount || 0).toLocaleString()}</strong>
                      </p>
                      <p>
                        <span>{t.totalHours}</span>
                        <strong>{Number(s.totalHours || 0).toLocaleString()}</strong>
                      </p>
                    </div>
                    <div className="geerp-exec-report-last">
                      <span>{t.latestUpdate}</span>
                      <strong>{s.latestReportDate || '-'}</strong>
                      {s.latestWorkSummary ? (
                        <p className="geerp-exec-report-note">{s.latestWorkSummary}</p>
                      ) : (
                        <p className="geerp-exec-report-note">{t.noReportYet}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="geerp-exec-block">
            <h2 className="geerp-subtitle">{t.kpiChartTitle}</h2>
            <div className="geerp-exec-chart">
              {(data.chart || []).map((row) => {
                const max = maxScore(data.chart || []);
                const score = Number(row.kpi_score || 0);
                const pct = Math.max(4, Math.round((score / max) * 100));
                const name =
                  lang === 'th' ? row.dept_name_th || row.dept_name_en : row.dept_name_en || row.dept_name_th;
                return (
                  <div className="geerp-exec-chart-row" key={row.dept_code}>
                    <div className="geerp-exec-chart-label">{name}</div>
                    <div className="geerp-exec-chart-track">
                      <div className="geerp-exec-chart-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="geerp-exec-chart-value">{score.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {!loading && data?.type === 'approvals' ? (
        <div className="geerp-table-wrap">
          <table className="geerp-table">
            <thead>
              <tr>
                <th>{t.colRequest}</th>
                <th>{t.colTitle}</th>
                <th>{t.colDept}</th>
                <th>{t.colAmount}</th>
                <th>{t.colDate}</th>
                <th>{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {!data.rows?.length ? (
                <tr>
                  <td colSpan={6} className="geerp-table-empty">
                    {t.noApprovals}
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.request_no}</td>
                    <td>{row.title}</td>
                    <td>{deptName(row, lang)}</td>
                    <td>
                      {row.amount != null ? Number(row.amount).toLocaleString() : '—'}
                    </td>
                    <td>
                      {row.created_at
                        ? String(row.created_at).slice(0, 10)
                        : '—'}
                    </td>
                    <td className="geerp-exec-actions">
                      <button
                        type="button"
                        className="geerp-exec-btn geerp-exec-btn--ok"
                        disabled={acting === row.id}
                        onClick={() => handleReview(row.id, 'approve')}
                      >
                        {t.approve}
                      </button>
                      <button
                        type="button"
                        className="geerp-exec-btn geerp-exec-btn--no"
                        disabled={acting === row.id}
                        onClick={() => handleReview(row.id, 'reject')}
                      >
                        {t.reject}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && data?.type === 'ai' ? (
        <div className="geerp-exec-ai-list">
          {!data.rows?.length ? (
            <p className="geerp-table-empty">{t.noInsights}</p>
          ) : (
            data.rows.map((row) => (
              <article
                key={row.id}
                className={`geerp-exec-ai-card geerp-exec-ai-card--${row.severity || 'info'}`}
              >
                <header className="geerp-exec-ai-head">
                  <span className="geerp-exec-ai-badge">{t.aiBadge}</span>
                  {row.trend_direction ? (
                    <span
                      className={`geerp-exec-trend geerp-exec-trend--${row.trend_direction}`}
                    >
                      {trendLabel(t, row.trend_direction)}
                      {row.trend_pct != null ? ` (${Number(row.trend_pct).toFixed(1)}%)` : ''}
                    </span>
                  ) : null}
                </header>
                <h3>{row.title}</h3>
                {row.summary ? <p className="geerp-exec-ai-summary">{row.summary}</p> : null}
                {row.problem_detail ? (
                  <div className="geerp-exec-ai-block">
                    <strong>{t.problemDetail}</strong>
                    <p>{row.problem_detail}</p>
                  </div>
                ) : null}
                {row.fix_recommendation ? (
                  <div className="geerp-exec-ai-block geerp-exec-ai-block--fix">
                    <strong>{t.fixRecommendation}</strong>
                    <p>{row.fix_recommendation}</p>
                  </div>
                ) : null}
                <footer className="geerp-exec-ai-foot">
                  {row.dept_code ? (
                    <span>{row.name_th || row.dept_code}</span>
                  ) : (
                    <span>{t.companyTotal}</span>
                  )}
                  <time dateTime={String(row.generated_at)}>
                    {String(row.generated_at || '').slice(0, 16).replace('T', ' ')}
                  </time>
                </footer>
              </article>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
