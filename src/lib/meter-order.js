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
  const n = parseFloat(String(value || '').replace(/[^\d.]/g, ''));
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
