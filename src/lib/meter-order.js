/** GE-IoT Power Meter — pricing & bank details for corporate site orders */

export const SMART_METER_PRODUCT_ID = 'smart-meter';

export const METER_ORDER_BANK = {
  company: 'GE Energy Tech Co., Ltd.',
  bankNameTh: 'ธนาคารกุกมินเกาหลี (KB Kookmin Bank)',
  bankNameEn: 'KB Kookmin Bank (Korea)',
  accountNumber: '179-1-99999-9',
  accountName: 'GE ENERGY TECH CO., LTD.',
};

const BASE_PRICE_KRW = 30900;
const PER_KVA_KRW = 420;

function parseNum(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;

  // Normalize localized digits (Thai / Arabic-Indic / full-width) to ASCII.
  const normalizedDigits = raw
    .replace(/[๐-๙]/g, (ch) => String(ch.charCodeAt(0) - 3664))
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 1776))
    .replace(/[０-９]/g, (ch) => String(ch.charCodeAt(0) - 65296));

  // Keep only separators/digits, then support either "12.5" or "12,5".
  const cleaned = normalizedDigits.replace(/[^\d,.\-]/g, '');
  const decimalSafe =
    cleaned.includes('.') ? cleaned.replace(/,/g, '') : cleaned.replace(',', '.');

  const n = parseFloat(decimalSafe);
  return Number.isFinite(n) ? n : 0;
}

/** Unit price (KRW) from breaker amperage and machine kVA */
export function calculateMeterUnitPrice(breakerAmps, machineKva) {
  const amps = parseNum(breakerAmps);
  const kva = parseNum(machineKva);
  if (kva <= 0) return null;

  let price = BASE_PRICE_KRW + kva * PER_KVA_KRW;
  if (amps > 250) price += 22000;
  else if (amps > 100) price += 11000;
  else if (amps > 63) price += 5000;

  return Math.round(price);
}

export function formatThb(amount) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}
