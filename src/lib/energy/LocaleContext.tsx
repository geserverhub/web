'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, getT } from '@/lib/translations';

type Locale = 'ko' | 'en' | 'th' | 'cn' | 'vn' | 'ms';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  /** Merged translation object — missing keys fall back to English */
  tObj: typeof translations['en'];
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ko');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const validLocales: Locale[] = ['ko', 'en', 'th', 'cn', 'vn', 'ms'];

    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && validLocales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    setMounted(true);

    // Listen for locale changes dispatched by AdminLayout / Header
    const handleLocaleChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ locale: string }>).detail;
      const incoming = detail?.locale as Locale;
      if (incoming && validLocales.includes(incoming)) {
        setLocaleState(incoming);
      }
    };
    window.addEventListener('locale-changed', handleLocaleChanged);
    return () => window.removeEventListener('locale-changed', handleLocaleChanged);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    // Use 'ko' during SSR and first client render to match server HTML (prevents hydration mismatch)
    const activeLocale = mounted ? locale : 'ko';
    const merged = getT(activeLocale) as unknown as Record<string, unknown>;
    const val = merged[key];
    return typeof val === 'string' ? val : key;
  };

  // Pre-merged translation object; safe to use as `const t = tObj` in page components
  const tObj = getT(mounted ? locale : 'ko');

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, tObj }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  return context ?? {
    locale: 'en' as Locale,
    setLocale: () => {},
    t: (key: string) => key,
    tObj: translations['en'],
  };
}
