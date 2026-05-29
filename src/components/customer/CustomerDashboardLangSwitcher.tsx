'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { useLocale } from '@/lib/LocaleContext';
import {
  CD_LANG_OPTIONS,
  applyCdLocale,
  normalizeCdLocale,
} from '@/lib/customer-dashboard-i18n';

export default function CustomerDashboardLangSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = normalizeCdLocale(locale);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current =
    CD_LANG_OPTIONS.find((o) => normalizeCdLocale(o.code) === active) ||
    CD_LANG_OPTIONS.find((o) => o.code === locale) ||
    CD_LANG_OPTIONS[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
        <span className="max-w-[5.5rem] truncate">{current.label}</span>
        <span className="text-emerald-600" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-[200] mt-1 min-w-[10.5rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {CD_LANG_OPTIONS.map((opt) => {
            const isActive = normalizeCdLocale(opt.code) === active || opt.code === locale;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  applyCdLocale(setLocale, opt.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                  isActive
                    ? 'bg-emerald-50 font-bold text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{opt.label}</span>
                {isActive ? <span className="text-emerald-600">✓</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
