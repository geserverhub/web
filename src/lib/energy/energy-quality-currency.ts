import { fmtNum, type EqLocale } from './energy-quality-i18n';

export type ReportCurrency = {
  code: string;
  label: string;
  /** Estimated industrial tariff (local currency per kWh). */
  kwhRate: number;
  defaultInvestment: number;
  perMonth: string;
  chartUnit: string;
  /** Approximate FX multiplier from THB (product prices are stored in THB). */
  fxFromThb: number;
  /** VAT rate applied when showing tax-inclusive prices (e.g. Korea 10%, Thailand 7%). */
  vat: number;
};

const CURRENCY_BY_LOCALE: Record<EqLocale, ReportCurrency> = {
  th: {
    code: 'THB',
    label: 'บาท',
    kwhRate: 4.2,
    defaultInvestment: 200_000,
    perMonth: '/เดือน',
    chartUnit: ' บาท',
    fxFromThb: 1,
    vat: 0.07,
  },
  ko: {
    code: 'KRW',
    label: '원',
    kwhRate: 150,
    defaultInvestment: 8_000_000,
    perMonth: '/월',
    chartUnit: ' 원',
    fxFromThb: 38,
    vat: 0.10,
  },
  en: {
    code: 'USD',
    label: 'USD',
    kwhRate: 0.12,
    defaultInvestment: 5_700,
    perMonth: '/mo',
    chartUnit: ' USD',
    fxFromThb: 0.028,
    vat: 0,
  },
  cn: {
    code: 'CNY',
    label: '元',
    kwhRate: 0.65,
    defaultInvestment: 40_000,
    perMonth: '/月',
    chartUnit: ' 元',
    fxFromThb: 0.20,
    vat: 0.13,
  },
  vn: {
    code: 'VND',
    label: 'đồng',
    kwhRate: 2_500,
    defaultInvestment: 140_000_000,
    perMonth: '/tháng',
    chartUnit: ' đ',
    fxFromThb: 720,
    vat: 0.10,
  },
  ms: {
    code: 'MYR',
    label: 'RM',
    kwhRate: 0.45,
    defaultInvestment: 27_000,
    perMonth: '/bulan',
    chartUnit: ' RM',
    fxFromThb: 0.13,
    vat: 0.06,
  },
};

export function reportCurrency(locale: EqLocale): ReportCurrency {
  return CURRENCY_BY_LOCALE[locale] ?? CURRENCY_BY_LOCALE.en;
}

export function reportKwhTariff(locale: EqLocale): number {
  return reportCurrency(locale).kwhRate;
}

export function defaultReportInvestment(locale: EqLocale): number {
  return reportCurrency(locale).defaultInvestment;
}

/** Convert a THB amount into the locale currency (product prices are stored in THB). */
export function convertFromThb(amountThb: number, locale: EqLocale): number {
  return amountThb * reportCurrency(locale).fxFromThb;
}

/** Locale VAT rate (e.g. Thailand 0.07, Korea 0.10). */
export function localeVatRate(locale: EqLocale): number {
  return reportCurrency(locale).vat;
}

/**
 * Tax-inclusive product price in the locale currency, from a THB ex-VAT base.
 * (Korea VAT 10%, Thailand 7%, etc. — not the fixed Pin_VAT stored in the table.)
 */
export function priceInclVatFromThb(baseThb: number, locale: EqLocale): number {
  return convertFromThb(baseThb, locale) * (1 + reportCurrency(locale).vat);
}

export function fmtReportMoney(
  locale: EqLocale,
  amount: number,
  opts?: { perMonth?: boolean; decimals?: number },
): string {
  const c = reportCurrency(locale);
  const decimals = opts?.decimals ?? 0;
  const suffix = opts?.perMonth ? c.perMonth : '';
  return `${fmtNum(amount, decimals)} ${c.label}${suffix}`;
}

/** Parse numeric amount from formatted report money strings (any locale). */
export function parseReportMoney(value: string): number | null {
  if (value === '—' || !value.trim()) return null;
  const m = value.replace(/,/g, '').match(/([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}
