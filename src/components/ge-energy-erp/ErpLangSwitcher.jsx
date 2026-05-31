'use client';

import { ERP_LANG_OPTIONS } from '@/lib/ge-energy-erp-i18n';

export default function ErpLangSwitcher({ lang, onChange, className = '', ariaLabel }) {
  return (
    <div
      className={`geerp-lang ${className}`.trim()}
      role="group"
      aria-label={ariaLabel || 'Language'}
    >
      {ERP_LANG_OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          className={lang === opt.code ? 'is-active' : ''}
          onClick={() => onChange(opt.code)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
