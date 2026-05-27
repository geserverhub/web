export const GEET_LANG_OPTIONS = [
  { code: 'th', label: 'ไทย' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-tw', label: '繁體中文' },
  { code: 'ms', label: 'Bahasa Melayu' },
];

export const GEET_LANG_KEY = 'ge-energy-tech-lang';

const NAV_EXTRA = {
  th: { tracking: 'ติดตามการจัดส่งสินค้า', afterSales: 'บริการหลังการขาย' },
  en: { tracking: 'Track Shipment', afterSales: 'After-Sales Support' },
  ko: { tracking: '배송 조회', afterSales: 'AS 고객지원' },
  zh: { tracking: '物流追踪', afterSales: '售后服务' },
  vi: { tracking: 'Theo dõi giao hàng', afterSales: 'Hậu mãi' },
  ja: { tracking: '配送追跡', afterSales: 'アフターサービス' },
  'zh-tw': { tracking: '物流追蹤', afterSales: '售後服務' },
  ms: { tracking: 'Jejak penghantaran', afterSales: 'Khidmat selepas jualan' },
};

const TRACKING_COPY = {
  th: {
    title: 'ติดตามการจัดส่งสินค้า',
    sub: 'กรอกอีเมลหรือเลขที่ใบสั่งซื้อ เพื่อตรวจสอบสถานะการจัดส่งล่าสุด',
    by: 'ค้นหาด้วย',
    byEmail: 'อีเมล',
    byOrder: 'เลขที่ใบสั่งซื้อ',
    email: 'อีเมลลูกค้า',
    orderId: 'เลขที่ใบสั่งซื้อ',
    find: 'ค้นหารายการ',
    back: 'กลับหน้า GE Energy Tech',
    notFound: 'ไม่พบรายการสั่งซื้อ กรุณาตรวจสอบข้อมูลอีกครั้ง',
    cardTitle: 'สถานะการจัดส่ง',
    orderNo: 'เลขที่ใบสั่งซื้อ',
    status: 'สถานะ',
    updatedAt: 'อัปเดตล่าสุด',
    timeline: 'ความคืบหน้า',
  },
  en: {
    title: 'Track Shipment',
    sub: 'Enter customer email or order number to check shipping updates.',
    by: 'Search by',
    byEmail: 'Email',
    byOrder: 'Order number',
    email: 'Customer email',
    orderId: 'Order number',
    find: 'Find order',
    back: 'Back to GE Energy Tech',
    notFound: 'Order not found. Please check your input.',
    cardTitle: 'Shipping status',
    orderNo: 'Order no.',
    status: 'Status',
    updatedAt: 'Last updated',
    timeline: 'Timeline',
  },
  ko: {
    title: '배송 조회',
    sub: '고객 이메일 또는 주문번호를 입력해 배송 상태를 확인하세요.',
    by: '검색 방식',
    byEmail: '이메일',
    byOrder: '주문번호',
    email: '고객 이메일',
    orderId: '주문번호',
    find: '조회하기',
    back: 'GE Energy Tech로 돌아가기',
    notFound: '주문 정보를 찾을 수 없습니다.',
    cardTitle: '배송 상태',
    orderNo: '주문번호',
    status: '상태',
    updatedAt: '최종 업데이트',
    timeline: '진행 단계',
  },
};

const CHAT_COPY = {
  th: {
    title: 'บริการหลังการขาย',
    sub: 'แชทสดกับเจ้าหน้าที่แบบโต้ตอบเรียลไทม์',
    placeholder: 'พิมพ์ข้อความของคุณ…',
    send: 'ส่ง',
    back: 'กลับหน้า GE Energy Tech',
    welcome: 'สวัสดีค่ะ ทีมบริการหลังการขาย GE Energy Tech พร้อมช่วยเหลือค่ะ',
    typing: 'เจ้าหน้าที่กำลังพิมพ์…',
  },
  en: {
    title: 'After-Sales Support',
    sub: 'Live interactive chat with our support team',
    placeholder: 'Type your message…',
    send: 'Send',
    back: 'Back to GE Energy Tech',
    welcome: 'Hello! GE Energy Tech after-sales support is here to help you.',
    typing: 'Agent is typing…',
  },
  ko: {
    title: 'AS 고객지원',
    sub: '상담원과 실시간 대화',
    placeholder: '메시지를 입력하세요…',
    send: '보내기',
    back: 'GE Energy Tech로 돌아가기',
    welcome: '안녕하세요. GE Energy Tech AS 지원팀입니다. 무엇을 도와드릴까요?',
    typing: '상담원이 입력 중…',
  },
};

for (const option of GEET_LANG_OPTIONS) {
  const code = option.code;
  if (!TRACKING_COPY[code]) TRACKING_COPY[code] = TRACKING_COPY.en;
  if (!CHAT_COPY[code]) CHAT_COPY[code] = CHAT_COPY.en;
}

export function readGeetLang() {
  if (typeof window === 'undefined') return 'th';
  const saved = window.localStorage.getItem(GEET_LANG_KEY);
  return GEET_LANG_OPTIONS.some((item) => item.code === saved) ? saved : 'th';
}

export function getTrackingCopy(lang) {
  return TRACKING_COPY[lang] || TRACKING_COPY.en;
}

export function getAfterSalesCopy(lang) {
  return CHAT_COPY[lang] || CHAT_COPY.en;
}

export function getNavExtraLabels(lang) {
  return NAV_EXTRA[lang] || NAV_EXTRA.en;
}
