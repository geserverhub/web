'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Save, Sparkles, Trash2 } from 'lucide-react';

type AiSettingsResponse = {
  openai_model: string;
  api_key_masked: string;
  has_api_key: boolean;
  key_source: 'database' | 'environment' | 'none';
  env_fallback?: boolean;
};

const COPY = {
  th: {
    title: 'ตั้งค่าโทเค็น AI (OpenAI)',
    subtitle: 'บันทึกในฐานข้อมูล goeunserverhub — ใช้แทนหรือร่วมกับ .env.local',
    token: 'API Key (sk-...)',
    tokenPlaceholder: 'วาง OpenAI API key ใหม่',
    model: 'โมเดล',
    save: 'บันทึกโทเค็น',
    clear: 'ลบโทเค็นที่บันทึก',
    saved: 'บันทึกแล้ว',
    sourceDb: 'ใช้โทเค็นจากระบบ (ที่คุณบันทึก)',
    sourceEnv: 'ใช้ OPENAI_API_KEY จากเซิร์ฟเวอร์ (.env)',
    sourceNone: 'ยังไม่มีโทเค็น — กรอกด้านล่าง',
    login: 'กรุณาเข้าสู่ระบบ',
    invalid: 'รูปแบบ key ไม่ถูกต้อง (ต้องขึ้นต้นด้วย sk-)',
  },
  en: {
    title: 'AI token settings (OpenAI)',
    subtitle: 'Stored in goeunserverhub DB — overrides or complements .env.local',
    token: 'API key (sk-...)',
    tokenPlaceholder: 'Paste new OpenAI API key',
    model: 'Model',
    save: 'Save token',
    clear: 'Clear saved token',
    saved: 'Saved',
    sourceDb: 'Using token saved in dashboard',
    sourceEnv: 'Using server OPENAI_API_KEY (.env)',
    sourceNone: 'No token — enter below',
    login: 'Please sign in',
    invalid: 'Invalid key (must start with sk-)',
  },
  ko: {
    title: 'AI 토큰 설정 (OpenAI)',
    subtitle: 'goeunserverhub DB에 저장 — .env와 함께 사용',
    token: 'API 키 (sk-...)',
    tokenPlaceholder: 'OpenAI API 키 입력',
    model: '모델',
    save: '토큰 저장',
    clear: '저장된 토큰 삭제',
    saved: '저장됨',
    sourceDb: '대시보드에 저장된 토큰 사용',
    sourceEnv: '서버 .env OPENAI_API_KEY 사용',
    sourceNone: '토큰 없음 — 아래에 입력',
    login: '로그인 필요',
    invalid: '키 형식 오류 (sk- 로 시작)',
  },
};

const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'];

export default function AiTokenSettingsCard({
  locale = 'th',
  onSaved,
}: {
  locale?: string;
  onSaved?: () => void;
}) {
  const ui = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AiSettingsResponse | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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
    if (!userId) return;
    const res = await fetch(`/api/ge-energy/ai-settings?userId=${userId}`);
    const json = await res.json();
    if (json.success) {
      setSettings(json.settings);
      setModel(json.settings.openai_model || 'gpt-4o-mini');
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(clearKey = false) {
    if (!userId) {
      setStatus({ type: 'err', text: ui.login });
      return;
    }
    if (!clearKey && apiKey.trim() && !apiKey.trim().startsWith('sk-')) {
      setStatus({ type: 'err', text: ui.invalid });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/ge-energy/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          apiKey: clearKey ? undefined : apiKey.trim() || undefined,
          openai_model: model,
          clearKey,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus({ type: 'ok', text: json.message || ui.saved });
        setApiKey('');
        await load();
        onSaved?.();
      } else {
        setStatus({ type: 'err', text: json.error || 'Save failed' });
      }
    } catch {
      setStatus({ type: 'err', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  }

  const sourceLabel =
    settings?.key_source === 'database'
      ? ui.sourceDb
      : settings?.key_source === 'environment'
        ? ui.sourceEnv
        : ui.sourceNone;

  const inputClass =
    'w-full rounded-xl border border-violet-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none font-mono';

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-violet-100 text-violet-700">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-violet-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {ui.title}
          </h3>
          <p className="text-xs text-violet-700 mt-0.5">{ui.subtitle}</p>
          <p className="text-xs font-medium text-violet-800 mt-2">
            {sourceLabel}
            {settings?.api_key_masked ? ` · ${settings.api_key_masked}` : ''}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-gray-600">{ui.token}</span>
          <input
            type="password"
            className={inputClass}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={ui.tokenPlaceholder}
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">{ui.model}</span>
          <select
            className={inputClass}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {status && (
        <p
          className={`text-xs px-3 py-2 rounded-lg ${
            status.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {status.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => save(false)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? '…' : ui.save}
        </button>
        {settings?.key_source === 'database' && (
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            {ui.clear}
          </button>
        )}
      </div>
    </div>
  );
}
