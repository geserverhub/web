'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/LocaleContext';
import DeviceCard from '@/components/DeviceCard';
import { Plus, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';

interface Device {
  deviceID: string;
  deviceName: string;
  customerName: string | null;
  geId: string | null;
  seriesNo: string | null;
  location: string | null;
  isOnline: boolean;
  lastUpdate: string | null;
  currentReadings: {
    l1: number | null;
    l2: number | null;
    l3: number | null;
  };
}

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
    deviceID: device.deviceID,
    deviceName: device.deviceName,
    customerName,
    geId: device.GEsaveID?.trim() || null,
    seriesNo: device.seriesNo?.trim() || null,
    location: device.location?.trim() || null,
    isOnline: device.isOnline,
    lastUpdate: device.lastUpdate,
    currentReadings: {
      l1: ch2[0] ?? ch1[0] ?? null,
      l2: ch2[1] ?? ch1[1] ?? null,
      l3: ch2[2] ?? ch1[2] ?? null,
    },
  };
}

export default function OverviewPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ge-energy/dashboard-stats?site=all');
      const json = await res.json();

      if (json.success) {
        const recent = (json.data?.recentDevices ?? []) as DashboardStatsDevice[];
        setDevices(recent.map(mapStatsDevice));
        setError(null);
      } else {
        setError(json.error || t('loadDevicesFailed'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
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
                currentReadings={device.currentReadings}
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
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  const hours = diffHours % 24;
  const minutes = diffMins % 60;
  const seconds = diffSecs % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
