'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/LocaleContext';
import DeviceCard from '@/components/DeviceCard';
import { Plus, RefreshCw, Server, Wifi, WifiOff, Activity } from 'lucide-react';
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

interface Device {
  deviceID: string;
  deviceName: string;
  customerName: string | null;
  geId: string | null;
  seriesNo: string | null;
  location: string | null;
  isOnline: boolean;
  lastUpdate: string | null;
  ch1Readings: {
    l1: number | null;
    l2: number | null;
    l3: number | null;
  };
  ch2Readings: {
    l1: number | null;
    l2: number | null;
    l3: number | null;
  };
  co2Kg: number | null;
  carbonCreditsTonnes: number | null;
}

type TrendPoint = { time: string; ch1: number; ch2: number };

type DashboardStatsDevice = {
  deviceID: string;
  deviceName: string;
  customerName?: string | null;
  customerNameEn?: string | null;
  GEsaveID?: string | null;
  seriesNo?: string | null;
  location: string | null;
  isOnline: boolean;
  lastUpdate: string | null;
  currentABC?: Array<number | null>;
  beforeCurrentABC?: Array<number | null>;
};

function mapStatsDevice(device: DashboardStatsDevice): Device {
  const ch2 = device.currentABC ?? [];
  const ch1 = device.beforeCurrentABC ?? [];
  const customerName =
    (device.customerName || device.customerNameEn || '').trim() || null;
  return {
    deviceID: String(device.deviceID),
    deviceName: device.deviceName,
    customerName,
    geId: device.GEsaveID?.trim() || null,
    seriesNo: device.seriesNo?.trim() || null,
    location: device.location?.trim() || null,
    isOnline: device.isOnline,
    lastUpdate: device.lastUpdate,
    ch1Readings: {
      l1: ch1[0] ?? null,
      l2: ch1[1] ?? null,
      l3: ch1[2] ?? null,
    },
    ch2Readings: {
      l1: ch2[0] ?? null,
      l2: ch2[1] ?? null,
      l3: ch2[2] ?? null,
    },
    co2Kg: null,
    carbonCreditsTonnes: null,
  };
}

export default function OverviewPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [trendByDevice, setTrendByDevice] = useState<Map<string, TrendPoint[]>>(new Map());
  const [trendLoading, setTrendLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ge-energy/dashboard-stats?site=all');
      const json = await res.json();

      if (json.success) {
        const recent = (json.data?.recentDevices ?? []) as DashboardStatsDevice[];
        const mapped = recent.map(mapStatsDevice);
        setDevices(mapped);
        setError(null);

        // Merge in CO2 / carbon credits per meter (latest CH1-CH2 diff, already
        // computed correctly by carbon-meters — see earlier fixes this session).
        try {
          const carbonRes = await fetch('/api/ge-energy/carbon-meters?period=365&all=true', {
            cache: 'no-store',
          });
          const carbonJson = await carbonRes.json();
          if (carbonJson.success) {
            const byId = new Map<string, { co2Kg: number; carbonCreditsTonnes: number }>(
              carbonJson.meters.map((m: { deviceId: number; co2Kg: number; carbonCreditsTonnes: number }) => [
                String(m.deviceId),
                { co2Kg: m.co2Kg, carbonCreditsTonnes: m.carbonCreditsTonnes },
              ]),
            );
            setDevices((prev) =>
              prev.map((d) => {
                const c = byId.get(d.deviceID);
                return c ? { ...d, co2Kg: c.co2Kg, carbonCreditsTonnes: c.carbonCreditsTonnes } : d;
              }),
            );
          }
        } catch {
          /* non-critical — cards just show without CO2/credit stats */
        }

        // Aggregate CH1 vs CH2 trend across all meters for the comparison chart.
        fetchTrend(mapped.map((d) => d.deviceID));
      } else {
        setError(json.error || t('loadDevicesFailed'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('networkError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const fetchTrend = useCallback(async (deviceIds: string[]) => {
    if (!deviceIds.length) {
      setTrend([]);
      setTrendByDevice(new Map());
      return;
    }
    setTrendLoading(true);
    try {
      const results = await Promise.all(
        deviceIds.map((id) =>
          fetch(`/api/ge-energy/current-history?deviceId=${encodeURIComponent(id)}&hours=3&scope=installed`, {
            cache: 'no-store',
          })
            .then((r) => r.json())
            .then((json) => ({ id, json }))
            .catch(() => ({ id, json: null })),
        ),
      );

      // Bucket every device's chartData by its "time" label (HH:MM) and average
      // beforeAvg (CH1) / afterAvg (CH2) across whichever meters have a point
      // at that minute.
      const buckets = new Map<string, { ch1: number[]; ch2: number[] }>();
      const perDevice = new Map<string, TrendPoint[]>();
      for (const { id, json } of results) {
        const points = json?.data?.chartData ?? [];
        const series: TrendPoint[] = [];
        for (const p of points) {
          if (!p?.time) continue;
          const bucket = buckets.get(p.time) ?? { ch1: [], ch2: [] };
          if (p.beforeAvg != null && Number.isFinite(p.beforeAvg)) bucket.ch1.push(p.beforeAvg);
          if (p.afterAvg != null && Number.isFinite(p.afterAvg)) bucket.ch2.push(p.afterAvg);
          buckets.set(p.time, bucket);
          series.push({
            time: p.time,
            ch1: p.beforeAvg != null ? Math.round(p.beforeAvg * 100) / 100 : 0,
            ch2: p.afterAvg != null ? Math.round(p.afterAvg * 100) / 100 : 0,
          });
        }
        perDevice.set(id, series);
      }

      const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
      const merged = Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, b]) => ({ time, ch1: Math.round(avg(b.ch1) * 100) / 100, ch2: Math.round(avg(b.ch2) * 100) / 100 }));

      setTrend(merged);
      setTrendByDevice(perDevice);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deviceCount = devices.length;

  const handleEditDevice = (deviceId: string) => {
    router.push(`/devices-setting?device=${deviceId}`);
  };

  // Loading State
  if (loading && devices.length === 0) {
    return (
      <div className="energy-page space-y-5 animate-pulse">
        <div className="h-36 bg-gradient-to-r from-slate-200 to-slate-100 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const onlineCount = devices.filter(d => d.isOnline).length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div className="energy-page space-y-5">

      {/* Hero */}
      <div className="energy-hero">
        <div className="energy-hero-inner px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <Server className="w-3.5 h-3.5" /> {t('overviewCompanyBadge')}
            </div>
            <h1 className="text-3xl font-black text-white mb-1">{t('devicesOverview')}</h1>
            <p className="text-emerald-100 text-sm">{t('overviewSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { icon: Server, val: deviceCount, label: t('total'), color: 'from-white/20 to-white/10' },
              { icon: Wifi, val: onlineCount, label: t('online'), color: 'from-emerald-400/40 to-emerald-500/20' },
              { icon: WifiOff, val: offlineCount, label: t('offline'), color: offlineCount > 0 ? 'from-red-400/40 to-red-500/20' : 'from-white/20 to-white/10' },
            ].map(kpi => (
              <div key={kpi.label} className={`flex flex-col items-center bg-gradient-to-br ${kpi.color} backdrop-blur-sm rounded-2xl px-5 py-3 min-w-[80px] border border-white/20`}>
                <kpi.icon className="w-4 h-4 text-white/70 mb-1" />
                <span className="text-2xl font-black text-white leading-none">{kpi.val}</span>
                <span className="text-emerald-100 text-xs mt-0.5">{kpi.label}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={fetchDevices} title={t('refresh')}
                className="p-3 bg-white/15 hover:bg-white/25 rounded-xl border border-white/20 transition-all">
                <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => router.push('/devices-setting')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 font-bold text-sm rounded-xl hover:bg-emerald-50 transition-all shadow-md">
                <Plus className="w-4 h-4" /> {t('addDevice')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* CH1 vs CH2 trend, averaged across all meters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Activity className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-800">{t('ch1Ch2TrendTitle')}</h2>
          {trendLoading && <RefreshCw className="w-3.5 h-3.5 text-gray-300 animate-spin ml-1" />}
        </div>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="ovCh1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="ovCh2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" A" />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} A`} />
              <Legend />
              <Area type="monotone" dataKey="ch1" name="CH1" stroke="#ea580c" fill="url(#ovCh1)" strokeWidth={2} />
              <Area type="monotone" dataKey="ch2" name="CH2" stroke="#2563eb" fill="url(#ovCh2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 text-sm py-10">{t('noChart')}</p>
        )}
      </div>

      {/* Device Cards */}
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {devices.map((device) => {
            const isOnline = device.isOnline;
            return (
              <DeviceCard
                key={device.deviceID}
                deviceName={device.deviceName}
                customerName={device.customerName}
                geId={device.geId}
                seriesNo={device.seriesNo}
                location={device.location}
                isOnline={isOnline}
                ch1Readings={device.ch1Readings}
                ch2Readings={device.ch2Readings}
                co2Kg={device.co2Kg}
                carbonCreditsTonnes={device.carbonCreditsTonnes}
                trend={trendByDevice.get(device.deviceID)}
                lastConnected={device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : t('notAvailable')}
                onlineTime={isOnline && device.lastUpdate ? calculateTimeAgo(device.lastUpdate) : undefined}
                onEdit={() => handleEditDevice(device.deviceID)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Server className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">{t('noDevicesFound')}</p>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate time ago
function calculateTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  // Clamp to 0 instead of going negative when the browser's clock lags
  // slightly behind the server's (clock skew), or the reading is very fresh.
  const diffMs = Math.max(0, now.getTime() - then.getTime());
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  const hours = diffHours % 24;
  const minutes = diffMins % 60;
  const seconds = diffSecs % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
