'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, getT } from '@/lib/k-translations';

const LocaleContext = createContext(undefined);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState('ko');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const validLocales = ['ko', 'en', 'th', 'cn', 'vn', 'ms', 'zh', 'vi', 'ja', 'zh-tw'];

    let savedLocale = null;
    try {
      savedLocale =
        localStorage.getItem('ge-energy-tech-lang') ||
        localStorage.getItem('locale');
    } catch {
      /* ignore */
    }
    if (savedLocale && validLocales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    setMounted(true);

    const handleLocaleChanged = (e) => {
      const detail = e.detail;
      const incoming = detail?.locale;
      if (incoming && validLocales.includes(incoming)) {
        setLocaleState(incoming);
        try {
          localStorage.setItem('ge-energy-tech-lang', incoming);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('locale-changed', handleLocaleChanged);
    return () => window.removeEventListener('locale-changed', handleLocaleChanged);
  }, []);

  const setLocale = (newLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('locale', newLocale);
      localStorage.setItem('ge-energy-tech-lang', newLocale);
    } catch {
      /* ignore */
    }
  };

  const t = (key) => {
    const activeLocale = mounted ? locale : 'ko';
    const merged = getT(activeLocale);
    const val = merged[key];
    return typeof val === 'string' ? val : key;
  };

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
    locale: 'en',
    setLocale: () => {},
    t: (key) => key,
    tObj: translations['en'],
  };
}
