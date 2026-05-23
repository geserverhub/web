'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/LocaleContext';
import { ArrowLeft, Code2, ExternalLink, Server, Zap } from 'lucide-react';

const copy = {
  th: {
    title: 'นักพัฒนา / API',
    subtitle: 'เอกสาร API สำหรับระบบ GE Energy Tech (K-Energy)',
    back: 'กลับแดชบอร์ด',
    proxy: 'Next.js proxy',
    proxyDesc: 'คำขอ /api/kenergy/* อ่านจากฐานข้อมูล goeunserverhub เท่านั้น',
    endpoints: 'Endpoints หลัก',
    note: 'ใช้ query site=thailand|korea|vietnam|malaysia ตามไซต์ที่ต้องการ',
  },
  en: {
    title: 'Developer / API',
    subtitle: 'API reference for GE Energy Tech (K-Energy)',
    back: 'Back to dashboard',
    proxy: 'Next.js proxy',
    proxyDesc: 'Requests to /api/kenergy/* read from goeunserverhub only',
    endpoints: 'Main endpoints',
    note: 'Use query site=thailand|korea|vietnam|malaysia as needed',
  },
  ko: {
    title: '개발자 / API',
    subtitle: 'GE Energy Tech (K-Energy) API 문서',
    back: '대시보드로',
    proxy: 'Next.js 프록시',
    proxyDesc: '/api/kenergy/* 요청은 goeunserverhub DB만 사용합니다',
    endpoints: '주요 엔드포인트',
    note: 'site=thailand|korea|vietnam|malaysia 쿼리 사용',
  },
};

const endpoints = [
  { method: 'GET', path: '/api/kenergy/devices', desc: 'Device list' },
  { method: 'GET', path: '/api/kenergy/devices-setting?site={site}', desc: 'Device settings' },
  { method: 'GET', path: '/api/kenergy/device-monitoring?deviceId={id}', desc: 'Live metrics' },
  { method: 'GET', path: '/api/kenergy/current-history?deviceId={id}&hours=0.5', desc: 'Current history' },
  { method: 'GET', path: '/api/kenergy/device-history?deviceId={id}&period=hour', desc: 'Historical data' },
  { method: 'GET', path: '/api/kenergy/customers-by-site?site={site}', desc: 'Customers by site' },
  { method: 'GET', path: '/api/kenergy/device-locations?site={site}', desc: 'Map locations' },
  { method: 'GET', path: '/api/kenergy/notifications?site={site}', desc: 'Notifications' },
  { method: 'GET', path: '/api/kenergy/device-notifications?site={site}', desc: 'Device alarms' },
  { method: 'GET', path: '/api/kenergy/dashboard-stats?site={site}', desc: 'Dashboard stats' },
  { method: 'GET', path: '/api/kenergy/meter-seting', desc: 'Meter configuration' },
  { method: 'POST', path: '/api/user/login', desc: 'Login (pageName: /energy-dashboard)' },
];

export default function DeveloperPageContent({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useLocale();
  const lang = ['th', 'ko', 'en'].includes(locale) ? locale : 'th';
  const ui = copy[lang as keyof typeof copy];

  return (
    <div className={embedded ? 'energy-page max-w-4xl' : 'min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50'}>
      {!embedded && (
        <header className="border-b border-emerald-100 bg-white/90 backdrop-blur px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                <Code2 className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-emerald-900">{ui.title}</h1>
                <p className="text-xs text-slate-500">{ui.subtitle}</p>
              </div>
            </div>
            <Link
              href="/energy-dashboard/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {ui.back}
            </Link>
          </div>
        </header>
      )}

      <main className={`${embedded ? '' : 'max-w-4xl mx-auto px-6 py-8'} space-y-6`}>
        {embedded && (
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Code2 className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-emerald-900">{ui.title}</h1>
              <p className="text-sm text-slate-500">{ui.subtitle}</p>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Server className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">{ui.proxy}</h2>
              <p className="text-sm text-slate-600 mt-1">{ui.proxyDesc}</p>
              <code className="mt-2 inline-block text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                MySQL goeunserverhub → /api/kenergy/*
              </code>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-emerald-50 bg-emerald-50/50 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-emerald-900">{ui.endpoints}</h2>
          </div>
          <p className="px-5 py-2 text-xs text-slate-500 border-b border-slate-100">{ui.note}</p>
          <ul className="divide-y divide-slate-100">
            {endpoints.map((ep) => (
              <li key={ep.path} className="px-5 py-3 hover:bg-emerald-50/40 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      ep.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono text-slate-800 break-all">{ep.path}</code>
                </div>
                <p className="text-xs text-slate-500">{ep.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-center text-xs text-slate-400 pb-4">
          <Link
            href="/energy-dashboard/current-monitor"
            className="text-emerald-600 hover:underline inline-flex items-center gap-1"
          >
            Current Monitor
            <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      </main>
    </div>
  );
}
