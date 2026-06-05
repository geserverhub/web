'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import { applyEnergyLocale } from '@/components/energy/EnergyLangSwitcher';
import {
  eqT,
  EQ_PRINT_LOCALES,
  EQ_PRINT_LANG_META,
  formatEqDateTime,
  formatHistoryPeriodHours,
  type EqLocale,
} from '@/lib/energy/energy-quality-i18n';
import { reportT } from '@/lib/energy/energy-quality-report-i18n';
import {
  buildDisplayEnergyQualityReport,
  buildReportPrintHtml,
  enrichEnergyQualityReport,
  withReportNumber,
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
  chartDataCh1Only,
  type DbChartPoint,
} from '@/lib/energy/energy-quality-current-analysis';
import { normalizeRecordScope } from '@/lib/energy/energy-quality-scope';
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

function mapChannels(raw: Record<string, unknown>, ch1Only: boolean) {
  const channels = raw.channels as { ch1?: ReportChannel; ch2?: ReportChannel } | undefined;
  return {
    ch1: channels?.ch1 ?? EMPTY_CHANNEL,
    ch2: ch1Only ? EMPTY_CHANNEL : (channels?.ch2 ?? EMPTY_CHANNEL),
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
  const { locale, setLocale } = useLocale();
  const reportRef = useRef<HTMLDivElement>(null);

  const initialDevice = searchParams.get('deviceId') || '';
  const initialLocation = searchParams.get('location') || '';

  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [selectedDevice, setSelectedDevice] = useState(initialDevice);
  const [ch1, setCh1] = useState<ReportChannel>(EMPTY_CHANNEL);
  const [ch2, setCh2] = useState<ReportChannel>(EMPTY_CHANNEL);
  const [lastUpdateTs, setLastUpdateTs] = useState<number | null>(null);
  const [historyPoints, setHistoryPoints] = useState(0);
  const [chartData, setChartData] = useState<DbChartPoint[]>([]);
  const [historyHours, setHistoryHours] = useState(336);
  const [measurementStartTs, setMeasurementStartTs] = useState<number | undefined>();
  const [measurementEndTs, setMeasurementEndTs] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const resolveLocale = (code: string): EqLocale =>
    (['th', 'ko', 'en', 'cn', 'vn', 'ms'].includes(code) ? code : 'en') as EqLocale;

  const [reportLocale, setReportLocale] = useState<EqLocale>(() => resolveLocale(locale));

  useEffect(() => {
    setReportLocale(resolveLocale(locale));
  }, [locale]);

  const ui = eqT(reportLocale);
  const rt = reportT(reportLocale);

  const lastUpdate = useMemo(
    () => (lastUpdateTs != null ? formatEqDateTime(lastUpdateTs, reportLocale) : ''),
    [lastUpdateTs, reportLocale],
  );
  const historyPeriod = useMemo(
    () => formatHistoryPeriodHours(historyHours, reportLocale),
    [historyHours, reportLocale],
  );
  const measurementStart = useMemo(
    () =>
      measurementStartTs != null ? formatEqDateTime(measurementStartTs, reportLocale) : undefined,
    [measurementStartTs, reportLocale],
  );
  const measurementEnd = useMemo(
    () => (measurementEndTs != null ? formatEqDateTime(measurementEndTs, reportLocale) : undefined),
    [measurementEndTs, reportLocale],
  );
  const [dbCustomer, setDbCustomer] = useState<ReportDbCustomer | null>(null);
  const [dbSite, setDbSite] = useState<ReportDbSite | null>(null);
  const [dbTablesReady, setDbTablesReady] = useState<boolean | null>(null);
  const [nextReportNumber, setNextReportNumber] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const filteredDevices = useMemo(() => {
    if (!selectedLocation) return devices;
    return devices.filter((d) => (d.location || '').trim() === selectedLocation);
  }, [devices, selectedLocation]);

  const selectedInfo = filteredDevices.find((d) => d.deviceID === selectedDevice);
  const ch1Only = true;

  const hasLiveData = channelHasLiveData(ch1) || (!ch1Only && channelHasLiveData(ch2));
  const hasHistoryData = chartData.length > 0;
  const livePending = Boolean(selectedDevice) && !hasLiveData && !hasHistoryData;
  const noMeter = !selectedDevice;

  const dbAnalysis = useMemo(
    () =>
      analyzeCurrentHistory(chartData, {
        locale: reportLocale,
        ch1Label: rt.ch1Label,
        ch2Label: rt.ch2Label,
        periodLabel: historyPeriod,
        ch1Only,
      }),
    [chartData, reportLocale, rt.ch1Label, rt.ch2Label, historyPeriod, ch1Only],
  );

  const report = useMemo(() => {
    const device = selectedInfo ?? PLACEHOLDER_DEVICE;
    const built = buildDisplayEnergyQualityReport({
      device,
      site: selectedSite,
      lastUpdate: lastUpdate || rt.waitingLive,
      ch1: selectedDevice ? ch1 : EMPTY_CHANNEL,
      ch2: selectedDevice && !ch1Only ? ch2 : EMPTY_CHANNEL,
      ch1Only,
      historyPoints,
      measurementStart,
      measurementEnd,
      chartData,
      historyPeriod,
      locale: reportLocale,
      livePending,
      noMeter,
    });
    let doc = built;
    if (!noMeter && (dbCustomer || dbSite)) {
      doc = enrichEnergyQualityReport(built, { customer: dbCustomer, site: dbSite }, rt);
    }
    if (nextReportNumber) {
      doc = withReportNumber(doc, nextReportNumber, rt.f_reportId);
    }
    return doc;
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
    historyPeriod,
    reportLocale,
    livePending,
    noMeter,
    selectedDevice,
    ch1Only,
    dbCustomer,
    dbSite,
    rt,
    nextReportNumber,
  ]);

  const canPrintReport = Boolean(
    selectedDevice && dbTablesReady && report && (hasLiveData || hasHistoryData),
  );

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`/api/ge-energy/devices-setting?site=${selectedSite}`, { cache: 'no-store' });
      const json = await res.json();
      const rows = json.devices ?? json.data;
      if (!json.success || !Array.isArray(rows)) {
        setDevices([]);
        setLocations([]);
        return;
      }
      const list: DeviceRow[] = rows.map((d: DeviceRow & { deviceID?: string | number; installation_location?: string }) => ({
        deviceID: String(d.deviceID ?? ''),
        deviceName: d.deviceName || String(d.deviceID),
        GEsaveID: d.GEsaveID,
        location: String(d.location || d.installation_location || '').trim(),
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
      setLocations([]);
    }
  }, [selectedSite]);

  const fetchSnapshot = useCallback(async () => {
    if (!selectedDevice || !selectedInfo) return;
    try {
      if (lastUpdateTs == null) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const scope = normalizeRecordScope(selectedInfo.recordScope);
      const scopeQ = `&scope=${scope}`;
      const [monRes, histRes] = await Promise.all([
        fetch(
          `/api/ge-energy/device-monitoring?deviceId=${encodeURIComponent(selectedDevice)}${scopeQ}`,
          { cache: 'no-store' },
        ),
        fetch(
          `/api/ge-energy/current-history?deviceId=${encodeURIComponent(selectedDevice)}&hours=336${scopeQ}`,
          { cache: 'no-store' },
        ),
      ]);
      const json = await monRes.json();
      const histJson = await histRes.json();

      if (json.success && json.data?.metrics) {
        const { ch1: c1 } = mapChannels(json.data.metrics as Record<string, unknown>, ch1Only);
        setCh1(c1);
        setCh2(EMPTY_CHANNEL);
        setLastUpdateTs(
          json.data.lastUpdate ? new Date(json.data.lastUpdate).getTime() : Date.now(),
        );
      } else {
        setError(json.error || ui.errorLoad);
        setCh1(EMPTY_CHANNEL);
        setCh2(EMPTY_CHANNEL);
        setLastUpdateTs(null);
        return;
      }

      const hist = histJson.data;
      const rawPoints = (hist?.chartData ?? []) as DbChartPoint[];
      const points = chartDataCh1Only(rawPoints);
      setChartData(points);
      setHistoryPoints(hist?.dataPoints ?? points.length);
      if (hist?.period) {
        const match = String(hist.period).match(/(\d+)/);
        if (match) setHistoryHours(Number(match[1]));
      }
      if (points.length > 0) {
        const first = points[0];
        const last = points[points.length - 1];
        const toTs = (p: DbChartPoint) =>
          p.timestamp ?? (p.time ? new Date(p.time).getTime() : undefined);
        setMeasurementStartTs(toTs(first));
        setMeasurementEndTs(toTs(last));
      }
    } catch {
      setError(ui.errorLoad);
      setCh1(EMPTY_CHANNEL);
      setCh2(EMPTY_CHANNEL);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDevice, selectedInfo, ui.errorLoad, lastUpdateTs]);

  const fetchDbContext = useCallback(async (deviceId: string) => {
    try {
      const res = await fetch(
        `/api/ge-energy/energy-quality-report?deviceId=${encodeURIComponent(deviceId)}&previewNext=1`,
        { cache: 'no-store' },
      );
      const json = await res.json();
      if (!json.success) {
        setDbTablesReady(false);
        setDbCustomer(null);
        setDbSite(null);
        setNextReportNumber(null);
        return;
      }
      setDbTablesReady(json.tablesReady ?? false);
      setNextReportNumber(
        typeof json.nextReportNumber === 'string' ? json.nextReportNumber : null,
      );
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
      setNextReportNumber(null);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!devices.length) return;
    if (initialDevice) {
      const exists = devices.some((d) => d.deviceID === initialDevice);
      if (exists) setSelectedDevice(initialDevice);
      return;
    }
    if (!selectedDevice && filteredDevices.length === 1) {
      setSelectedDevice(filteredDevices[0].deviceID);
    }
  }, [devices, initialDevice, filteredDevices, selectedDevice]);

  useEffect(() => {
    if (!selectedDevice) {
      setDbCustomer(null);
      setDbSite(null);
      setDbTablesReady(null);
      return;
    }
    fetchDbContext(selectedDevice);
  }, [selectedDevice, fetchDbContext]);

  useEffect(() => {
    if (!selectedDevice) {
      setIsLive(false);
      setCh1(EMPTY_CHANNEL);
      setCh2(EMPTY_CHANNEL);
      setLastUpdateTs(null);
      setMeasurementStartTs(undefined);
      setMeasurementEndTs(undefined);
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

  const printReport = useCallback(async () => {
    if (!report || !selectedDevice || !dbTablesReady) return;
    setPrinting(true);
    setError(null);
    try {
      const res = await fetch('/api/ge-energy/energy-quality-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice,
          siteRegion: selectedSite,
          locale: reportLocale,
          assignNewReportNumber: true,
          reportIdLabel: rt.f_reportId,
          report,
          ch1,
          measurementStart,
          measurementEnd,
        }),
      });
      const json = await res.json();
      if (!json.success || typeof json.reportNumber !== 'string') {
        setError(json.error || ui.errorLoad);
        return;
      }
      const reportToPrint = withReportNumber(report, json.reportNumber, rt.f_reportId);
      const device = selectedInfo ?? PLACEHOLDER_DEVICE;
      const html = buildReportPrintHtml({
        report: reportToPrint,
        locale: reportLocale,
        ch1Label: rt.ch1Label,
        ch2Label: rt.ch2Label,
        ch1: selectedDevice ? ch1 : EMPTY_CHANNEL,
        ch2: selectedDevice && !ch1Only ? ch2 : EMPTY_CHANNEL,
        ch1Only,
        logoUrl: `${window.location.origin}/momoge/Logo-brand.png`,
        chartData: ch1Only ? chartDataCh1Only(chartData) : chartData,
        historyPeriod,
        historyPoints,
        measurementStart,
        measurementEnd,
        deviceName: device.deviceName,
        meterId: device.GEsaveID || device.deviceID,
        chartStats: dbAnalysis.stats,
        technicalInsights: dbAnalysis.insights,
        snapshotLabels: {
          lastUpdate: ui.lastUpdate,
          l1: ui.l1,
          l2: ui.l2,
          l3: ui.l3,
          avg: ui.avg,
          thd: ui.thd,
          powerFactor: ui.powerFactor,
          frequency: ui.frequency,
        },
      });
      const win = window.open('', '_blank');
      if (!win) {
        setError(ui.errorLoad);
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();

      const previewRes = await fetch(
        `/api/ge-energy/energy-quality-report?deviceId=${encodeURIComponent(selectedDevice)}&previewNext=1`,
        { cache: 'no-store' },
      );
      const previewJson = await previewRes.json();
      if (previewJson.success && typeof previewJson.nextReportNumber === 'string') {
        setNextReportNumber(previewJson.nextReportNumber);
      }
    } catch {
      setError(ui.errorLoad);
    } finally {
      setPrinting(false);
    }
  }, [
    report,
    selectedDevice,
    dbTablesReady,
    selectedSite,
    reportLocale,
    rt,
    ch1,
    ch2,
    ch1Only,
    chartData,
    historyPeriod,
    historyPoints,
    measurementStart,
    measurementEnd,
    selectedInfo,
    dbAnalysis.stats,
    dbAnalysis.insights,
    ui,
  ]);

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
                <span className="eq-sub">{d.GEsaveID || d.deviceID}</span>
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
            key={reportLocale}
            report={report}
            rt={rt}
            ch1Label={rt.ch1Label}
            ch2Label={rt.ch2Label}
            ch1={selectedDevice ? ch1 : EMPTY_CHANNEL}
            ch2={selectedDevice && !ch1Only ? ch2 : EMPTY_CHANNEL}
            ch1Only={ch1Only}
            reportLocale={reportLocale}
            historyPeriod={historyPeriod}
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
            dbChartData={chartDataCh1Only(chartData)}
            dbStats={dbAnalysis.stats}
            technicalInsights={dbAnalysis.insights}
            chartUi={{ l1: ui.l1, l2: ui.l2, l3: ui.l3, noChart: ui.noChart }}
          />
        </div>

        {selectedDevice ? (
          <aside className="eq-panel eq-print-panel eq-print-panel--side">
            <p className="eq-report-id-auto">
              <span>{rt.f_reportId}</span>
              <strong>{report.reportId}</strong>
            </p>
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
                const active = reportLocale === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    className={`eq-lang-btn eq-lang-btn--${loc}${active ? ' eq-lang-btn-active' : ''}`}
                    onClick={() => {
                      setReportLocale(loc);
                      applyEnergyLocale(setLocale, loc);
                    }}
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
              onClick={() => void printReport()}
              disabled={!canPrintReport || printing}
              className="eq-btn eq-btn-primary eq-btn-print"
            >
              <Printer className="w-4 h-4" />
              {printing ? ui.loading : ui.printReport}
            </button>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export default function EnergyQualityReportPage() {
  return (
    <Suspense
      fallback={
        <div className="energy-page p-8 text-center text-slate-400">
          {eqT('en').loading}
        </div>
      }
    >
      <EnergyQualityReportInner />
    </Suspense>
  );
}
