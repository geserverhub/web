'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff, Clock, Code } from 'lucide-react';
import { useLocale } from '@/lib/energy/LocaleContext';

const I18N = {
  th: {
    title: 'บันทึกข้อมูลอุปกรณ์',
    desc: 'ดักจับ payload จาก IoT gateway — แสดง 20 รายการล่าสุด',
    autoOn: 'รีเฟรชอัตโนมัติ เปิด',
    autoOff: 'รีเฟรชอัตโนมัติ ปิด',
    refresh: 'รีเฟรช',
    apiLabel: 'Gateway → ตั้งค่า API path เป็น:',
    received: 'รับข้อมูล',
    noData: 'ยังไม่มีข้อมูลจาก gateway',
    noDataSub: 'รอต่อมิเตอร์และ gateway จะส่งข้อมูลมา',
    selectLog: 'คลิก log ด้านซ้ายเพื่อดู payload',
    payload: 'เลือก log เพื่อดู payload',
    sourceIp: 'Source IP',
    receivedAt: 'เวลารับ',
    rawPayload: 'Raw JSON Payload',
  },
  ko: {
    title: '기기 수신 로그',
    desc: 'IoT 게이트웨이에서 수신된 payload — 최근 20개 표시',
    autoOn: '자동 새로고침 켜짐',
    autoOff: '자동 새로고침 꺼짐',
    refresh: '새로고침',
    apiLabel: 'Gateway → API 경로 설정:',
    received: '수신된 데이터',
    noData: '게이트웨이에서 데이터가 없습니다',
    noDataSub: '미터를 연결하면 게이트웨이가 데이터를 전송합니다',
    selectLog: '왼쪽 로그를 클릭하여 payload 확인',
    payload: '로그를 선택하여 payload 확인',
    sourceIp: '소스 IP',
    receivedAt: '수신 시간',
    rawPayload: 'Raw JSON Payload',
  },
  en: {
    title: 'Device Ingest Log',
    desc: 'Capture payload from IoT gateway — showing latest 20 entries',
    autoOn: 'Auto refresh ON',
    autoOff: 'Auto refresh OFF',
    refresh: 'Refresh',
    apiLabel: 'Gateway → Set API path to:',
    received: 'Received data',
    noData: 'No data from gateway yet',
    noDataSub: 'Connect a meter and the gateway will start sending data',
    selectLog: 'Click a log on the left to view payload',
    payload: 'Select a log to view payload',
    sourceIp: 'Source IP',
    receivedAt: 'Received at',
    rawPayload: 'Raw JSON Payload',
  },
} as const;

type Locale = keyof typeof I18N;

type RawLog = {
  id: number;
  received_at: string;
  source_ip: string;
  topic: string;
  raw_body: string;
};

export default function DeviceIngestPage() {
  const { locale } = useLocale();
  const lang = (I18N[locale as Locale] ?? I18N.en);

  const [logs, setLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<RawLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ge-energy/device-ingest');
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchLogs, 5000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchLogs]);

  function parseBody(raw: string) {
    try { return JSON.parse(raw); } catch { return raw; }
  }

  function formatTime(dt: string) {
    const localeMap: Record<Locale, string> = { th: 'th-TH', ko: 'ko-KR', en: 'en-US' };
    return new Date(dt).toLocaleString(localeMap[locale as Locale] ?? 'en-US', { hour12: false });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Code className="w-6 h-6 text-blue-500" />
            {lang.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{lang.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {autoRefresh ? lang.autoOn : lang.autoOff}
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {lang.refresh}
          </button>
        </div>
      </div>

      {/* Endpoint Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{lang.apiLabel}</p>
        <code className="text-sm text-blue-800 dark:text-blue-300 font-mono">/api/ge-energy/device-ingest</code>
      </div>

      {/* Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {lang.received} ({logs.length})
            </span>
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <WifiOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{lang.noData}</p>
              <p className="text-gray-400 text-xs mt-1">{lang.noDataSub}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
              {logs.map(log => (
                <button
                  key={log.id}
                  onClick={() => setSelected(log)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selected?.id === log.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400">#{log.id}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(log.received_at)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{log.source_ip}</div>
                  <div className="text-xs text-gray-400 truncate font-mono mt-0.5">
                    {log.raw_body?.slice(0, 60)}...
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {selected ? `Payload #${selected.id}` : lang.payload}
            </span>
          </div>
          {selected ? (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <p className="text-gray-400 mb-0.5">{lang.sourceIp}</p>
                  <p className="font-mono text-gray-700 dark:text-gray-200">{selected.source_ip}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <p className="text-gray-400 mb-0.5">{lang.receivedAt}</p>
                  <p className="font-mono text-gray-700 dark:text-gray-200">{formatTime(selected.received_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">{lang.rawPayload}</p>
                <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-auto max-h-80 font-mono">
                  {JSON.stringify(parseBody(selected.raw_body), null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Code className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{lang.selectLog}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
