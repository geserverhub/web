'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/lib/LocaleContext';
import {
  BrainCircuit, CheckCircle2, XCircle, Key, Save, Trash2,
  ChevronDown, Sparkles, AlertCircle, RefreshCw,
} from 'lucide-react';

type Settings = {
  openai_model: string;
  anthropic_model: string;
  api_key_masked: string;
  has_api_key: boolean;
  key_source: 'database' | 'environment' | 'none';
  active_provider: 'anthropic' | 'openai';
  updated_at: string | null;
  env_anthropic: boolean;
  env_openai: boolean;
};

const ANTHROPIC_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-7',
  'claude-haiku-3-5-20241022',
  'claude-3-5-sonnet-20241022',
];

const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'];

const COPY = {
  th: {
    title: 'ตั้งค่า AI',
    subtitle: 'เชื่อมต่อ AI Provider เพื่อเปิดใช้การวิเคราะห์พลังงาน, Carbon Credit, ที่ปรึกษาการบ้าน และ Chatbot',
    activeProvider: 'Provider ที่ใช้งานอยู่',
    noKey: 'ยังไม่มี API Key — ระบบใช้ Rule-based',
    envSet: 'ตั้งค่าจาก .env.local (เซิร์ฟเวอร์)',
    dbSet: 'บันทึกในฐานข้อมูล',
    anthropicSection: 'Claude (Anthropic) — แนะนำ',
    openaiSection: 'OpenAI (GPT)',
    apiKey: 'API Key',
    model: 'โมเดล',
    save: 'บันทึก',
    clear: 'ลบ Key',
    saving: 'กำลังบันทึก…',
    envGuide: 'หรือตั้งค่าใน .env.local (ใช้ได้ทุก user):',
    howToGet: 'วิธีขอ API Key:',
    anthropicHowTo: 'ไปที่ console.anthropic.com → API Keys → Create Key',
    openaiHowTo: 'ไปที่ platform.openai.com/api-keys → Create new secret key',
    usedBy: 'ฟีเจอร์ที่ใช้ AI:',
    features: ['วิเคราะห์แนวโน้มพลังงาน (Customer Dashboard)', 'วิเคราะห์ Carbon Credit', 'ที่ปรึกษาการบ้าน (Online Classroom)', 'Chatbot M-Group'],
    invalidAnthropic: 'Key ไม่ถูกต้อง (ต้องขึ้นต้นด้วย sk-ant-)',
    invalidOpenai: 'Key ไม่ถูกต้อง (ต้องขึ้นต้นด้วย sk-)',
    login: 'กรุณาเข้าสู่ระบบก่อน',
    lastUpdated: 'อัปเดตล่าสุด',
  },
  en: {
    title: 'AI Settings',
    subtitle: 'Connect an AI provider to enable energy analysis, carbon credits, homework advisor, and chatbot.',
    activeProvider: 'Active provider',
    noKey: 'No API key — using rule-based fallback',
    envSet: 'Set via .env.local (server)',
    dbSet: 'Saved in database',
    anthropicSection: 'Claude (Anthropic) — Recommended',
    openaiSection: 'OpenAI (GPT)',
    apiKey: 'API Key',
    model: 'Model',
    save: 'Save',
    clear: 'Clear key',
    saving: 'Saving…',
    envGuide: 'Or set in .env.local (applies to all users):',
    howToGet: 'How to get an API key:',
    anthropicHowTo: 'Go to console.anthropic.com → API Keys → Create Key',
    openaiHowTo: 'Go to platform.openai.com/api-keys → Create new secret key',
    usedBy: 'Features powered by AI:',
    features: ['Energy trend analysis (Customer Dashboard)', 'Carbon credit insights', 'Homework advisor (Online Classroom)', 'M-Group Chatbot'],
    invalidAnthropic: 'Invalid key (must start with sk-ant-)',
    invalidOpenai: 'Invalid key (must start with sk-)',
    login: 'Please sign in first',
    lastUpdated: 'Last updated',
  },
  ko: {
    title: 'AI 설정',
    subtitle: 'AI 제공자를 연결하여 에너지 분석, 탄소 크레딧, 과제 상담, 챗봇을 활성화하세요.',
    activeProvider: '활성 제공자',
    noKey: 'API 키 없음 — 규칙 기반 사용 중',
    envSet: '.env.local에서 설정 (서버)',
    dbSet: '데이터베이스에 저장됨',
    anthropicSection: 'Claude (Anthropic) — 권장',
    openaiSection: 'OpenAI (GPT)',
    apiKey: 'API 키',
    model: '모델',
    save: '저장',
    clear: '키 삭제',
    saving: '저장 중…',
    envGuide: '또는 .env.local에서 설정 (전체 사용자에게 적용):',
    howToGet: 'API 키 발급 방법:',
    anthropicHowTo: 'console.anthropic.com → API Keys → Create Key',
    openaiHowTo: 'platform.openai.com/api-keys → Create new secret key',
    usedBy: 'AI를 사용하는 기능:',
    features: ['에너지 추세 분석 (고객 대시보드)', '탄소 크레딧 분석', '과제 상담 (온라인 강의실)', 'M-Group 챗봇'],
    invalidAnthropic: '잘못된 키 (sk-ant-로 시작해야 함)',
    invalidOpenai: '잘못된 키 (sk-로 시작해야 함)',
    login: '먼저 로그인하세요',
    lastUpdated: '마지막 업데이트',
  },
};

function ProviderBadge({ provider, active }: { provider: 'anthropic' | 'openai' | 'none'; active: boolean }) {
  if (!active) return <span className="inline-flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3.5 h-3.5" />No AI</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
      provider === 'anthropic' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
    }`}>
      <CheckCircle2 className="w-3.5 h-3.5" />
      {provider === 'anthropic' ? 'Claude (Anthropic)' : 'OpenAI (GPT)'}
    </span>
  );
}

export default function AiSettingsPage() {
  const { locale } = useLocale();
  const t = COPY[locale as keyof typeof COPY] ?? COPY.en;

  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // Anthropic form
  const [antKey, setAntKey] = useState('');
  const [antModel, setAntModel] = useState('claude-haiku-4-5-20251001');
  const [antSaving, setAntSaving] = useState(false);
  const [antStatus, setAntStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // OpenAI form
  const [oaiKey, setOaiKey] = useState('');
  const [oaiModel, setOaiModel] = useState('gpt-4o-mini');
  const [oaiSaving, setOaiSaving] = useState(false);
  const [oaiStatus, setOaiStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('energy_system_user');
      const u = raw ? JSON.parse(raw) : null;
      setUserId(u?.userId != null ? String(u.userId) : null);
    } catch { setUserId(null); }
  }, []);

  const loadSettings = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/ge-energy/ai-settings?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
        setAntModel(json.settings.anthropic_model || 'claude-haiku-4-5-20251001');
        setOaiModel(json.settings.openai_model || 'gpt-4o-mini');
      }
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  async function saveKey(provider: 'anthropic' | 'openai', key: string, model: string, clear = false) {
    if (!userId) {
      if (provider === 'anthropic') setAntStatus({ type: 'err', text: t.login });
      else setOaiStatus({ type: 'err', text: t.login });
      return;
    }
    if (!clear && key) {
      if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
        setAntStatus({ type: 'err', text: t.invalidAnthropic }); return;
      }
      if (provider === 'openai' && !key.startsWith('sk-')) {
        setOaiStatus({ type: 'err', text: t.invalidOpenai }); return;
      }
    }
    if (provider === 'anthropic') { setAntSaving(true); setAntStatus(null); }
    else { setOaiSaving(true); setOaiStatus(null); }

    try {
      const res = await fetch('/api/ge-energy/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, provider, apiKey: clear ? undefined : key || undefined, model, clearKey: clear }),
      });
      const json = await res.json();
      const statusObj = json.success
        ? { type: 'ok' as const, text: json.message || 'Saved' }
        : { type: 'err' as const, text: json.error || 'Error' };
      if (provider === 'anthropic') { setAntStatus(statusObj); setAntKey(''); }
      else { setOaiStatus(statusObj); setOaiKey(''); }
      await loadSettings();
    } catch {
      const err = { type: 'err' as const, text: 'Network error' };
      if (provider === 'anthropic') setAntStatus(err); else setOaiStatus(err);
    } finally {
      if (provider === 'anthropic') setAntSaving(false); else setOaiSaving(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none bg-white';
  const selectCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none bg-white';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.subtitle}</p>
        </div>
      </div>

      {/* Active status card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.activeProvider}</p>
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <ProviderBadge
                provider={settings?.has_api_key ? settings.active_provider : 'none'}
                active={Boolean(settings?.has_api_key)}
              />
            )}
          </div>
          <div className="text-right text-xs text-gray-400">
            {settings?.api_key_masked && <p>Key: <span className="font-mono">{settings.api_key_masked}</span></p>}
            {settings?.key_source === 'environment' && <p>{t.envSet}</p>}
            {settings?.key_source === 'database' && <p>{t.dbSet}</p>}
            {settings?.key_source === 'none' && <p className="text-amber-500">{t.noKey}</p>}
            {settings?.updated_at && <p>{t.lastUpdated}: {new Date(settings.updated_at).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* Env status pills */}
        {settings && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${settings.env_anthropic ? 'bg-violet-50 text-violet-700' : 'bg-gray-50 text-gray-400'}`}>
              {settings.env_anthropic ? '✅' : '○'} ANTHROPIC_API_KEY
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${settings.env_openai ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
              {settings.env_openai ? '✅' : '○'} OPENAI_API_KEY
            </span>
          </div>
        )}
      </div>

      {/* Anthropic section */}
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <h2 className="font-bold text-violet-900 text-sm">{t.anthropicSection}</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.apiKey} <span className="text-gray-400">(sk-ant-...)</span></label>
            <input
              type="password"
              className={inputCls}
              value={antKey}
              onChange={e => setAntKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.model}</label>
            <div className="relative">
              <select className={selectCls} value={antModel} onChange={e => setAntModel(e.target.value)}>
                {ANTHROPIC_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {antStatus && (
          <p className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${antStatus.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {antStatus.type === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {antStatus.text}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={antSaving}
            onClick={() => saveKey('anthropic', antKey, antModel)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {antSaving ? t.saving : t.save}
          </button>
          {settings?.key_source === 'database' && settings?.active_provider === 'anthropic' && (
            <button
              type="button"
              disabled={antSaving}
              onClick={() => saveKey('anthropic', '', antModel, true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />{t.clear}
            </button>
          )}
        </div>

        <div className="bg-violet-50/80 rounded-xl p-3 text-xs space-y-1">
          <p className="font-semibold text-violet-800">{t.howToGet}</p>
          <p className="text-violet-700">{t.anthropicHowTo}</p>
          <p className="text-violet-600 font-medium mt-2">{t.envGuide}</p>
          <pre className="bg-violet-100 text-violet-900 rounded-lg px-3 py-2 text-[11px] font-mono overflow-x-auto">ANTHROPIC_API_KEY=sk-ant-...{'\n'}ANTHROPIC_MODEL=claude-haiku-4-5-20251001</pre>
        </div>
      </div>

      {/* OpenAI section */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-emerald-900 text-sm">{t.openaiSection}</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.apiKey} <span className="text-gray-400">(sk-...)</span></label>
            <input
              type="password"
              className={inputCls}
              value={oaiKey}
              onChange={e => setOaiKey(e.target.value)}
              placeholder="sk-proj-..."
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.model}</label>
            <div className="relative">
              <select className={selectCls} value={oaiModel} onChange={e => setOaiModel(e.target.value)}>
                {OPENAI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {oaiStatus && (
          <p className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${oaiStatus.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {oaiStatus.type === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {oaiStatus.text}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={oaiSaving}
            onClick={() => saveKey('openai', oaiKey, oaiModel)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {oaiSaving ? t.saving : t.save}
          </button>
          {settings?.key_source === 'database' && settings?.active_provider === 'openai' && (
            <button
              type="button"
              disabled={oaiSaving}
              onClick={() => saveKey('openai', '', oaiModel, true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />{t.clear}
            </button>
          )}
        </div>

        <div className="bg-emerald-50/80 rounded-xl p-3 text-xs space-y-1">
          <p className="font-semibold text-emerald-800">{t.howToGet}</p>
          <p className="text-emerald-700">{t.openaiHowTo}</p>
          <p className="text-emerald-600 font-medium mt-2">{t.envGuide}</p>
          <pre className="bg-emerald-100 text-emerald-900 rounded-lg px-3 py-2 text-[11px] font-mono overflow-x-auto">OPENAI_API_KEY=sk-...{'\n'}OPENAI_MODEL=gpt-4o-mini</pre>
        </div>
      </div>

      {/* Features powered by AI */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">{t.usedBy}</p>
        <ul className="space-y-1.5">
          {t.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-gray-400">
          Priority: <span className="font-mono">ANTHROPIC_API_KEY</span> (.env) → DB Anthropic → <span className="font-mono">OPENAI_API_KEY</span> (.env) → DB OpenAI → Rule-based
        </p>
      </div>

    </div>
  );
}
