'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { L } from '@/lib/customer-dashboard-i18n';
import { downloadBlob } from '@/lib/excel-export';
import { customerDashboardFetch } from '@/lib/customer-dashboard-fetch';

function toLocalInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseFilename(contentDisposition) {
  if (!contentDisposition) return null;
  const m = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return m?.[1] ?? null;
}

const RANGE_PRESETS = [
  { key: '1h', hours: 1 },
  { key: '6h', hours: 6 },
  { key: '24h', hours: 24 },
  { key: 'today', hours: null },
];

const INTERVAL_OPTIONS = [1, 5, 10, 30, 60, 120, 300];
const FORMAT_OPTIONS = [
  { value: 'xlsx', labelEn: 'Excel (.xlsx)', labelTh: 'Excel (.xlsx)', labelKo: 'Excel (.xlsx)' },
  { value: 'csv', labelEn: 'CSV (.csv)', labelTh: 'CSV (.csv)', labelKo: 'CSV (.csv)' },
  { value: 'xls', labelEn: 'Excel 97-2003 (.xls)', labelTh: 'Excel เก่า (.xls)', labelKo: 'Excel 97-2003 (.xls)' },
];

export default function CurrentExportModal({
  open,
  onClose,
  locale,
  site,
  deviceId,
  deviceName,
}) {
  const now = useMemo(() => new Date(), [open]);
  const [fromLocal, setFromLocal] = useState(() => toLocalInputValue(new Date(now.getTime() - 60 * 60 * 1000)));
  const [toLocal, setToLocal] = useState(() => toLocalInputValue(now));
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [fileFormat, setFileFormat] = useState('xlsx');
  const [rangePreset, setRangePreset] = useState('1h');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    setFromLocal(toLocalInputValue(start));
    setToLocal(toLocalInputValue(end));
    setIntervalSeconds(60);
    setFileFormat('xlsx');
    setRangePreset('1h');
    setError(null);
  }, [open]);

  function applyPreset(key) {
    setRangePreset(key);
    const end = new Date();
    if (key === 'today') {
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      setFromLocal(toLocalInputValue(start));
      setToLocal(toLocalInputValue(end));
      return;
    }
    const preset = RANGE_PRESETS.find((p) => p.key === key);
    if (!preset?.hours) return;
    const start = new Date(end.getTime() - preset.hours * 60 * 60 * 1000);
    setFromLocal(toLocalInputValue(start));
    setToLocal(toLocalInputValue(end));
  }

  async function handleExport() {
    if (!deviceId) return;
    setExporting(true);
    setError(null);
    try {
      const fromIso = new Date(fromLocal).toISOString();
      const toIso = new Date(toLocal).toISOString();
      const params = new URLSearchParams({
        site: site || 'thailand',
        deviceId: String(deviceId),
        from: fromIso,
        to: toIso,
        intervalSeconds: String(intervalSeconds),
        format: fileFormat,
      });
      const res = await customerDashboardFetch(`/api/ge-energy/customer-current-export?${params}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        let msg = 'Export failed';
        try {
          const j = await res.json();
          if (j.error) msg = j.error;
        } catch {
          /* binary error body */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const name =
        parseFilename(res.headers.get('Content-Disposition')) ||
        `current_${deviceName || deviceId}.${fileFormat}`;
      downloadBlob(blob, name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="cd-export-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cd-export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cd-export-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cd-export-header">
          <h2 id="cd-export-title" className="cd-export-title">
            {L(locale, 'ส่งออกข้อมูลกระแสไฟ', '전류 데이터보내기', 'Export current data')}
          </h2>
          <button type="button" className="cd-export-close" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="cd-export-device">
          {deviceName || deviceId}
        </p>

        <div className="cd-form-field">
          <span className="cd-form-label">{L(locale, 'ช่วงเวลา', '기간', 'Time range')}</span>
          <div className="cd-export-presets">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`cd-export-preset${rangePreset === p.key ? ' cd-export-preset--active' : ''}`}
                onClick={() => applyPreset(p.key)}
              >
                {p.key === '1h' && L(locale, '1 ชม.', '1시간', '1 hour')}
                {p.key === '6h' && L(locale, '6 ชม.', '6시간', '6 hours')}
                {p.key === '24h' && L(locale, '24 ชม.', '24시간', '24 hours')}
                {p.key === 'today' && L(locale, 'วันนี้', '오늘', 'Today')}
              </button>
            ))}
          </div>
        </div>

        <div className="cd-export-datetime-row">
          <div className="cd-form-field">
            <label className="cd-form-label" htmlFor="cd-export-from">
              {L(locale, 'ตั้งแต่', '시작', 'From')}
            </label>
            <input
              id="cd-export-from"
              type="datetime-local"
              className="cd-form-input"
              value={fromLocal}
              onChange={(e) => {
                setRangePreset('custom');
                setFromLocal(e.target.value);
              }}
            />
          </div>
          <div className="cd-form-field">
            <label className="cd-form-label" htmlFor="cd-export-to">
              {L(locale, 'ถึง', '종료', 'To')}
            </label>
            <input
              id="cd-export-to"
              type="datetime-local"
              className="cd-form-input"
              value={toLocal}
              onChange={(e) => {
                setRangePreset('custom');
                setToLocal(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="cd-form-field">
          <label className="cd-form-label" htmlFor="cd-export-interval">
            {L(locale, 'ความถี่ (วินาที)', '간격 (초)', 'Interval (seconds)')}
          </label>
          <select
            id="cd-export-interval"
            className="cd-form-input"
            value={intervalSeconds}
            onChange={(e) => setIntervalSeconds(Number(e.target.value))}
          >
            {INTERVAL_OPTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {sec} {L(locale, 'วินาที', '초', 'sec')}
              </option>
            ))}
          </select>
        </div>

        <div className="cd-form-field">
          <label className="cd-form-label" htmlFor="cd-export-format">
            {L(locale, 'ประเภทไฟล์', '파일 형식', 'File format')}
          </label>
          <select
            id="cd-export-format"
            className="cd-form-input"
            value={fileFormat}
            onChange={(e) => setFileFormat(e.target.value)}
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {L(locale, f.labelTh, f.labelKo, f.labelEn)}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="cd-export-error">{error}</p>}

        <div className="cd-export-actions">
          <button type="button" className="cd-btn cd-btn--ghost" onClick={onClose} disabled={exporting}>
            {L(locale, 'ยกเลิก', '취소', 'Cancel')}
          </button>
          <button
            type="button"
            className="cd-btn cd-btn--primary"
            onClick={handleExport}
            disabled={exporting || !deviceId}
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting
              ? L(locale, 'กำลังส่งออก…', '보내는 중…', 'Exporting…')
              : L(locale, 'ส่งออก', '보내기', 'Export')}
          </button>
        </div>
      </div>
    </div>
  );
}
