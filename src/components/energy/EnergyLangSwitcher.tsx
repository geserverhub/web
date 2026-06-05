'use client';

import { useLocale } from '@/lib/LocaleContext';
import { GE_LANG_KEY } from '@/lib/ge-storage-keys';

const ENERGY_LANGS = [
  { value: 'th' as const, label: 'ไทย' },
  { value: 'ko' as const, label: '한국어' },
  { value: 'en' as const, label: 'EN' },
];

type EnergyLocale = (typeof ENERGY_LANGS)[number]['value'];

function applyLocale(setLocale: (l: string) => void, code: EnergyLocale) {
  setLocale(code);
  try {
    localStorage.setItem('locale', code);
    localStorage.setItem(GE_LANG_KEY, code);
    window.dispatchEvent(new CustomEvent('ge-lang-changed', { detail: code }));
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: code } }));
  } catch {
    /* ignore */
  }
}

export default function EnergyLangSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const active = ENERGY_LANGS.some((l) => l.value === locale) ? locale : 'th';

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-emerald-200/80 bg-white/95 p-0.5 shadow-md backdrop-blur-sm ${className}`}
      role="group"
      aria-label="Language"
    >
      {ENERGY_LANGS.map((lang) => (
        <button
          key={lang.value}
          type="button"
          onClick={() => applyLocale(setLocale, lang.value)}
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight transition-colors ${
            active === lang.value
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
