/** Thailand grid average — matches power_records.co2_reduction generated column. */
export const CO2_KG_PER_KWH = 0.5135;

export type CarbonMarket = 'thailand' | 'korea' | 'default';

export type SiteCreditPricing = {
  market: CarbonMarket;
  currency: 'THB' | 'KRW';
  creditPricePerTonne: number;
  currencyLabel: { th: string; en: string; ko: string };
};

/** Default voluntary-market reference prices per tonne CO₂e */
export const DEFAULT_CREDIT_PRICE_THB_PER_TONNE = 250;
export const DEFAULT_CREDIT_PRICE_KRW_PER_TONNE = 32_000;

const SITE_PRICING: Record<string, SiteCreditPricing> = {
  thailand: {
    market: 'thailand',
    currency: 'THB',
    creditPricePerTonne: DEFAULT_CREDIT_PRICE_THB_PER_TONNE,
    currencyLabel: { th: 'บาท', en: 'THB', ko: '바트' },
  },
  korea: {
    market: 'korea',
    currency: 'KRW',
    creditPricePerTonne: DEFAULT_CREDIT_PRICE_KRW_PER_TONNE,
    currencyLabel: { th: 'วอน', en: 'KRW', ko: '원' },
  },
};

export function getSiteCreditPricing(site: string): SiteCreditPricing {
  const key = String(site || 'thailand').toLowerCase();
  const base = SITE_PRICING[key] ?? SITE_PRICING.thailand;

  if (key === 'korea') {
    const krw = Number(process.env.CARBON_CREDIT_PRICE_KRW);
    return {
      ...base,
      creditPricePerTonne: Number.isFinite(krw) && krw > 0 ? krw : DEFAULT_CREDIT_PRICE_KRW_PER_TONNE,
    };
  }

  if (key === 'thailand') {
    const thb = Number(process.env.CARBON_CREDIT_PRICE_THB);
    return {
      ...base,
      creditPricePerTonne: Number.isFinite(thb) && thb > 0 ? thb : DEFAULT_CREDIT_PRICE_THB_PER_TONNE,
    };
  }

  return base;
}

export type CarbonSummaryInput = {
  totalEnergySavedKwh: number;
  totalCo2Kg: number;
  avgBeforeKwh?: number;
  avgAfterKwh?: number;
};

export type CarbonSummary = {
  totalEnergySavedKwh: number;
  totalCo2Kg: number;
  carbonCreditsTonnes: number;
  carbonCreditsKg: number;
  reductionPercent: number;
  estimatedValue: number;
  /** @deprecated use estimatedValue + currency */
  estimatedValueThb: number;
  currency: 'THB' | 'KRW';
  market: CarbonMarket;
  creditPricePerTonne: number;
  /** @deprecated use creditPricePerTonne + currency */
  creditPriceThbPerTonne: number;
  emissionFactorKgPerKwh: number;
};

export function computeCarbonSummary(
  input: CarbonSummaryInput,
  pricing: SiteCreditPricing = getSiteCreditPricing('thailand')
): CarbonSummary {
  const totalEnergySavedKwh = Math.max(0, Number(input.totalEnergySavedKwh) || 0);
  const totalCo2Kg = Math.max(
    0,
    Number(input.totalCo2Kg) || totalEnergySavedKwh * CO2_KG_PER_KWH
  );
  const carbonCreditsKg = totalCo2Kg;
  const carbonCreditsTonnes = carbonCreditsKg / 1000;
  const avgBefore = Number(input.avgBeforeKwh) || 0;
  const avgAfter = Number(input.avgAfterKwh) || 0;
  const reductionPercent =
    avgBefore > 0 ? Math.round(((avgBefore - avgAfter) / avgBefore) * 1000) / 10 : 0;

  const estimatedValue = Math.round(carbonCreditsTonnes * pricing.creditPricePerTonne);

  return {
    totalEnergySavedKwh: Math.round(totalEnergySavedKwh * 1000) / 1000,
    totalCo2Kg: Math.round(totalCo2Kg * 100) / 100,
    carbonCreditsTonnes: Math.round(carbonCreditsTonnes * 10000) / 10000,
    carbonCreditsKg: Math.round(carbonCreditsKg * 100) / 100,
    reductionPercent,
    estimatedValue,
    estimatedValueThb: pricing.currency === 'THB' ? estimatedValue : estimatedValue,
    currency: pricing.currency,
    market: pricing.market,
    creditPricePerTonne: pricing.creditPricePerTonne,
    creditPriceThbPerTonne:
      pricing.currency === 'THB' ? pricing.creditPricePerTonne : DEFAULT_CREDIT_PRICE_THB_PER_TONNE,
    emissionFactorKgPerKwh: CO2_KG_PER_KWH,
  };
}

function formatMoney(value: number, currency: 'THB' | 'KRW', locale: string): string {
  const loc =
    currency === 'KRW'
      ? locale.startsWith('ko')
        ? 'ko-KR'
        : 'en-US'
      : locale.startsWith('th')
        ? 'th-TH'
        : 'en-US';
  return new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(value);
}

export function buildRuleBasedInsights(
  summary: CarbonSummary,
  pricing: SiteCreditPricing,
  locale: string,
  deviceCount: number
): string[] {
  const isTh = locale === 'th' || locale.startsWith('th');
  const isKo = locale === 'ko' || locale.startsWith('ko');
  const unit = isTh
    ? pricing.currencyLabel.th
    : isKo
      ? pricing.currencyLabel.ko
      : pricing.currencyLabel.en;
  const valueStr = formatMoney(summary.estimatedValue, summary.currency, locale);

  if (isTh) {
    const marketName = pricing.market === 'korea' ? 'เกาหลี (วอน)' : 'ไทย (บาท)';
    return [
      `ข้อมูลจาก MQTT → power_records: ประหยัดไฟรวม ${summary.totalEnergySavedKwh.toLocaleString('th-TH')} kWh`,
      `ลดการปล่อย CO₂ สะสม ${summary.totalCo2Kg.toLocaleString('th-TH')} kg (ปัจจัย ${summary.emissionFactorKgPerKwh} kg/kWh)`,
      `คาร์บอนเครดิตโดยประมาณ ${summary.carbonCreditsTonnes.toLocaleString('th-TH')} ตัน CO₂e`,
      `มูลค่าอ้างอิงตลาด${marketName}: ~${valueStr} ${unit} (@${pricing.creditPricePerTonne.toLocaleString('th-TH')} ${unit}/ตัน)`,
      deviceCount > 0
        ? `ครอบคลุม ${deviceCount} อุปกรณ์ — ประสิทธิการลดพลังงานเฉลี่ย ${summary.reductionPercent}%`
        : 'ยังไม่มีข้อมูลอุปกรณ์ในช่วงที่เลือก',
    ];
  }

  if (isKo) {
    const marketName = pricing.market === 'korea' ? '한국' : '태국';
    return [
      `MQTT → power_records: 총 ${summary.totalEnergySavedKwh.toLocaleString('ko-KR')} kWh 절감`,
      `누적 CO₂ 감축 ${summary.totalCo2Kg.toLocaleString('ko-KR')} kg`,
      `추정 탄소 크레딧 ${summary.carbonCreditsTonnes.toLocaleString('ko-KR')} tCO₂e`,
      `${marketName} 참고 가치: ~${valueStr} ${unit} (톤당 ${pricing.creditPricePerTonne.toLocaleString('ko-KR')} ${unit})`,
      deviceCount > 0
        ? `${deviceCount}개 장치, 평균 ${summary.reductionPercent}% 절감`
        : '선택 기간에 장치 데이터 없음',
    ];
  }

  const marketName = pricing.market === 'korea' ? 'Korea' : 'Thailand';
  return [
    `MQTT → power_records: ${summary.totalEnergySavedKwh.toLocaleString()} kWh saved`,
    `CO₂ avoided: ${summary.totalCo2Kg.toLocaleString()} kg`,
    `Carbon credits: ${summary.carbonCreditsTonnes.toLocaleString()} tCO₂e`,
    `${marketName} reference value: ~${valueStr} ${summary.currency} (@${pricing.creditPricePerTonne.toLocaleString()} ${summary.currency}/t)`,
    deviceCount > 0
      ? `${deviceCount} devices — ${summary.reductionPercent}% avg. reduction`
      : 'No telemetry in selected period',
  ];
}

export function formatReferenceValue(
  value: number,
  currency: 'THB' | 'KRW',
  locale: string
): string {
  const unit =
    currency === 'KRW'
      ? locale.startsWith('th')
        ? 'วอน'
        : locale.startsWith('ko')
          ? '원'
          : 'KRW'
      : locale.startsWith('th')
        ? 'บาท'
        : locale.startsWith('ko')
          ? '바트'
          : 'THB';
  return `${formatMoney(value, currency, locale)} ${unit}`;
}
