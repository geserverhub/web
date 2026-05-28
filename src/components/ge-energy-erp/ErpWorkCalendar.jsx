'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ERP_CALENDAR_COPY } from '@/lib/ge-energy-erp-i18n';
import { erpApiHeaders } from '@/lib/erp-api-auth';

const WEEKDAYS_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_KO = ['월', '화', '수', '목', '금', '토', '일'];

function deptLabel(d, lang) {
  if (lang === 'en') return d.name_en || d.name_th;
  if (lang === 'ko') return d.name_en || d.name_th;
  return d.name_th || d.name_en;
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const startPad = (first.getDay() + 6) % 7; // Convert JS Sunday-first to Monday-first.
  const cells = [];

  for (let i = 0; i < startPad; i++) cells.push({ empty: true });
  for (let d = 1; d <= lastDay; d++) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ empty: false, day: d, iso });
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true });
  return cells;
}

export default function ErpWorkCalendar({ lang, deptCode = null, pageId = 'exec-daily-work-calendar' }) {
  const t = ERP_CALENDAR_COPY[lang] || ERP_CALENDAR_COPY.th;
  const weekdays =
    lang === 'en' ? WEEKDAYS_EN : lang === 'ko' ? WEEKDAYS_KO : WEEKDAYS_TH;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [calendar, setCalendar] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [lockedDeptId, setLockedDeptId] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({
    departmentId: '',
    reporterName: '',
    workSummary: '',
    hoursWorked: '',
  });

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({
        year: String(year),
        month: String(month),
        pageId,
      });
      if (deptCode) qs.set('dept', deptCode);
      const res = await fetch(`/api/ge-energy-erp/daily-work?${qs.toString()}`, {
        headers: erpApiHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Load failed');
      setCalendar(json.calendar);
      setDepartments(json.departments || []);
      if (json.department?.id) {
        setLockedDeptId(String(json.department.id));
        setForm((f) => ({ ...f, departmentId: String(json.department.id) }));
      }
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [year, month, deptCode, pageId]);

  useEffect(() => {
    load();
  }, [load]);

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
    setSelectedDate(null);
  }

  const dayReports = selectedDate && calendar?.byDate?.[selectedDate]
    ? calendar.byDate[selectedDate]
    : [];

  async function submitReport(e) {
    e.preventDefault();
    if (!selectedDate) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/ge-energy-erp/daily-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...erpApiHeaders() },
        body: JSON.stringify({
          pageId,
          dept: deptCode || undefined,
          reportDate: selectedDate,
          departmentId: Number(form.departmentId),
          reporterName: form.reporterName,
          workSummary: form.workSummary,
          hoursWorked: form.hoursWorked,
          year,
          month,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setCalendar(json.calendar);
      setForm((f) => ({ ...f, workSummary: '', hoursWorked: '' }));
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
          pageId,
          dept: deptCode || undefined,
          year,
          month,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      setCalendar(json.calendar);
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  const monthLabel =
    lang === 'en'
      ? new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })
      : lang === 'ko'
        ? new Date(year, month - 1).toLocaleString('ko', { month: 'long', year: 'numeric' })
        : new Date(year, month - 1).toLocaleString('th', { month: 'long', year: 'numeric' });

  return (
    <div className="geerp-calendar">
      <div className="geerp-calendar-toolbar">
        <button type="button" className="geerp-calendar-nav" onClick={() => shiftMonth(-1)}>
          ‹
        </button>
        <h2 className="geerp-calendar-title">{monthLabel}</h2>
        <button type="button" className="geerp-calendar-nav" onClick={() => shiftMonth(1)}>
          ›
        </button>
        <button type="button" className="geerp-tool-btn geerp-tool-btn--muted" onClick={load} disabled={loading}>
          {t.refresh}
        </button>
      </div>

      {error ? <div className="geerp-dev-alert geerp-dev-alert--error">{error}</div> : null}
      {loading ? <p className="geerp-page-loading" role="status" /> : null}

      {!loading && calendar ? (
        <p className="geerp-calendar-summary">
          {t.monthTotal}: <strong>{calendar.total}</strong> {t.reports}
        </p>
      ) : null}

      <div className="geerp-calendar-layout">
        <div className="geerp-calendar-grid-wrap">
          <table className="geerp-calendar-table" role="grid">
            <thead>
              <tr>
                {weekdays.map((w) => (
                  <th key={w} scope="col">
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: grid.length / 7 }, (_, rowIdx) => (
                <tr key={rowIdx}>
                  {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, ci) => {
                    if (cell.empty) {
                      return <td key={ci} className="geerp-calendar-cell geerp-calendar-cell--empty" />;
                    }
                    const count = calendar?.counts?.[cell.iso] || 0;
                    const isSelected = selectedDate === cell.iso;
                    const isToday =
                      cell.iso ===
                      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    return (
                      <td key={ci} className="geerp-calendar-cell-wrap">
                        <button
                          type="button"
                          className={`geerp-calendar-cell ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''} ${count ? 'has-reports' : ''}`}
                          onClick={() => setSelectedDate(cell.iso)}
                        >
                          <span className="geerp-calendar-day">{cell.day}</span>
                          {count > 0 ? (
                            <span className="geerp-calendar-badge">{count}</span>
                          ) : (
                            <span className="geerp-calendar-empty-dot" aria-hidden />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="geerp-calendar-side">
          {selectedDate ? (
            <>
              <h3 className="geerp-subtitle">
                {t.dayDetail}: {selectedDate}
              </h3>
              {dayReports.length === 0 ? (
                <p className="geerp-calendar-hint">{t.noReportsDay}</p>
              ) : (
                <ul className="geerp-calendar-report-list">
                  {dayReports.map((r) => (
                    <li key={r.id} className="geerp-calendar-report-item">
                      <div className="geerp-calendar-report-head">
                        <strong>{deptLabel(r, lang)}</strong>
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

              <form className="geerp-calendar-form" onSubmit={submitReport}>
                <h4 className="geerp-calendar-form-title">{t.addReport}</h4>
                {deptCode && lockedDeptId ? (
                  <input type="hidden" value={lockedDeptId} readOnly />
                ) : (
                  <label className="geerp-field">
                    <span>{t.department}</span>
                    <select
                      required
                      value={form.departmentId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, departmentId: e.target.value }))
                      }
                    >
                      <option value="">{t.selectDept}</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {deptLabel(d, lang)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="geerp-field">
                  <span>{t.reporter}</span>
                  <input
                    type="text"
                    value={form.reporterName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reporterName: e.target.value }))
                    }
                    placeholder={t.reporterPh}
                  />
                </label>
                <label className="geerp-field">
                  <span>{t.workSummary}</span>
                  <textarea
                    rows={3}
                    required
                    value={form.workSummary}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, workSummary: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hoursWorked: e.target.value }))
                    }
                  />
                </label>
                <button type="submit" className="geerp-save-btn" disabled={saving}>
                  {saving ? t.saving : t.submitReport}
                </button>
              </form>
            </>
          ) : (
            <p className="geerp-calendar-hint">{t.pickDay}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
