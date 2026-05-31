'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/lib/LocaleContext';
import {
  Database,
  Download,
  FileSpreadsheet,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Zap,
  Clock,
  X,
  Search,
  Table2,
  Server,
  FileCode2,
  Info,
} from 'lucide-react';

function L(locale: string, th: string, en: string, ko: string) {
  if (locale === 'th') return th;
  if (locale === 'ko') return ko;
  return en;
}

interface PowerRecord {
  id: number;
  device_name: string;
  ge_id: string;
  site: string;
  series_no: string;
  record_time: string;
  before_kWh: number | null;
  metrics_kWh: number | null;
  energy_reduction: number | null;
  co2_reduction: number | null;
  before_P: number | null;
  metrics_P: number | null;
  before_PF: number | null;
  metrics_PF: number | null;
  before_THD: number | null;
  metrics_THD: number | null;
  before_L1: number | null;
  before_L2: number | null;
  before_L3: number | null;
  metrics_L1: number | null;
  metrics_L2: number | null;
  metrics_L3: number | null;
}

interface BackupFile {
  filename: string;
  size: string;
  sizeBytes: number;
  created: string;
}

interface DeviceOption {
  deviceId: number;
  deviceName: string;
  geID: string;
}

function fmt2(n: number | null | undefined): string {
  if (n == null) return '—';
  return Number(n).toFixed(2);
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DeveloperPageContent({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useLocale();

  // ── Records state ───────────────────────────────────────
  const [records, setRecords] = useState<PowerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ────────────────────────────────────────
  const [site, setSite] = useState('all');
  const [deviceId, setDeviceId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [devices, setDevices] = useState<DeviceOption[]>([]);

  // ── Backup state ─────────────────────────────────────────
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [backupListLoading, setBackupListLoading] = useState(false);

  // ── Export state ─────────────────────────────────────────
  const [exporting, setExporting] = useState(false);

  // ── SQL Viewer state ──────────────────────────────────────
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<{
    filename: string;
    sizeMB: string;
    lineCount: number;
    truncated: boolean;
    truncatedAt: string | null;
    created: string;
    meta: { tables: string[]; host: string | null; database: string | null; serverVersion: string | null; dumpDate: string | null };
    content: string;
  } | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerSearch, setViewerSearch] = useState('');
  const [viewerActiveTab, setViewerActiveTab] = useState<'content' | 'tables' | 'info'>('info');

  // ── Fetch devices for filter ─────────────────────────────
  useEffect(() => {
    fetch('/api/ge-energy/carbon-meters?list=true', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (j.success) setDevices(j.devices); })
      .catch(() => {});
  }, []);

  // ── Fetch records ─────────────────────────────────────────
  const fetchRecords = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (site && site !== 'all') params.set('site', site);
      if (deviceId) params.set('deviceId', deviceId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/ge-energy/power-records-list?${params}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setRecords(json.rows);
        setTotal(json.total);
        setPages(json.pages);
        setPage(p);
      } else {
        setError(json.error || 'Failed to load records');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [site, deviceId, from, to, limit]);

  // ── Fetch backup list ──────────────────────────────────────
  const fetchBackups = useCallback(async () => {
    setBackupListLoading(true);
    try {
      const res = await fetch('/api/backup', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setBackupFiles(json.backups || []);
    } catch { /* silent */ } finally {
      setBackupListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(1);
    fetchBackups();
  }, [fetchRecords, fetchBackups]);

  // ── Trigger DB backup ──────────────────────────────────────
  const runBackup = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setBackupMsg({ ok: true, text: `✅ Backup สำเร็จ — ${json.filename} (${json.size})` });
        fetchBackups();
      } else {
        setBackupMsg({ ok: false, text: `❌ ${json.message || 'Backup ล้มเหลว'}` });
      }
    } catch (e) {
      setBackupMsg({ ok: false, text: `❌ ${e instanceof Error ? e.message : 'Error'}` });
    } finally {
      setBackupLoading(false);
    }
  };

  // ── Export Excel ───────────────────────────────────────────
  const exportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format: 'excel' });
      if (site && site !== 'all') params.set('site', site);
      if (deviceId) params.set('deviceId', deviceId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/ge-energy/power-records-list?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `power_records_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export error');
    } finally {
      setExporting(false);
    }
  };

  // ── Open SQL viewer ────────────────────────────────────────
  const openViewer = async (filename: string) => {
    setViewerOpen(true);
    setViewerLoading(true);
    setViewerFile(null);
    setViewerSearch('');
    setViewerActiveTab('info');
    try {
      const res = await fetch(`/api/backup/view?filename=${encodeURIComponent(filename)}`);
      const json = await res.json();
      if (json.success) {
        setViewerFile(json);
      }
    } catch { /* silent */ } finally {
      setViewerLoading(false);
    }
  };

  // ── Highlighted SQL lines ──────────────────────────────────
  const filteredLines = viewerFile
    ? (viewerSearch.trim()
        ? viewerFile.content.split('\n').filter((l) => l.toLowerCase().includes(viewerSearch.toLowerCase()))
        : viewerFile.content.split('\n'))
    : [];

  return (
    <div className={embedded ? 'energy-page' : 'min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50'}>

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="cc-hero mb-6">
        <div className="cc-hero-content">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6" />
            {L(locale, 'บันทึกข้อมูลและแบ็คอัพ', 'Data Records & Backup', '데이터 기록 및 백업')}
          </h1>
          <p className="text-emerald-100 text-sm mt-1">
            {L(locale,
              'ดูรายการข้อมูลกระแสไฟที่บันทึกในฐานข้อมูล สั่งแบ็คอัพ และส่งออกเป็น Excel',
              'Browse electricity records stored in the database, trigger backups, and export to Excel',
              '데이터베이스에 저장된 전력 기록을 조회하고 백업하고 Excel로 내보내기'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-white/70 text-xs">{L(locale, 'รายการทั้งหมด', 'Total Records', '전체 기록')}</p>
            <p className="text-white text-2xl font-bold">{total.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ══════════════════════════════════════════════
            SECTION 1 · RECORDS BROWSER
        ══════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-blue-900 text-base">
                {L(locale, 'รายการข้อมูลกระแสไฟ (power_records)', 'Electricity Records (power_records)', '전력 기록 (power_records)')}
              </h2>
              {!loading && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {total.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportExcel}
                disabled={exporting || loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exporting
                  ? L(locale, 'กำลังส่งออก...', 'Exporting...', '내보내는 중...')
                  : L(locale, 'ส่งออก Excel', 'Export Excel', 'Excel 내보내기')}
              </button>
              <button
                onClick={() => fetchRecords(1)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {L(locale, 'รีเฟรช', 'Refresh', '새로고침')}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {L(locale, 'กรอง', 'Filter', '필터')}
              </span>
            </div>
            {/* Site */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Site</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white min-w-[130px]"
              >
                <option value="all">{L(locale, 'ทั้งหมด', 'All Sites', '전체')}</option>
                <option value="thailand">Thailand</option>
                <option value="korea">Korea</option>
                <option value="vietnam">Vietnam</option>
                <option value="malaysia">Malaysia</option>
              </select>
            </div>
            {/* Device */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">
                {L(locale, 'อุปกรณ์', 'Device', '장치')}
              </label>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white min-w-[160px]"
              >
                <option value="">{L(locale, 'ทั้งหมด', 'All Devices', '전체')}</option>
                {devices.map((d) => (
                  <option key={d.deviceId} value={String(d.deviceId)}>
                    {d.deviceName} ({d.geID})
                  </option>
                ))}
              </select>
            </div>
            {/* Date range */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {L(locale, 'จาก', 'From', '시작')}
              </label>
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {L(locale, 'ถึง', 'To', '종료')}
              </label>
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white"
              />
            </div>
            <button
              onClick={() => fetchRecords(1)}
              className="mt-auto px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              {L(locale, 'ค้นหา', 'Search', '검색')}
            </button>
            <button
              onClick={() => { setSite('all'); setDeviceId(''); setFrom(''); setTo(''); }}
              className="mt-auto px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              {L(locale, 'ล้าง', 'Clear', '초기화')}
            </button>
          </div>

          {/* Table */}
          {error ? (
            <div className="flex items-center gap-2 px-5 py-6 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">{L(locale, 'กำลังโหลด...', 'Loading...', '로딩 중...')}</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{L(locale, 'ไม่พบข้อมูล', 'No records found', '데이터 없음')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  {/* Group row */}
                  <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold uppercase tracking-wide">
                    <th colSpan={4} className="px-3 py-1.5 text-left text-gray-500" />
                    <th colSpan={3} className="px-3 py-1.5 text-center text-blue-600 border-l border-gray-200">
                      {L(locale, 'พลังงาน / CO₂', 'Energy / CO₂', '에너지 / CO₂')}
                    </th>
                    <th colSpan={6} className="px-3 py-1.5 text-center text-red-500 border-l border-gray-200">
                      Before
                    </th>
                    <th colSpan={6} className="px-3 py-1.5 text-center text-emerald-600 border-l border-gray-200">
                      Current (Metrics)
                    </th>
                  </tr>
                  {/* Column headers */}
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {/* Info columns */}
                    {[
                      { key: 'id', label: 'ID', cls: '' },
                      { key: 'device', label: L(locale, 'อุปกรณ์', 'Device', '장치'), cls: '' },
                      { key: 'site', label: 'Site', cls: '' },
                      { key: 'time', label: L(locale, 'เวลาบันทึก', 'Record Time', '기록 시간'), cls: '' },
                    ].map((col) => (
                      <th key={col.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                    {/* Energy/CO2 */}
                    {[
                      { key: 'saved', label: L(locale, 'ประหยัด kWh', 'Saved kWh', '절감 kWh'), border: true },
                      { key: 'co2', label: 'CO₂ (kg)', border: false },
                      { key: 'kwh_diff', label: 'Δ kWh', border: false },
                    ].map((col) => (
                      <th key={col.key} className={`px-3 py-2 text-right text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap ${col.border ? 'border-l border-gray-200' : ''}`}>
                        {col.label}
                      </th>
                    ))}
                    {/* Before columns */}
                    {['kWh', 'P (W)', 'PF', 'THD', 'L1', 'L2', 'L3'].map((lbl, i) => (
                      <th key={`b_${lbl}`} className={`px-3 py-2 text-right text-xs font-semibold text-red-500 uppercase tracking-wide whitespace-nowrap ${i === 0 ? 'border-l border-gray-200' : ''}`}>
                        {lbl}
                      </th>
                    ))}
                    {/* Metrics columns */}
                    {['kWh', 'P (W)', 'PF', 'THD', 'L1', 'L2', 'L3'].map((lbl, i) => (
                      <th key={`m_${lbl}`} className={`px-3 py-2 text-right text-xs font-semibold text-emerald-600 uppercase tracking-wide whitespace-nowrap ${i === 0 ? 'border-l border-gray-200' : ''}`}>
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((r, i) => {
                    const saved = r.energy_reduction;
                    const goodSave = saved != null && saved > 0;
                    const kwhDiff = (r.before_kWh != null && r.metrics_kWh != null)
                      ? r.before_kWh - r.metrics_kWh : null;
                    return (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white hover:bg-blue-50/20' : 'bg-gray-50/40 hover:bg-blue-50/20'} style={{ transition: 'background .1s' }}>
                        {/* Info */}
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{r.id}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-gray-800 text-xs">{r.device_name}</div>
                          <div className="text-gray-400 font-mono text-xs">{r.ge_id}</div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{r.site || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{fmtDate(r.record_time)}</td>
                        {/* Energy/CO2 */}
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-bold border-l border-gray-100">
                          <span className={goodSave ? 'text-blue-700' : 'text-gray-400'}>{fmt2(saved)}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs">
                          <span className={r.co2_reduction != null && r.co2_reduction > 0 ? 'text-teal-600 font-semibold' : 'text-gray-400'}>{fmt2(r.co2_reduction)}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs">
                          <span className={kwhDiff != null && kwhDiff > 0 ? 'text-blue-500' : 'text-gray-400'}>{fmt2(kwhDiff)}</span>
                        </td>
                        {/* Before */}
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-red-400 border-l border-gray-100">{fmt2(r.before_kWh)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-red-400">{fmt2(r.before_P)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-red-400">{fmt2(r.before_PF)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-red-400">{fmt2(r.before_THD)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-red-300">{fmt2(r.before_L1)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-red-300">{fmt2(r.before_L2)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-red-300">{fmt2(r.before_L3)}</td>
                        {/* Metrics */}
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-600 border-l border-gray-100">{fmt2(r.metrics_kWh)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-600">{fmt2(r.metrics_P)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-600">{fmt2(r.metrics_PF)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-600">{fmt2(r.metrics_THD)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-400">{fmt2(r.metrics_L1)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-400">{fmt2(r.metrics_L2)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-400">{fmt2(r.metrics_L3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
              <span className="text-xs text-gray-500">
                {L(locale, 'หน้า', 'Page', '페이지')} {page} / {pages}
                &nbsp;·&nbsp;
                {total.toLocaleString()} {L(locale, 'รายการ', 'records', '건')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchRecords(page - 1)}
                  disabled={page === 1 || loading}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => fetchRecords(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                        p === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchRecords(page + 1)}
                  disabled={page === pages || loading}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 2 · DATABASE BACKUP
        ══════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-emerald-900 text-base">
              {L(locale, 'แบ็คอัพฐานข้อมูล', 'Database Backup', '데이터베이스 백업')}
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Manual backup */}
            <div className="border border-emerald-100 rounded-xl p-5 bg-emerald-50/40">
              <h3 className="font-bold text-emerald-800 mb-1 flex items-center gap-2">
                <Download className="w-4 h-4" />
                {L(locale, 'แบ็คอัพทันที', 'Backup Now', '즉시 백업')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {L(locale,
                  'สร้าง mysqldump ของฐานข้อมูล goeunserverhub บันทึกเป็นไฟล์ .sql',
                  'Create a mysqldump of goeunserverhub database saved as .sql file',
                  'goeunserverhub 데이터베이스의 mysqldump를 .sql 파일로 저장'
                )}
              </p>
              <button
                onClick={runBackup}
                disabled={backupLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition text-sm"
              >
                {backupLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> {L(locale, 'กำลังสร้าง...', 'Creating...', '생성 중...')}</>
                ) : (
                  <><HardDrive className="w-4 h-4" /> {L(locale, 'สร้าง Backup', 'Create Backup', '백업 생성')}</>
                )}
              </button>
              {backupMsg && (
                <div className={`mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                  backupMsg.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {backupMsg.ok
                    ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span>{backupMsg.text}</span>
                </div>
              )}
            </div>

            {/* Auto schedule info */}
            <div className="border border-blue-100 rounded-xl p-5 bg-blue-50/30">
              <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {L(locale, 'แบ็คอัพอัตโนมัติ', 'Automatic Backup', '자동 백업')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-gray-600">
                    {L(locale, 'สถานะ: เปิดใช้งาน', 'Status: Enabled', '상태: 활성화')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-gray-600">
                    {L(locale, 'ตาราง: ทุกวันจันทร์ 00:00 (UTC+7)', 'Schedule: Every Monday 00:00 (UTC+7)', '일정: 매주 월요일 00:00 (UTC+7)')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                  <span className="text-gray-600">
                    {L(locale, 'ที่เก็บ: /backups/', 'Location: /backups/', '저장 위치: /backups/')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Backup file list */}
          <div className="border-t border-gray-100">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
              <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">
                <Database className="w-4 h-4 text-gray-400" />
                {L(locale, 'ไฟล์ Backup ทั้งหมด', 'Backup Files', '백업 파일')}
                {backupFiles.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-semibold">
                    {backupFiles.length}
                  </span>
                )}
              </h3>
              <button
                onClick={fetchBackups}
                disabled={backupListLoading}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${backupListLoading ? 'animate-spin' : ''}`} />
                {L(locale, 'รีเฟรช', 'Refresh', '새로고침')}
              </button>
            </div>
            {backupFiles.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">
                {L(locale, 'ยังไม่มีไฟล์ backup', 'No backup files yet', '백업 파일 없음')}
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {backupFiles.map((f) => (
                  <button
                    key={f.filename}
                    onClick={() => openViewer(f.filename)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-emerald-50 transition text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileCode2 className="w-4 h-4 text-emerald-500 flex-shrink-0 group-hover:text-emerald-700" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-emerald-700 group-hover:text-emerald-900 truncate font-mono underline-offset-2 group-hover:underline">
                          {f.filename}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(f.created).toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {f.size}
                      </span>
                      <span className="text-xs text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition">
                        {L(locale, 'ดูไฟล์ →', 'View →', '보기 →')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ══════════════════════════════════════════════
          SQL VIEWER MODAL
      ══════════════════════════════════════════════ */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-end"
          style={{ background: 'rgba(0,0,0,.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setViewerOpen(false); }}
        >
          <div className="w-full max-w-4xl bg-white flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCode2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-bold text-white truncate font-mono">
                  {viewerFile?.filename ?? L(locale, 'กำลังโหลด...', 'Loading...', '로딩 중...')}
                </span>
              </div>
              <button
                onClick={() => setViewerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewerLoading ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{L(locale, 'กำลังโหลดไฟล์...', 'Loading file...', '파일 로딩 중...')}</span>
              </div>
            ) : viewerFile ? (
              <>
                {/* Tab bar */}
                <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-2 gap-1">
                  {([
                    { key: 'info', icon: Info, label: L(locale, 'ข้อมูลไฟล์', 'File Info', '파일 정보') },
                    { key: 'tables', icon: Table2, label: L(locale, `ตาราง (${viewerFile.meta.tables.length})`, `Tables (${viewerFile.meta.tables.length})`, `테이블 (${viewerFile.meta.tables.length})`) },
                    { key: 'content', icon: FileCode2, label: L(locale, 'เนื้อหา SQL', 'SQL Content', 'SQL 내용') },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setViewerActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition ${
                        viewerActiveTab === tab.key
                          ? 'border-emerald-500 text-emerald-700 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-hidden flex flex-col">

                  {/* INFO TAB */}
                  {viewerActiveTab === 'info' && (
                    <div className="p-5 overflow-y-auto space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { icon: HardDrive, label: L(locale, 'ขนาดไฟล์', 'File Size', '파일 크기'), value: `${viewerFile.sizeMB} MB` },
                          { icon: FileCode2, label: L(locale, 'จำนวนบรรทัด', 'Line Count', '라인 수'), value: viewerFile.lineCount.toLocaleString() + (viewerFile.truncated ? ` (${L(locale,'แสดงแค่','showing first','처음')} ${viewerFile.truncatedAt})` : '') },
                          { icon: Server, label: L(locale, 'เซิร์ฟเวอร์', 'Server Host', '서버 호스트'), value: viewerFile.meta.host ?? '—' },
                          { icon: Database, label: L(locale, 'ฐานข้อมูล', 'Database', '데이터베이스'), value: viewerFile.meta.database ?? '—' },
                          { icon: Info, label: L(locale, 'MySQL Version', 'MySQL Version', 'MySQL 버전'), value: viewerFile.meta.serverVersion ?? '—' },
                          { icon: Clock, label: L(locale, 'วันที่ Dump', 'Dump Date', 'Dump 날짜'), value: viewerFile.meta.dumpDate ?? new Date(viewerFile.created).toLocaleString('th-TH') },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <Icon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 font-medium">{label}</p>
                              <p className="text-sm font-semibold text-gray-800 font-mono break-all">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {viewerFile.truncated && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {L(locale,
                            `ไฟล์ขนาดใหญ่ — แสดงเฉพาะ ${viewerFile.truncatedAt} แรก`,
                            `Large file — showing first ${viewerFile.truncatedAt} only`,
                            `대용량 파일 — 처음 ${viewerFile.truncatedAt}만 표시`
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TABLES TAB */}
                  {viewerActiveTab === 'tables' && (
                    <div className="p-5 overflow-y-auto">
                      <p className="text-xs text-gray-400 mb-3">
                        {L(locale, `พบ ${viewerFile.meta.tables.length} ตาราง`, `Found ${viewerFile.meta.tables.length} tables`, `${viewerFile.meta.tables.length}개 테이블 발견`)}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {viewerFile.meta.tables.map((tbl) => (
                          <div
                            key={tbl}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <Table2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="text-sm font-mono font-semibold text-slate-700">{tbl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CONTENT TAB */}
                  {viewerActiveTab === 'content' && (
                    <>
                      {/* Search bar */}
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder={L(locale, 'ค้นหาในไฟล์...', 'Search in file...', '파일에서 검색...')}
                          value={viewerSearch}
                          onChange={(e) => setViewerSearch(e.target.value)}
                          className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                        />
                        {viewerSearch && (
                          <span className="text-xs text-gray-400">
                            {filteredLines.length} {L(locale, 'บรรทัด', 'lines', '줄')}
                          </span>
                        )}
                        {viewerSearch && (
                          <button onClick={() => setViewerSearch('')} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {/* SQL content */}
                      <div className="flex-1 overflow-auto bg-slate-900 p-4">
                        <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {filteredLines.map((line, i) => {
                            // Simple SQL keyword highlighting via spans
                            const hl = line
                              .replace(/^(--.*)/g, '<span style="color:#6a9955">$1</span>')
                              .replace(/\b(CREATE TABLE|INSERT INTO|DROP TABLE|ALTER TABLE|LOCK TABLES|UNLOCK TABLES|SET|ENGINE|AUTO_INCREMENT|DEFAULT|PRIMARY KEY|KEY|CONSTRAINT|REFERENCES|NULL|NOT NULL)\b/g,
                                '<span style="color:#569cd6">$1</span>')
                              .replace(/\b(int|varchar|decimal|datetime|text|bigint|tinyint|char|float|double)\b/gi,
                                '<span style="color:#4ec9b0">$1</span>');
                            return (
                              <span key={i}>
                                <span style={{ color: '#4d4d4d', userSelect: 'none', marginRight: 12 }}>{String(i + 1).padStart(4)}</span>
                                <span
                                  style={{
                                    background: viewerSearch && line.toLowerCase().includes(viewerSearch.toLowerCase())
                                      ? 'rgba(255,215,0,.15)' : undefined,
                                  }}
                                  dangerouslySetInnerHTML={{ __html: hl }}
                                />
                                {'\n'}
                              </span>
                            );
                          })}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <AlertCircle className="w-5 h-5 mr-2" />
                {L(locale, 'โหลดไฟล์ไม่สำเร็จ', 'Failed to load file', '파일 로드 실패')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
