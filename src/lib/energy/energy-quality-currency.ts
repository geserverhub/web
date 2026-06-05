import { fmtNum, type EqLocale } from './energy-quality-i18n';

export type ReportCurrency = {
  code: string;
  label: string;
  /** Estimated industrial tariff (local currency per kWh). */
  kwhRate: number;
  defaultInvestment: number;
  perMonth: string;
  chartUnit: string;
};

const CURRENCY_BY_LOCALE: Record<EqLocale, ReportCurrency> = {
  th: {
    code: 'THB',
    label: 'บาท',
    kwhRate: 4.2,
    defaultInvestment: 200_000,
    perMonth: '/เดือน',
    chartUnit: ' บาท',
  },
  ko: {
    code: 'KRW',
    label: '원',
    kwhRate: 150,
    defaultInvestment: 8_000_000,
    perMonth: '/월',
    chartUnit: ' 원',
  },
  en: {
    code: 'USD',
    label: 'USD',
    kwhRate: 0.12,
    defaultInvestment: 5_700,
    perMonth: '/mo',
    chartUnit: ' USD',
  },
  cn: {
    code: 'CNY',
    label: '元',
    kwhRate: 0.65,
    defaultInvestment: 40_000,
    perMonth: '/月',
    chartUnit: ' 元',
  },
  vn: {
    code: 'VND',
    label: 'đồng',
    kwhRate: 2_500,
    defaultInvestment: 140_000_000,
    perMonth: '/tháng',
    chartUnit: ' đ',
  },
  ms: {
    code: 'MYR',
    label: 'RM',
    kwhRate: 0.45,
    defaultInvestment: 27_000,
    perMonth: '/bulan',
    chartUnit: ' RM',
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
