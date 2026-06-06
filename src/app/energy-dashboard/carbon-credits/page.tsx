'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/lib/LocaleContext';
import { useSite } from '@/lib/SiteContext';
import { GOLD_STANDARD_URLS, ISO14064MethodologySteps, getLocaleLabel } from '@/lib/carbon-calculations';
import { buildCarbonPrintHtml, buildCarbonReportScope } from '@/lib/energy/carbon-credits-print';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Zap,
  Leaf,
  DollarSign,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Search,
  Calculator,
  X,
  Printer,
} from 'lucide-react';
import './carbon-credits.css';

interface CarbonData {
  summary: {
    totalEnergySavedKwh: number;
    totalCo2Kg: number;
    carbonCreditsTonnes: number;
    estimatedValue: number;
    currency: string;
    creditPricePerTonne: number;
  };
  dailyTrend: Array<{
    date: string;
    energySavedKwh: number;
    co2Kg: number;
    carbonCreditsTonnes: number;
  }>;
  topDevices: Array<{
    deviceId: number;
    deviceName: string;
    GEsaveID: string;
    energySavedKwh: number;
    co2Kg: number;
    carbonCreditsTonnes: number;
  }>;
  insights: {
    aiNarrative: string | null;
    aiAvailable: boolean;
  };
}

interface DeviceAiInsights {
  [deviceId: number]: {
    aiNarrative: string | null;
    aiAvailable: boolean;
    loading: boolean;
  };
}

interface MeterRow {
  rank: number;
  deviceId: number;
  deviceName: string;
  GEsaveID: string;
  site: string;
  ch1Before: string;
  ch2After: string;
  totalKwhCh1Before: number;
  totalKwhCh2After: number;
  recordCount?: number;
  energySavedKwh: number;
  co2Kg: number;
  carbonCreditsTonnes: number;
  estimatedValueKRW: number;
  estimatedValueTHB: number;
}

interface MeterTotals {
  energySavedKwh: number;
  co2Kg: number;
  carbonCreditsTonnes: number;
  estimatedValueKRW: number;
  estimatedValueTHB: number;
  totalKwhCh1Before: number;
  totalKwhCh2After: number;
}

interface DeviceOption {
  deviceId: number;
  deviceName: string;
  GEsaveID: string;
  site: string;
}

function L(locale: string, th: string, en: string, ko: string): string {
  if (locale === 'th') return th;
  if (locale === 'ko') return ko;
  return en;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function formatCurrency(value: number, currency: string): string {
  if (currency === 'THB') return `฿${value.toLocaleString()}`;
  if (currency === 'KRW') return `₩${value.toLocaleString()}`;
  return `${value.toLocaleString()}`;
}

export default function CarbonCreditsPage() {
  const { locale } = useLocale();
  const { selectedSite } = useSite();
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<CarbonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMethodology, setExpandedMethodology] = useState(true);
  const [deviceAiInsights, setDeviceAiInsights] = useState<DeviceAiInsights>({});
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [meterTable, setMeterTable] = useState<{
    loading: boolean;
    meters: MeterRow[];
    totals: MeterTotals | null;
  }>({ loading: false, meters: [], totals: null });
  const [allDevices, setAllDevices] = useState<DeviceOption[]>([]);
  const [meterSearch, setMeterSearch] = useState('');
  const [pickedIds, setPickedIds] = useState<Set<number>>(new Set());
  /** Device IDs used for KPI / per-meter analysis after last Calculate (null = site-wide). */
  const [activeScopeIds, setActiveScopeIds] = useState<number[] | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [printLocale, setPrintLocale] = useState<'th' | 'en' | 'ko'>(locale as 'th' | 'en' | 'ko');
  const [printing, setPrinting] = useState(false);
  const [fxData, setFxData] = useState<{
    krwToThb: number | null;
    lastUpdated: string | null;
    loading: boolean;
  }>({ krwToThb: null, lastUpdated: null, loading: false });

  const fetchExchangeRate = useCallback(async () => {
    setFxData((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/KRW');
      const json = await res.json();
      if (json.result === 'success' && typeof json.rates?.THB === 'number') {
        setFxData({ krwToThb: json.rates.THB, lastUpdated: json.time_last_update_utc ?? null, loading: false });
      } else {
        setFxData((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setFxData((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const fetchAllDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/ge-energy/carbon-meters?list=true', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setAllDevices(json.devices);
    } catch { /* silent */ }
  }, []);

  const fetchMeterTable = useCallback(async (deviceIds?: number[]) => {
    setMeterTable((prev) => ({ ...prev, loading: true }));
    try {
      let url = `/api/ge-energy/carbon-meters?period=${period}`;
      if (deviceIds && deviceIds.length > 0) {
        url += `&deviceIds=${deviceIds.join(',')}`;
      } else {
        url += `&all=true`;
      }
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setMeterTable({ loading: false, meters: json.meters, totals: json.totals });
      } else {
        setMeterTable((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setMeterTable((prev) => ({ ...prev, loading: false }));
    }
  }, [period]);

  const fetchCarbonData = useCallback(async (scopeDeviceIds?: number[] | null) => {
    setLoading(true);
    setError(null);
    try {
      const ids =
        scopeDeviceIds !== undefined
          ? scopeDeviceIds
          : activeScopeIds;
      let url = `/api/ge-energy/ai-carbon-insights?site=${selectedSite}&period=${period}&locale=${locale}`;
      if (ids && ids.length > 0) {
        url += `&deviceIds=${ids.join(',')}`;
      }
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load carbon data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading carbon data');
    } finally {
      setLoading(false);
    }
  }, [selectedSite, period, locale, activeScopeIds]);

  const fetchDeviceAiInsights = useCallback(
    async (deviceId: number) => {
      setDeviceAiInsights((prev) => ({
        ...prev,
        [deviceId]: { aiNarrative: null, aiAvailable: false, loading: true },
      }));
      try {
        const res = await fetch(
          `/api/ge-energy/ai-carbon-insights?site=${selectedSite}&period=${period}&locale=${locale}&deviceId=${deviceId}`,
          { cache: 'no-store' }
        );
        const json = await res.json();
        if (json.success && json.data?.insights) {
          setDeviceAiInsights((prev) => ({
            ...prev,
            [deviceId]: {
              aiNarrative: json.data.insights.aiNarrative,
              aiAvailable: json.data.insights.aiAvailable,
              loading: false,
            },
          }));
        }
      } catch {
        setDeviceAiInsights((prev) => ({
          ...prev,
          [deviceId]: { aiNarrative: null, aiAvailable: false, loading: false },
        }));
      }
    },
    [selectedSite, period, locale]
  );

  useEffect(() => {
    if (meterTable.meters.length === 0) return;
    const scopeSet = activeScopeIds ? new Set(activeScopeIds) : null;
    const devices = meterTable.meters.filter(
      (m) => !scopeSet || scopeSet.has(m.deviceId),
    );
    if (!devices.length) return;
    void Promise.all(devices.map((m) => fetchDeviceAiInsights(m.deviceId)));
  }, [meterTable.meters, activeScopeIds, fetchDeviceAiInsights]);

  useEffect(() => {
    fetchCarbonData(activeScopeIds);
    fetchMeterTable(activeScopeIds ?? undefined);
    fetchExchangeRate();
    fetchAllDevices();
  }, [fetchCarbonData, fetchMeterTable, fetchExchangeRate, fetchAllDevices, activeScopeIds]);

  const printCarbonReport = useCallback(async () => {
    if (!data || printing) return;

    const t = (th: string, en: string, ko: string) =>
      printLocale === 'th' ? th : printLocale === 'ko' ? ko : en;

    const scope = buildCarbonReportScope({
      summary: data.summary,
      topDevices: data.topDevices || [],
      meters: meterTable.meters,
      meterTotals: meterTable.totals,
      activeScopeIds,
      pickedIds,
      selectedDeviceId,
    });

    const scopeLabel =
      scope.displayScopeSet && scope.analysisMeters.length > 0
        ? `${scope.analysisMeters.length} ${t('มิเตอร์ที่เลือก', 'selected meters', '선택 미터')}`
        : null;

    setPrinting(true);
    try {
      const deviceIds = scope.perDeviceCards.map((d) => d.deviceId);
      const saveRes = await fetch('/api/ge-energy/carbon-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: selectedSite,
          periodDays: period,
          locale: printLocale,
          deviceIds,
          meterCount: scope.perDeviceCards.length,
          summary: scope.displaySummary,
        }),
      });
      const saveJson = await saveRes.json();
      if (!saveJson.success || typeof saveJson.reportNumber !== 'string') {
        alert(saveJson.error || t('บันทึกเลขที่รายงานไม่สำเร็จ', 'Failed to save report number', '보고서 번호 저장 실패'));
        return;
      }

      const html = buildCarbonPrintHtml({
        reportId: saveJson.reportNumber,
        printLocale,
        period,
        selectedSite,
        summary: scope.displaySummary,
        creditPricePerTonne: data.summary.creditPricePerTonne,
        analysisMeters: scope.analysisMeters,
        perDeviceCards: scope.perDeviceCards,
        creditsDenominator: scope.creditsDenominator,
        scopedTotals: scope.scopedTotals,
        meterTotals: meterTable.totals,
        scopeLabel,
        pickedCount: pickedIds.size,
        selectedDeviceId,
        fxKrwToThb: fxData.krwToThb,
        fxLastUpdated: fxData.lastUpdated,
        dailyTrend: data.dailyTrend ?? [],
      });

      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) {
        alert(t('กรุณาอนุญาต popup เพื่อพิมพ์รายงาน', 'Please allow popups to print the report', '보고서 인쇄를 위해 팝업을 허용해 주세요'));
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    } catch {
      alert(t('เกิดข้อผิดพลาดขณะพิมพ์รายงาน', 'Error while printing report', '보고서 인쇄 중 오류'));
    } finally {
      setPrinting(false);
    }
  }, [data, fxData, meterTable, period, selectedSite, printLocale, activeScopeIds, pickedIds, selectedDeviceId, printing]);

  if (loading && !data) {
    return (
      <div className="cc-page">
        <div className="cc-hero">
          <div className="cc-hero-content">
            <h1>{L(locale, 'คำนวณคาร์บอนเครดิต', 'Carbon Credit Calculation', '탄소 크레딧 계산')}</h1>
          </div>
        </div>
        <div className="cc-loading">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <p>{L(locale, 'กำลังโหลด...', 'Loading...', '로딩 중...')}</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="cc-page">
        <div className="cc-hero">
          <h1>{L(locale, 'คำนวณคาร์บอนเครดิต', 'Carbon Credit Calculation', '탄소 크레딧 계산')}</h1>
        </div>
        <div className="cc-error">
          <AlertCircle className="w-6 h-6" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    displayScopeSet,
    analysisMeters,
    perDeviceCards,
    creditsDenominator,
    displaySummary,
  } = buildCarbonReportScope({
    summary: data.summary,
    topDevices: data.topDevices || [],
    meters: meterTable.meters,
    meterTotals: meterTable.totals,
    activeScopeIds,
    pickedIds,
    selectedDeviceId,
  });

  const chipMeters = analysisMeters.length > 0 ? analysisMeters : meterTable.meters;
  const tableScopeSet = displayScopeSet;

  const totalDevices = perDeviceCards.length;

  return (
    <div className="cc-page">
      {/* Hero Section */}
      <div className="cc-hero">
        <div className="cc-hero-content">
          <h1>{L(locale, 'คำนวณคาร์บอนเครดิต', 'Carbon Credit Calculation', '탄소 크레딧 계산')}</h1>
          <p>
            {L(
              locale,
              'ตามมาตรฐาน ISO 14064-2 สำหรับการคำนวณและรายงานก๊าซเรือนกระจก',
              'Based on ISO 14064-2 for GHG accounting and reporting',
              'ISO 14064-2 온실가스 회계 및 보고에 기반'
            )}
          </p>
        </div>
        <div className="flex flex-col gap-3 flex-shrink-0">
          {/* Print Report Button */}
          <button
            onClick={printCarbonReport}
            disabled={!data || printing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-emerald-700 font-bold rounded-xl border-2 border-white/80 shadow hover:bg-emerald-50 disabled:opacity-40 transition text-sm"
          >
            {printing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            {printing
              ? L(locale, 'กำลังบันทึก...', 'Saving...', '저장 중...')
              : L(locale, 'พิมพ์รายงาน ISO 14064-2', 'Print ISO 14064-2 Report', 'ISO 14064-2 보고서 인쇄')}
          </button>
          {/* Print language selector */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-white/70 text-xs">{L(locale, 'ภาษารายงาน:', 'Report lang:', '보고서 언어:')}</span>
            {(['th', 'en', 'ko'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setPrintLocale(l)}
                className={`px-2 py-1 rounded-lg text-xs font-bold border transition ${
                  printLocale === l
                    ? 'bg-white text-emerald-700 border-white shadow'
                    : 'bg-transparent text-white border-white/40 hover:bg-white/20'
                }`}
              >
                {l === 'th' ? 'ไทย' : l === 'ko' ? '한국어' : 'EN'}
              </button>
            ))}
          </div>
          <div className="cc-period-selector">
            <label>{L(locale, 'ช่วงเวลา', 'Period', '기간')}:</label>
            <select value={period} onChange={(e) => { setPeriod(Number(e.target.value)); }}>
              <option value={30}>30 {L(locale, 'วัน', 'days', '일')}</option>
              <option value={90}>90 {L(locale, 'วัน', 'days', '일')}</option>
              <option value={365}>365 {L(locale, 'วัน', 'days', '일')}</option>
            </select>
          </div>
          {/* Meter selector chips */}
          <div className="flex flex-wrap gap-2 px-1">
            <button
              onClick={() => setSelectedDeviceId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                selectedDeviceId === null
                  ? 'bg-white text-emerald-700 border-white shadow'
                  : 'bg-transparent text-white border-white/50 hover:bg-white/20'
              }`}
            >
              {L(locale, '📊 ทั้งหมด', '📊 All Meters', '📊 전체')}
            </button>
            {chipMeters.map((m) => (
              <button
                key={m.deviceId}
                onClick={() => setSelectedDeviceId(m.deviceId === selectedDeviceId ? null : m.deviceId)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                  selectedDeviceId === m.deviceId
                    ? 'bg-white text-emerald-700 border-white shadow'
                    : 'bg-transparent text-white border-white/50 hover:bg-white/20'
                }`}
              >
                ⚡ {m.GEsaveID || m.deviceName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="cc-kpi-grid">
        <div className="cc-kpi-card">
          <div className="cc-kpi-icon cc-icon-carbon">
            <Leaf className="w-6 h-6" />
          </div>
          <p className="cc-kpi-val">{fmt(displaySummary.carbonCreditsTonnes)}</p>
          <p className="cc-kpi-label">{L(locale, 'คาร์บอนเครดิต', 'Carbon Credits', '탄소 크레딧')}</p>
          <p className="cc-kpi-unit">{L(locale, 'tCO₂e', 'tCO₂e', 'tCO₂e')}</p>
        </div>
        <div className="cc-kpi-card">
          <div className="cc-kpi-icon cc-icon-co2">
            <Zap className="w-6 h-6" />
          </div>
          <p className="cc-kpi-val">{fmt(displaySummary.totalCo2Kg)}</p>
          <p className="cc-kpi-label">{L(locale, 'CO₂ ลดลง', 'CO₂ Avoided', 'CO₂ 회피')}</p>
          <p className="cc-kpi-unit">kg CO₂</p>
        </div>
        <div className="cc-kpi-card">
          <div className="cc-kpi-icon cc-icon-value">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="cc-kpi-val">{formatCurrency(displaySummary.estimatedValue, displaySummary.currency)}</p>
          {fxData.krwToThb ? (
            <p className="text-sm font-semibold text-amber-600 mt-0.5">
              {displaySummary.currency === 'KRW'
                ? `≈ ฿${Math.round(displaySummary.estimatedValue * fxData.krwToThb).toLocaleString()}`
                : `≈ ₩${Math.round(displaySummary.estimatedValue / fxData.krwToThb).toLocaleString()}`}
            </p>
          ) : (
            <p className="text-xs text-gray-300 mt-0.5">...</p>
          )}
          <p className="cc-kpi-label">{L(locale, 'มูลค่า', 'Market Value', '시장 가치')}</p>
          <p className="cc-kpi-unit">{displaySummary.currency}</p>
        </div>
        <div className="cc-kpi-card">
          <div className="cc-kpi-icon cc-icon-energy">
            <TrendingDown className="w-6 h-6" />
          </div>
          <p className="cc-kpi-val">{fmt(displaySummary.totalEnergySavedKwh)}</p>
          <p className="cc-kpi-label">{L(locale, 'ไฟฟ้าประหยัด', 'Energy Saved', '에너지 절감')}</p>
          <p className="cc-kpi-unit">kWh</p>
        </div>
      </div>

      {/* Step Flow Map */}
      <div className="cc-card">
        <h2 className="cc-card-title">
          {L(locale, 'แผนผังขั้นตอนการคำนวณ ISO 14064-2', 'ISO 14064-2 Calculation Flow', 'ISO 14064-2 계산 흐름도')}
        </h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-stretch gap-0 min-w-max py-2">
            {(() => {
              const krw7 = displaySummary.currency === 'KRW'
                ? formatCurrency(displaySummary.estimatedValue, 'KRW')
                : fxData.krwToThb
                  ? formatCurrency(Math.round(displaySummary.estimatedValue / fxData.krwToThb), 'KRW')
                  : '—';
              const thb7 = displaySummary.currency === 'THB'
                ? formatCurrency(displaySummary.estimatedValue, 'THB')
                : fxData.krwToThb
                  ? formatCurrency(Math.round(displaySummary.estimatedValue * fxData.krwToThb), 'THB')
                  : '—';
              const steps = [
                {
                  step: 1, icon: '📊', color: 'blue',
                  th: 'ค่าฐาน', en: 'Baseline', ko: '기준선',
                  formula: 'Σ monthly before', value: L(locale, 'ก่อนติดตั้ง', 'Pre-install', '설치 전'), unit: 'kWh',
                },
                {
                  step: 2, icon: '⚡', color: 'indigo',
                  th: 'การใช้จริง', en: 'Actual', ko: '실제 소비',
                  formula: 'Σ monthly after', value: L(locale, 'หลังติดตั้ง', 'Post-install', '설치 후'), unit: 'kWh',
                },
                {
                  step: 3, icon: '💡', color: 'green',
                  th: 'ไฟประหยัด', en: 'Energy Saved', ko: '절감 에너지',
                  formula: 'baseline − actual', value: fmt(displaySummary.totalEnergySavedKwh), unit: 'kWh',
                },
                {
                  step: 4, icon: '🏭', color: 'purple',
                  th: 'ค่าแฟกเตอร์', en: 'Emission Factor', ko: '배출 계수',
                  formula: '× 0.5135 kg/kWh', value: '0.5135', unit: 'kgCO₂/kWh',
                },
                {
                  step: 5, icon: '🌿', color: 'orange',
                  th: 'CO₂ ลดลง', en: 'CO₂ Avoided', ko: 'CO₂ 회피',
                  formula: 'energy × factor', value: fmt(displaySummary.totalCo2Kg), unit: 'kg CO₂',
                },
                {
                  step: 6, icon: '🎯', color: 'teal',
                  th: 'คาร์บอนเครดิต', en: 'Carbon Credits', ko: '탄소 크레딧',
                  formula: 'CO₂ kg ÷ 1000', value: fmt(displaySummary.carbonCreditsTonnes), unit: 'tCO₂e',
                },
                {
                  step: 7, icon: '💰', color: 'yellow',
                  th: 'มูลค่าตลาด', en: 'Market Value', ko: '시장 가치',
                  formula: 'credits × price', value: `${krw7}`, unit: `THB: ${thb7}`,
                },
              ];
              const colors: Record<string, { bg: string; border: string; text: string; num: string }> = {
                blue:   { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-700',   num: 'bg-blue-500' },
                indigo: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', num: 'bg-indigo-500' },
                green:  { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-700',  num: 'bg-green-500' },
                purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', num: 'bg-purple-500' },
                orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', num: 'bg-orange-500' },
                teal:   { bg: 'bg-teal-50',   border: 'border-teal-300',   text: 'text-teal-700',   num: 'bg-teal-500' },
                yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', num: 'bg-yellow-500' },
              };
              return steps.map((s, i) => {
                const c = colors[s.color];
                const title = locale === 'ko' ? s.ko : locale === 'th' ? s.th : s.en;
                return (
                  <div key={s.step} className="flex items-center">
                    <div className={`w-36 rounded-xl border-2 ${c.border} ${c.bg} p-3 flex flex-col items-center text-center shadow-sm`}>
                      <div className={`${c.num} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-1`}>
                        {s.step}
                      </div>
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <p className={`text-xs font-semibold ${c.text} leading-tight mb-1.5`}>{title}</p>
                      <code className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 mb-2 leading-tight w-full truncate">{s.formula}</code>
                      <p className={`text-sm font-bold ${c.text} leading-tight`}>{s.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.unit}</p>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="px-1 text-gray-300 text-xl font-light select-none">→</div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Per-Meter Carbon Credits Table */}
      <div className="cc-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="cc-card-title" style={{ margin: 0 }}>
            {L(locale, 'ตารางคาร์บอนเครดิตรายมิเตอร์', 'Carbon Credits per Meter', '미터별 탄소 크레딧')}
            {pickedIds.size > 0 && (
              <span className="ml-2 text-sm font-normal text-emerald-600">({pickedIds.size} {L(locale, 'มิเตอร์', 'meters', '미터')})</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition"
            >
              <Search className="w-4 h-4" />
              {L(locale, 'เลือกมิเตอร์', 'Select Meters', '미터 선택')}
            </button>
            <button
              onClick={() => {
                setSelectedDeviceId(null);
                const ids = pickedIds.size > 0 ? Array.from(pickedIds) : null;
                setActiveScopeIds(ids);
                fetchMeterTable(ids ?? undefined);
                fetchCarbonData(ids);
              }}
              disabled={meterTable.loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <Calculator className="w-4 h-4" />
              {meterTable.loading
                ? L(locale, 'กำลังคำนวณ...', 'Calculating...', '계산 중...')
                : L(locale, 'คำนวณ', 'Calculate', '계산')}
            </button>
          </div>
        </div>

        {/* Meter Picker Panel */}
        {showPicker && (
          <div className="mb-4 border border-emerald-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border-b border-emerald-100">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={L(locale, 'ค้นหามิเตอร์ (ชื่อ / ID)...', 'Search meters (name / ID)...', '미터 검색 (이름 / ID)...')}
                value={meterSearch}
                onChange={(e) => setMeterSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
              />
              {meterSearch && (
                <button onClick={() => setMeterSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>
              )}
            </div>
            <div className="flex items-center gap-3 px-3 py-2 bg-white border-b border-gray-100 text-xs">
              <button
                onClick={() => setPickedIds(new Set(allDevices.map((d) => d.deviceId)))}
                className="text-emerald-600 font-semibold hover:underline"
              >
                {L(locale, '✓ เลือกทั้งหมด', '✓ Select All', '✓ 전체 선택')}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setPickedIds(new Set())}
                className="text-gray-400 font-semibold hover:underline"
              >
                {L(locale, 'ล้างทั้งหมด', 'Clear All', '전체 해제')}
              </button>
              <span className="ml-auto text-gray-400">
                {pickedIds.size > 0
                  ? `${pickedIds.size} ${L(locale, 'เลือกแล้ว', 'selected', '선택됨')}`
                  : L(locale, 'ยังไม่ได้เลือก (คำนวณทั้งหมด)', 'None selected (calculate all)', '선택 없음 (전체 계산)')}
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
              {allDevices
                .filter((d) => {
                  const q = meterSearch.toLowerCase();
                  return !q || d.deviceName.toLowerCase().includes(q) || d.GEsaveID.toLowerCase().includes(q) || d.site.toLowerCase().includes(q);
                })
                .map((d) => {
                  const checked = pickedIds.has(d.deviceId);
                  return (
                    <label
                      key={d.deviceId}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-emerald-50 transition ${checked ? 'bg-emerald-50' : 'bg-white'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setPickedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(d.deviceId)) next.delete(d.deviceId);
                            else next.add(d.deviceId);
                            return next;
                          });
                        }}
                        className="accent-emerald-600 w-4 h-4 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${checked ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {d.deviceName}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">{d.GEsaveID} {d.site ? `· ${d.site}` : ''}</p>
                      </div>
                    </label>
                  );
                })}
              {allDevices.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">{L(locale, 'ไม่พบอุปกรณ์', 'No devices found', '장치 없음')}</p>
              )}
            </div>
          </div>
        )}

        {meterTable.loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">{L(locale, 'กำลังคำนวณ...', 'Calculating...', '계산 중...')}</span>
          </div>
        ) : meterTable.meters.length === 0 ? (
          <div className="text-center py-10">
            <Calculator className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold text-sm">
              {L(locale, 'กดปุ่ม "คำนวณ" เพื่อดึงข้อมูลมิเตอร์', 'Press "Calculate" to load meter data', '"계산" 버튼을 눌러 미터 데이터 로드')}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {L(locale, 'หรือเลือกมิเตอร์ที่ต้องการก่อน แล้วกดคำนวณ', 'Or select specific meters first, then calculate', '먼저 미터를 선택하거나 전체 계산')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-emerald-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'มิเตอร์', 'Meter', '미터')}
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Meter ID</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'CH1 ก่อน', 'CH1 Before', 'CH1 설치 전')}
                  </th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'CH2 หลัง', 'CH2 After', 'CH2 설치 후')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'kWh CH1 ก่อน', 'Total kWh CH1 Before', 'CH1 설치 전 kWh')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'kWh CH2 หลัง', 'Total kWh CH2 After', 'CH2 설치 후 kWh')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'ไฟประหยัด', 'kWh Saved', '절감 kWh')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">CO₂ (kg)</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'เครดิต', 'Credits', '크레딧')} (tCO₂e)
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'มูลค่า', 'Value', '가치')} (KRW)
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                    {L(locale, 'มูลค่า', 'Value', '가치')} (THB)
                  </th>
                </tr>
              </thead>
              <tbody>
                {meterTable.meters
                  .filter((m) => !tableScopeSet || tableScopeSet.has(m.deviceId))
                  .map((m) => {
                    const isSelected = selectedDeviceId === m.deviceId;
                    const hasTelemetry = (m.recordCount ?? 0) > 0 || m.energySavedKwh > 0;
                    const thbValue = fxData.krwToThb
                      ? Math.round(m.estimatedValueKRW * fxData.krwToThb)
                      : m.estimatedValueTHB;
                    return (
                      <tr
                        key={m.deviceId}
                        onClick={() => setSelectedDeviceId(m.deviceId === selectedDeviceId ? null : m.deviceId)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-100'
                            : !hasTelemetry
                              ? 'bg-gray-50/60 hover:bg-gray-50'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-3 text-gray-400 font-mono">{m.rank}</td>
                        <td className="py-3 px-3">
                          <span className={`font-semibold ${isSelected ? 'text-emerald-700' : 'text-gray-800'}`}>
                            {m.deviceName}
                          </span>
                          {!hasTelemetry && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {L(locale, 'ไม่มีข้อมูลในช่วงที่เลือก', 'No data in selected period', '선택 기간 데이터 없음')}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-gray-500">{m.GEsaveID}</td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-orange-700">{m.ch1Before}</td>
                        <td className="py-3 px-3 text-center font-mono text-xs text-indigo-700">{m.ch2After}</td>
                        <td className="py-3 px-3 text-right font-medium text-orange-600">{fmt(m.totalKwhCh1Before)}</td>
                        <td className="py-3 px-3 text-right font-medium text-indigo-600">{fmt(m.totalKwhCh2After)}</td>
                        <td className="py-3 px-3 text-right font-medium text-blue-700">{fmt(m.energySavedKwh)}</td>
                        <td className="py-3 px-3 text-right font-medium text-orange-600">{fmt(m.co2Kg)}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">{fmt(m.carbonCreditsTonnes)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-purple-700">₩{m.estimatedValueKRW.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-semibold text-amber-700">฿{thbValue.toLocaleString()}</td>
                      </tr>
                    );
                  })}
              </tbody>
              {(selectedDeviceId === null && meterTable.totals && perDeviceCards.length !== 1) && (
                <tfoot>
                  <tr className="border-t-2 border-emerald-200 bg-emerald-50">
                    <td className="py-3 px-3" colSpan={3}>
                      <span className="font-bold text-emerald-800">
                        {L(locale, '✓ รวมทั้งหมด', '✓ Grand Total', '✓ 합계')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-400">—</td>
                    <td className="py-3 px-3 text-center font-bold text-gray-400">—</td>
                    <td className="py-3 px-3 text-right font-bold text-orange-600">
                      {fmt(meterTable.totals.totalKwhCh1Before)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-600">
                      {fmt(meterTable.totals.totalKwhCh2After)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-blue-700">
                      {fmt(meterTable.totals.energySavedKwh)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-orange-600">
                      {fmt(meterTable.totals.co2Kg)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {fmt(meterTable.totals.carbonCreditsTonnes)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-purple-700">
                      ₩{meterTable.totals.estimatedValueKRW.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-700">
                      ฿{(fxData.krwToThb
                        ? Math.round(meterTable.totals.estimatedValueKRW * fxData.krwToThb)
                        : meterTable.totals.estimatedValueTHB
                      ).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            {fxData.krwToThb && (
              <p className="text-xs text-gray-400 mt-2 text-right">
                * THB {L(locale, 'คำนวณจากอัตราแลกเปลี่ยนสด', 'calculated from live rate', '실시간 환율 적용')}:
                1 KRW = {fxData.krwToThb.toFixed(6)} THB
              </p>
            )}
          </div>
        )}
      </div>

      {/* Methodology Section */}
      <div className="cc-card">
        <div className="cc-methodology-header">
          <div onClick={() => setExpandedMethodology(!expandedMethodology)} className="cc-methodology-title">
            {expandedMethodology ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            <h2>{L(locale, 'ขั้นตอนการคำนวณ ISO 14064-2', 'ISO 14064-2 Calculation Steps', 'ISO 14064-2 계산 단계')}</h2>
          </div>
        </div>
        {expandedMethodology && (
          <div className="cc-methodology-steps">
            {ISO14064MethodologySteps.map((step) => (
              <div key={step.step} className="cc-step">
                <div className="cc-step-number">{step.step}</div>
                <div className="cc-step-content">
                  <h3 className="cc-step-title">
                    {locale === 'th' ? step.titleTh : locale === 'ko' ? step.titleKo : step.titleEn}
                  </h3>
                  <p className="cc-step-description">
                    {locale === 'th'
                      ? step.descriptionTh
                      : locale === 'ko'
                        ? step.descriptionKo
                        : step.descriptionEn}
                  </p>
                  <div className="cc-step-formula">
                    <span className="cc-formula-label">Formula:</span>
                    <code>{step.formula}</code>
                    <span className="cc-formula-unit">{step.unit}</span>
                  </div>
                  {/* Example calculation */}
                  <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <span className="font-bold mr-1">
                      {locale === 'th' ? '📐 ตัวอย่าง:' : locale === 'ko' ? '📐 예시:' : '📐 Example:'}
                    </span>
                    {locale === 'th' ? step.exampleTh : locale === 'ko' ? step.exampleKo : step.exampleEn}
                  </div>
                  {/* Reference */}
                  <div className="mt-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
                    <span className="font-semibold text-gray-600 mr-1">
                      {locale === 'th' ? '📄 อ้างอิง:' : locale === 'ko' ? '📄 참고:' : '📄 Reference:'}
                    </span>
                    {step.reference}
                  </div>
                  {/* Certifications */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {step.certifications.map((cert, i) => (
                      <a
                        key={i}
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={cert.body}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-medium hover:bg-emerald-100 transition"
                      >
                        <span>✓</span>
                        <span>{cert.standard}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Trend Chart */}
      {data.dailyTrend && data.dailyTrend.length > 0 && (
        <div className="cc-card">
          <h2 className="cc-card-title">{L(locale, 'แนวโน้มคาร์บอนประจำวัน', 'Daily Carbon Trend', '일일 탄소 추세')}</h2>
          <div className="cc-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyTrend}>
                <defs>
                  <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => {
                    if (typeof value === 'number') return fmt(value);
                    return value;
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="carbonCreditsTonnes"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCredit)"
                  name={L(locale, 'คาร์บอนเครดิต', 'Carbon Credits', '탄소 크레딧')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Device Breakdown */}
      {perDeviceCards.length > 0 && (
        <div className="cc-card">
          <h2 className="cc-card-title">
            {L(locale, 'การวิเคราะห์ต่อตัวมิเตอร์', 'Per-Device Analysis', '장치별 분석')} ({totalDevices})
            {activeScopeIds && activeScopeIds.length > 0 && (
              <span className="ml-2 text-sm font-normal text-emerald-600">
                · {L(locale, 'ตามมิเตอร์ที่เลือก', 'selected meters', '선택한 미터')}
              </span>
            )}
          </h2>
          <div className="cc-devices-grid">
            {perDeviceCards.map((device) => {
              const contribution =
                creditsDenominator > 0
                  ? (device.carbonCreditsTonnes / creditsDenominator) * 100
                  : 0;
              const ai = deviceAiInsights[device.deviceId];
              const isFocused = selectedDeviceId === device.deviceId;

              return (
                <div
                  key={device.deviceId}
                  className={`cc-device-card ${isFocused ? 'ring-2 ring-emerald-400' : ''}`}
                  onClick={() =>
                    setSelectedDeviceId(device.deviceId === selectedDeviceId ? null : device.deviceId)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedDeviceId(device.deviceId === selectedDeviceId ? null : device.deviceId);
                    }
                  }}
                >
                  <div className="cc-device-header">
                    <h3>{device.deviceName}</h3>
                    <p className="cc-device-id">{device.GEsaveID}</p>
                  </div>
                  <div className="cc-device-stats">
                    <div className="cc-stat">
                      <span className="cc-stat-label">{L(locale, 'ไฟประหยัด', 'Energy Saved', '에너지 절감')}</span>
                      <span className="cc-stat-value">{fmt(device.energySavedKwh)} kWh</span>
                    </div>
                    <div className="cc-stat">
                      <span className="cc-stat-label">CO₂</span>
                      <span className="cc-stat-value">{fmt(device.co2Kg)} kg</span>
                    </div>
                    <div className="cc-stat">
                      <span className="cc-stat-label">{L(locale, 'คาร์บอนเครดิต', 'Carbon Credits', '탄소 크레딧')}</span>
                      <span className="cc-stat-value">{fmt(device.carbonCreditsTonnes)} tCO₂e</span>
                    </div>
                    <div className="cc-stat">
                      <span className="cc-stat-label">{L(locale, 'สัดส่วน', 'Share', '비율')}</span>
                      <span className="cc-stat-value">{fmt(contribution)}%</span>
                    </div>
                  </div>
                  {ai && (ai.aiAvailable || ai.aiNarrative) && (
                    <div className="cc-device-ai">
                      <p className="cc-ai-label">
                        {L(locale, 'AI รายงาน', 'AI Report', 'AI 보고서')}
                      </p>
                      {ai.loading ? (
                        <p className="cc-ai-loading">{L(locale, 'วิเคราะห์...', 'Analyzing...', '분석 중...')}</p>
                      ) : ai.aiNarrative ? (
                        <p className="cc-ai-text">{ai.aiNarrative}</p>
                      ) : (
                        <p className="cc-ai-fallback">{L(locale, 'ไม่มี AI ขณะนี้', 'AI analysis not available', 'AI 분석 사용 불가')}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Market Info */}
      <div className="cc-card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="cc-card-title" style={{ margin: 0 }}>
            {L(locale, 'ข้อมูลตลาดคาร์บอน', 'Carbon Market Info', '탄소 시장 정보')}
          </h2>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {L(locale, 'อัตราแลกเปลี่ยนเรียลไทม์', 'Live Exchange Rate', '실시간 환율')}
          </span>
        </div>

        {/* System price rows */}
        <div className="cc-market-info mb-5">
          <div className="cc-market-row">
            <span>{L(locale, 'ราคาต่อตัน', 'Price per Tonne', '톤당 가격')} (KRW):</span>
            <strong>
              {data.summary.currency === 'KRW'
                ? formatCurrency(data.summary.creditPricePerTonne, 'KRW')
                : fxData.krwToThb
                  ? formatCurrency(Math.round(data.summary.creditPricePerTonne / fxData.krwToThb), 'KRW')
                  : '—'}
            </strong>
          </div>
          <div className="cc-market-row">
            <span>{L(locale, 'ราคาต่อตัน', 'Price per Tonne', '톤당 가격')} (THB):</span>
            <strong>
              {data.summary.currency === 'THB'
                ? formatCurrency(data.summary.creditPricePerTonne, 'THB')
                : fxData.krwToThb
                  ? formatCurrency(Math.round(data.summary.creditPricePerTonne * fxData.krwToThb), 'THB')
                  : '—'}
            </strong>
          </div>
          <div className="cc-market-row">
            <span>{L(locale, 'สกุลเงิน', 'Currency', '통화')}:</span>
            <strong>{data.summary.currency}</strong>
          </div>
          <div className="cc-market-row">
            <span>{L(locale, 'อัตราแลกเปลี่ยน', 'Exchange Rate', '환율')}:</span>
            <span className="flex items-center gap-2">
              {fxData.loading ? (
                <span className="text-gray-400 text-sm">{L(locale, 'กำลังโหลด...', 'Loading...', '로딩 중...')}</span>
              ) : fxData.krwToThb ? (
                <span className="text-sm font-medium text-gray-700">
                  1 KRW = {fxData.krwToThb.toFixed(6)} THB
                  {fxData.lastUpdated && (
                    <span className="text-gray-400 text-xs ml-2">
                      ({L(locale, 'อัปเดต', 'Updated', '업데이트')}: {new Date(fxData.lastUpdated).toLocaleDateString()})
                    </span>
                  )}
                </span>
              ) : <span className="text-gray-400 text-sm">—</span>}
              <button onClick={fetchExchangeRate} disabled={fxData.loading}
                className="p-1 hover:bg-gray-100 rounded transition disabled:opacity-50"
                title={L(locale, 'รีเฟรชอัตราแลกเปลี่ยน', 'Refresh exchange rate', '환율 새로고침')}>
                <RefreshCw className={`w-3 h-3 text-gray-400 ${fxData.loading ? 'animate-spin' : ''}`} />
              </button>
            </span>
          </div>
        </div>

        {/* Reference Market Prices */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            {L(locale, '📊 ราคาอ้างอิงตลาดคาร์บอน (แหล่งทางการ)', '📊 Carbon Market Reference Prices (Official Sources)', '📊 탄소 시장 참고 가격 (공식 출처)')}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                flag: '🇹🇭',
                market: 'Thailand T-VER',
                org: 'TGO (องค์การบริหารจัดการก๊าซเรือนกระจก)',
                price: L(locale, '฿250–400 / tCO₂e', '฿250–400 / tCO₂e', '฿250–400 / tCO₂e'),
                note: L(locale, 'ตลาดคาร์บอนภาคสมัครใจ 2567', 'Voluntary Carbon Market 2024', '자발적 탄소 시장 2024'),
                url: 'https://carbonmarket.tgo.or.th',
                urlHost: 'carbonmarket.tgo.or.th',
                badge: 'T-VER',
                color: 'blue',
              },
              {
                flag: '🇰🇷',
                market: 'Korea K-ETS',
                org: 'KRX (Korea Exchange)',
                price: L(locale, '₩7,000–35,000 / tCO₂e', '₩7,000–35,000 / tCO₂e', '₩7,000–35,000 / tCO₂e'),
                note: L(locale, 'ระบบซื้อขายสิทธิ์การปล่อยก๊าซ 2567', 'Emissions Trading System 2024', '배출권거래제 2024'),
                url: 'https://ets.krx.co.kr',
                urlHost: 'ets.krx.co.kr',
                badge: 'K-ETS',
                color: 'purple',
              },
              {
                flag: '🌍',
                market: 'World Bank Carbon Pricing',
                org: 'World Bank Group',
                price: L(locale, '$5–130 / tCO₂e (USD)', '$5–130 / tCO₂e (USD)', '$5–130 / tCO₂e (USD)'),
                note: L(locale, 'ภาพรวมราคาคาร์บอนโลก 2567', 'Global Carbon Pricing Overview 2024', '글로벌 탄소 가격 개요 2024'),
                url: 'https://carbonpricingdashboard.worldbank.org',
                urlHost: 'carbonpricingdashboard.worldbank.org',
                badge: 'World Bank',
                color: 'green',
              },
              {
                flag: '🌐',
                market: 'Gold Standard for the Global Goals (GS4GG)',
                org: 'Gold Standard Foundation',
                price: L(locale, '$3–50 / tCO₂e (USD)', '$3–50 / tCO₂e (USD)', '$3–50 / tCO₂e (USD)'),
                note: L(
                  locale,
                  'ทะเบียนเครดิตที่ตรวจสอบและรับรองแล้ว (Impact Registry)',
                  'Verified credits on the official Impact Registry',
                  '공식 Impact Registry의 검증된 크레딧',
                ),
                url: GOLD_STANDARD_URLS.registry,
                urlHost: GOLD_STANDARD_URLS.registryHost,
                standardUrl: GOLD_STANDARD_URLS.standard,
                standardHost: GOLD_STANDARD_URLS.standardHost,
                badge: 'Gold Standard',
                color: 'amber',
              },
            ].map((src) => (
              <div key={src.market}
                className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition group">
                <span className="text-2xl flex-shrink-0">{src.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={src.url} target="_blank" rel="noopener noreferrer"
                      className="font-bold text-sm text-gray-800 group-hover:text-emerald-700 hover:underline">
                      {src.market}
                    </a>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                      src.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      src.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                      src.color === 'green' ? 'bg-green-100 text-green-700' :
                      'bg-amber-100 text-amber-700'}`}>
                      {src.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{src.org}</p>
                  <a href={src.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-emerald-700/80 hover:text-emerald-800 hover:underline mt-0.5 inline-flex items-center gap-1">
                    {src.urlHost}
                    <span className="text-gray-300 group-hover:text-emerald-500">↗</span>
                  </a>
                  {'standardUrl' in src && src.standardUrl ? (
                    <a href={src.standardUrl} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-gray-400 hover:text-emerald-700 hover:underline mt-0.5">
                      {L(locale, 'มาตรฐาน GS4GG', 'GS4GG standard', 'GS4GG 표준')}: {src.standardHost} ↗
                    </a>
                  ) : null}
                  <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                    <span className="text-sm font-bold text-emerald-700">{src.price}</span>
                    <span className="text-xs text-gray-400">{src.note}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            {L(
              locale,
              '* ราคาอ้างอิงจากแหล่งทางการ TGO, KRX, World Bank, Gold Standard — ราคาจริงอาจผันแปรตามตลาด อัตราแลกเปลี่ยนดึงจาก open.er-api.com แบบเรียลไทม์',
              '* Reference prices from official sources: TGO, KRX, World Bank, Gold Standard — actual prices may vary. Exchange rate fetched live from open.er-api.com',
              '* 참고 가격은 TGO, KRX, World Bank, Gold Standard 공식 출처 기준 — 실제 가격은 시장에 따라 변동. 환율은 open.er-api.com에서 실시간 제공'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
