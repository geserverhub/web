/** Shipment status + timeline labels — all 8 GE Energy Tech languages */

export const ORDER_STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

export const ORDER_STATUS_TEXT = {
  th: {
    pending: 'รอยืนยันการชำระเงิน',
    processing: 'กำลังเตรียมสินค้า',
    shipped: 'จัดส่งแล้ว',
    delivered: 'จัดส่งสำเร็จ',
  },
  en: {
    pending: 'Pending payment verification',
    processing: 'Preparing order',
    shipped: 'Shipped',
    delivered: 'Delivered',
  },
  ko: {
    pending: '결제 확인 대기',
    processing: '상품 준비 중',
    shipped: '배송 중',
    delivered: '배송 완료',
  },
  zh: {
    pending: '待确认付款',
    processing: '备货中',
    shipped: '已发货',
    delivered: '已送达',
  },
  vi: {
    pending: 'Chờ xác nhận thanh toán',
    processing: 'Đang chuẩn bị hàng',
    shipped: 'Đã giao cho đơn vị vận chuyển',
    delivered: 'Giao hàng thành công',
  },
  ja: {
    pending: '入金確認待ち',
    processing: '出荷準備中',
    shipped: '発送済み',
    delivered: '配達完了',
  },
  'zh-tw': {
    pending: '待確認付款',
    processing: '備貨中',
    shipped: '已出貨',
    delivered: '已送達',
  },
  ms: {
    pending: 'Menunggu pengesahan bayaran',
    processing: 'Menyediakan pesanan',
    shipped: 'Telah dihantar',
    delivered: 'Penghantaran selesai',
  },
};

const SUPPORTED = new Set(Object.keys(ORDER_STATUS_TEXT));

export function resolveOrderStatusLang(code) {
  const normalized = String(code || 'en').toLowerCase();
  if (SUPPORTED.has(normalized)) return normalized;
  if (normalized === 'zh_tw') return 'zh-tw';
  return 'en';
}

export function getOrderStatusLabels(lang) {
  const key = resolveOrderStatusLang(lang);
  return ORDER_STATUS_TEXT[key] || ORDER_STATUS_TEXT.en;
}

export const ORDER_STATUS_LOCALE = {
  th: 'th-TH',
  en: 'en-US',
  ko: 'ko-KR',
  zh: 'zh-CN',
  vi: 'vi-VN',
  ja: 'ja-JP',
  'zh-tw': 'zh-TW',
  ms: 'ms-MY',
};

export function getOrderStatusLocale(lang) {
  return ORDER_STATUS_LOCALE[resolveOrderStatusLang(lang)] || 'en-US';
}

export function buildOrderTimeline(shipmentStatus, labels) {
  const index = ORDER_STATUS_ORDER.indexOf(shipmentStatus);
  const current = index >= 0 ? index : 0;
  return ORDER_STATUS_ORDER.map((key, i) => ({
    step: labels[key] || key,
    done: i <= current,
    statusKey: key,
  }));
}
