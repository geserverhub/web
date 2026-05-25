'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from '@/lib/LocaleContext';
import { useSite } from '@/lib/SiteContext';
import { formatCurrencyBySite, getCurrencyCodeBySite, getCurrencySymbolBySite } from '@/lib/currency';
import { formatEnergyDisplayUser } from '@/lib/energy/display-user';
import { GE_ADMIN_USER_KEY } from '@/lib/ge-storage-keys';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Zap, TrendingDown, DollarSign, Leaf, Phone,
  CheckCircle, Send, Activity, Cpu, Wifi, WifiOff, RefreshCw,
  Thermometer, ChevronDown, BarChart2, Users, Sprout, Download,
  AlertCircle,
} from 'lucide-react';
import { generateMonthlyEnergyExcel } from '@/lib/excel-export';

function L(locale, th, ko, en) {
  if (locale === 'th') return th;
  if (locale === 'ko') return ko;
  return en;
}
function fmt(n) { return n.toLocaleString(); }

function readStoredCustomerUser() {
  try {
    const raw = localStorage.getItem(GE_ADMIN_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildCustomerDashboardQuery(user, deviceId) {
  const params = new URLSearchParams();
  if (user?.userId) params.set('userId', String(user.userId));
  if (user?.clientId) params.set('clientId', String(user.clientId));
  if (user?.email) params.set('email', String(user.email));
  if (user?.phone) params.set('phone', String(user.phone));
  if (user?.username) params.set('username', String(user.username));
  if (deviceId) params.set('deviceId', String(deviceId));
  return params.toString();
}

function AiEnergyInsightPanel({ monthlyData, locale, site }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (!monthlyData || monthlyData.length === 0) {
      setAiInsights(null);
      return;
    }

    const fetchAiInsights = async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const response = await fetch('/api/ge-energy/ai-energy-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthly: monthlyData, locale, site }),
        });

        const json = await response.json();
        if (json.success && json.data?.insights) {
          setAiInsights(json.data);
        } else {
          setAiError(json.error || 'Failed to load AI insights');
        }
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'Error loading insights');
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiInsights();
  }, [monthlyData, locale, site]);

  if (aiLoading) {
    return (
      <div className="cd-card cd-ai-panel">
        <div className="cd-card-accent cd-card-accent--energy" />
        <div className="cd-card-body">
          <h2 className="cd-card-title">{L(locale, 'AI วิเคราะห์แนวโน้มไฟ', 'AI 전력 분석', 'AI Energy Analysis')}</h2>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <p>{L(locale, 'กำลังวิเคราะห์...', '분석 중...', 'Analyzing...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!aiInsights) return null;

  const { insights, aiAvailable, ruleBasedFallback } = aiInsights;
  const fallbackLabel = ruleBasedFallback ? ` (${L(locale, 'วิเคราะห์อัตโนมัติ', '자동 분석', 'Auto Analysis')})` : '';

  return (
    <div className="cd-card cd-ai-panel">
      <div className="cd-card-accent cd-card-accent--energy" />
      <div className="cd-card-body">
        <h2 className="cd-card-title">
          {L(locale, 'AI วิเคราะห์แนวโน้มไฟ', 'AI 전력 분석', 'AI Energy Analysis')}
          {fallbackLabel}
        </h2>

        {/* Trend Summary */}
        <div className="cd-ai-section">
          <div className="cd-ai-badge-trend">
            <TrendingDown className="w-4 h-4" />
            <span>{insights.trend}</span>
          </div>
        </div>

        {/* Problems */}
        {insights.problems && insights.problems.length > 0 && (
          <div className="cd-ai-section">
            <h3 className="cd-ai-subtitle">{L(locale, 'ปัญหาที่พบ', '발견된 문제', 'Issues Detected')}</h3>
            <div className="space-y-2">
              {insights.problems.map((prob, i) => (
                <div key={i} className="cd-ai-problem-card">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{prob}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Load Patterns */}
        <div className="cd-ai-load-patterns">
          <div className="cd-ai-load-card cd-ai-load-heavy">
            <Activity className="w-5 h-5" />
            <div>
              <p className="cd-ai-load-label">{L(locale, 'โหลดหนัก', '무거운 부하', 'Heavy Load')}</p>
              <p className="cd-ai-load-months">
                {insights.heavyLoad?.months?.length > 0
                  ? insights.heavyLoad.months.join(', ')
                  : L(locale, 'ไม่มี', '없음', 'None')}
              </p>
              <p className="cd-ai-load-reason">{insights.heavyLoad?.reason}</p>
            </div>
          </div>

          <div className="cd-ai-load-card cd-ai-load-light">
            <Sprout className="w-5 h-5" />
            <div>
              <p className="cd-ai-load-label">{L(locale, 'โหลดเบา', '가벼운 부하', 'Light Load')}</p>
              <p className="cd-ai-load-months">
                {insights.lightLoad?.months?.length > 0
                  ? insights.lightLoad.months.join(', ')
                  : L(locale, 'ไม่มี', '없음', 'None')}
              </p>
              <p className="cd-ai-load-reason">{insights.lightLoad?.reason}</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div className="cd-ai-section">
            <h3 className="cd-ai-subtitle">{L(locale, 'ข้อเสนอแนะ', '권장 사항', 'Recommendations')}</h3>
            <ul className="space-y-2">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="cd-ai-rec-item">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Forecast */}
        {insights.forecast && (
          <div className="cd-ai-forecast">
            <Zap className="w-4 h-4" />
            <div>
              <p className="cd-ai-forecast-label">{L(locale, 'การพยากรณ์', '예측', 'Forecast')}</p>
              <p>{insights.forecast}</p>
            </div>
          </div>
        )}

        {aiError && <p className="cd-error">{aiError}</p>}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { locale } = useLocale();
  const { selectedSite, setSelectedSite } = useSite();
  const [activeTab, setActiveTab] = useState('energy');
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState(null);
  const [customerUser, setCustomerUser] = useState(null);
  const [customerMeters, setCustomerMeters] = useState([]);
  const [selectedMeterDeviceId, setSelectedMeterDeviceId] = useState('');
  const [billingSite, setBillingSite] = useState('thailand');
  const [electricityRate, setElectricityRate] = useState(null);

  // ── Live monitoring state ──
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [liveData, setLiveData] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveMetric, setLiveMetric] = useState('current');
  const [deviceDetails, setDeviceDetails] = useState(null);
  const liveTimer = useRef(null);
  const monitorTimer = useRef(null);
  const [monitorSeries, setMonitorSeries] = useState([]);
  const [monitorSnapshot, setMonitorSnapshot] = useState(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState(null);
  const [lastMonitorAt, setLastMonitorAt] = useState(null);
  const [monitorMinutes, setMonitorMinutes] = useState(30);
  const [monitorMetric, setMonitorMetric] = useState('current');
  const [isLivePulse, setIsLivePulse] = useState(false);

  const monitorMetricOptions = [
    { key: 'current', label: L(locale, 'กระแสไฟ', '전류', 'Current') },
    { key: 'power', label: L(locale, 'กำลังไฟ', '전력', 'Power') },
    { key: 'voltage', label: L(locale, 'แรงดัน', '전압', 'Voltage') },
    { key: 'frequency', label: L(locale, 'ความถี่', '주파수', 'Frequency') },
    { key: 'stability', label: L(locale, 'ความเสถียร', '안정성', 'Stability') },
    { key: 'reactive', label: L(locale, 'การกักเก็บกระแสไฟ', '무효전력', 'Reactive') },
  ];
  const [sendingContact, setSendingContact] = useState(false);
  const [contactError, setContactError] = useState(null);
  const [welcomeName, setWelcomeName] = useState('');

  const totalBefore = monthlyData.reduce((s, d) => s + d.before, 0);
  const totalAfter = monthlyData.reduce((s, d) => s + d.after, 0);
  const totalSavedKwh = totalBefore - totalAfter;
  const totalCostBefore = monthlyData.reduce((s, d) => s + d.costBefore, 0);
  const totalCostAfter = monthlyData.reduce((s, d) => s + d.costAfter, 0);
  const totalSavedCost = totalCostBefore - totalCostAfter;
  const savingPct = totalBefore > 0 ? ((totalSavedKwh / totalBefore) * 100).toFixed(1) : '0.0';
  const co2Saved = (totalSavedKwh * 0.5313).toFixed(0);
  const currencySymbol = getCurrencySymbolBySite(billingSite, locale);
  const currencyCode = getCurrencyCodeBySite(billingSite, locale);
  const formatCost = (n) =>
    formatCurrencyBySite(n, billingSite, locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const labelCostBefore = L(locale, `ก่อน (${currencySymbol})`, `이전 (${currencySymbol})`, `Before (${currencyCode})`);
  const labelCostAfter = L(locale, `หลัง (${currencySymbol})`, `이후 (${currencySymbol})`, `After (${currencyCode})`);
  const labelCostSaved = L(locale, `ประหยัด (${currencySymbol})`, `절약 (${currencySymbol})`, `Saved (${currencyCode})`);
  const labelMonthlyCost = L(
    locale,
    `ค่าใช้จ่ายรายเดือน (${currencyCode})`,
    `월별 전기 요금 (${currencyCode})`,
    `Monthly Cost (${currencyCode})`,
  );
  const labelMonthlyEnergy = L(locale, 'การใช้ไฟฟ้ารายเดือน (kWh)', '월별 전력 사용량 (kWh)', 'Monthly Energy (kWh)');

  const normalizeSnapshot = (raw, connection) => {
    const payload = raw;
    const metrics = payload?.metrics ?? (raw) ?? {};
    const toNumber = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    return {
      status: String(connection || '').toUpperCase() === 'ONLINE' ? 'online' : 'offline',
      totalPower: toNumber(metrics.totalPower),
      currentL1: toNumber(Array.isArray(metrics.current) ? metrics.current[0] : metrics.currentL1),
      currentL2: toNumber(Array.isArray(metrics.current) ? metrics.current[1] : metrics.currentL2),
      currentL3: toNumber(Array.isArray(metrics.current) ? metrics.current[2] : metrics.currentL3),
      powerFactor: toNumber(metrics.powerFactor),
      voltageL1: toNumber(Array.isArray(metrics.voltageLL) ? metrics.voltageLL[0] : metrics.voltageL1),
      voltageL2: toNumber(Array.isArray(metrics.voltageLL) ? metrics.voltageLL[1] : metrics.voltageL2),
      voltageL3: toNumber(Array.isArray(metrics.voltageLL) ? metrics.voltageLL[2] : metrics.voltageL3),
      frequency: toNumber(metrics.frequency),
      reactivePower: toNumber(metrics.reactivePower),
      thdBefore: toNumber(metrics.thdBefore),
      thdAfter: toNumber(metrics.thdAfter),
      energySaved: toNumber(metrics.energySaved),
      co2Saved: toNumber(metrics.co2Saved),
    };
  };

  useEffect(() => {
    const parsed = readStoredCustomerUser();
    setCustomerUser(parsed);
    const { displayName } = formatEnergyDisplayUser(parsed || {});
    setWelcomeName(displayName || '');
  }, []);

  useEffect(() => {
    let active = true;
    setMonthlyLoading(true);

    const user = customerUser || readStoredCustomerUser();
    const query = buildCustomerDashboardQuery(user, selectedMeterDeviceId || undefined);

    fetch(`/api/ge-energy/customer-dashboard?${query}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        if (!active) return;
        if (j.success && Array.isArray(j.data?.monthly)) {
          setMonthlyData(j.data.monthly);
          setCustomerMeters(Array.isArray(j.data.meters) ? j.data.meters : []);
          const site = j.data.primarySite || 'thailand';
          setBillingSite(site);
          setSelectedSite(site);
          setElectricityRate(j.data.summary?.electricityRate ?? null);
          setMonthlyError(null);

          const meterDevices = (j.data.meters || []).map((m) => ({
            deviceID: m.deviceId,
            deviceName: m.deviceName || m.label,
            connection: 'ONLINE',
          }));
          if (meterDevices.length > 0) {
            setDevices(meterDevices);
            const keepId = selectedMeterDeviceId || selectedDeviceId;
            const allowed = meterDevices.some((d) => String(d.deviceID) === String(keepId));
            const nextId = allowed ? String(keepId) : String(meterDevices[0].deviceID);
            if (!selectedDeviceId || !allowed) setSelectedDeviceId(nextId);
          }
        } else {
          setMonthlyError(j.error || 'Failed to load monthly comparison data');
        }
      })
      .catch(() => {
        if (active) setMonthlyError('Failed to load monthly comparison data');
      })
      .finally(() => {
        if (active) setMonthlyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [customerUser, selectedMeterDeviceId, setSelectedSite]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    fetchLive();
    if (liveTimer.current) clearInterval(liveTimer.current);
    liveTimer.current = setInterval(fetchLiveSnapshot, 30000);
    return () => { if (liveTimer.current) clearInterval(liveTimer.current); };
  }, [selectedDeviceId]);

  async function fetchCustomerMonitor() {
    if (!selectedDeviceId) return;
    setMonitorLoading(true);
    setMonitorError(null);
    try {
      const res = await fetch(
        `/api/ge-energy/customer-live-monitor?site=${encodeURIComponent(selectedSite)}&deviceId=${encodeURIComponent(selectedDeviceId)}&minutes=${monitorMinutes}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load monitor data');
      }
      if (Array.isArray(json.devices) && json.devices.length > 0) {
        setDevices(json.devices);
      }
      setMonitorSeries(json.series || []);
      setMonitorSnapshot(json.snapshot || null);
      setLastMonitorAt(json.timestamp || new Date().toISOString());
      setIsLivePulse(Boolean(json.snapshot?.isOnline));
    } catch (err) {
      setMonitorError(err instanceof Error ? err.message : 'Failed to load monitor data');
      setMonitorSeries([]);
      setMonitorSnapshot(null);
      setIsLivePulse(false);
    } finally {
      setMonitorLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab !== 'monitor' || !selectedDeviceId) return undefined;
    fetchCustomerMonitor();
    if (monitorTimer.current) clearInterval(monitorTimer.current);
    monitorTimer.current = setInterval(fetchCustomerMonitor, 10000);
    return () => {
      if (monitorTimer.current) clearInterval(monitorTimer.current);
    };
  }, [activeTab, selectedDeviceId, selectedSite, monitorMinutes]);

  async function fetchLive() {
    setLiveLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [histRes, snapRes, devRes] = await Promise.all([
        fetch(`/api/ge-energy/device-history?deviceId=${selectedDeviceId}&period=hour&from=${today}&to=${today}&limit=24`),
        fetch(`/api/ge-energy/device-monitoring?deviceId=${selectedDeviceId}`),
        fetch(`/api/ge-energy/devices-setting?site=all`),
      ]);
      const histJson = await histRes.json();
      const snapJson = await snapRes.json();
      const devJson  = await devRes.json();
      if (histJson.success) {
        const history = Array.isArray(histJson.history)
          ? histJson.history
          : Array.isArray(histJson.data)
            ? histJson.data
            : [];
        setLiveData(history);
      }

      let found = null;
      if (devJson.success) {
        found = devJson.devices?.find(d => String(d.deviceID) === String(selectedDeviceId));
        if (found) setDeviceDetails(found);
      }
      if (snapJson.success) setSnapshot(normalizeSnapshot(snapJson.data, found?.connection));
    } catch {}
    setLiveLoading(false);
  }

  async function fetchLiveSnapshot() {
    if (!selectedDeviceId) return;
    try {
      const r = await fetch(`/api/ge-energy/device-monitoring?deviceId=${selectedDeviceId}`);
      const j = await r.json();
      if (j.success) setSnapshot(normalizeSnapshot(j.data, deviceDetails?.connection));
    } catch {}
  }
  const [chartType, setChartType] = useState('bar');
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const monthLabel = (d) => {
    const th = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const en = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ko = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const idx = Math.max(0, Math.min(11, d.monthIndex - 1));
    return locale === 'th' ? th[idx] : locale === 'ko' ? ko[idx] : en[idx];
  };

  const chartData = monthlyData.map(d => ({
    name: monthLabel(d),
    [L(locale,'ก่อนติดตั้ง','설치 전','Before')]: d.before,
    [L(locale,'หลังติดตั้ง','설치 후','After')]: d.after,
    [labelCostBefore]: d.costBefore,
    [labelCostAfter]: d.costAfter,
  }));

  const keyBefore  = L(locale,'ก่อนติดตั้ง','설치 전','Before');
  const keyAfter   = L(locale,'หลังติดตั้ง','설치 후','After');
  const keyCostB   = labelCostBefore;
  const keyCostA   = labelCostAfter;

  async function handleSend(e) {
    e.preventDefault();

    setSendingContact(true);
    setContactError(null);

    try {
      const response = await fetch('/api/ge-energy/user-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'General Feedback',
          subject: `Customer Dashboard Contact - ${contactForm.name}`,
          message: `Name: ${contactForm.name}\nPhone: ${contactForm.phone}\nEmail: ${contactForm.email || '-'}\n\n${contactForm.message}`,
          rating: 5,
          branch: selectedSite
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to send message');
      }

      setSent(true);
      setContactForm({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Failed to send message');
      setSent(false);
    } finally {
      setSendingContact(false);
    }
  }

  const tabs = [
    { key: 'energy',  label: L(locale,'กราฟไฟฟ้า','전력 그래프','Energy'),  icon: BarChart2 },
    { key: 'cost',    label: L(locale,'กราฟค่าไฟ','비용 그래프','Cost'),     icon: DollarSign },
    { key: 'live',    label: L(locale,'ไฟปัจจุบัน','실시간','Live'),         icon: Activity },
    { key: 'monitor', label: L(locale,'มอนิเตอร์เรียลไทม์','실시간 모니터','Real-time Monitor'), icon: Cpu },
    { key: 'contact', label: L(locale,'ติดต่อ','연락','Contact'),            icon: Users },
  ];

  const kpiItems = [
    { icon: Zap, val: `${fmt(totalSavedKwh)} kWh`, label: L(locale,'ไฟฟ้าที่ประหยัด','절약 전력량','Energy Saved'), tone: 'energy' },
    { icon: DollarSign, val: formatCost(totalSavedCost), label: L(locale,`ค่าไฟที่ประหยัด (${currencySymbol})`,`절약 비용 (${currencySymbol})`,`Cost Saved (${currencyCode})`), tone: 'cost' },
    { icon: TrendingDown, val: `${savingPct}%`, label: L(locale,'% ที่ประหยัด','절약률','Saving Rate'), tone: 'rate' },
    { icon: Leaf, val: `${fmt(Number(co2Saved))} kg`, label: L(locale,'CO₂ ที่ลดได้','CO₂ 절감량','CO₂ Reduced'), tone: 'co2' },
  ];

  return (
    <div className="cd-page-content">

      <div className="cd-hero">
        <div className="cd-hero-blob cd-hero-blob--a" aria-hidden />
        <div className="cd-hero-blob cd-hero-blob--b" aria-hidden />
        <div className="cd-hero-pattern" aria-hidden />
        <div className="cd-hero-top">
          <div className="cd-hero-icon">
            <Sprout className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div>
            {welcomeName ? (
              <p className="cd-hero-welcome">
                {locale === 'ko' ? (
                  <><strong>{welcomeName}</strong>님, 환영합니다</>
                ) : locale === 'en' ? (
                  <>Welcome, <strong>{welcomeName}</strong></>
                ) : (
                  <>ยินดีต้อนรับ, <strong>{welcomeName}</strong></>
                )}
              </p>
            ) : null}
            <h1 className="cd-hero-title">{L(locale,'รายงานเปรียบเทียบพลังงาน','에너지 비교 보고서','Energy Comparison Report')}</h1>
            <p className="cd-hero-sub">{L(locale,'เปรียบเทียบการใช้ไฟฟ้าและค่าใช้จ่ายก่อน-หลัง','설치 전후 전력 사용량 및 비용 비교','Electricity usage & cost comparison before/after installation')}</p>
            <span className="cd-hero-badge">
              <span className="cd-hero-badge-dot" />
              {L(locale,'พลังงานสะอาด · รักโลก','친환경 · 그린 에너지','Clean energy · Eco friendly')}
            </span>
          </div>
        </div>
        <div className="cd-kpi-grid">
          {kpiItems.map(({ icon: Icon, val, label, tone }) => (
            <div key={label} className="cd-kpi-card">
              <div className={`cd-kpi-icon cd-kpi-icon--${tone}`}>
                <Icon className="w-4 h-4" strokeWidth={2.25} />
              </div>
              <p className="cd-kpi-val">{val}</p>
              <p className="cd-kpi-label">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="cd-main">
        <nav className="cd-tab-sticky" aria-label={L(locale,'เมนูหลัก','메인 메뉴','Main menu')}>
          <div className="cd-tab-scroll">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`cd-tab-btn${activeTab === tab.key ? ' cd-tab-btn--active' : ''}`}
              >
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.25} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Energy / Cost Charts ── */}
        {(activeTab === 'energy' || activeTab === 'cost') && (
          <div className="cd-stack">
            {customerMeters.length > 0 && (
              <div className="cd-meter-toolbar">
                <label htmlFor="cd-meter-select" className="cd-meter-toolbar-label">
                  {L(locale, 'มิเตอร์ของคุณ', '내 미터', 'Your meters')}
                </label>
                <div className="cd-meter-toolbar-row">
                  <select
                    id="cd-meter-select"
                    className="cd-meter-select"
                    value={selectedMeterDeviceId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedMeterDeviceId(v);
                      if (v) setSelectedDeviceId(v);
                    }}
                  >
                    <option value="">{L(locale, 'ทุกมิเตอร์', '전체 미터', 'All meters')}</option>
                    {customerMeters.map((m) => (
                      <option key={m.deviceId} value={String(m.deviceId)}>
                        {m.label}{m.locationName ? ` · ${m.locationName}` : ''} ({m.site})
                      </option>
                    ))}
                  </select>
                  {electricityRate != null && (
                  <span className="cd-meter-rate">
                    {L(locale, 'อัตราไฟ', '요금', 'Rate')}: {fmt(electricityRate)} / kWh ({currencyCode})
                  </span>
                  )}
                </div>
              </div>
            )}

            {!monthlyLoading && customerUser && customerMeters.length === 0 && (
              <p className="cd-error">
                {L(
                  locale,
                  'ไม่พบมิเตอร์ที่ผูกกับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ',
                  '이 계정에 연결된 미터가 없습니다. 관리자에게 문의하세요.',
                  'No meters linked to this account. Please contact support.',
                )}
              </p>
            )}

            {activeTab === 'energy' && (
              <div className="cd-segment">
                <button type="button" onClick={() => setChartType('bar')}
                  className={`cd-segment-btn${chartType === 'bar' ? ' cd-segment-btn--active' : ''}`}>
                  <BarChart2 className="w-3.5 h-3.5" />{L(locale,'แผนภูมิแท่ง','막대 차트','Bar')}
                </button>
                <button type="button" onClick={() => setChartType('line')}
                  className={`cd-segment-btn${chartType === 'line' ? ' cd-segment-btn--active' : ''}`}>
                  <Activity className="w-3.5 h-3.5" />{L(locale,'กราฟเส้น','선 차트','Line')}
                </button>
              </div>
            )}

            {(activeTab === 'cost'
              ? [
                  { mode: 'energy', title: labelMonthlyEnergy, accent: 'cd-card-accent--energy' },
                  { mode: 'cost', title: labelMonthlyCost, accent: 'cd-card-accent--cost' },
                ]
              : [{ mode: 'energy', title: labelMonthlyEnergy, accent: 'cd-card-accent--energy' }]
            ).map(({ mode, title, accent }) => (
            <div key={mode} className="cd-card">
              <div className={`cd-card-accent ${accent}`} />
              <div className="cd-card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="cd-card-title">{title}</h2>
                    <p className="cd-card-desc">
                      {L(locale,'เปรียบเทียบก่อนและหลังติดตั้ง','설치 전후 비교','Before vs after installation')}
                    </p>
                  </div>
                  {mode === 'energy' && activeTab === 'energy' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (monthlyData.length > 0) {
                        generateMonthlyEnergyExcel(monthlyData, billingSite);
                      }
                    }}
                    disabled={monthlyData.length === 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    {L(locale,'ดาวน์โหลด','다운로드','Download')}
                  </button>
                  )}
                </div>
                {monthlyLoading ? (
                  <div className="cd-chart-loading">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="cd-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                {mode === 'cost' || chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(v) =>
                      mode === 'energy'
                        ? Number(v).toLocaleString()
                        : formatCost(Number(v))
                    } />
                    <Legend />
                    {mode === 'energy' ? <>
                      <Line type="monotone" dataKey={keyBefore} stroke="#b45309" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey={keyAfter}  stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </> : <>
                      <Line type="monotone" dataKey={keyCostB} stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey={keyCostA} stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </>}
                  </LineChart>
                ) : (
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(v) =>
                      mode === 'energy'
                        ? Number(v).toLocaleString()
                        : formatCost(Number(v))
                    } />
                    <Legend />
                    {mode === 'energy' ? <>
                      <Bar dataKey={keyBefore} fill="#b45309" radius={[4,4,0,0]} />
                      <Bar dataKey={keyAfter}  fill="#059669" radius={[4,4,0,0]} />
                    </> : <>
                      <Bar dataKey={keyCostB} fill="#d97706" radius={[4,4,0,0]} />
                      <Bar dataKey={keyCostA} fill="#0d9488" radius={[4,4,0,0]} />
                    </>}
                  </BarChart>
                )}
                  </ResponsiveContainer>
                  </div>
                )}
                {monthlyError && mode === 'energy' && <p className="cd-error">{monthlyError}</p>}
              </div>
            </div>
            ))}

            {/* KPI Comparison Grid */}
            <div className="cd-card">
              <div className="cd-card-accent cd-card-accent--energy" />
              <div className="cd-card-body">
                <h2 className="cd-card-title">{L(locale,'สรุป KPI ประหยัดพลังงาน','에너지 절약 KPI 요약','Energy Savings KPI Summary')}</h2>
                <div className="cd-kpi-grid">
                  <div className="cd-kpi-card">
                    <div className="cd-kpi-icon cd-kpi-icon--energy">
                      <Zap className="w-5 h-5" />
                    </div>
                    <p className="cd-kpi-val">{fmt(totalSavedKwh)}</p>
                    <p className="cd-kpi-label">{L(locale,'ประหยัด kWh','절약 kWh','Saved kWh')}</p>
                  </div>
                  <div className="cd-kpi-card">
                    <div className="cd-kpi-icon cd-kpi-icon--cost">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <p className="cd-kpi-val">{formatCost(totalSavedCost)}</p>
                    <p className="cd-kpi-label">{labelCostSaved}</p>
                  </div>
                  <div className="cd-kpi-card">
                    <div className="cd-kpi-icon cd-kpi-icon--rate">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <p className="cd-kpi-val">{savingPct}%</p>
                    <p className="cd-kpi-label">{L(locale,'อัตราประหยัด','절약률','Save %')}</p>
                  </div>
                  <div className="cd-kpi-card">
                    <div className="cd-kpi-icon cd-kpi-icon--co2">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <p className="cd-kpi-val">{fmt(co2Saved)}</p>
                    <p className="cd-kpi-label">{L(locale,'CO₂ ลด (kg)','CO₂ 감소 (kg)','CO₂ Reduced (kg)')}</p>
                  </div>
                </div>

                {activeTab === 'energy' && monthlyData.length > 0 && (
                  <div className="cd-kpi-monthly-chart">
                    <h3 className="cd-chart-subtitle">{L(locale,'เปรียบเทียบรายเดือน (kWh)','월별 비교 (kWh)','Monthly Comparison (kWh)')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData.map(d => ({
                        name: monthLabel(d),
                        before: d.before,
                        after: d.after,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={v => Number(v).toLocaleString()} />
                        <Legend />
                        <Bar dataKey={L(locale,'ก่อน','이전','Before')} fill="#b45309" radius={[4,4,0,0]} />
                        <Bar dataKey={L(locale,'หลัง','이후','After')} fill="#059669" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* AI Energy Analysis Panel */}
            <AiEnergyInsightPanel
              monthlyData={monthlyData}
              locale={locale}
              site={selectedSite}
            />
          </div>
        )}

        {/* ── Real-time current monitor ── */}
        {activeTab === 'monitor' && (
          <div className="cd-stack">
            <div className="cd-toolbar">
              <div className="cd-select-wrap">
                <select value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)} className="cd-select">
                  {devices.map(d => (
                    <option key={d.deviceID} value={String(d.deviceID)}>{d.deviceName || d.geID || d.deviceID}</option>
                  ))}
                </select>
                <ChevronDown className="cd-select-chevron" />
              </div>
              <select value={monitorMinutes} onChange={e => setMonitorMinutes(Number(e.target.value))} className="cd-select">
                <option value={15}>{L(locale,'15 นาที','15분','15 min')}</option>
                <option value={30}>{L(locale,'30 นาที','30분','30 min')}</option>
                <option value={60}>{L(locale,'60 นาที','60분','60 min')}</option>
              </select>
              <div className="cd-metric-scroll">
                {monitorMetricOptions.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMonitorMetric(m.key)}
                    className={`cd-metric-pill${monitorMetric === m.key ? ' cd-metric-pill--active' : ''}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="cd-toolbar-row">
              <button type="button" onClick={fetchCustomerMonitor} disabled={monitorLoading}
                className="cd-btn cd-btn--primary">
                <RefreshCw className={`w-4 h-4 ${monitorLoading ? 'animate-spin' : ''}`} />
                {L(locale,'รีเฟรช','새로고침','Refresh')}
              </button>
              <div className="cd-live-hint">
                <span className={`cd-live-dot${isLivePulse ? ' cd-live-dot--on' : ''}`} />
                {L(locale,'อัปเดตทุก 10 วินาที','10초마다 업데이트','Updates every 10s')}
                {lastMonitorAt && (
                  <span>· {new Date(lastMonitorAt).toLocaleTimeString()}</span>
                )}
              </div>
              </div>
            </div>

            {monitorSnapshot && (
              <div className="cd-stat-grid cd-stat-grid--8">
                {[
                  { label: L(locale,'สถานะ','상태','Status'), val: monitorSnapshot.isOnline ? L(locale,'ออนไลน์','온라인','Online') : L(locale,'ออฟไลน์','오프라인','Offline'), color: monitorSnapshot.isOnline ? 'text-emerald-600' : 'text-red-500' },
                  { label: L(locale,'กำลังไฟ OUT (kW)','출력 전력','Power OUT'), val: monitorSnapshot.totalPowerKw?.toFixed(2) ?? '—', color: 'text-amber-600' },
                  { label: L(locale,'แรงดัน L1 (V)','전압 L1','V L1'), val: monitorSnapshot.voltage?.L1?.toFixed(1) ?? '—', color: 'text-violet-600' },
                  { label: L(locale,'ความถี่ (Hz)','주파수','Freq'), val: monitorSnapshot.frequency?.toFixed(2) ?? '—', color: 'text-blue-600' },
                  { label: L(locale,'ความเสถียร (PF)','역률 PF','PF'), val: monitorSnapshot.powerFactor?.toFixed(3) ?? '—', color: 'text-teal-600' },
                  { label: L(locale,'กระแสรีแอก OUT (kVAr)','무효전력 OUT','Q OUT'), val: monitorSnapshot.reactiveOutputKvar?.toFixed(2) ?? '—', color: 'text-indigo-600' },
                  { label: L(locale,'OUTPUT L1 (A)','OUTPUT L1','OUT L1'), val: monitorSnapshot.currentOutput?.L1?.toFixed(2) ?? '—', color: 'text-emerald-600' },
                  { label: L(locale,'INPUT L1 (A)','INPUT L1','IN L1'), val: monitorSnapshot.currentInput?.L1?.toFixed(2) ?? '—', color: 'text-red-600' },
                ].map((item) => (
                  <div key={item.label} className="cd-stat-card">
                    <p className={`cd-stat-val ${item.color}`}>{item.val}</p>
                    <p className="cd-stat-label">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="cd-card">
              <div className="cd-card-accent cd-card-accent--monitor" />
              <div className="cd-card-body">
                <h2 className="cd-card-title">
                  {monitorMetric === 'current' && L(locale,'กราฟกระแสไฟเรียลไทม์','실시간 전류','Real-time Current')}
                  {monitorMetric === 'power' && L(locale,'กราฟกำลังไฟเรียลไทม์','실시간 전력','Real-time Power')}
                  {monitorMetric === 'voltage' && L(locale,'กราฟแรงดันเรียลไทม์','실시간 전압','Real-time Voltage')}
                  {monitorMetric === 'frequency' && L(locale,'กราฟความถี่เรียลไทม์','실시간 주파수','Real-time Frequency')}
                  {monitorMetric === 'stability' && L(locale,'กราฟความเสถียร (Power Factor)','안정성 (역률)','Stability (Power Factor)')}
                  {monitorMetric === 'reactive' && L(locale,'กราฟการกักเก็บกระแสไฟ (kVAr)','무효전력','Reactive Power (kVAr)')}
                </h2>
                <p className="cd-card-desc">
                  {monitorSeries.length} {L(locale,'จุดข้อมูล','데이터 포인트','points')}
                </p>
                {monitorLoading && monitorSeries.length === 0 ? (
                  <div className="cd-chart-loading">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                ) : monitorSeries.length === 0 ? (
                  <div className="cd-empty">
                    <WifiOff className="w-10 h-10 mb-2" />
                    <p>{L(locale,'ยังไม่มีข้อมูลในช่วงเวลาที่เลือก','선택 구간 데이터 없음','No data in selected window')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={monitorSeries} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, name) => {
                        if (v == null) return ['—', name];
                        const n = Number(v).toFixed(2);
                        if (monitorMetric === 'frequency') return [`${n} Hz`, name];
                        if (monitorMetric === 'stability') return [n, name];
                        if (monitorMetric === 'power') return [`${n} kW`, name];
                        if (monitorMetric === 'voltage') return [`${n} V`, name];
                        if (monitorMetric === 'reactive') return [`${n} kVAr`, name];
                        return [`${n} A`, name];
                      }} />
                      <Legend />
                      {monitorMetric === 'current' && <>
                        <Line type="monotone" dataKey="beforeL1" name="INPUT L1" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="beforeL2" name="INPUT L2" stroke="#f97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="beforeL3" name="INPUT L3" stroke="#fb923c" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="afterL1" name="OUTPUT L1" stroke="#10b981" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="afterL2" name="OUTPUT L2" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="afterL3" name="OUTPUT L3" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                      </>}
                      {monitorMetric === 'power' && <>
                        <Line type="monotone" dataKey="powerInput" name="INPUT (kW)" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="powerOutput" name="OUTPUT (kW)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                      </>}
                      {monitorMetric === 'voltage' && <>
                        <Line type="monotone" dataKey="voltageL1" name="L1 (V)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="voltageL2" name="L2 (V)" stroke="#a78bfa" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="voltageL3" name="L3 (V)" stroke="#c4b5fd" strokeWidth={2} dot={false} />
                      </>}
                      {monitorMetric === 'frequency' && (
                        <Line type="monotone" dataKey="frequency" name={L(locale,'ความถี่ (Hz)','주파수','Frequency')} stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      )}
                      {monitorMetric === 'stability' && (
                        <Line type="monotone" dataKey="powerFactor" name={L(locale,'Power Factor','역률','PF')} stroke="#0d9488" strokeWidth={2.5} dot={false} />
                      )}
                      {monitorMetric === 'reactive' && <>
                        <Line type="monotone" dataKey="reactiveInput" name="INPUT (kVAr)" stroke="#6366f1" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="reactiveOutput" name="OUTPUT (kVAr)" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                      </>}
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {monitorError && <p className="cd-error">{monitorError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Live Devices ── */}
        {activeTab === 'live' && (
          <div className="cd-stack">
            <div className="cd-toolbar">
              <div className="cd-select-wrap">
                <select value={selectedDeviceId} onChange={e => { setSelectedDeviceId(e.target.value); }} className="cd-select">
                  {devices.map(d => (
                    <option key={d.deviceID} value={String(d.deviceID)}>{d.deviceName || d.deviceID}</option>
                  ))}
                </select>
                <ChevronDown className="cd-select-chevron" />
              </div>
              <div className="cd-metric-scroll">
                {monitorMetricOptions.map((m) => (
                  <button key={m.key} type="button" onClick={() => setLiveMetric(m.key)}
                    className={`cd-metric-pill${liveMetric === m.key ? ' cd-metric-pill--active' : ''}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={fetchLive} disabled={liveLoading} className="cd-btn cd-btn--ghost">
                <RefreshCw className={`w-4 h-4 ${liveLoading ? 'animate-spin text-emerald-600' : ''}`} />
                {L(locale,'รีเฟรช','새로고침','Refresh')}
              </button>
            </div>

            {/* Snapshot KPI row */}
            {snapshot && (() => {
              const d = snapshot;
              const isOnline = d.status === 'online';
              return (
                <div className="cd-stat-grid">
                  {[
                    { icon: isOnline ? Wifi : WifiOff, label: L(locale,'สถานะ','상태','Status'), val: isOnline ? L(locale,'ออนไลน์','온라인','Online') : 'Offline', color: isOnline ? 'text-emerald-600' : 'text-red-500', bg: isOnline ? 'bg-emerald-50' : 'bg-red-50' },
                    { icon: Zap, label: L(locale,'กำลังไฟ (kW)','전력 (kW)','Power (kW)'), val: (d.totalPower ?? 0).toFixed(2), color: 'text-amber-600', bg: 'bg-amber-50' },
                    { icon: Activity, label: L(locale,'L1 (A)','L1 (A)','L1 (A)'), val: (d.currentL1 ?? 0).toFixed(2), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: Activity, label: L(locale,'L2 (A)','L2 (A)','L2 (A)'), val: (d.currentL2 ?? 0).toFixed(2), color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { icon: Activity, label: L(locale,'L3 (A)','L3 (A)','L3 (A)'), val: (d.currentL3 ?? 0).toFixed(2), color: 'text-teal-600', bg: 'bg-teal-50' },
                    { icon: Thermometer, label: L(locale,'Power Factor','역률','Power Factor'), val: (d.powerFactor ?? 0).toFixed(3), color: 'text-teal-600', bg: 'bg-teal-50' },
                  ].map(({ icon: Icon, label, val, color, bg }) => (
                    <div key={label} className={`cd-stat-card cd-stat-card--tint ${bg}`}>
                      <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                      <div>
                        <p className={`cd-stat-val ${color}`}>{val}</p>
                        <p className="cd-stat-label">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="cd-card">
              <div className="cd-card-accent cd-card-accent--live" />
              <div className="cd-card-body">
                <h2 className="cd-card-title">
                  {L(locale,'กราฟกระแสไฟรายชั่วโมง (วันนี้)','오늘 시간별 전류 그래프','Hourly Chart — Today')}
                </h2>
                <p className="cd-card-desc">
                  {L(locale,'อัปเดตทุก 30 วินาที','30초마다 업데이트','Updates every 30 seconds')} · {selectedDeviceId}
                </p>
              {liveLoading ? (
                <div className="cd-chart-loading">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : liveData.length === 0 ? (
                <div className="cd-empty">
                  <WifiOff className="w-10 h-10 mb-2" />
                  <p>{L(locale,'ยังไม่มีข้อมูลวันนี้','오늘 데이터 없음','No data for today')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={liveData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }}
                      tickFormatter={v => v ? String(v).slice(11, 16) : ''} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={v => v ? String(v).slice(11, 16) : ''}
                      formatter={(v, name) => [v?.toFixed(2), name]} />
                    <Legend />
                    {liveMetric === 'current' && <>
                      <Line type="monotone" dataKey="currentL1" name="L1 (A)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="currentL2" name="L2 (A)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="currentL3" name="L3 (A)" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </>}
                    {liveMetric === 'power' && <>
                      <Line type="monotone" dataKey="totalPower" name={L(locale,'กำลังไฟ (kW)','전력 (kW)','Power (kW)')} stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                    </>}
                    {liveMetric === 'voltage' && <>
                      <Line type="monotone" dataKey="voltageL1" name="V-L1" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="voltageL2" name="V-L2" stroke="#06b6d4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="voltageL3" name="V-L3" stroke="#f97316" strokeWidth={2} dot={false} />
                    </>}
                    {liveMetric === 'frequency' && (
                      <Line type="monotone" dataKey="frequency" name={L(locale,'ความถี่ (Hz)','주파수','Hz')} stroke="#2563eb" strokeWidth={2.5} dot={false} />
                    )}
                    {liveMetric === 'stability' && (
                      <Line type="monotone" dataKey="powerFactor" name={L(locale,'Power Factor','역률','PF')} stroke="#0d9488" strokeWidth={2.5} dot={false} />
                    )}
                    {liveMetric === 'reactive' && (
                      <Line type="monotone" dataKey="reactivePower" name={L(locale,'กระแสรีแอก (kVAr)','무효전력','kVAr')} stroke="#6366f1" strokeWidth={2.5} dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
              </div>
            </div>

            {/* Device Detail Card */}
            {snapshot && (() => {
              const d = snapshot;
              const dev = devices.find(x => String(x.deviceID) === String(selectedDeviceId));
              const dd = deviceDetails;
              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-600" />
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-emerald-600" />
                    <h2 className="font-bold text-gray-800">{L(locale,'รายละเอียดเครื่อง','기기 상세정보','Device Details')}</h2>
                  </div>

                  {/* Owner / Customer section */}
                  <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-green-50/60 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">{L(locale,'ข้อมูลลูกค้า / เจ้าของเครื่อง','고객 / 기기 소유자 정보','Customer / Owner Information')}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'ชื่อเครื่อง / Device ID','장치명 / Device ID','Device Name / Device ID')}</p>
                        <p className="font-semibold text-gray-800">{dev?.deviceName ?? selectedDeviceId}</p>
                        <p className="text-xs text-emerald-600 font-mono mt-0.5">{dd?.energyID ?? dev?.energyID ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'ชื่อลูกค้า','고객명','Customer Name')}</p>
                        <p className="font-semibold text-gray-800">{dd?.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'เบอร์โทร','전화번호','Phone')}</p>
                        {dd?.customerPhone
                          ? <a href={`tel:${dd.customerPhone}`} className="font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />{dd.customerPhone}
                            </a>
                          : <p className="font-semibold text-gray-800">-</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'ที่อยู่','주소','Address')}</p>
                        <p className="font-semibold text-gray-800 text-sm leading-snug">{dd?.customerAddress || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'อีเมลเจ้าของ','소유자 이메일','Owner Email')}</p>
                        <p className="font-semibold text-gray-800 break-all text-sm">{dd?.owner ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'สถานที่/ไซต์','설치 위치/사이트','Location / Site')}</p>
                        <p className="font-semibold text-gray-800">{dd?.location ?? dev?.location ?? '-'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{dd?.site ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'วันที่ลงทะเบียน','등록일','Register Date')}</p>
                        <p className="font-semibold text-gray-800">{dd?.registerDate ?? '-'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">IP: {dd?.ipAddress ?? '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Electrical measurements grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 divide-x divide-y divide-gray-100 text-sm">
                    {[
                      [L(locale,'สถานะเครื่อง','연결 상태','Connection'), dd?.connection ?? '-', dd?.connection === 'ONLINE' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'],
                      [L(locale,'แรงดัน L1 (V)','전압 L1 (V)','Voltage L1 (V)'), (d.voltageL1 ?? 0).toFixed(1), 'text-emerald-700'],
                      [L(locale,'แรงดัน L2 (V)','전압 L2 (V)','Voltage L2 (V)'), (d.voltageL2 ?? 0).toFixed(1), 'text-emerald-700'],
                      [L(locale,'แรงดัน L3 (V)','전압 L3 (V)','Voltage L3 (V)'), (d.voltageL3 ?? 0).toFixed(1), 'text-emerald-700'],
                      [L(locale,'กระแส L1 (A)','전류 L1 (A)','Current L1 (A)'), (d.currentL1 ?? 0).toFixed(2), 'text-emerald-700'],
                      [L(locale,'กระแส L2 (A)','전류 L2 (A)','Current L2 (A)'), (d.currentL2 ?? 0).toFixed(2), 'text-violet-700'],
                      [L(locale,'กระแส L3 (A)','전류 L3 (A)','Current L3 (A)'), (d.currentL3 ?? 0).toFixed(2), 'text-pink-700'],
                      [L(locale,'กำลังไฟ (kW)','전력 (kW)','Total Power (kW)'), (d.totalPower ?? 0).toFixed(2), 'text-amber-700'],
                      [L(locale,'Power Factor','역률','Power Factor'), (d.powerFactor ?? 0).toFixed(3), 'text-gray-800'],
                      [L(locale,'ความถี่ (Hz)','주파수 (Hz)','Frequency (Hz)'), (d.frequency ?? 0).toFixed(1), 'text-gray-800'],
                      [L(locale,'THD ก่อน (%)','THD 이전 (%)','THD Before (%)'), (d.thdBefore ?? 0).toFixed(1), 'text-red-600'],
                      [L(locale,'THD หลัง (%)','THD 이후 (%)','THD After (%)'), (d.thdAfter ?? 0).toFixed(1), 'text-green-600'],
                      [L(locale,'พลังงานประหยัด (kWh)','절약 에너지 (kWh)','Energy Saved (kWh)'), (d.energySaved ?? 0).toFixed(2), 'text-emerald-700 font-bold'],
                      [L(locale,'CO₂ ลดได้ (kg)','CO₂ 절감 (kg)','CO₂ Saved (kg)'), (d.co2Saved ?? 0).toFixed(2), 'text-teal-700 font-bold'],
                    ].map(([label, val, cls]) => (
                      <div key={label} className="px-5 py-4 hover:bg-gray-50/80 transition-colors">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className={`font-semibold ${cls}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Contact ── */}
        {activeTab === 'contact' && (
          <div className="cd-contact-wrap">
            <div className="cd-card">
              <div className="cd-card-accent cd-card-accent--contact" />
              <div className="cd-card-body">
                <h2 className="cd-card-title">{L(locale,'ส่งข้อความหาเรา','메시지 보내기','Send us a message')}</h2>
                <p className="cd-card-desc">{L(locale,'ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง','24시간 내에 연락드리겠습니다','Our team will reply within 24 hours')}</p>
              {sent ? (
                <div className="cd-success">
                  <div className="cd-success-icon">
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <p className="font-semibold text-gray-800">{L(locale,'ส่งข้อความเรียบร้อยแล้ว!','메시지가 전송되었습니다!','Message sent!')}</p>
                  <p className="text-sm text-gray-500 text-center">{L(locale,'เราจะติดต่อกลับโดยเร็วที่สุด','최대한 빨리 연락드리겠습니다','We will contact you as soon as possible')}</p>
                  <button type="button" onClick={() => setSent(false)} className="mt-2 text-emerald-600 text-sm underline">
                    {L(locale,'ส่งอีกครั้ง','다시 보내기','Send another')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSend}>
                  <div className="cd-form-field">
                    <label className="cd-form-label">{L(locale,'ชื่อ','이름','Name')} *</label>
                    <input required value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})}
                      className="cd-form-input"
                      placeholder={L(locale,'ชื่อของคุณ','성함을 입력하세요','Your name')} />
                  </div>
                  <div className="cd-form-field">
                    <label className="cd-form-label">{L(locale,'เบอร์โทร','전화번호','Phone')} *</label>
                    <input required value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                      className="cd-form-input"
                      placeholder={L(locale,'เบอร์โทรของคุณ','전화번호를 입력하세요','Your phone number')} />
                  </div>
                  <div className="cd-form-field">
                    <label className="cd-form-label">{L(locale,'อีเมล','이메일','Email')}</label>
                    <input type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})}
                      className="cd-form-input"
                      placeholder="email@example.com" />
                  </div>
                  <div className="cd-form-field">
                    <label className="cd-form-label">{L(locale,'ข้อความ','메시지','Message')} *</label>
                    <textarea required rows={4} value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})}
                      className="cd-form-input cd-form-textarea"
                      placeholder={L(locale,'พิมพ์ข้อความของคุณ...','메시지를 입력하세요...','Type your message...')} />
                  </div>
                  <button type="submit" disabled={sendingContact} className="cd-btn cd-btn--primary cd-form-submit">
                    <Send className="w-4 h-4" />
                    {sendingContact ? L(locale,'กำลังส่ง...','전송 중...','Sending...') : L(locale,'ส่งข้อความ','메시지 보내기','Send Message')}
                  </button>
                  {contactError && <p className="cd-error">{contactError}</p>}
                </form>
              )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
