'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ERP_DEPT_DAILY_COPY } from '@/lib/ge-energy-erp-i18n';
import { erpApiHeaders } from '@/lib/erp-api-auth';

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ErpDeptDailyReport({ lang, deptCode, erpUser }) {
  const t = ERP_DEPT_DAILY_COPY[lang] || ERP_DEPT_DAILY_COPY.th;
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [department, setDepartment] = useState(null);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({
    reportDate: todayIso(),
    reporterName: '',
    workSummary: '',
    hoursWorked: '',
  });

  const load = useCallback(async () => {
    if (!deptCode) return;
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({
        year: String(year),
        month: String(month),
        dept: deptCode,
        pageId: 'dept-daily-report',
      });
      const res = await fetch(`/api/ge-energy-erp/daily-work?${qs.toString()}`, {
        headers: erpApiHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Load failed');
      if (json.department?.id) {
        setDepartment(json.department);
      } else {
        const match = (json.departments || []).find((d) => d.code === deptCode);
        if (match) setDepartment(match);
      }
      const flat = Object.values(json.calendar?.byDate || {}).flat();
      setReports(flat.sort((a, b) => String(b.report_date).localeCompare(String(a.report_date))));
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [deptCode, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const name = erpUser?.name || erpUser?.username || '';
    if (name) {
      setForm((f) => (f.reporterName ? f : { ...f, reporterName: name }));
    }
  }, [erpUser]);

  const deptId = useMemo(() => {
    if (department?.id) return department.id;
    return null;
  }, [department]);

  async function submitReport(e) {
    e.preventDefault();
    if (!deptId) {
      setError(t.noDept);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/ge-energy-erp/daily-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...erpApiHeaders() },
        body: JSON.stringify({
          pageId: 'dept-daily-report',
          dept: deptCode,
          reportDate: form.reportDate,
          departmentId: deptId,
          reporterName: form.reporterName,
          workSummary: form.workSummary,
          hoursWorked: form.hoursWorked,
          year,
          month,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setForm((f) => ({ ...f, workSummary: '', hoursWorked: '' }));
      const flat = Object.values(json.calendar?.byDate || {}).flat();
      setReports(flat.sort((a, b) => String(b.report_date).localeCompare(String(a.report_date))));
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function removeReport(id) {
    if (!confirm(t.confirmDelete)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/ge-energy-erp/daily-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...erpApiHeaders() },
        body: JSON.stringify({
          action: 'delete',
          id,
          dept: deptCode,
          pageId: 'dept-daily-report',
          year,
          month,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      const flat = Object.values(json.calendar?.byDate || {}).flat();
      setReports(flat.sort((a, b) => String(b.report_date).localeCompare(String(a.report_date))));
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="geerp-dept-daily">
      {error ? <div className="geerp-dev-alert geerp-dev-alert--error">{error}</div> : null}
      {loading ? <p className="geerp-page-loading" role="status" /> : null}

      {!loading ? (
        <div className="geerp-dept-daily-layout">
          <form className="geerp-calendar-form geerp-dept-daily-form" onSubmit={submitReport}>
            <h2 className="geerp-subtitle">{t.formTitle}</h2>
            <label className="geerp-field">
              <span>{t.reportDate}</span>
              <input
                type="date"
                required
                value={form.reportDate}
                onChange={(e) => setForm((f) => ({ ...f, reportDate: e.target.value }))}
              />
            </label>
            <label className="geerp-field">
              <span>{t.reporter}</span>
              <input
                type="text"
                value={form.reporterName}
                onChange={(e) => setForm((f) => ({ ...f, reporterName: e.target.value }))}
                placeholder={t.reporterPh}
              />
            </label>
            <label className="geerp-field">
              <span>{t.workSummary}</span>
              <textarea
                rows={4}
                required
                value={form.workSummary}
                onChange={(e) => setForm((f) => ({ ...f, workSummary: e.target.value }))}
                placeholder={t.workSummaryPh}
              />
            </label>
            <label className="geerp-field">
              <span>{t.hours}</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.hoursWorked}
                onChange={(e) => setForm((f) => ({ ...f, hoursWorked: e.target.value }))}
              />
            </label>
            <button type="submit" className="geerp-save-btn" disabled={saving}>
              {saving ? t.saving : t.submitReport}
            </button>
          </form>

          <section className="geerp-dept-daily-list">
            <h2 className="geerp-subtitle">{t.recentTitle}</h2>
            {!reports.length ? (
              <p className="geerp-calendar-hint">{t.noReports}</p>
            ) : (
              <ul className="geerp-calendar-report-list">
                {reports.map((r) => (
                  <li key={r.id} className="geerp-calendar-report-item">
                    <div className="geerp-calendar-report-head">
                      <strong>{String(r.report_date).slice(0, 10)}</strong>
                      <button
                        type="button"
                        className="geerp-calendar-del"
                        onClick={() => removeReport(r.id)}
                        disabled={saving}
                      >
                        ×
                      </button>
                    </div>
                    <p className="geerp-calendar-reporter">
                      {r.employee_name || r.reporter_name || '—'}
                      {r.hours_worked != null ? ` · ${r.hours_worked}h` : ''}
                    </p>
                    <p className="geerp-calendar-summary-text">{r.work_summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
