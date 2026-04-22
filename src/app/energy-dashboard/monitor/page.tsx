"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSite } from "@/lib/SiteContext";
import { useLocale } from "@/lib/LocaleContext";
import { formatCurrencyBySite, getCurrencyCodeBySite } from "@/lib/currency";
import { ChevronDown, RefreshCw, Clock, Wifi, WifiOff, X, Zap, Activity, Gauge, Leaf, BarChart2, TrendingDown } from "lucide-react";
import MonitorCard from "@/components/MonitorCard";
import {
  AreaChart, Area, BarChart, Bar, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

interface Device {
  deviceID: string;
  deviceName: string;
  location: string;
}

interface Customer {
  customerName: string;
  site: string;
  deviceCount: number;
  deviceIds: string[];
  deviceNames: string[];
}

interface MonitoringMetrics {
  voltageLL: number[];
  current: number[];
  power: number[];
  totalPower: number;
  reactivePower: number;
  apparentPower: number;
  frequency: number;
  powerFactor: number;
  energy: number;
  energySaved: number;
  co2Saved: number;
  beforeEnergy: number;
  thdBefore: number | null;
  thdAfter:  number | null;
}

interface DeviceSettingsRecord {
  deviceID?: string | number;
  deviceName?: string;
  location?: string;
  customerName?: string;
}

type ChartValue = string | number | null | undefined;
type ChartPoint = Record<string, ChartValue>;

export default function MonitorPage() {
  const { selectedSite } = useSite();
  const { t, locale } = useLocale();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [monitoringData, setMonitoringData] = useState<MonitoringMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [history, setHistory] = useState<ChartPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [energyHistory, setEnergyHistory] = useState<ChartPoint[]>([]);
  const [energyLoading, setEnergyLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Chart controls — compute dates on client side to avoid hydration mismatch
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yesterday = useMemo(() => new Date(Date.now() - 86400000).toISOString().slice(0, 10), []);
  const thirtyDaysAgo = useMemo(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), []);

  // Initialize with empty strings to avoid SSR hydration mismatch
  // Will be set to correct dates in useEffect
  const [energyDate, setEnergyDate] = useState('');
  const [trendMetric, setTrendMetric] = useState('voltageL1');
  const [period, setPeriod] = useState<'minute'|'hour'|'day'>('minute');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showLimits, setShowLimits] = useState(false);
  const [showMetricMenu, setShowMetricMenu] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  // Energy Historical chart (separate date range + data)
  const [histFromDate, setHistFromDate] = useState('');
  const [histToDate, setHistToDate] = useState('');
  const [histData, setHistData] = useState<ChartPoint[]>([]);
  const [histDataLoading, setHistDataLoading] = useState(false);

  // Event Viewer date range
  const [evFromDate, setEvFromDate] = useState('');
  const [evToDate, setEvToDate] = useState('');

  useEffect(() => {
    setIsClient(true);
    // Initialize dates on client side only
    setEnergyDate(today);
    setFromDate(yesterday);
    setToDate(today);
    setHistFromDate(thirtyDaysAgo);
    setHistToDate(today);
    setEvFromDate(yesterday);
    setEvToDate(today);
  }, [today, yesterday, thirtyDaysAgo]);

  // Format time label: show only HH:MM for minute/hour, date for day
  const formatXTick = (val: string) => {
    if (!val) return '';
    // "2026-02-23 14:30" → "14:30"  |  "2026-02-23 14:00" → "14:00"  |  "2026-02-23" → "23 Feb"
    const spaceIdx = val.indexOf(' ');
    if (spaceIdx !== -1) return val.slice(spaceIdx + 1); // HH:MM or HH:00
    // day period: YYYY-MM-DD → DD MMM
    const parts = val.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = parts[2];
      const monthIndex = parseInt(parts[1], 10) - 1;
      return `${day} ${monthNames[monthIndex]}`;
    }
    return val;
  };

  const metricOptions: [string, string, string][] = [
    ['voltageL1','Voltage LN1 (V)','V'], ['voltageL2','Voltage LN2 (V)','V'], ['voltageL3','Voltage LN3 (V)','V'],
    ['currentL1','Current L1 (A)','A'],  ['currentL2','Current L2 (A)','A'],  ['currentL3','Current L3 (A)','A'],
    ['totalPower','Active Power (kW)','kW'], ['reactivePower','Reactive Power (kVAr)','kVAr'], ['apparentPower','Apparent Power (kVA)','kVA'],
    ['powerFactor','Power Factor',''], ['frequency','Frequency (Hz)','Hz'],
    ['energy','Energy (kWh)','kWh'], ['energySaved','Energy Saved (kWh)','kWh'],
    ['thdBefore','THD Before (%)','%'], ['thdAfter','THD After (%)','%'],
  ];
  const activeMetric = metricOptions.find(([key]) => key === trendMetric) ?? metricOptions[0];
  const currencyCode = getCurrencyCodeBySite(selectedSite, locale);

  const fetchCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      const res = await fetch(`/api/kenergy/customers-by-site?site=${selectedSite}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.customers || []);
        setSelectedCustomer("");
        setSelectedDevice("");
        setDevices([]);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setCustomersLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const fetchDevicesForCustomer = useCallback(async (customerName: string) => {
    try {
      setDevicesLoading(true);
      const res = await fetch(`/api/kenergy/devices-setting?site=${selectedSite}`);
      const json = await res.json();
      if (json.success) {
        const customerDevices = (json.devices as DeviceSettingsRecord[]).filter((d) => d.customerName === customerName);
        setDevices(customerDevices.map((d) => ({
          deviceID: String(d.deviceID ?? ''),
          deviceName: d.deviceName ?? '',
          location: d.location ?? ''
        })));
        if (customerDevices.length === 1 && customerDevices[0]?.deviceID != null) {
          setSelectedDevice(String(customerDevices[0].deviceID));
        } else {
          setSelectedDevice("");
        }
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setDevicesLoading(false);
    }
  }, [selectedSite]);

  const fetchMonitoringData = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/kenergy/device-monitoring?deviceId=${selectedDevice}`);
      const json = await res.json();
      if (json.success) {
        setMonitoringData(json.data.metrics);
        setLastUpdate(json.data.lastUpdate);
      } else {
        setError(json.error || 'Failed to load monitoring data');
        setMonitoringData(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
      setMonitoringData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  const fetchHistory = useCallback(async (p?: string, f?: string, t?: string) => {
    if (!selectedDevice) return;
    try {
      setHistoryLoading(true);
      const per = p ?? period;
      const fr  = f ?? fromDate;
      const to_ = t ?? toDate;
      const res = await fetch(`/api/kenergy/device-history?deviceId=${selectedDevice}&period=${per}&from=${fr}&to=${to_}&limit=1440`);
      const json = await res.json();
      if (json.success) setHistory((json.history || []) as ChartPoint[]);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [fromDate, period, selectedDevice, toDate]);

  const fetchEnergyHistory = useCallback(async (date?: string) => {
    if (!selectedDevice) return;
    try {
      setEnergyLoading(true);
      const d = date ?? energyDate;
      const res = await fetch(`/api/kenergy/device-history?deviceId=${selectedDevice}&period=hour&from=${d}&to=${d}&limit=48`);
      const json = await res.json();
      if (json.success) setEnergyHistory((json.history || []) as ChartPoint[]);
    } catch (err) {
      console.error('Energy history fetch error:', err);
    } finally {
      setEnergyLoading(false);
    }
  }, [energyDate, selectedDevice]);

  const fetchHistData = useCallback(async (f?: string, t?: string) => {
    if (!selectedDevice) return;
    try {
      setHistDataLoading(true);
      const fr = f ?? histFromDate;
      const to_ = t ?? histToDate;
      const res = await fetch(`/api/kenergy/device-history?deviceId=${selectedDevice}&period=hour&from=${fr}&to=${to_}&limit=720`);
      const json = await res.json();
      if (json.success) setHistData((json.history || []) as ChartPoint[]);
    } catch (err) {
      console.error('HistData fetch error:', err);
    } finally {
      setHistDataLoading(false);
    }
  }, [histFromDate, histToDate, selectedDevice]);

  useEffect(() => {
    if (selectedDevice) {
      fetchMonitoringData();
      fetchHistory();
      fetchEnergyHistory();
      fetchHistData();
      const interval = setInterval(() => {
        fetchMonitoringData();
        fetchHistory();
        fetchEnergyHistory();
        fetchHistData();
      }, 30000);
      setIsLive(true);
      return () => { clearInterval(interval); setIsLive(false); };
    }
  }, [fetchEnergyHistory, fetchHistData, fetchHistory, fetchMonitoringData, selectedDevice]);

  const currentDevice = devices.find(d => d.deviceID === selectedDevice);

  const SectionHeader = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
    <div className={`flex items-center gap-2 mb-3`}>
      <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{label}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );

  return (
    <div className="min-h-full bg-gray-50 p-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('devicesMonitor') || 'Device Monitor'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time electrical measurements</p>
        </div>

        {lastUpdate && (
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
            {isLive
              ? <><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-600 font-medium">Live</span></>
              : <WifiOff className="w-4 h-4 text-gray-400" />
            }
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">{isClient ? new Date(lastUpdate).toLocaleString() : lastUpdate}</span>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Customer dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="flex items-center gap-2 pl-4 pr-3 py-2.5 border-2 border-gray-200 hover:border-green-400 rounded-xl bg-gray-50 hover:bg-green-50 transition-all min-w-[260px]"
              disabled={customersLoading}
            >
              <Activity className="w-4 h-4 text-green-500 shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">
                {selectedCustomer || (customersLoading ? "Loading…" : "Select Customer")}
              </span>
              {selectedCustomer && !customersLoading && (
                <X
                  className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setSelectedCustomer(""); setSelectedDevice(""); setDevices([]); setMonitoringData(null); setIsLive(false); }}
                />
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCustomerDropdown && customers.length > 0 && (
              <div className="absolute top-full left-0 mt-2 min-w-full bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 max-h-64 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.customerName}
                    onClick={() => {
                      setSelectedCustomer(customer.customerName);
                      setShowCustomerDropdown(false);
                      fetchDevicesForCustomer(customer.customerName);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors ${
                      selectedCustomer === customer.customerName ? 'bg-green-50 text-green-700' : 'text-gray-700'
                    }`}
                  >
                    <p className="text-sm font-semibold">{customer.customerName}</p>
                    <p className="text-xs text-gray-400">{customer.deviceCount} device{customer.deviceCount > 1 ? 's' : ''}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Device dropdown - only show if customer is selected */}
          {selectedCustomer && (
            <div className="relative">
              <button
                onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
                className="flex items-center gap-2 pl-4 pr-3 py-2.5 border-2 border-gray-200 hover:border-blue-400 rounded-xl bg-gray-50 hover:bg-blue-50 transition-all min-w-[260px]"
                disabled={devicesLoading}
              >
                <Wifi className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-700 text-left">
                  {devices.find(d => d.deviceID === selectedDevice)?.deviceName ?? (devicesLoading ? "Loading…" : "Select Device")}
                </span>
                {selectedDevice && !devicesLoading && (
                  <X
                    className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setSelectedDevice(""); setMonitoringData(null); setIsLive(false); }}
                  />
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDeviceDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDeviceDropdown && devices.length > 0 && (
                <div className="absolute top-full left-0 mt-2 min-w-full bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 max-h-64 overflow-y-auto">
                  {devices.map((device) => (
                    <button
                      key={device.deviceID}
                      onClick={() => { setSelectedDevice(device.deviceID); setShowDeviceDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors ${
                        selectedDevice === device.deviceID ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <p className="text-sm font-semibold">{device.deviceName}</p>
                      <p className="text-xs text-gray-400">{device.location || 'No location'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => { fetchMonitoringData(); fetchHistory(); }}
            disabled={!selectedDevice || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh') || 'Refresh'}
          </button>

          {currentDevice?.location && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              📍 {currentDevice.location}
            </span>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && !monitoringData && (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading monitoring data…</p>
          </div>
        </div>
      )}

      {/* ── No device selected ── */}
      {!selectedDevice && !loading && (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-sm mx-auto">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">No device selected</p>
            <p className="text-gray-400 text-sm">Choose a device from the dropdown above to view live data</p>
          </div>
        </div>
      )}

      {/* ── Charts — reference-style ── */}
      {selectedDevice && (
        <div className="space-y-5 mb-6">

          {/* ── 1. Trend Chart ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-wrap">
              {/* Select data */}
              <div className="relative">
                <button
                  onClick={() => { setShowMetricMenu(!showMetricMenu); setShowPeriodMenu(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 min-w-[160px]"
                >
                  <span className="flex-1 text-left">{activeMetric[1]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {showMetricMenu && (
                  <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[210px] max-h-72 overflow-y-auto">
                    {metricOptions.map(([key, label]) => (
                      <button key={key} onClick={() => { setTrendMetric(key); setShowMetricMenu(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${trendMetric===key ? 'text-green-600 font-semibold bg-green-50' : 'text-gray-700'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Period */}
              <div className="relative">
                <button
                  onClick={() => { setShowPeriodMenu(!showPeriodMenu); setShowMetricMenu(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                >
                  <span className="w-2 h-2 rounded-full border-2 border-gray-400" />
                  <span className="capitalize">{period}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {showPeriodMenu && (
                  <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    {(['minute','hour','day'] as const).map(p => (
                      <button key={p} onClick={() => { setPeriod(p); setShowPeriodMenu(false); fetchHistory(p); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 capitalize ${period===p ? 'text-green-600 font-semibold' : 'text-gray-700'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date range */}
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm" />
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm" />

              {/* Show Limits */}
              <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={showLimits} onChange={e => setShowLimits(e.target.checked)}
                  className="w-3.5 h-3.5 accent-green-500" />
                Show Limits
              </label>

              {/* Plot */}
              <button onClick={() => fetchHistory()}
                className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-md flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5" /> Plot
              </button>

              {/* Export placeholder */}
              <button className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md ml-auto">
                ⬇ Export
              </button>
            </div>

            {/* chart body */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-gray-400" /> Trend Chart
                  {historyLoading && <span className="text-xs text-gray-400 animate-pulse ml-1">Loading…</span>}
                </span>
                {/* zoom icon row (decorative, matching reference) */}
                <div className="flex items-center gap-2 text-gray-400">
                  <button title="Zoom In"  className="hover:text-gray-600 text-base leading-none">🔍︎</button>
                  <button title="Zoom Out" className="hover:text-gray-600 text-base leading-none">🔎︎</button>
                  <button title="Pan"      className="hover:text-gray-600 text-base leading-none">↕︎</button>
                  <button title="Reset"    className="hover:text-gray-600 text-base leading-none">⌂︎</button>
                </div>
              </div>
              {historyLoading ? (
                <div className="flex items-center justify-center h-52 gap-2 text-gray-400 text-sm">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Loading chart data…
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 text-gray-400 text-sm gap-2">
                  <BarChart2 className="w-8 h-8 opacity-30" />
                  <span>ไม่พบข้อมูลในช่วงวันที่เลือก</span>
                  <span className="text-xs">ลองเปลี่ยน date range แล้วกด Plot</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false} tickLine={false}
                      interval="preserveStartEnd"
                      tickFormatter={formatXTick}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false} tickLine={false}
                      width={52}
                      tickFormatter={(v) => Number(v).toFixed(1)}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}
                      formatter={(v: number | string) => [`${Number(v).toFixed(2)} ${activeMetric[2]}`, activeMetric[1]]}
                      labelFormatter={(val) => `🕐 ${val}`}
                      labelStyle={{ color: '#6b7280', fontSize: 11 }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={() => activeMetric[1]}
                    />
                    <Area
                      type="monotone"
                      dataKey={trendMetric}
                      name={activeMetric[1]}
                      stroke="#ef4444"
                      fill="url(#trendFill)"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                    />
                    {showLimits && trendMetric.startsWith('voltage') && (
                      <>
                        <Area type="monotone" dataKey={() => 240} name="Upper (240V)" stroke="#ef444488" fill="none" strokeDasharray="5 3" strokeWidth={1} dot={false} />
                        <Area type="monotone" dataKey={() => 210} name="Lower (210V)" stroke="#f9731688" fill="none" strokeDasharray="5 3" strokeWidth={1} dot={false} />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── 2 + 3. Energy Trend & Cost ── */}
          {(() => {
            const ZoomIcons = () => (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <button title="Zoom In"  className="hover:text-gray-600">🔍︎</button>
                <button title="Zoom Out" className="hover:text-gray-600">🔎︎</button>
                <button title="Pan"      className="hover:text-gray-600">↕︎</button>
                <button title="Reset"    className="hover:text-gray-600">⌂︎</button>
              </div>
            );
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Energy Trend */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-wrap">
                    <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white hover:bg-gray-50">
                      📅 Day <ChevronDown className="w-3 h-3" />
                    </button>
                    <input type="date" value={energyDate}
                      onChange={e => { setEnergyDate(e.target.value); fetchEnergyHistory(e.target.value); }}
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-xs" />
                    <button className="px-2.5 py-1.5 border border-green-500 text-green-600 text-xs rounded-md ml-auto hover:bg-green-50">⬇ Export</button>
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" />
                        Energy Trend (KWH)
                        {energyLoading && <span className="text-xs text-gray-400 animate-pulse ml-1">Loading…</span>}
                      </span>
                      <ZoomIcons />
                    </div>
                    {energyHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-52 text-gray-400 text-sm">ไม่มีข้อมูลในวันที่เลือก</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={energyHistory} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                            tickFormatter={formatXTick} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={36}
                            label={{ value: 'Energy Usage', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#9ca3af', dx: -2 }} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                            formatter={(v: number | string, n: string) => [`${Number(v).toFixed(2)} kWh`, n]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="offPeak" name="OFF PEAK" fill="#0f766e" radius={[3,3,0,0]} maxBarSize={28}>
                            <LabelList dataKey="offPeak" position="top" style={{ fontSize: 8, fill: '#0f766e' }}
                              formatter={(v: number | string) => Number(v) > 0 ? Number(v).toFixed(1) : ''} />
                          </Bar>
                          <Bar dataKey="onPeak" name="ON PEAK" fill="#fca5a5" radius={[3,3,0,0]} maxBarSize={28}>
                            <LabelList dataKey="onPeak" position="top" style={{ fontSize: 8, fill: '#ef4444' }}
                              formatter={(v: number | string) => Number(v) > 0 ? Number(v).toFixed(1) : ''} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Energy Cost */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-wrap">
                    <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white hover:bg-gray-50">
                      📅 Day <ChevronDown className="w-3 h-3" />
                    </button>
                    <input type="date" value={energyDate}
                      onChange={e => { setEnergyDate(e.target.value); fetchEnergyHistory(e.target.value); }}
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-xs" />
                    <button className="px-2.5 py-1.5 border border-green-500 text-green-600 text-xs rounded-md ml-auto hover:bg-green-50">⬇ Export</button>
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" />
                        {`Energy Cost (${currencyCode})`}
                      </span>
                      <ZoomIcons />
                    </div>
                    {energyHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-52 text-gray-400 text-sm">ไม่มีข้อมูลในวันที่เลือก</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={energyHistory} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                            tickFormatter={formatXTick} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40}
                            label={{ value: `Energy Cost (${currencyCode})`, angle: -90, position: 'insideLeft', fontSize: 9, fill: '#9ca3af', dx: -2 }} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                            formatter={(v: number | string, n: string) => [
                              formatCurrencyBySite(Number(v), selectedSite, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                              n,
                            ]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="costOffPeak" name="OFF PEAK" fill="#0f766e" radius={[3,3,0,0]} maxBarSize={28}>
                            <LabelList dataKey="costOffPeak" position="top" style={{ fontSize: 8, fill: '#0f766e' }}
                              formatter={(v: number | string) => Number(v) > 0 ? Number(v).toFixed(1) : ''} />
                          </Bar>
                          <Bar dataKey="costOnPeak" name="ON PEAK" fill="#fca5a5" radius={[3,3,0,0]} maxBarSize={28}>
                            <LabelList dataKey="costOnPeak" position="top" style={{ fontSize: 8, fill: '#ef4444' }}
                              formatter={(v: number | string) => Number(v) > 0 ? Number(v).toFixed(1) : ''} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── 4 + 5. Energy Historical & Event Viewer ── always visible ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Energy Historical */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-wrap">
                <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded-md text-xs bg-white hover:bg-gray-50">
                  📅 Hour <ChevronDown className="w-3 h-3" />
                </button>
                <input type="date" value={histFromDate}
                  onChange={e => { setHistFromDate(e.target.value); fetchHistData(e.target.value, histToDate); }}
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-xs" />
                <input type="date" value={histToDate}
                  onChange={e => { setHistToDate(e.target.value); fetchHistData(histFromDate, e.target.value); }}
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-xs" />
                <button className="px-2.5 py-1.5 border border-green-500 text-green-600 text-xs rounded-md ml-auto hover:bg-green-50">⬇ Export</button>
              </div>
              <div className="px-4 pb-4 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />
                    ENERGY HISTORICAL (KWH)
                  </span>
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <button title="Zoom In"  className="hover:text-gray-600">🔍︎</button>
                    <button title="Zoom Out" className="hover:text-gray-600">🔎︎</button>
                    <button title="Pan"      className="hover:text-gray-600">↕︎</button>
                    <button title="Reset"    className="hover:text-gray-600">⌂︎</button>
                  </div>
                </div>
                {histDataLoading ? (
                  <div className="flex items-center justify-center h-52">
                    <svg className="animate-spin w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  </div>
                ) : histData.length === 0 ? (
                  <div className="flex items-center justify-center h-52 text-gray-400 text-sm">ไม่มีข้อมูลในช่วงวันที่เลือก</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={histData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="energyHistGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#f97316" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                        tickFormatter={formatXTick} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={36}
                        label={{ value: 'Energy (KwH)', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#9ca3af', dx: -2 }} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        formatter={(v: number | string) => [`${Number(v).toFixed(2)} kWh`, 'Energy']}
                        labelFormatter={(val) => `🕐 ${val}`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="energy" name="Energy (KWH)"
                        stroke="#f97316" fill="url(#energyHistGrad)" strokeWidth={2} dot={false}
                        activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Event Viewer */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-wrap">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-gray-400 inline-block rounded-sm" /> EVENT VIEWER
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <input type="date" value={evFromDate} onChange={e => setEvFromDate(e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs" />
                  <input type="date" value={evToDate} onChange={e => setEvToDate(e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-sm text-gray-600">Show</span>
                  <input type="number" defaultValue={8} className="w-14 px-2 py-1 border border-gray-300 rounded text-sm" />
                  <span className="text-sm text-gray-600">entries</span>
                  <select className="px-2 py-1 border border-gray-300 rounded text-sm ml-auto">
                    <option>All Types</option>
                    <option>Alert</option>
                    <option>Warning</option>
                    <option>Info</option>
                  </select>
                  <input type="search" placeholder="Search…" className="px-3 py-1 border border-gray-300 rounded text-sm w-32" />
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {['Date','Data','Type','Message','Status','Actions'].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-gray-500 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">No data available in table</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-3">Showing 0 to 0 of 0 entries</p>
              </div>
            </div>
          </div>

        </div>
      )}



      {/* ── Metric Grid ── */}
      {monitoringData && selectedDevice && (
        <div className="space-y-6">

          {/* Voltage */}
          <section>
            <SectionHeader
              icon={<Zap className="w-4 h-4 text-yellow-600" />}
              label="Voltage (Line-to-Line)"
              color="bg-yellow-100"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {["L1–L2", "L2–L3", "L3–L1"].map((label, i) => (
                <MonitorCard key={i} title={`Voltage ${label}`} value={monitoringData.voltageLL[i]} unit="V" lastUpdate={lastUpdate} color="yellow" icon="voltage" />
              ))}
            </div>
          </section>

          {/* Current */}
          <section>
            <SectionHeader
              icon={<Activity className="w-4 h-4 text-blue-600" />}
              label="Current"
              color="bg-blue-100"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {["Phase 1", "Phase 2", "Phase 3"].map((label, i) => (
                <MonitorCard key={i} title={`Current ${label}`} value={monitoringData.current[i]} unit="A" lastUpdate={lastUpdate} color="blue" icon="current" />
              ))}
            </div>
          </section>

          {/* Power */}
          <section>
            <SectionHeader
              icon={<Gauge className="w-4 h-4 text-orange-600" />}
              label="Power"
              color="bg-orange-100"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {["Phase 1", "Phase 2", "Phase 3"].map((label, i) => (
                <MonitorCard key={i} title={`Power ${label}`} value={monitoringData.power[i]} unit="kW" lastUpdate={lastUpdate} color="orange" icon="power" />
              ))}
              <MonitorCard title="Total Power" value={monitoringData.totalPower} unit="kW" lastUpdate={lastUpdate} color="orange" icon="total" highlight />
              <MonitorCard title="Reactive Power" value={monitoringData.reactivePower} unit="kVAr" lastUpdate={lastUpdate} color="purple" icon="power" />
              <MonitorCard title="Apparent Power" value={monitoringData.apparentPower} unit="kVA" lastUpdate={lastUpdate} color="purple" icon="power" />
              <MonitorCard title="Frequency" value={monitoringData.frequency} unit="Hz" lastUpdate={lastUpdate} color="blue" icon="frequency" />
              <MonitorCard title="Power Factor" value={monitoringData.powerFactor} unit="PF" lastUpdate={lastUpdate} color="green" icon="pf" />
            </div>
          </section>

          {/* THD */}
          <section>
            <SectionHeader
              icon={<TrendingDown className="w-4 h-4 text-red-600" />}
              label="Total Harmonic Distortion (THD)"
              color="bg-red-100"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Before card */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-4">
                <div className="shrink-0">
                  <ResponsiveContainer width={80} height={80}>
                    <RadialBarChart
                      innerRadius={28} outerRadius={40}
                      data={[{ value: Math.min(monitoringData.thdBefore ?? 0, 100), fill: '#ef4444' }]}
                      startAngle={90} endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#fee2e2' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">THD Before</p>
                  <p className="text-2xl font-bold text-red-700 tabular-nums">
                    {monitoringData.thdBefore != null ? `${monitoringData.thdBefore.toFixed(2)}%` : '—'}
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">Before K-Save</p>
                </div>
              </div>

              {/* After card */}
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-4">
                <div className="shrink-0">
                  <ResponsiveContainer width={80} height={80}>
                    <RadialBarChart
                      innerRadius={28} outerRadius={40}
                      data={[{ value: Math.min(monitoringData.thdAfter ?? 0, 100), fill: '#22c55e' }]}
                      startAngle={90} endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#dcfce7' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">THD After</p>
                  <p className="text-2xl font-bold text-green-700 tabular-nums">
                    {monitoringData.thdAfter != null ? `${monitoringData.thdAfter.toFixed(2)}%` : '—'}
                  </p>
                  <p className="text-xs text-green-500 mt-0.5">With K-Save</p>
                </div>
              </div>

              {/* Reduction card */}
              {monitoringData.thdBefore != null && monitoringData.thdAfter != null && monitoringData.thdBefore > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <TrendingDown className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">THD Reduction</p>
                    <p className="text-2xl font-bold text-blue-700 tabular-nums">
                      {(((monitoringData.thdBefore - monitoringData.thdAfter) / monitoringData.thdBefore) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">
                      ↓ {(monitoringData.thdBefore - monitoringData.thdAfter).toFixed(2)} pp
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Energy & Savings */}
          <section>
            <SectionHeader
              icon={<Leaf className="w-4 h-4 text-green-600" />}
              label="Energy & Savings"
              color="bg-green-100"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <MonitorCard title="Energy" value={monitoringData.energy} unit="kWh" lastUpdate={lastUpdate} color="green" icon="energy" />
              <MonitorCard title="Energy Saved" value={monitoringData.energySaved} unit="kWh" lastUpdate={lastUpdate} color="green" icon="energy" highlight />
              <MonitorCard title="CO₂ Saved" value={monitoringData.co2Saved} unit="kg" lastUpdate={lastUpdate} color="green" icon="co2" highlight />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
