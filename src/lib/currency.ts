export type SupportedSite = 'thailand' | 'korea' | 'vietnam' | 'malaysia'
type SupportedLocale = 'th' | 'ko' | 'en' | 'cn' | 'vn' | 'ms'

const SITE_CURRENCY: Record<SupportedSite, { code: string; symbol: string; locale: string }> = {
  thailand: { code: 'THB', symbol: '฿', locale: 'th-TH' },
  korea: { code: 'KRW', symbol: '₩', locale: 'ko-KR' },
  vietnam: { code: 'VND', symbol: '₫', locale: 'vi-VN' },
  malaysia: { code: 'MYR', symbol: 'RM', locale: 'ms-MY' },
}

const LOCALE_CURRENCY: Record<SupportedLocale, { code: string; symbol: string; locale: string }> = {
  th: { code: 'THB', symbol: '฿', locale: 'th-TH' },
  ko: { code: 'KRW', symbol: '₩', locale: 'ko-KR' },
  en: { code: 'USD', symbol: '$', locale: 'en-US' },
  cn: { code: 'CNY', symbol: '¥', locale: 'zh-CN' },
  vn: { code: 'VND', symbol: '₫', locale: 'vi-VN' },
  ms: { code: 'MYR', symbol: 'RM', locale: 'ms-MY' },
}

const LOCALE_TO_TAG: Record<string, string> = {
  th: 'th-TH',
  ko: 'ko-KR',
  en: 'en-US',
  cn: 'zh-CN',
  vn: 'vi-VN',
  ms: 'ms-MY',
}

/** Normalize site/location strings to a billing country key (matches customer-scope). */
export function normalizeCurrencySite(site: string | null | undefined): SupportedSite {
  const s = String(site || '').trim().toLowerCase()
  if (s.includes('korea') || s === 'kr' || s === 'ko') return 'korea'
  if (s.includes('thai') || s === 'th') return 'thailand'
  if (s.includes('viet') || s === 'vn') return 'vietnam'
  if (s.includes('malay') || s === 'ms') return 'malaysia'
  if (s === 'korea' || s === 'thailand' || s === 'vietnam' || s === 'malaysia') return s as SupportedSite
  return 'thailand'
}

const normalizeSite = normalizeCurrencySite

export const getCurrencyCodeBySite = (site: string, _locale?: string): string =>
  SITE_CURRENCY[normalizeSite(site || 'thailand')].code

export const getCurrencySymbolBySite = (site: string, _locale?: string): string =>
  SITE_CURRENCY[normalizeSite(site || 'thailand')].symbol

export const getLocaleTag = (locale?: string, site?: string): string => {
  if (locale && LOCALE_TO_TAG[locale]) return LOCALE_TO_TAG[locale]
  return SITE_CURRENCY[normalizeSite(site || 'thailand')].locale
}

export const formatCurrencyBySite = (
  value: number,
  site: string,
  _locale?: string,
  options?: Intl.NumberFormatOptions,
): string => {
  const siteKey = normalizeSite(site || 'thailand')
  const siteCfg = SITE_CURRENCY[siteKey]
  return new Intl.NumberFormat(siteCfg.locale, {
    style: 'currency',
    currency: siteCfg.code,
    ...options,
  }).format(Number.isFinite(value) ? value : 0)
}
