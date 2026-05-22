'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

const labels = {
  th: {
    title: 'มอนิเตอร์กระแสไฟเรียลไทม์',
    subtitle: 'รับค่ากระแส (A) จากอุปกรณ์แบบเรียลไทม์',
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
  },
  en: {
    title: 'Real-time Current Monitor',
    subtitle: 'Live current (A) readings from your devices',
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
  },
  ko: {
    title: '실시간 전류 모니터',
    subtitle: '장치에서 실시간 전류(A) 값을 표시합니다',
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
  },
};

type LocaleKey = keyof typeof labels;

function formatTimeLabel(val: string) {
  if (!val) return '';
  const space = val.indexOf(' ');
  return space > 0 ? val.slice(space + 1, space + 6) : val;
}

export default function CurrentMonitorPage() {
  const { selectedSite } = useSite();
  const { locale } = useLocale();
  const lang = (labels[locale as LocaleKey] ? locale : 'th') as LocaleKey;
  const ui = labels[lang];

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
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{ui.title}</h1>
          </div>
          <p className="text-sm text-gray-500">{ui.subtitle}</p>
          <p className="text-xs text-gray-400 mt-1">Site: {selectedSite}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              <Wifi className="w-3.5 h-3.5" /> {ui.live}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5" /> {ui.offline}
            </span>
          )}
          <button
            type="button"
            onClick={() => { fetchLiveMetrics(); fetchCurrentHistory(); }}
            disabled={!selectedDevice || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {ui.refresh}
          </button>
          <Link
            href="/energy-dashboard/monitor"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            {ui.fullMonitor}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <label className="text-xs font-semibold text-gray-500 block mb-1">{ui.customer}</label>
          <button
            type="button"
            onClick={() => setShowCustomerMenu(!showCustomerMenu)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <span className="truncate">{selectedCustomer || ui.allCustomers}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showCustomerMenu && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                onClick={() => { setSelectedCustomer(''); setShowCustomerMenu(false); }}
              >
                {ui.allCustomers}
              </button>
              {customers.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                  onClick={() => { setSelectedCustomer(name); setShowCustomerMenu(false); }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-w-[220px] flex-1">
          <label className="text-xs font-semibold text-gray-500 block mb-1">{ui.device}</label>
          <button
            type="button"
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <span className="truncate">
              {selectedDeviceInfo
                ? `${selectedDeviceInfo.deviceName} (${selectedDevice})`
                : ui.selectDevice}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showDeviceMenu && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {devices.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-400">—</p>
              ) : (
                devices.map((d) => (
                  <button
                    key={d.deviceID}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                    onClick={() => {
                      setSelectedDevice(d.deviceID);
                      setShowDeviceMenu(false);
                    }}
                  >
                    <span className="font-medium">{d.deviceName}</span>
                    <span className="block text-xs text-gray-400">{d.deviceID}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {(selectedCustomer || selectedDevice) && (
          <button
            type="button"
            className="self-end p-2 text-gray-400 hover:text-gray-600"
            onClick={() => {
              setSelectedCustomer('');
              setSelectedDevice('');
              setMetrics(null);
              setChartData([]);
            }}
            aria-label="Clear"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {!selectedDevice && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          {ui.noDevice}
        </div>
      )}

      {selectedDevice && (
        <>
          {lastUpdate && (
            <p className="text-xs text-gray-400 mb-3">{ui.lastUpdate}: {lastUpdate}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {phaseLabels.map((label, i) => (
              <MonitorCard
                key={label}
                title={label}
                value={metrics?.current?.[i]}
                unit="A"
                lastUpdate={lastUpdate}
                color="blue"
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

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h2 className="text-sm font-bold text-gray-800 mb-4">{ui.chartTitle}</h2>
            {chartLoading && chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">{ui.loading}</div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">{ui.noChart}</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tickFormatter={formatTimeLabel} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="A" />
                  <Tooltip labelFormatter={(l) => String(l)} />
                  <Legend />
                  <Line type="monotone" dataKey="currentL1" name={ui.l1} stroke="#3b82f6" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="currentL2" name={ui.l2} stroke="#8b5cf6" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="currentL3" name={ui.l3} stroke="#06b6d4" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
