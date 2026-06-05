'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import {
  eqT,
  EQ_PRINT_LOCALES,
  EQ_PRINT_LANG_META,
  type EqLocale,
} from '@/lib/energy/energy-quality-i18n';
import { reportT } from '@/lib/energy/energy-quality-report-i18n';
import {
  buildDisplayEnergyQualityReport,
  buildReportPrintHtml,
  enrichEnergyQualityReport,
  type ReportChannel,
  type DeviceReportInput,
  type HistoryPoint,
  type EnergyQualityReport,
  type ReportDbCustomer,
  type ReportDbSite,
} from '@/lib/energy/energy-quality-report-model';
import EnergyQualityReportView from '@/components/energy/EnergyQualityReportView';
import {
  analyzeCurrentHistory,
  type DbChartPoint,
} from '@/lib/energy/energy-quality-current-analysis';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Printer,
  ArrowLeft,
  FileText,
  Globe,
  Check,
  Loader2,
} from 'lucide-react';
import '../energy-quality.css';

interface DeviceRow extends DeviceReportInput {
  recordScope?: string;
}

const PLACEHOLDER_DEVICE: DeviceReportInput = {
  deviceID: '—',
  deviceName: '—',
  location: '—',
};

const EMPTY_CHANNEL: ReportChannel = {
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

function resolveRecordScope(scope?: string | null): 'installed' | 'pre_install' {
  const normalized = String(scope || '').trim().toLowerCase();
  if (normalized === 'pre_install' || normalized === 'pre-install' || normalized === 'preinstall') {
    return 'pre_install';
  }
  return 'installed';
}

function mapChannels(raw: Record<string, unknown>) {
  const channels = raw.channels as { ch1?: ReportChannel; ch2?: ReportChannel } | undefined;
  return {
    ch1: channels?.ch1 ?? EMPTY_CHANNEL,
    ch2: channels?.ch2 ?? EMPTY_CHANNEL,
  };
}

function channelHasLiveData(ch: ReportChannel): boolean {
  return (
    ch.current.some((v) => v != null && Number.isFinite(v)) ||
    ch.voltage.some((v) => v != null && Number.isFinite(v)) ||
    ch.thd != null ||
    ch.powerFactor != null
  );
}

function EnergyQualityReportInner() {
  const searchParams = useSearchParams();
  const { selectedSite } = useSite();
  const { locale } = useLocale();
  const reportRef = useRef<HTMLDivElement>(null);

  const initialDevice = searchParams.get('deviceId') || '';
  const initialLocation = searchParams.get('location') || '';

  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [selectedDevice, setSelectedDevice] = useState(initialDevice);
  const [ch1, setCh1] = useState<ReportChannel>(EMPTY_CHANNEL);
  const [ch2, setCh2] = useState<ReportChannel>(EMPTY_CHANNEL);
  const [lastUpdate, setLastUpdate] = useState('');
  const [historyPoints, setHistoryPoints] = useState(0);
  const [chartData, setChartData] = useState<DbChartPoint[]>([]);
  const [historyPeriod, setHistoryPeriod] = useState('24 hours');
  const [measurementStart, setMeasurementStart] = useState<string>();
  const [measurementEnd, setMeasurementEnd] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [printLocale, setPrintLocale] = useState<EqLocale>(
    (['th', 'ko', 'en', 'cn', 'vn', 'ms'].includes(locale) ? locale : 'en') as EqLocale,
  );
  const ui = eqT(printLocale);
  const [dbCustomer, setDbCustomer] = useState<ReportDbCustomer | null>(null);
  const [dbSite, setDbSite] = useState<ReportDbSite | null>(null);
  const [dbTablesReady, setDbTablesReady] = useState<boolean | null>(null);
  const lastPersistRef = useRef(0);

  const filteredDevices = useMemo(() => {
    if (!selectedLocation) return devices;
    return devices.filter((d) => (d.location || '').trim() === selectedLocation);
  }, [devices, selectedLocation]);

  const selectedInfo = filteredDevices.find((d) => d.deviceID === selectedDevice);
  const rt = reportT(printLocale);

  const hasLiveData = channelHasLiveData(ch1) || channelHasLiveData(ch2);
  const livePending = Boolean(selectedDevice) && !hasLiveData;
  const noMeter = !selectedDevice;

  const dbAnalysis = useMemo(
    () =>
      analyzeCurrentHistory(chartData, {
        locale: printLocale,
        ch1Label: rt.ch1Label,
        ch2Label: rt.ch2Label,
        periodLabel: historyPeriod,
      }),
    [chartData, printLocale, rt.ch1Label, rt.ch2Label, historyPeriod],
  );

  const report = useMemo(() => {
    const device = selectedInfo ?? PLACEHOLDER_DEVICE;
    const built = buildDisplayEnergyQualityReport({
      device,
      site: selectedSite,
      lastUpdate: lastUpdate || rt.waitingLive,
      ch1: selectedDevice ? ch1 : EMPTY_CHANNEL,
      ch2: selectedDevice ? ch2 : EMPTY_CHANNEL,
      historyPoints,
      measurementStart,
      measurementEnd,
      chartData,
      locale: printLocale,
      livePending,
      noMeter,
    });
    if (noMeter || (!dbCustomer && !dbSite)) return built;
    return enrichEnergyQualityReport(built, { customer: dbCustomer, site: dbSite }, rt);
  }, [
    selectedInfo,
    selectedSite,
    lastUpdate,
    ch1,
    ch2,
    historyPoints,
    measurementStart,
    measurementEnd,
    chartData,
    printLocale,
    livePending,
    noMeter,
    selectedDevice,
    dbCustomer,
    dbSite,
    rt,
  ]);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`/api/ge-energy/devices-setting?site=${selectedSite}`, { cache: 'no-store' });
      const json = await res.json();
      const rows = json.devices ?? json.data;
      if (!json.success || !Array.isArray(rows)) {
        setDevices([]);
        return;
      }
      const list: DeviceRow[] = rows.map((d: DeviceRow & { deviceID?: string | number }) => ({
        deviceID: String(d.deviceID ?? ''),
        deviceName: d.deviceName || String(d.deviceID),
        geID: d.geID,
        location: d.location?.trim() || '',
        beforeMeterNo: d.beforeMeterNo,
        metricsMeterNo: d.metricsMeterNo,
        recordScope: d.recordScope,
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        customerAddress: d.customerAddress,
        owner: d.owner,
        ipAddress: d.ipAddress,
      }));
      setDevices(list);
      setLocations(Array.from(new Set(list.map((d) => d.location).filter(Boolean) as string[])).sort());
    } catch {
      setDevices([]);
    }
  }, [selectedSite]);

  const fetchSnapshot = useCallback(async () => {
    if (!selectedDevice || !selectedInfo) return;
    try {
      if (!lastUpdate) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const scope = resolveRecordScope(selectedInfo.recordScope);
      const scopeQ = `&scope=${scope}`;
      const [monRes, histRes] = await Promise.all([
        fetch(
          `/api/ge-energy/device-monitoring?deviceId=${encodeURIComponent(selectedDevice)}${scopeQ}`,
          { cache: 'no-store' },
        ),
        fetch(
          `/api/ge-energy/current-history?deviceId=${encodeURIComponent(selectedDevice)}&hours=24${scopeQ}`,
          { cache: 'no-store' },
        ),
      ]);
      const json = await monRes.json();
      const histJson = await histRes.json();

      if (json.success && json.data?.metrics) {
        const { ch1: c1, ch2: c2 } = mapChannels(json.data.metrics as Record<string, unknown>);
        setCh1(c1);
        setCh2(c2);
        setLastUpdate(
          json.data.lastUpdate
            ? new Date(json.data.lastUpdate).toLocaleString()
            : new Date().toLocaleString(),
        );
      } else {
        setError(json.error || ui.errorLoad);
        setCh1(EMPTY_CHANNEL);
        setCh2(EMPTY_CHANNEL);
        setLastUpdate('');
        return;
      }

      const hist = histJson.data;
      const points = (hist?.chartData ?? []) as DbChartPoint[];
      setChartData(points);
      setHistoryPoints(hist?.dataPoints ?? points.length);
      if (hist?.period) setHistoryPeriod(String(hist.period));
      if (points.length > 0) {
        const first = points[0];
        const last = points[points.length - 1];
        const fmtTs = (p: DbChartPoint) =>
          p.timestamp ? new Date(p.timestamp).toLocaleString() : p.time;
        setMeasurementStart(fmtTs(first));
        setMeasurementEnd(fmtTs(last));
      }
    } catch {
      setError(ui.errorLoad);
      setCh1(EMPTY_CHANNEL);
      setCh2(EMPTY_CHANNEL);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDevice, selectedInfo, ui.errorLoad, lastUpdate]);

  const fetchDbContext = useCallback(async (deviceId: string) => {
    try {
      const res = await fetch(
        `/api/ge-energy/energy-quality-report?deviceId=${encodeURIComponent(deviceId)}`,
        { cache: 'no-store' },
      );
      const json = await res.json();
      if (!json.success) {
        setDbTablesReady(false);
        setDbCustomer(null);
        setDbSite(null);
        return;
      }
      setDbTablesReady(json.tablesReady ?? false);
      const c = json.customer;
      const s = json.site;
      setDbCustomer(
        c
          ? {
              customer_name: c.customer_name,
              business_type: c.business_type,
              address: c.address,
              contact_person: c.contact_person,
              phone: c.phone,
            }
          : null,
      );
      setDbSite(s ? { site_name: s.site_name, location: s.location } : null);
    } catch {
      setDbTablesReady(false);
      setDbCustomer(null);
      setDbSite(null);
    }
  }, []);

  const persistReport = useCallback(
    async (snapshot: EnergyQualityReport) => {
      if (!selectedDevice || !dbTablesReady) return;
      const now = Date.now();
      if (now - lastPersistRef.current < 30000) return;
      lastPersistRef.current = now;
      try {
        await fetch('/api/ge-energy/energy-quality-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: selectedDevice,
            siteRegion: selectedSite,
            locale: printLocale,
            report: snapshot,
            ch1,
            measurementStart,
            measurementEnd,
          }),
        });
      } catch {
        /* non-blocking */
      }
    },
    [
      selectedDevice,
      selectedSite,
      printLocale,
      ch1,
      measurementStart,
      measurementEnd,
      dbTablesReady,
    ],
  );

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!initialDevice || !devices.length) return;
    const exists = devices.some((d) => d.deviceID === initialDevice);
    if (exists) setSelectedDevice(initialDevice);
  }, [devices, initialDevice]);

  useEffect(() => {
    if (!selectedDevice) {
      setDbCustomer(null);
      setDbSite(null);
      setDbTablesReady(null);
      return;
    }
    fetchDbContext(selectedDevice);
    lastPersistRef.current = 0;
  }, [selectedDevice, fetchDbContext]);

  useEffect(() => {
    if (report && hasLiveData) persistReport(report);
  }, [report, persistReport, hasLiveData]);

  useEffect(() => {
    if (!selectedDevice) {
      setIsLive(false);
      setCh1(EMPTY_CHANNEL);
      setCh2(EMPTY_CHANNEL);
      setLastUpdate('');
      return undefined;
    }
    fetchSnapshot();
    const tick = setInterval(fetchSnapshot, 5000);
    setIsLive(true);
    return () => {
      clearInterval(tick);
      setIsLive(false);
    };
  }, [fetchSnapshot, selectedDevice]);

  useEffect(() => {
    if (selectedDevice && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedDevice]);

  const printReport = useCallback(() => {
    if (!report) return;
    const html = buildReportPrintHtml(report, rt, rt.ch1Label, rt.ch2Label);
    const win = window.open('', '_blank', 'width=960,height=720');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }, [report, rt]);

  return (
    <div className="energy-page eq-page eq-page--report mx-auto px-4 sm:px-6 pb-10">
      <section className="eq-hero">
        <div className="eq-tag">
          <FileText className="w-3.5 h-3.5" />
          {ui.tagline}
        </div>
        <h1>{ui.reportTitle}</h1>
        <p>{ui.reportSubtitle}</p>
        <p className="eq-report-page-badge">{ui.reportPageBadge}</p>
      </section>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <Link href="/energy-dashboard/energy-quality" className="eq-btn eq-btn-outline w-fit">
          <ArrowLeft className="w-4 h-4" />
          {ui.pageTitle}
        </Link>
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
            onClick={fetchSnapshot}
            disabled={!selectedDevice || loading}
            className="eq-btn eq-btn-primary"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {ui.refresh}
          </button>
        </div>
      </div>

      <div className="eq-panel">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label>{ui.location}</label>
            <select
              className="eq-select"
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setSelectedDevice('');
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
        </div>

        <p className="eq-section-title">{ui.selectMeter}</p>
        <div className="eq-meter-grid">
          {filteredDevices.length === 0 ? (
            <p className="text-sm text-slate-400">{ui.noMeters}</p>
          ) : (
            filteredDevices.map((d) => (
              <button
                key={d.deviceID}
                type="button"
                className={`eq-meter-btn${d.deviceID === selectedDevice ? ' eq-meter-btn-active' : ''}`}
                onClick={() => setSelectedDevice(d.deviceID)}
              >
                {d.deviceName}
                <span className="eq-sub">{d.geID || d.deviceID}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {error && <div className="eq-error">{error}</div>}
      {selectedDevice && dbTablesReady === false && (
        <p className="eq-db-hint text-sm text-amber-600/90 mb-3">{ui.dbMigrationHint}</p>
      )}
      {selectedDevice && dbCustomer && (
        <p className="eq-db-hint text-xs text-slate-500 mb-2">
          {dbCustomer.customer_name}
          {dbSite?.site_name ? ` · ${dbSite.site_name}` : ''}
        </p>
      )}
      <div className="eq-report-page-body" data-page="energy-quality-report-v2">
        <div ref={reportRef} id="report-doc" className="eq-report-wrap eq-report-wrap--primary">
          <EnergyQualityReportView
            report={report}
            rt={rt}
            ch1Label={rt.ch1Label}
            ch2Label={rt.ch2Label}
            ch1={selectedDevice ? ch1 : EMPTY_CHANNEL}
            livePending={livePending}
            noMeter={noMeter}
            isRefreshing={refreshing}
            snapshotUi={{
              lastUpdate: ui.lastUpdate,
              l1: ui.l1,
              l2: ui.l2,
              l3: ui.l3,
              avg: ui.avg,
              thd: ui.thd,
              powerFactor: ui.powerFactor,
              frequency: ui.frequency,
            }}
            dbChartData={chartData}
            dbStats={dbAnalysis.stats}
            technicalInsights={dbAnalysis.insights}
            chartUi={{ l1: ui.l1, l2: ui.l2, l3: ui.l3, noChart: ui.noChart }}
          />
        </div>

        {selectedDevice ? (
          <aside className="eq-panel eq-print-panel eq-print-panel--side">
            <div className="eq-print-lang-head">
              <span className="eq-print-lang-head-icon" aria-hidden>
                <Globe className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <div>
                <p className="eq-print-lang-title">{ui.printLang}</p>
                <p className="eq-print-lang-hint">{ui.printLangHint}</p>
              </div>
            </div>
            <div className="eq-print-langs" role="group" aria-label={ui.printLang}>
              {EQ_PRINT_LOCALES.map((loc) => {
                const meta = EQ_PRINT_LANG_META[loc];
                const active = printLocale === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    className={`eq-lang-btn eq-lang-btn--${loc}${active ? ' eq-lang-btn-active' : ''}`}
                    onClick={() => setPrintLocale(loc)}
                    aria-pressed={active}
                  >
                    <span className="eq-lang-btn-flag" aria-hidden>
                      {meta.flag}
                    </span>
                    <span className="eq-lang-btn-body">
                      <span className="eq-lang-btn-code">{meta.code}</span>
                      <strong className="eq-lang-btn-label">{meta.label}</strong>
                    </span>
                    {active ? (
                      <span className="eq-lang-btn-check" aria-hidden>
                        <Check strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={printReport}
              disabled={!report}
              className="eq-btn eq-btn-primary eq-btn-print"
            >
              <Printer className="w-4 h-4" />
              {ui.printReport}
            </button>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export default function EnergyQualityReportPage() {
  return (
    <Suspense fallback={<div className="energy-page p-8 text-center text-slate-400">Loading…</div>}>
      <EnergyQualityReportInner />
    </Suspense>
  );
}
