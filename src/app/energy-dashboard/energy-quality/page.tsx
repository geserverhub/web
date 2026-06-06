'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import { eqT, fmtA, fmtNum } from '@/lib/energy/energy-quality-i18n';
import {
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  FileText,
  Gauge,
  Plus,
  User,
  Phone,
  MapPin,
  Mail,
  CircleDot,
  Zap,
  Flame,
  RotateCcw,
  Percent,
  BarChart3,
  Radio,
  Battery,
  Layers,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import EqCurrentHistoryChart, { buildEqCurrentChartLines } from '@/components/energy/EqCurrentHistoryChart';
import './energy-quality.css';

interface DeviceRow {
  deviceID: string;
  deviceName: string;
  GEsaveID?: string;
  location?: string;
  beforeMeterNo?: string;
  metricsMeterNo?: string;
  recordScope?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  owner?: string;
  phone?: string;
  connection?: string;
  ipAddress?: string;
}

interface Em4374Channel {
  voltage: (number | null)[];
  current: (number | null)[];
  activePower: number | null;
  reactivePower: number | null;
  apparentPower: number | null;
  powerFactor: number | null;
  thd: number | null;
  frequency: number | null;
  energyKwh: number | null;
}

const EMPTY_CHANNEL: Em4374Channel = {
  voltage: [null, null, null],
  current: [null, null, null],
  activePower: null,
  reactivePower: null,
  apparentPower: null,
  powerFactor: null,
  thd: null,
  frequency: null,
  energyKwh: null,
};

interface MonitoringMetrics {
  channels: { ch1: Em4374Channel; ch2: Em4374Channel };
  beforeCurrent: (number | null)[];
  afterCurrent: (number | null)[];
  thdBefore?: number | null;
  thdAfter?: number | null;
  powerFactor?: number | null;
  frequency?: number | null;
}

function channelHasReadings(channel: Em4374Channel | undefined): boolean {
  if (!channel) return false;
  return (
    hasPhaseReadings(channel.voltage) ||
    hasPhaseReadings(channel.current) ||
    channel.activePower != null ||
    channel.reactivePower != null ||
    channel.apparentPower != null ||
    channel.powerFactor != null ||
    channel.thd != null ||
    channel.frequency != null ||
    channel.energyKwh != null
  );
}

function hasMetricReadings(metrics: MonitoringMetrics | null): boolean {
  if (!metrics) return false;
  return channelHasReadings(metrics.channels?.ch1) || channelHasReadings(metrics.channels?.ch2);
}

function mapApiMetrics(raw: Record<string, unknown>): MonitoringMetrics {
  const channels = raw.channels as { ch1?: Em4374Channel; ch2?: Em4374Channel } | undefined;
  const ch1 = channels?.ch1 ?? EMPTY_CHANNEL;
  const ch2 = channels?.ch2 ?? EMPTY_CHANNEL;
  return {
    channels: { ch1, ch2 },
    beforeCurrent: (raw.beforeCurrent as (number | null)[]) ?? ch1.current,
    afterCurrent: (raw.afterCurrent as (number | null)[]) ?? ch2.current,
    thdBefore: (raw.thdBefore as number | null) ?? ch1.thd,
    thdAfter: (raw.thdAfter as number | null) ?? ch2.thd,
    powerFactor: (raw.powerFactor as number | null) ?? ch1.powerFactor ?? ch2.powerFactor,
    frequency: (raw.frequency as number | null) ?? ch1.frequency ?? ch2.frequency,
  };
}

function resolveRecordScope(scope?: string | null): 'installed' | 'pre_install' {
  const normalized = String(scope || '').trim().toLowerCase();
  if (normalized === 'installed') return 'installed';
  return 'pre_install';
}

function hasPhaseReadings(phases: (number | null)[] | undefined): boolean {
  return Boolean(phases?.some((v) => v != null && Number.isFinite(v)));
}

function phaseDisplay(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return v;
}

function phaseAvg(phases: (number | null)[] | undefined): number | null {
  if (!phases?.length) return null;
  const vals = phases.filter((v): v is number => v != null && Number.isFinite(v));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

type MetricKind =
  | 'voltage'
  | 'current'
  | 'activePower'
  | 'reactivePower'
  | 'apparentPower'
  | 'powerFactor'
  | 'thd'
  | 'frequency'
  | 'energy';

type PhaseKind = 'l1' | 'l2' | 'l3' | 'sum';

const METRIC_ICONS: Record<MetricKind, LucideIcon> = {
  voltage: Zap,
  current: Activity,
  activePower: Flame,
  reactivePower: RotateCcw,
  apparentPower: Gauge,
  powerFactor: Percent,
  thd: BarChart3,
  frequency: Radio,
  energy: Battery,
};

const PHASE_ICONS: Record<PhaseKind, LucideIcon> = {
  l1: Zap,
  l2: Activity,
  l3: Waves,
  sum: Layers,
};

function EqPhaseCard({
  label,
  value,
  unit,
  variant,
  format = 'auto',
  metricKind,
  phaseKind,
}: {
  label: string;
  value: number | null;
  unit: string;
  variant: 'ch1' | 'ch2' | 'avg';
  format?: 'auto' | 'v' | 'a' | 'num';
  metricKind: MetricKind;
  phaseKind: PhaseKind;
}) {
  const empty = value == null;
  const MetricIcon = METRIC_ICONS[metricKind];
  const PhaseIcon = PHASE_ICONS[phaseKind];
  const formatted =
    format === 'v' || (format === 'auto' && unit === 'V')
      ? fmtNum(value, 1)
      : format === 'a' || (format === 'auto' && unit === 'A')
        ? fmtA(value)
        : fmtNum(value);

  return (
    <div className={`eq-phase-card eq-phase-card--${variant}`}>
      <div className="eq-phase-card-icons" aria-hidden>
        <span className="eq-card-icon eq-card-icon--metric">
          <MetricIcon strokeWidth={2.25} />
        </span>
        <span className={`eq-card-icon eq-card-icon--phase eq-card-icon--${phaseKind}`}>
          <PhaseIcon strokeWidth={2.25} />
        </span>
      </div>
      <p className="eq-phase-label">{label}</p>
      <div className="eq-phase-value">
        <strong className={empty ? 'eq-val-empty' : ''}>{empty ? '—' : formatted}</strong>
        {unit && <span>{unit}</span>}
      </div>
    </div>
  );
}

function EqPhaseMetricRow({
  metricLabel,
  metricKind,
  unit,
  phases,
  total,
  ui,
  waiting,
  variant,
}: {
  metricLabel: string;
  metricKind: MetricKind;
  unit: string;
  phases?: (number | null)[];
  total?: number | null;
  ui: ReturnType<typeof eqT>;
  waiting: boolean;
  variant: 'ch1' | 'ch2' | 'avg';
}) {
  const hasPhases = Boolean(phases?.some((v) => v != null && Number.isFinite(v)));
  const phaseLabels = [ui.l1, ui.l2, ui.l3, hasPhases ? ui.avg : ui.totalPhase];
  const phaseKinds: PhaseKind[] = ['l1', 'l2', 'l3', 'sum'];
  const phaseValues: (number | null)[] = waiting
    ? [null, null, null, null]
    : hasPhases
      ? [
          phaseDisplay(phases?.[0]),
          phaseDisplay(phases?.[1]),
          phaseDisplay(phases?.[2]),
          phaseAvg(phases),
        ]
      : [null, null, null, waiting ? null : total ?? null];
  const cardVariants: ('ch1' | 'ch2' | 'avg')[] = [
    variant,
    variant,
    variant,
    hasPhases ? 'avg' : variant,
  ];
  const format =
    unit === 'V' ? 'v' : unit === 'A' ? 'a' : ('num' as const);
  const RowIcon = METRIC_ICONS[metricKind];

  return (
    <div className="eq-metric-row">
      <p className="eq-metric-row-label">
        <span className="eq-metric-row-icon">
          <RowIcon strokeWidth={2.25} />
        </span>
        {metricLabel}
        {unit ? <span className="eq-metric-row-unit">{unit}</span> : null}
      </p>
      <div className="eq-phase-grid eq-phase-grid--metric">
        {phaseLabels.map((label, i) => (
          <EqPhaseCard
            key={`${metricLabel}-${label}`}
            label={label}
            value={phaseValues[i]}
            unit={hasPhases || i < 3 ? unit : unit}
            variant={cardVariants[i]}
            format={format}
            metricKind={metricKind}
            phaseKind={phaseKinds[i]}
          />
        ))}
      </div>
    </div>
  );
}

function Em4374ChannelPanel({
  title,
  subtitle,
  channelLabel,
  channelClass,
  blockClass,
  data,
  ui,
  waiting,
  dataPending,
  lastUpdate,
}: {
  title: string;
  subtitle: string;
  channelLabel: string;
  channelClass: 'ch1' | 'ch2';
  blockClass: string;
  data: Em4374Channel;
  ui: ReturnType<typeof eqT>;
  waiting: boolean;
  dataPending?: boolean;
  lastUpdate: string;
}) {
  const cardVariant = channelClass === 'ch1' ? 'ch1' : 'ch2';
  const scalar = (value: number | null | undefined) => (waiting ? null : value ?? null);

  return (
    <section className={`eq-monitor-block ${blockClass}`}>
      <div className="eq-section-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
          {!waiting && lastUpdate && (
            <p className="eq-section-updated">{ui.lastUpdate}: {lastUpdate}</p>
          )}
        </div>
        <span className={`eq-channel-badge eq-channel-badge--${channelClass}`}>{channelLabel}</span>
      </div>

      {!waiting && dataPending && !channelHasReadings(data) && (
        <div className="eq-waiting-banner eq-waiting-banner--inline">
          <span className="eq-waiting-pulse" />
          <p>{ui.waitingForData}</p>
        </div>
      )}

      <div className="eq-metric-rows">
        <EqPhaseMetricRow
          metricLabel={ui.voltage}
          metricKind="voltage"
          unit="V"
          phases={data.voltage}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
        <EqPhaseMetricRow
          metricLabel={ui.current}
          metricKind="current"
          unit="A"
          phases={data.current}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
        <EqPhaseMetricRow
          metricLabel={ui.activePower}
          metricKind="activePower"
          unit="kW"
          total={scalar(data.activePower)}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
        <EqPhaseMetricRow
          metricLabel={ui.reactivePower}
          metricKind="reactivePower"
          unit="kVar"
          total={scalar(data.reactivePower)}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
        <EqPhaseMetricRow
          metricLabel={ui.apparentPower}
          metricKind="apparentPower"
          unit="kVA"
          total={scalar(data.apparentPower)}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
        <EqPhaseMetricRow
          metricLabel={ui.powerFactor}
          metricKind="powerFactor"
          unit=""
          total={scalar(data.powerFactor)}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
        <EqPhaseMetricRow
          metricLabel={ui.thd}
          metricKind="thd"
          unit="%"
          total={scalar(data.thd)}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
        <EqPhaseMetricRow
          metricLabel={ui.frequency}
          metricKind="frequency"
          unit="Hz"
          total={scalar(data.frequency)}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
        <EqPhaseMetricRow
          metricLabel={ui.energyKwh}
          metricKind="energy"
          unit="kWh"
          total={scalar(data.energyKwh)}
          ui={ui}
          waiting={waiting}
          variant={cardVariant}
        />
      </div>
    </section>
  );
}

function countActivePhases(phases: (number | null)[] | undefined): number {
  return phases?.filter((v) => v != null && Number.isFinite(v)).length ?? 0;
}

type StatusVisual = {
  percent: number;
  label: string;
  detail: string;
  fill: string;
  bg: string;
};

function getMeterStatusVisual(
  ui: ReturnType<typeof eqT>,
  waiting: boolean,
  dataPending: boolean,
  isOnline: boolean,
  hasData: boolean
): StatusVisual {
  if (waiting) {
    return {
      percent: 0,
      label: ui.statusWaiting,
      detail: ui.waitingForMeter,
      fill: '#94a3b8',
      bg: '#f1f5f9',
    };
  }
  if (!hasData) {
    if (isOnline) {
      return {
        percent: 40,
        label: ui.statusWaiting,
        detail: ui.waitingForData,
        fill: '#f59e0b',
        bg: '#fef3c7',
      };
    }
    return {
      percent: 12,
      label: ui.statusOffline,
      detail: ui.deviceOffline,
      fill: '#ef4444',
      bg: '#fee2e2',
    };
  }
  if (isOnline) {
    return {
      percent: 100,
      label: ui.statusNormal,
      detail: ui.online,
      fill: '#10b981',
      bg: '#d1fae5',
    };
  }
  return {
    percent: 65,
    label: ui.statusNormal,
    detail: ui.deviceOffline,
    fill: '#f59e0b',
    bg: '#fef3c7',
  };
}

function getCurrentStatusVisual(
  ui: ReturnType<typeof eqT>,
  waiting: boolean,
  active: number,
  total: number
): StatusVisual {
  if (waiting) {
    return {
      percent: 0,
      label: ui.statusWaiting,
      detail: ui.waitingForMeter,
      fill: '#94a3b8',
      bg: '#f1f5f9',
    };
  }
  const percent = total > 0 ? (active / total) * 100 : 0;
  const fill = percent >= 80 ? '#10b981' : percent >= 34 ? '#3b82f6' : active > 0 ? '#f59e0b' : '#94a3b8';
  const bg = percent >= 80 ? '#d1fae5' : percent >= 34 ? '#dbeafe' : active > 0 ? '#fef3c7' : '#f1f5f9';
  return {
    percent,
    label: active > 0 ? ui.statusNormal : ui.statusNoData,
    detail: `${ui.statusPhases} ${active}/${total}`,
    fill,
    bg,
  };
}

function EqStatusRing({
  title,
  percent,
  statusLabel,
  detail,
  fill,
  bg,
  icon: StatusIcon,
}: {
  title: string;
  percent: number;
  statusLabel: string;
  detail: string;
  fill: string;
  bg: string;
  icon: LucideIcon;
}) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <div className="eq-status-ring">
      <span className="eq-status-ring-badge" aria-hidden>
        <StatusIcon strokeWidth={2.25} />
      </span>
      <div className="eq-status-ring-chart">
        <ResponsiveContainer width="100%" height={132}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            data={[{ value, fill }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: bg }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="eq-status-ring-center">
          <strong>{Math.round(value)}%</strong>
          <span>{statusLabel}</span>
        </div>
      </div>
      <p className="eq-status-ring-title">{title}</p>
      <p className="eq-status-ring-detail">{detail}</p>
    </div>
  );
}

function EqStatusPanel({
  ui,
  waiting,
  dataPending,
  isOnline,
  hasData,
  ch1,
}: {
  ui: ReturnType<typeof eqT>;
  waiting: boolean;
  dataPending: boolean;
  isOnline: boolean;
  hasData: boolean;
  ch1: Em4374Channel;
}) {
  const meterStatus = getMeterStatusVisual(ui, waiting, dataPending, isOnline, hasData);
  const ch1Active = countActivePhases(ch1.current);
  const overallCurrent = getCurrentStatusVisual(ui, waiting, ch1Active, 3);
  const ch1Status = getCurrentStatusVisual(ui, waiting, ch1Active, 3);

  return (
    <section className="eq-status-panel">
      <div className="eq-status-panel-head">
        <CircleDot className="w-4 h-4 text-emerald-600" />
        <h2>{ui.statusPanelTitle}</h2>
      </div>
      <div className="eq-status-grid eq-status-grid--ch1">
        <EqStatusRing
          title={ui.meterStatusTitle}
          percent={meterStatus.percent}
          statusLabel={meterStatus.label}
          detail={meterStatus.detail}
          fill={meterStatus.fill}
          bg={meterStatus.bg}
          icon={Gauge}
        />
        <EqStatusRing
          title={ui.currentStatusTitle}
          percent={overallCurrent.percent}
          statusLabel={overallCurrent.label}
          detail={overallCurrent.detail}
          fill={overallCurrent.fill}
          bg={overallCurrent.bg}
          icon={Activity}
        />
        <EqStatusRing
          title={ui.ch1StatusTitle}
          percent={ch1Status.percent}
          statusLabel={ch1Status.label}
          detail={ch1Status.detail}
          fill={ch1Status.fill}
          bg={ch1Status.bg}
          icon={Zap}
        />
      </div>
    </section>
  );
}

function resolveUiLocale(locale: string): string {
  if (['th', 'ko', 'en', 'cn', 'vn', 'ms'].includes(locale)) return locale;
  return 'en';
}

export default function EnergyQualityPage() {
  const { selectedSite } = useSite();
  const { locale } = useLocale();
  const ui = eqT(resolveUiLocale(locale));

  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [chartData, setChartData] = useState<Record<string, string | number>[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');
  const [recording, setRecording] = useState<{ start: string | null; end: string | null; count: number }>({
    start: null,
    end: null,
    count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const filteredDevices = useMemo(() => {
    if (!selectedLocation) return devices;
    return devices.filter((d) => (d.location || '').trim() === selectedLocation);
  }, [devices, selectedLocation]);

  const selectedInfo = filteredDevices.find((d) => d.deviceID === selectedDevice);
  const waiting = !selectedDevice;
  const dataPending = Boolean(selectedDevice) && !loading && !hasMetricReadings(metrics);
  const ch1Data = metrics?.channels?.ch1 ?? EMPTY_CHANNEL;
  const isMeterOnline = selectedInfo?.connection === 'ONLINE';
  const hasLiveData = hasMetricReadings(metrics);
  const chartLines = useMemo(() => buildEqCurrentChartLines(ui), [ui]);

  const fetchDevices = useCallback(async () => {
    try {
      // Show meters from every site (incl. INPUT / pre_install meters), not just the selected site.
      const res = await fetch(`/api/ge-energy/devices-setting?site=all`, { cache: 'no-store' });
      const json = await res.json();
      const rows = json.devices ?? json.data;
      if (!json.success || !Array.isArray(rows)) {
        setDevices([]);
        setLocations([]);
        return;
      }
      const list: DeviceRow[] = rows.map((d: DeviceRow & { deviceID?: string | number; owner?: string; installation_location?: string }) => ({
        deviceID: String(d.deviceID ?? ''),
        deviceName: d.deviceName || String(d.deviceID),
        GEsaveID: d.GEsaveID,
        location: String(d.location || d.installation_location || '').trim(),
        beforeMeterNo: d.beforeMeterNo,
        metricsMeterNo: d.metricsMeterNo,
        recordScope: d.recordScope,
        customerName: d.customerName,
        customerPhone: d.customerPhone || d.phone,
        customerAddress: d.customerAddress,
        owner: d.owner,
        phone: d.phone,
        connection: d.connection,
        ipAddress: d.ipAddress,
      }));
      setDevices(list);
      const locs = Array.from(new Set(list.map((d) => d.location).filter(Boolean) as string[])).sort();
      setLocations(locs);
      if (selectedDevice && !list.some((d) => d.deviceID === selectedDevice)) {
        setSelectedDevice('');
        setMetrics(null);
        setChartData([]);
      }
    } catch {
      setDevices([]);
      setLocations([]);
    }
  }, [selectedDevice, selectedSite]);

  const fetchLiveMetrics = useCallback(async () => {
    if (!selectedDevice) return;
    const scope = resolveRecordScope(
      devices.find((d) => d.deviceID === selectedDevice)?.recordScope
    );
    try {
      setLoading(true);
      setError(null);
      const scopeQ = `&scope=${scope}`;
      const [monRes, histRes] = await Promise.all([
        fetch(`/api/ge-energy/device-monitoring?deviceId=${encodeURIComponent(selectedDevice)}${scopeQ}`, { cache: 'no-store' }),
        fetch(`/api/ge-energy/current-history?deviceId=${encodeURIComponent(selectedDevice)}&hours=1${scopeQ}`, { cache: 'no-store' }),
      ]);
      const json = await monRes.json();
      const histJson = await histRes.json();

      const parsePhases = (arr: unknown[], hist?: { L1?: number | null; L2?: number | null; L3?: number | null }) =>
        [0, 1, 2].map((i) => {
          const apiVal = arr[i];
          if (apiVal != null && Number.isFinite(Number(apiVal))) return Number(apiVal);
          const histVal = hist ? [hist.L1, hist.L2, hist.L3][i] : null;
          if (histVal != null && Number.isFinite(Number(histVal))) return Number(histVal);
          return null;
        });

      if (json.success && json.data) {
        setRecording({
          start: json.data.recordingStart ?? null,
          end: json.data.recordingEnd ?? null,
          count: Number(json.data.recordingCount ?? 0),
        });
      }

      const fromHist = histJson.data?.stats;
      let nextMetrics: MonitoringMetrics | null = null;
      let nextUpdate = '';

      if (json.success && json.data?.metrics) {
        const m = json.data.metrics as Record<string, unknown>;
        let mapped = mapApiMetrics(m);
        if (fromHist) {
          const before = parsePhases(mapped.beforeCurrent, fromHist.currentBefore);
          const after = parsePhases(mapped.afterCurrent, fromHist.currentAfter);
          mapped = {
            ...mapped,
            beforeCurrent: before,
            afterCurrent: after,
            channels: {
              ch1: { ...mapped.channels.ch1, current: before },
              ch2: { ...mapped.channels.ch2, current: after },
            },
          };
        }
        nextMetrics = mapped;
        nextUpdate = json.data.lastUpdate
          ? new Date(String(json.data.lastUpdate)).toLocaleString()
          : new Date().toLocaleString();
      } else if (histJson.success && fromHist) {
        const before = parsePhases([], fromHist.currentBefore);
        const after = parsePhases([], fromHist.currentAfter);
        nextMetrics = {
          channels: {
            ch1: { ...EMPTY_CHANNEL, current: before },
            ch2: { ...EMPTY_CHANNEL, current: after },
          },
          beforeCurrent: before,
          afterCurrent: after,
          thdBefore: null,
          thdAfter: null,
          powerFactor: null,
          frequency: null,
        };
        nextUpdate = new Date().toLocaleString();
      }

      if (nextMetrics) {
        setMetrics(nextMetrics);
        setLastUpdate(nextUpdate);
        setError(null);
      } else {
        setMetrics(null);
        setError(json.error || histJson.error || ui.errorLoad);
      }
    } catch {
      setError(ui.errorLoad);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [devices, selectedDevice, ui.errorLoad]);

  const fetchCurrentHistory = useCallback(async () => {
    if (!selectedDevice) return;
    const scope = resolveRecordScope(
      devices.find((d) => d.deviceID === selectedDevice)?.recordScope
    );
    try {
      setChartLoading(true);
      const res = await fetch(
        `/api/ge-energy/current-history?deviceId=${encodeURIComponent(selectedDevice)}&hours=0.5&scope=${scope}`,
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
  }, [devices, selectedDevice]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!selectedDevice) {
      setIsLive(false);
      setRecording({ start: null, end: null, count: 0 });
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

  const reportHref = selectedDevice
    ? `/energy-dashboard/energy-quality/report?deviceId=${encodeURIComponent(selectedDevice)}${
        selectedLocation ? `&location=${encodeURIComponent(selectedLocation)}` : ''
      }`
    : '/energy-dashboard/energy-quality/report';

  return (
    <div className="energy-page eq-page max-w-6xl mx-auto">
      <section className="eq-hero">
        <div className="eq-tag">
          <Gauge className="w-3.5 h-3.5" />
          {ui.tagline}
        </div>
        <h1>{ui.tagline}</h1>
        <p>{ui.pageSubtitle} · {ui.meterModel}</p>
      </section>

      <div className="eq-toolbar-row">
        <div className="eq-toolbar">
          {isLive ? (
            <span className="eq-badge-live">
              <Wifi className="w-3.5 h-3.5" /> {ui.live}
            </span>
          ) : (
            <span className="eq-badge-live eq-badge-off">
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
            className="eq-btn eq-btn-primary"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {ui.refresh}
          </button>
          <Link href={reportHref} className="eq-btn eq-btn-outline">
            <FileText className="w-4 h-4" />
            {ui.openReport}
          </Link>
        </div>
      </div>

      <div className="eq-panel">
        <div className="eq-split">
          <div className="eq-split-main">
            <div>
              <label>{ui.location}</label>
              <select
                className="eq-select"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setSelectedDevice('');
                  setMetrics(null);
                  setChartData([]);
                }}
              >
                <option value="">{ui.allLocations}</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <p className="eq-section-title mt-4">{ui.selectMeter}</p>
            <div className="eq-meter-grid">
              {filteredDevices.length === 0 ? (
                <p className="text-sm text-slate-400">{ui.noMeters}</p>
              ) : (
                filteredDevices.map((d) => {
                  const active = d.deviceID === selectedDevice;
                  return (
                    <button
                      key={d.deviceID}
                      type="button"
                      className={`eq-meter-btn${active ? ' eq-meter-btn-active' : ''}`}
                      onClick={() => setSelectedDevice(d.deviceID)}
                    >
                      {d.deviceName}
                      <span className="eq-sub">
                        {d.GEsaveID || d.deviceID}
                        {d.beforeMeterNo || d.metricsMeterNo
                          ? ` · CH1:${d.beforeMeterNo || '—'} CH2:${d.metricsMeterNo || '—'}`
                          : ''}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <aside className="eq-customer-card">
            <div className="eq-customer-header">
              <h3>{ui.customerInfo}</h3>
              <Link href="/add-machine" className="eq-btn eq-btn-primary eq-btn-sm">
                <Plus className="w-3.5 h-3.5" />
                {ui.addMeter}
              </Link>
            </div>
            <p className="eq-customer-hint">{ui.selectMeterHint}</p>

            {selectedInfo ? (
              <dl className="eq-customer-dl">
                <div>
                  <dt><User className="w-3.5 h-3.5 inline mr-1" />{ui.customerName}</dt>
                  <dd>{selectedInfo.customerName || '—'}</dd>
                </div>
                <div>
                  <dt><Phone className="w-3.5 h-3.5 inline mr-1" />{ui.customerPhone}</dt>
                  <dd>{selectedInfo.customerPhone || selectedInfo.phone || '—'}</dd>
                </div>
                <div>
                  <dt><MapPin className="w-3.5 h-3.5 inline mr-1" />{ui.customerAddress}</dt>
                  <dd>{selectedInfo.customerAddress || selectedInfo.location || '—'}</dd>
                </div>
                <div>
                  <dt><Mail className="w-3.5 h-3.5 inline mr-1" />{ui.ownerEmail}</dt>
                  <dd className="break-all">{selectedInfo.owner || '—'}</dd>
                </div>
                <div>
                  <dt>{ui.device} / {ui.meterId}</dt>
                  <dd>{selectedInfo.deviceName} · <span className="font-mono text-xs">{selectedInfo.GEsaveID || selectedInfo.deviceID}</span></dd>
                </div>
                <div>
                  <dt>{ui.connection}</dt>
                  <dd>
                    <span className={selectedInfo.connection === 'ONLINE' ? 'eq-status-online' : 'eq-status-offline'}>
                      {selectedInfo.connection === 'ONLINE' ? ui.online : ui.deviceOffline}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="eq-customer-empty">{ui.noCustomerSelected}</p>
            )}
          </aside>
        </div>
      </div>

      {error && <div className="eq-error">{error}</div>}

      <div className={`eq-live-panel${waiting ? ' eq-live-panel--waiting' : ''}`}>
        {waiting ? (
          <div className="eq-waiting-banner">
            <span className="eq-waiting-pulse" />
            <p>{ui.waitingForMeter}</p>
          </div>
        ) : (
          <>
            <div className="eq-device-strip">
              <div className="eq-device-strip-item">
                <label>{ui.device}</label>
                <span>{selectedInfo?.deviceName}</span>
              </div>
              <div className="eq-device-strip-item">
                <label>{ui.meterId}</label>
                <span className="mono">{selectedInfo?.GEsaveID || selectedInfo?.deviceID}</span>
              </div>
              <div className="eq-device-strip-item">
                <label>{ui.lastUpdate}</label>
                <span>{lastUpdate || '—'}</span>
              </div>
              <div className="eq-device-strip-item">
                <label>{ui.recordingPeriod}</label>
                <span>
                  {recording.start
                    ? `${new Date(recording.start).toLocaleString()} – ${
                        recording.end ? new Date(recording.end).toLocaleString() : '—'
                      }`
                    : '—'}
                  {recording.start && recording.end ? (
                    <small className="eq-device-strip-sub">
                      {' '}
                      ({Math.max(
                        1,
                        Math.ceil(
                          (new Date(recording.end).getTime() - new Date(recording.start).getTime()) /
                            86400000,
                        ),
                      )}d · {recording.count.toLocaleString()})
                    </small>
                  ) : null}
                </span>
              </div>
              <div className="eq-device-strip-item">
                <label>{ui.connection}</label>
                <span className={selectedInfo?.connection === 'ONLINE' ? 'eq-status-online' : 'eq-status-offline'}>
                  {selectedInfo?.connection === 'ONLINE' ? ui.online : ui.deviceOffline}
                </span>
              </div>
            </div>
            {dataPending && (
              <div className="eq-waiting-banner eq-waiting-banner--inline">
                <span className="eq-waiting-pulse" />
                <p>{ui.waitingForData}</p>
              </div>
            )}
          </>
        )}

        <EqStatusPanel
          ui={ui}
          waiting={waiting}
          dataPending={dataPending}
          isOnline={isMeterOnline}
          hasData={hasLiveData}
          ch1={ch1Data}
        />

        <Em4374ChannelPanel
          title={ui.beforeCurrent}
          subtitle={ui.selectMeterHint}
          channelLabel="CH1"
          channelClass="ch1"
          blockClass="eq-monitor-block--ch1"
          data={ch1Data}
          ui={ui}
          waiting={waiting}
          dataPending={dataPending}
          lastUpdate={lastUpdate}
        />

        <div className="eq-chart-panel">
          <h2>
            <Activity className="w-4 h-4 text-emerald-600" />
            {ui.chartTitle}
          </h2>
          {waiting ? (
            <div className="eq-chart-waiting">
              <div className="eq-chart-waiting-bars">
                {[40, 65, 45, 80, 55, 70, 50, 75, 60].map((h, i) => (
                  <span key={i} className="eq-chart-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
              <p>{ui.waitingForData}</p>
            </div>
          ) : chartLoading && chartData.length === 0 ? (
            <div className="eq-chart-waiting">
              <div className="eq-chart-waiting-bars">
                {[40, 65, 45, 80, 55, 70, 50, 75, 60].map((h, i) => (
                  <span key={i} className="eq-chart-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
              <p>{ui.loading}</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="eq-chart-waiting">
              <div className="eq-chart-waiting-bars">
                {[40, 65, 45, 80, 55, 70, 50, 75, 60].map((h, i) => (
                  <span key={i} className="eq-chart-bar eq-chart-bar--muted" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p>{ui.noChart}</p>
            </div>
          ) : (
            <div className="eq-chart-canvas">
              <EqCurrentHistoryChart data={chartData} lines={chartLines} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
