'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import MonitorCard from '@/components/MonitorCard';
import {
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './current-monitor.css';

interface Device {
  deviceID: string;
  deviceName: string;
  location?: string;
  customerName?: string;
}

interface MonitoringMetrics {
  current: number[];
  totalPower?: number;
  frequency?: number;
  powerFactor?: number;
}

const brandShort = {
  th: 'GE Energy Tech',
  en: 'GE Energy Tech',
  ko: 'GE Energy Tech',
};

const companyNames = {
  th: 'บริษัท จีอี อีเนอร์จี่ เทค จำกัด',
  en: 'GE Energy Tech Co., Ltd.',
  ko: '(주식회사)지이 에너지텍',
};

const labels = {
  th: {
    title: 'มอนิเตอร์กระแสไฟเรียลไทม์',
    subtitle: 'รับค่ากระแส (A) จากอุปกรณ์แบบเรียลไทม์',
    tagline: 'ระบบติดตามพลังงานอัจฉริยะ',
    customer: 'ลูกค้า',
    device: 'อุปกรณ์',
    allCustomers: 'ทุกลูกค้า',
    selectDevice: 'เลือกอุปกรณ์',
    live: 'สด',
    offline: 'ออฟไลน์',
    lastUpdate: 'อัปเดตล่าสุด',
    refresh: 'รีเฟรช',
    loading: 'กำลังโหลด…',
    noDevice: 'กรุณาเลือกอุปกรณ์เพื่อดูกระแสไฟ',
    chartTitle: 'กราฟกระแส 30 นาทีล่าสุด',
    noChart: 'ยังไม่มีข้อมูลกราฟ',
    fullMonitor: 'ดูมอนิเตอร์แบบเต็ม',
    l1: 'เฟส L1',
    l2: 'เฟส L2',
    l3: 'เฟส L3',
    avg: 'เฉลี่ย 3 เฟส',
    errorLoad: 'โหลดข้อมูลไม่สำเร็จ',
    site: 'ไซต์',
    langTh: 'ไทย',
    langKo: '한국어',
    langEn: 'English',
  },
  en: {
    title: 'Real-time Current Monitor',
    subtitle: 'Live current (A) readings from your devices',
    tagline: 'Smart energy monitoring system',
    customer: 'Customer',
    device: 'Device',
    allCustomers: 'All customers',
    selectDevice: 'Select device',
    live: 'LIVE',
    offline: 'Offline',
    lastUpdate: 'Last update',
    refresh: 'Refresh',
    loading: 'Loading…',
    noDevice: 'Select a device to view live current',
    chartTitle: 'Current trend (last 30 min)',
    noChart: 'No chart data yet',
    fullMonitor: 'Full device monitor',
    l1: 'Phase L1',
    l2: 'Phase L2',
    l3: 'Phase L3',
    avg: '3-phase average',
    errorLoad: 'Failed to load data',
    site: 'Site',
    langTh: 'ไทย',
    langKo: '한국어',
    langEn: 'English',
  },
  ko: {
    title: '실시간 전류 모니터',
    subtitle: '장치에서 실시간 전류(A) 값을 표시합니다',
    tagline: '스마트 에너지 모니터링 시스템',
    customer: '고객',
    device: '장치',
    allCustomers: '전체 고객',
    selectDevice: '장치 선택',
    live: '실시간',
    offline: '오프라인',
    lastUpdate: '마지막 업데이트',
    refresh: '새로고침',
    loading: '로딩 중…',
    noDevice: '장치를 선택하면 전류를 볼 수 있습니다',
    chartTitle: '최근 30분 전류 추이',
    noChart: '차트 데이터 없음',
    fullMonitor: '전체 모니터 보기',
    l1: 'L1 상',
    l2: 'L2 상',
    l3: 'L3 상',
    avg: '3상 평균',
    errorLoad: '데이터 로드 실패',
    site: '사이트',
    langTh: 'ไทย',
    langKo: '한국어',
    langEn: 'English',
  },
};

type LocaleKey = keyof typeof labels;
const ENERGY_LOCALES: LocaleKey[] = ['th', 'ko', 'en'];

const CHART_COLORS = ['#15803d', '#22c55e', '#4ade80'];

function formatTimeLabel(val: string) {
  if (!val) return '';
  const space = val.indexOf(' ');
  return space > 0 ? val.slice(space + 1, space + 6) : val;
}

function resolveLang(locale: string): LocaleKey {
  return ENERGY_LOCALES.includes(locale as LocaleKey) ? (locale as LocaleKey) : 'th';
}

export default function CurrentMonitorPage() {
  const { selectedSite } = useSite();
  const { locale } = useLocale();
  const lang = resolveLang(locale);
  const ui = labels[lang];
  const company = companyNames[lang];
  const brand = brandShort[lang];

  const [customers, setCustomers] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [chartData, setChartData] = useState<Record<string, string | number>[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [showCustomerMenu, setShowCustomerMenu] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  const phaseLabels = [ui.l1, ui.l2, ui.l3];

  const avgCurrent = useMemo(() => {
    if (!metrics?.current?.length) return null;
    const vals = metrics.current.filter((v) => Number.isFinite(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [metrics]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(`/api/kenergy/customers-by-site?site=${selectedSite}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.customers)) {
        const names = json.customers.map((c: { customerName: string }) => c.customerName);
        setCustomers(names);
      }
    } catch {
      setCustomers([]);
    }
  }, [selectedSite]);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`/api/kenergy/devices-setting?site=${selectedSite}`);
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) {
        setDevices([]);
        return;
      }
      let list: Device[] = json.data.map((d: Device & { deviceID?: string | number }) => ({
        deviceID: String(d.deviceID ?? ''),
        deviceName: d.deviceName || String(d.deviceID),
        location: d.location,
        customerName: d.customerName,
      }));
      if (selectedCustomer) {
        list = list.filter((d) => d.customerName === selectedCustomer);
      }
      setDevices(list);
      if (selectedDevice && !list.some((d) => d.deviceID === selectedDevice)) {
        setSelectedDevice('');
        setMetrics(null);
        setChartData([]);
      }
    } catch {
      setDevices([]);
    }
  }, [selectedCustomer, selectedDevice, selectedSite]);

  const fetchLiveMetrics = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/kenergy/device-monitoring?deviceId=${encodeURIComponent(selectedDevice)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success && json.data?.metrics) {
        setMetrics(json.data.metrics);
        setLastUpdate(json.data.lastUpdate || new Date().toLocaleTimeString());
      } else {
        setError(json.error || ui.errorLoad);
        setMetrics(null);
      }
    } catch {
      setError(ui.errorLoad);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, ui.errorLoad]);

  const fetchCurrentHistory = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      setChartLoading(true);
      const res = await fetch(
        `/api/kenergy/current-history?deviceId=${encodeURIComponent(selectedDevice)}&hours=0.5`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (json.success && json.data?.chartData) {
        setChartData(json.data.chartData);
      } else {
        setChartData([]);
      }
    } catch {
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!selectedDevice) {
      setIsLive(false);
      return undefined;
    }
    fetchLiveMetrics();
    fetchCurrentHistory();
    const tick = setInterval(() => {
      fetchLiveMetrics();
      fetchCurrentHistory();
    }, 5000);
    setIsLive(true);
    return () => {
      clearInterval(tick);
      setIsLive(false);
    };
  }, [fetchCurrentHistory, fetchLiveMetrics, selectedDevice]);

  const selectedDeviceInfo = devices.find((d) => d.deviceID === selectedDevice);

  return (
    <div className="energy-page cm-page max-w-6xl mx-auto">
      <section className="cm-hero" aria-label="GE Energy Tech">
        <div className="cm-hero-inner">
          <div className="cm-brand">
            <Image
              src="/momoge/Logo-brand.png"
              alt={brand}
              width={72}
              height={44}
              className="cm-logo"
              priority
            />
            <div className="cm-brand-text">
              <p className="cm-brand-short">{brand}</p>
              <p className="cm-company">{company}</p>
              <p className="cm-company-sub">{ui.tagline}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
        <div className="cm-title-block">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-6 h-6 text-emerald-600" />
            <h1>{ui.title}</h1>
          </div>
          <p>{ui.subtitle}</p>
        </div>
        <div className="cm-toolbar">
          {isLive ? (
            <span className="cm-badge-live">
              <Wifi className="w-3.5 h-3.5" /> {ui.live}
            </span>
          ) : (
            <span className="cm-badge-live cm-badge-off">
              <WifiOff className="w-3.5 h-3.5" /> {ui.offline}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              fetchLiveMetrics();
              fetchCurrentHistory();
            }}
            disabled={!selectedDevice || loading}
            className="cm-btn-primary"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {ui.refresh}
          </button>
          <Link href="/energy-dashboard/monitor" className="cm-btn-outline">
            {ui.fullMonitor}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="cm-panel flex flex-wrap gap-3 items-end">
        <div className="relative min-w-[200px] flex-1">
          <label>{ui.customer}</label>
          <button
            type="button"
            onClick={() => setShowCustomerMenu(!showCustomerMenu)}
            className="cm-select-btn"
          >
            <span className="truncate">{selectedCustomer || ui.allCustomers}</span>
            <ChevronDown className="w-4 h-4 text-emerald-600 shrink-0" />
          </button>
          {showCustomerMenu && (
            <div className="cm-dropdown">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer('');
                  setShowCustomerMenu(false);
                }}
              >
                {ui.allCustomers}
              </button>
              {customers.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(name);
                    setShowCustomerMenu(false);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-w-[220px] flex-1">
          <label>{ui.device}</label>
          <button
            type="button"
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
            className="cm-select-btn"
          >
            <span className="truncate">
              {selectedDeviceInfo
                ? `${selectedDeviceInfo.deviceName} (${selectedDevice})`
                : ui.selectDevice}
            </span>
            <ChevronDown className="w-4 h-4 text-emerald-600 shrink-0" />
          </button>
          {showDeviceMenu && (
            <div className="cm-dropdown">
              {devices.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-400">—</p>
              ) : (
                devices.map((d) => (
                  <button
                    key={d.deviceID}
                    type="button"
                    onClick={() => {
                      setSelectedDevice(d.deviceID);
                      setShowDeviceMenu(false);
                    }}
                  >
                    <span className="font-medium block">{d.deviceName}</span>
                    <span className="text-xs text-slate-400">{d.deviceID}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {(selectedCustomer || selectedDevice) && (
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50"
            onClick={() => {
              setSelectedCustomer('');
              setSelectedDevice('');
              setMetrics(null);
              setChartData([]);
            }}
            aria-label="Clear filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && <div className="cm-error">{error}</div>}

      {!selectedDevice && <div className="cm-empty">{ui.noDevice}</div>}

      {selectedDevice && (
        <>
          {lastUpdate && (
            <p className="text-xs text-slate-500 mb-3">
              {ui.lastUpdate}: <span className="font-medium text-emerald-800">{lastUpdate}</span>
            </p>
          )}

          <div className="cm-stats-grid">
            {phaseLabels.map((label, i) => (
              <MonitorCard
                key={label}
                title={label}
                value={metrics?.current?.[i]}
                unit="A"
                lastUpdate={lastUpdate}
                color="green"
                icon="current"
                highlight={i === 0}
              />
            ))}
            <MonitorCard
              title={ui.avg}
              value={avgCurrent}
              unit="A"
              lastUpdate={lastUpdate}
              color="green"
              icon="current"
              highlight
            />
          </div>

          <div className="cm-chart-panel">
            <h2>{ui.chartTitle}</h2>
            {chartLoading && chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">{ui.loading}</div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">{ui.noChart}</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" />
                  <XAxis dataKey="time" tickFormatter={formatTimeLabel} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="A" />
                  <Tooltip labelFormatter={(l) => String(l)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="currentL1"
                    name={ui.l1}
                    stroke={CHART_COLORS[0]}
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentL2"
                    name={ui.l2}
                    stroke={CHART_COLORS[1]}
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentL3"
                    name={ui.l3}
                    stroke={CHART_COLORS[2]}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
