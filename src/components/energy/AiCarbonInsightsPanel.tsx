'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatReferenceValue } from '@/lib/energy/carbon-credits';
import AiTokenSettingsCard from '@/components/energy/AiTokenSettingsCard';
import { Brain, Leaf, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';

type InsightsData = {
  summary: {
    totalEnergySavedKwh: number;
    totalCo2Kg: number;
    carbonCreditsTonnes: number;
    estimatedValue: number;
    estimatedValueThb?: number;
    currency: 'THB' | 'KRW';
    market?: string;
    creditPricePerTonne?: number;
    pricing?: { market: string; currency: 'THB' | 'KRW'; creditPricePerTonne: number };
    reductionPercent: number;
    deviceCount: number;
    recordCount: number;
  };
  dailyTrend: { date: string; co2Kg: number; carbonCreditsTonnes: number; energySavedKwh: number }[];
  topDevices: {
    deviceId: number;
    deviceName?: string;
    GEsaveID?: string;
    co2Kg: number;
    carbonCreditsTonnes: number;
  }[];
  insights: {
    ruleBased: string[];
    aiNarrative: string | null;
    aiAvailable: boolean;
    aiKeySource?: string;
  };
};

const COPY = {
  th: {
    title: 'AI วิเคราะห์คาร์บอนเครดิต',
    subtitle: 'จากข้อมูล MQTT ที่บันทึกใน goeunserverhub',
    credits: 'คาร์บอนเครดิต (ตัน CO₂e)',
    co2: 'CO₂ ลดได้ (kg)',
    valueTh: 'มูลค่าอ้างอิง (ไทย · บาท)',
    valueKr: 'มูลค่าอ้างอิง (เกาหลี · วอน)',
    value: 'มูลค่าอ้างอิง',
    kwh: 'ประหยัดไฟ (kWh)',
    ai: 'วิเคราะห์ AI',
    rules: 'สรุปจากข้อมูล',
    trend: 'แนวโน้มคาร์บอนเครดิตรายวัน',
    top: 'อุปกรณ์ลด CO₂ สูงสุด',
    noData: 'ยังไม่มีข้อมูล MQTT ในช่วงนี้ — ตรวจสอบ mqtt-bridge และการ publish',
    refresh: 'รีเฟรช',
    days: 'วัน',
    noAiKey: 'บันทึก OpenAI API key ด้านบน หรือตั้ง OPENAI_API_KEY ใน .env.local',
  },
  en: {
    title: 'AI carbon credit analysis',
    subtitle: 'From MQTT telemetry stored in goeunserverhub',
    credits: 'Carbon credits (tCO₂e)',
    co2: 'CO₂ avoided (kg)',
    valueTh: 'Reference value (Thailand · THB)',
    valueKr: 'Reference value (Korea · KRW)',
    value: 'Reference value',
    kwh: 'Energy saved (kWh)',
    ai: 'AI analysis',
    rules: 'Data summary',
    trend: 'Daily carbon credit trend',
    top: 'Top CO₂ reducers',
    noData: 'No MQTT records in this period — check mqtt-bridge',
    refresh: 'Refresh',
    days: 'days',
    noAiKey: 'Save an OpenAI API key above or set OPENAI_API_KEY in .env.local',
  },
  ko: {
    title: 'AI 탄소 크레딧 분석',
    subtitle: 'goeunserverhub에 저장된 MQTT 데이터',
    credits: '탄소 크레딧 (tCO₂e)',
    co2: 'CO₂ 감축 (kg)',
    valueTh: '참고 가치 (태국 · 바트)',
    valueKr: '참고 가치 (한국 · 원)',
    value: '참고 가치',
    kwh: '절감 전력 (kWh)',
    ai: 'AI 분석',
    rules: '데이터 요약',
    trend: '일별 탄소 크레딧 추이',
    top: 'CO₂ 감축 상위 장치',
    noData: '이 기간 MQTT 데이터 없음',
    refresh: '새로고침',
    days: '일',
    noAiKey: '위에 OpenAI API 키를 저장하거나 .env.local에 설정하세요',
  },
};

export default function AiCarbonInsightsPanel({ periodDays = 30 }: { periodDays?: number }) {
  const { selectedSite } = useSite();
  const { locale } = useLocale();
  const ui = COPY[locale as keyof typeof COPY] ?? COPY.en;

  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('energy_system_user');
      const u = raw ? JSON.parse(raw) : null;
      setUserId(u?.userId != null ? String(u.userId) : null);
    } catch {
      setUserId(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const uid = userId ? `&userId=${userId}` : '';
      const res = await fetch(
        `/api/ge-energy/ai-carbon-insights?site=${selectedSite}&period=${periodDays}&locale=${locale}${uid}`
      );
      const json = await res.json();
      if (json.success) setData(json.data);
      else setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedSite, periodDays, locale, userId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const s = data?.summary;
  const currency = s?.currency ?? (selectedSite === 'korea' ? 'KRW' : 'THB');
  const valueLabel =
    selectedSite === 'korea' ? ui.valueKr : selectedSite === 'thailand' ? ui.valueTh : ui.value;
  const formattedValue = s
    ? formatReferenceValue(s.estimatedValue ?? s.estimatedValueThb ?? 0, currency, locale)
    : '—';

  const chartData =
    data?.dailyTrend?.map((d) => ({
      ...d,
      label: String(d.date).slice(5),
    })) ?? [];

  return (
    <section className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-100 text-xs font-semibold mb-1">
            <Brain className="w-4 h-4" />
            MQTT → AI
          </div>
          <h2 className="text-xl font-black text-white">{ui.title}</h2>
          <p className="text-emerald-100 text-sm">{ui.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {ui.refresh}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <AiTokenSettingsCard locale={locale} onSaved={load} />

        {loading && !data ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : !s || s.recordCount === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            {ui.noData}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5" /> {ui.credits}
                </p>
                <p className="text-2xl font-black text-emerald-900 mt-1">
                  {s.carbonCreditsTonnes.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                <p className="text-xs text-teal-700 font-medium">{ui.co2}</p>
                <p className="text-2xl font-black text-teal-900 mt-1">
                  {s.totalCo2Kg.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <p className="text-xs text-amber-800 font-medium">{valueLabel}</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{formattedValue}</p>
                {(s.pricing?.creditPricePerTonne ?? s.creditPricePerTonne) != null && (
                  <p className="text-[10px] text-amber-700/80 mt-1">
                    @{(s.pricing?.creditPricePerTonne ?? s.creditPricePerTonne)?.toLocaleString()}{' '}
                    {currency}/t
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> {ui.kwh}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {s.totalEnergySavedKwh.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  −{s.reductionPercent}% · {periodDays} {ui.days}
                </p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">{ui.trend}</h3>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="carbonCreditsTonnes"
                        name={ui.credits}
                        stroke="#059669"
                        fill="#10b98133"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2">{ui.rules}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {data?.insights.ruleBased.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-emerald-500 shrink-0">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                <h3 className="text-sm font-bold text-violet-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> {ui.ai}
                </h3>
                {data?.insights.aiNarrative ? (
                  <div className="text-sm text-violet-950 whitespace-pre-wrap leading-relaxed">
                    {data.insights.aiNarrative}
                  </div>
                ) : (
                  <p className="text-sm text-violet-700">{ui.noAiKey}</p>
                )}
              </div>
            </div>

            {(data?.topDevices?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">{ui.top}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="py-2 pr-4">Device</th>
                        <th className="py-2 pr-4">GE ID</th>
                        <th className="py-2 pr-4">CO₂ (kg)</th>
                        <th className="py-2">Credits (t)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.topDevices.map((d) => (
                        <tr key={d.deviceId} className="border-b border-gray-50">
                          <td className="py-2 pr-4 font-medium">{d.deviceName || `#${d.deviceId}`}</td>
                          <td className="py-2 pr-4 font-mono text-xs text-emerald-700">{d.GEsaveID || '—'}</td>
                          <td className="py-2 pr-4">{d.co2Kg.toLocaleString()}</td>
                          <td className="py-2">{d.carbonCreditsTonnes.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
