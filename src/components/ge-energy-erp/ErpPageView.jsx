'use client';

import { useCallback, useEffect, useState } from 'react';
import { ERP_PAGE_UI } from '@/lib/erp-page-ui';
import {
  labelFor,
  pageDescFor,
  ERP_DASHBOARD_COPY,
  ERP_DEV_COPY,
} from '@/lib/ge-energy-erp-i18n';
import { canManageErpAccess, erpApiHeaders } from '@/lib/erp-api-auth';
import ErpDevelopersHub from './ErpDevelopersHub';
import ErpPageAccessPanel from './ErpPageAccessPanel';
import ErpUserCreatePanel from './ErpUserCreatePanel';
import ErpExecutivePanel from './ErpExecutivePanel';
import ErpWorkCalendar from './ErpWorkCalendar';
import ErpAfterSalesChatPanel from './ErpAfterSalesChatPanel';
import ErpDeptDailyReport from './ErpDeptDailyReport';

const CHART_BAR_HEIGHTS = [58, 42, 72, 51, 68, 38, 64, 55, 76, 47, 61, 53];

const STATUS_COLUMNS = new Set(['status', 'result', 'resultStatus']);

function formatCell(value) {
  if (value == null || value === '') return '—';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function badgeClass(value) {
  const v = String(value ?? '')
    .toLowerCase()
    .trim();
  if (!v || v === '—') return 'geerp-badge--neutral';
  if (/(fail|cancel|error|reject)/.test(v)) return 'geerp-badge--fail';
  if (/(pending|planned|draft|wait|open)/.test(v)) return 'geerp-badge--pending';
  if (/(pass|active|completed|present|paid|ok)/.test(v)) return 'geerp-badge--ok';
  return 'geerp-badge--neutral';
}

function renderCell(col, value) {
  const text = formatCell(value);
  if (STATUS_COLUMNS.has(col) || col === 'result') {
    return <span className={`geerp-badge ${badgeClass(value)}`}>{text}</span>;
  }
  return text;
}

export default function ErpPageView({
  lang,
  deptId,
  deptLabel,
  pageId,
  pageLabel,
  erpUser,
  onDevNavigate,
  accessDenied,
}) {
  const ui = ERP_PAGE_UI[pageId];
  const t = ERP_DASHBOARD_COPY[lang] || ERP_DASHBOARD_COPY.th;
  const devT = ERP_DEV_COPY[lang] || ERP_DEV_COPY.th;
  const desc = pageDescFor(lang, pageId);
  const isDevPage = ['developers', 'erp-page-access', 'erp-user-create'].includes(pageId);
  const isExecPage = [
    'exec-dept-kpi',
    'exec-daily-work-calendar',
    'exec-pending-approvals',
    'exec-ai-performance',
    'exec-ai-issues',
    'exec-ai-growth',
  ].includes(pageId);
  const isCalendarPage = pageId === 'exec-daily-work-calendar';
  const isAfterSalesChatPage = pageId === 'after-sales-chat-live';
  const isDeptDailyReport = pageId === 'dept-daily-report';
  const isDeptMonthlySummary = pageId === 'dept-monthly-summary';
  const devAllowed = canManageErpAccess(erpUser);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [formData, setFormData] = useState({});
  const dataApiPath = pageId
    ? `/api/ge-energy-erp/data?pageId=${encodeURIComponent(pageId)}`
    : '';
  const dataApiHeaders = pageId
    ? { ...erpApiHeaders(), 'x-erp-page-id': String(pageId) }
    : erpApiHeaders();

  const loadData = useCallback(async () => {
    if (
      !pageId ||
      isDevPage ||
      isExecPage ||
      isCalendarPage ||
      isAfterSalesChatPage ||
      isDeptDailyReport ||
      isDeptMonthlySummary ||
      accessDenied
    ) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(dataApiPath, {
        headers: dataApiHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Load failed');
      if (json.type === 'report') {
        setMetrics(json.metrics || {});
        setRows([]);
      } else {
        setRows(Array.isArray(json.rows) ? json.rows : []);
        setMetrics(null);
      }
    } catch (err) {
      setError(err.message || 'Error');
      setRows([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [
    dataApiHeaders,
    dataApiPath,
    pageId,
    isDevPage,
    isExecPage,
    isCalendarPage,
    isAfterSalesChatPage,
    isDeptDailyReport,
    isDeptMonthlySummary,
    accessDenied,
  ]);

  useEffect(() => {
    setFormData({});
    loadData();
  }, [loadData]);

  const onFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!ui?.fieldKeys?.length) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(dataApiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...dataApiHeaders },
        body: JSON.stringify({ data: formData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setFormData({});
      if (json.type === 'report') {
        setMetrics(json.metrics || {});
      } else {
        setRows(Array.isArray(json.rows) ? json.rows : []);
      }
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (!ui) {
    return (
      <section className="geerp-content">
        <p className="geerp-breadcrumb">
          {deptLabel}
          <span aria-hidden> › </span>
          {pageLabel}
        </p>
        <h1 className="geerp-content-title">{pageLabel}</h1>
        <p className="geerp-content-hint">{desc}</p>
      </section>
    );
  }

  const tableColumns = ui.type === 'table' ? ui.columnKeys : [];
  const displayRows = rows.map((row) => {
    if (!tableColumns.length) return row;
    const out = {};
    for (const col of tableColumns) {
      out[col] = row[col] ?? row[col.replace(/([A-Z])/g, '_$1').toLowerCase()] ?? row.id;
    }
    return out;
  });

  return (
    <section className="geerp-content" data-page={pageId}>
      <p className="geerp-breadcrumb">
        {deptLabel}
        <span aria-hidden> › </span>
        {pageLabel}
      </p>
      <h1 className="geerp-content-title">{pageLabel}</h1>
      <p className="geerp-content-hint">{desc}</p>

      {accessDenied ? (
        <div className="geerp-dev-alert geerp-dev-alert--error">{devT.deniedPage}</div>
      ) : null}

      {isDevPage && !devAllowed ? (
        <div className="geerp-dev-alert geerp-dev-alert--error">{devT.forbidden}</div>
      ) : null}

      {!accessDenied && isDevPage && devAllowed && ui?.type === 'developers-hub' ? (
        <ErpDevelopersHub lang={lang} onNavigate={onDevNavigate} />
      ) : null}

      {!accessDenied && isDevPage && devAllowed && ui?.type === 'erp-page-access' ? (
        <ErpPageAccessPanel lang={lang} />
      ) : null}

      {!accessDenied && isDevPage && devAllowed && ui?.type === 'erp-user-create' ? (
        <ErpUserCreatePanel lang={lang} />
      ) : null}

      {!accessDenied && isCalendarPage && ui ? (
        <ErpWorkCalendar lang={lang} />
      ) : null}

      {!accessDenied && isAfterSalesChatPage && ui ? (
        <ErpAfterSalesChatPanel lang={lang} />
      ) : null}

      {!accessDenied && isDeptDailyReport && ui ? (
        <ErpDeptDailyReport lang={lang} deptCode={deptId} erpUser={erpUser} />
      ) : null}

      {!accessDenied && isDeptMonthlySummary && ui ? (
        <ErpWorkCalendar
          lang={lang}
          deptCode={deptId}
          pageId="dept-monthly-summary"
        />
      ) : null}

      {!accessDenied && isExecPage && !isCalendarPage && ui ? (
        <ErpExecutivePanel lang={lang} pageId={pageId} />
      ) : null}

      {!accessDenied &&
      !isDevPage &&
      !isExecPage &&
      !isCalendarPage &&
      !isAfterSalesChatPage &&
      !isDeptDailyReport &&
      !isDeptMonthlySummary &&
      ui ? (
      <>
      {error ? <div className="geerp-dev-alert geerp-dev-alert--error">{error}</div> : null}
      {loading ? (
        <p className="geerp-page-loading" role="status">
          {t.loadingData || t.loading}
        </p>
      ) : null}

      <div className="geerp-toolbar">
        <input type="search" className="geerp-search" placeholder={t.search} disabled aria-disabled />
        <button type="button" className="geerp-tool-btn" onClick={loadData} disabled={loading}>
          {t.refresh}
        </button>
        <button type="button" className="geerp-tool-btn geerp-tool-btn--muted" disabled>
          {t.export}
        </button>
      </div>

      {ui.type === 'form' ? (
        <form className="geerp-form" onSubmit={onSubmit}>
          <div className="geerp-form-grid">
            {ui.fieldKeys.map((field) => (
              <label key={field.key} className="geerp-field">
                <span>{labelFor(lang, field.key)}</span>
                {field.input === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={formData[field.key] ?? ''}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder={labelFor(lang, field.key)}
                  />
                ) : (
                  <input
                    type={field.input || 'text'}
                    value={formData[field.key] ?? ''}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder={labelFor(lang, field.key)}
                  />
                )}
              </label>
            ))}
          </div>
          <button type="submit" className="geerp-save-btn" disabled={saving}>
            {saving ? (t.saving || 'กำลังบันทึก…') : t.save}
          </button>
        </form>
      ) : null}

      {ui.type === 'table' ? (
        <div className="geerp-table-wrap">
          <table className="geerp-table">
            <thead>
              <tr>
                {ui.columnKeys.map((col) => (
                  <th key={col}>{labelFor(lang, col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={ui.columnKeys.length} className="geerp-table-empty">
                    {loading ? '…' : t.noData}
                  </td>
                </tr>
              ) : (
                displayRows.map((row, idx) => (
                  <tr key={row.id ?? idx}>
                    {ui.columnKeys.map((col) => (
                      <td key={col}>{renderCell(col, row[col])}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {ui.type === 'report' ? (
        <div className="geerp-report">
          <p className="geerp-report-period">
            {t.reportPeriod}: <strong>{metrics?.period || '2026 Q1'}</strong>
          </p>
          <div className="geerp-metrics">
            {ui.metricKeys.map((key) => (
              <div key={key} className="geerp-metric-card">
                <span className="geerp-metric-label">{labelFor(lang, key)}</span>
                <strong className="geerp-metric-value">
                  {metrics && metrics[key] != null ? formatCell(metrics[key]) : t.sampleValue}
                </strong>
              </div>
            ))}
          </div>
          <div className="geerp-chart" aria-hidden>
            <div className="geerp-chart-head">
              <span>{t.chartTrend}</span>
              <span>{metrics?.period || '2026 Q1'}</span>
            </div>
            <div className="geerp-chart-bars">
              {CHART_BAR_HEIGHTS.map((h, i) => (
                <span key={i} style={{ '--h': `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {ui.type === 'cards' ? (
        <div className="geerp-cards">
          {ui.cardKeys.map((key) => {
            const hasRows = rows.some((r) => (r.doc_key || r.asset_key) === key);
            return (
              <article
                key={key}
                className={`geerp-card ${hasRows ? 'geerp-card--has-data' : ''}`}
              >
                <h3>{labelFor(lang, key)}</h3>
                <p className="geerp-card-meta">{hasRows ? t.hasData : t.noData}</p>
              </article>
            );
          })}
        </div>
      ) : null}

      {ui.type === 'form' && rows.length > 0 ? (
        <div className="geerp-section geerp-table-wrap">
          <h2 className="geerp-subtitle">{t.recentRecords}</h2>
          <table className="geerp-table">
            <thead>
              <tr>
                {Object.keys(rows[0])
                  .filter((k) => k !== 'id')
                  .slice(0, 6)
                  .map((k) => (
                    <th key={k}>{k}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row) => (
                <tr key={row.id}>
                  {Object.keys(rows[0])
                    .filter((k) => k !== 'id')
                    .slice(0, 6)
                    .map((k) => (
                      <td key={k}>{formatCell(row[k])}</td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      </>
      ) : null}
    </section>
  );
}
