/**
 * Customer Dashboard — 8 languages (same set as GE Energy Tech login).
 */
import {
  GET_AUTH_LANG_KEY,
  GET_AUTH_LANG_OPTIONS,
  GET_AUTH_COMPANY,
} from '@/lib/ge-energy-tech-auth-i18n';
import { CD_EXTRA_CATALOG } from '@/lib/cd-extra-catalog';
import {
  PARTNER_CATEGORY,
  isPartnerEnergyCategory,
  isPartnerIotCategory,
} from '@/lib/partner-catalog';

export const CD_LANG_OPTIONS = GET_AUTH_LANG_OPTIONS;
export const CD_LANG_KEY = GET_AUTH_LANG_KEY;

const ALIASES = { cn: 'zh', vn: 'vi' };

export function normalizeCdLocale(locale) {
  const l = String(locale || 'th').toLowerCase();
  return ALIASES[l] || l;
}

export const CD_VALID_LOCALES = [
  'th', 'zh', 'vi', 'en', 'ko', 'ja', 'zh-tw', 'ms', 'cn', 'vn',
];

/** th-keyed extra translations (zh, vi, ja, zh-tw, ms). */
export const CD_EXTRA = {
  'กราฟไฟฟ้า': { zh: '电力图表', vi: 'Biểu đồ điện', ja: '電力グラフ', 'zh-tw': '電力圖表', ms: 'Carta tenaga' },
  'กราฟค่าไฟ': { zh: '电费图表', vi: 'Biểu đồ chi phí', ja: '電気料金グラフ', 'zh-tw': '電費圖表', ms: 'Carta kos' },
  'สินค้าของเรา': { zh: '我们的产品', vi: 'Sản phẩm của chúng tôi', ja: '当社製品', 'zh-tw': '我們的產品', ms: 'Produk kami' },
  'AI วิเคราะห์': { zh: 'AI 分析', vi: 'Phân tích AI', ja: 'AI分析', 'zh-tw': 'AI 分析', ms: 'Analisis AI' },
  'ไฟปัจจุบัน': { zh: '实时电力', vi: 'Điện trực tiếp', ja: 'リアルタイム電力', 'zh-tw': '即時電力', ms: 'Tenaga langsung' },
  'มอนิเตอร์เรียลไทม์': { zh: '实时监控', vi: 'Giám sát thời gian thực', ja: 'リアルタイムモニター', 'zh-tw': '即時監控', ms: 'Monitor masa nyata' },
  'เปรียบเทียบ': { zh: '对比', vi: 'So sánh', ja: '比較', 'zh-tw': '對比', ms: 'Bandingkan' },
  'ประวัติการทำรายการ': { zh: '活动记录', vi: 'Lịch sử hoạt động', ja: '活動履歴', 'zh-tw': '活動記錄', ms: 'Sejarah aktiviti' },
  'ติดต่อ': { zh: '联系', vi: 'Liên hệ', ja: 'お問い合わせ', 'zh-tw': '聯絡', ms: 'Hubungi' },
  'รายงานเปรียบเทียบพลังงาน': { zh: '能源对比报告', vi: 'Báo cáo so sánh năng lượng', ja: 'エネルギー比較レポート', 'zh-tw': '能源對比報告', ms: 'Laporan perbandingan tenaga' },
  'เปรียบเทียบการใช้ไฟฟ้าและค่าใช้จ่ายก่อน-หลัง': {
    zh: '对比安装前后的用电量和费用',
    vi: 'So sánh điện năng và chi phí trước/sau lắp đặt',
    ja: '設置前後の電力使用量とコストを比較',
    'zh-tw': '對比安裝前後的用電量和費用',
    ms: 'Bandingkan penggunaan & kos sebelum/selepas pemasangan',
  },
  'พลังงานสะอาด · รักษ์โลก': { zh: '清洁能源 · 环保', vi: 'Năng lượng sạch · Thân thiện môi trường', ja: 'クリーンエネルギー · 環境配慮', 'zh-tw': '潔淨能源 · 環保', ms: 'Tenaga bersih · Mesra alam' },
  'เมนูหลัก': { zh: '主菜单', vi: 'Menu chính', ja: 'メインメニュー', 'zh-tw': '主選單', ms: 'Menu utama' },
  'มิเตอร์ของคุณ': { zh: '您的电表', vi: 'Đồng hồ của bạn', ja: 'お客様のメーター', 'zh-tw': '您的電表', ms: 'Meter anda' },
  'ทุกมิเตอร์': { zh: '全部电表', vi: 'Tất cả đồng hồ', ja: '全メーター', 'zh-tw': '全部電表', ms: 'Semua meter' },
  'อัตราไฟ': { zh: '电价', vi: 'Giá điện', ja: '電気料金', 'zh-tw': '電價', ms: 'Kadar tenaga' },
  'จากฐานข้อมูล': { zh: '来自数据库', vi: 'Từ cơ sở dữ liệu', ja: 'データベースから', 'zh-tw': '來自資料庫', ms: 'Dari pangkalan data' },
  'จาก env': { zh: '来自 env', vi: 'Từ env', ja: 'env から', 'zh-tw': '來自 env', ms: 'Dari env' },
  'แผนภูมิแท่ง': { zh: '柱状图', vi: 'Biểu đồ cột', ja: '棒グラフ', 'zh-tw': '長條圖', ms: 'Carta bar' },
  'กราฟเส้น': { zh: '折线图', vi: 'Biểu đồ đường', ja: '折れ線グラフ', 'zh-tw': '折線圖', ms: 'Carta garis' },
  'ดาวน์โหลด': { zh: '下载', vi: 'Tải xuống', ja: 'ダウンロード', 'zh-tw': '下載', ms: 'Muat turun' },
  'สรุป KPI ประหยัดพลังงาน': { zh: '节能 KPI 摘要', vi: 'Tóm tắt KPI tiết kiệm', ja: '省エネKPIサマリー', 'zh-tw': '節能 KPI 摘要', ms: 'Ringkasan KPI penjimatan' },
  'ไฟฟ้าที่ประหยัด': { zh: '节省电量', vi: 'Điện tiết kiệm', ja: '節約電力量', 'zh-tw': '節省電量', ms: 'Tenaga dijimat' },
  '% ที่ประหยัด': { zh: '节省率', vi: 'Tỷ lệ tiết kiệm', ja: '節約率', 'zh-tw': '節省率', ms: 'Kadar penjimatan' },
  'CO₂ ที่ลดได้': { zh: '减少的 CO₂', vi: 'CO₂ giảm', ja: '削減CO₂', 'zh-tw': '減少的 CO₂', ms: 'CO₂ dikurangkan' },
  'ก่อนติดตั้ง': { zh: '安装前', vi: 'Trước lắp đặt', ja: '設置前', 'zh-tw': '安裝前', ms: 'Sebelum pemasangan' },
  'หลังติดตั้ง': { zh: '安装后', vi: 'Sau lắp đặt', ja: '設置後', 'zh-tw': '安裝後', ms: 'Selepas pemasangan' },
  'ก่อน': { zh: '前', vi: 'Trước', ja: '前', 'zh-tw': '前', ms: 'Sebelum' },
  'หลัง': { zh: '后', vi: 'Sau', ja: '後', 'zh-tw': '後', ms: 'Selepas' },
  'รีเฟรช': { zh: '刷新', vi: 'Làm mới', ja: '更新', 'zh-tw': '重新整理', ms: 'Muat semula' },
  'กำลังโหลดรายการสินค้า...': { zh: '正在加载产品...', vi: 'Đang tải sản phẩm...', ja: '製品を読み込み中...', 'zh-tw': '正在載入產品...', ms: 'Memuatkan produk...' },
  'เครื่องประหยัดพลังงานแต่ละขนาด': { zh: '各规格节能机', vi: 'Máy tiết kiệm theo công suất', ja: '省エネ機各容量', 'zh-tw': '各規格節能機', ms: 'Penjimat tenaga mengikut saiz' },
  'อุปกรณ์ IoT ที่วางขาย': { zh: '在售 IoT 设备', vi: 'Thiết bị IoT đang bán', ja: '販売中IoT機器', 'zh-tw': '在售 IoT 設備', ms: 'Peranti IoT dijual' },
  'แคตตาล็อกสินค้า': { zh: '产品目录', vi: 'Danh mục sản phẩm', ja: '製品カタログ', 'zh-tw': '產品目錄', ms: 'Katalog produk' },
  'ขนาด': { zh: '容量', vi: 'Công suất', ja: '容量', 'zh-tw': '容量', ms: 'Kapasiti' },
  'ราคา': { zh: '价格', vi: 'Giá', ja: '価格', 'zh-tw': '價格', ms: 'Harga' },
  'รหัสสินค้า': { zh: 'SKU', vi: 'Mã SKU', ja: 'SKU', 'zh-tw': 'SKU', ms: 'SKU' },
  'ยังไม่มีสินค้าในหมวดเครื่องประหยัดพลังงาน': {
    zh: '暂无节能机产品',
    vi: 'Chưa có sản phẩm tiết kiệm năng lượng',
    ja: '省エネ製品はまだありません',
    'zh-tw': '暫無節能機產品',
    ms: 'Tiada produk penjimat tenaga lagi',
  },
  'ยังไม่มีสินค้าอุปกรณ์ IoT': {
    zh: '暂无 IoT 设备',
    vi: 'Chưa có thiết bị IoT',
    ja: 'IoT製品はまだありません',
    'zh-tw': '暫無 IoT 設備',
    ms: 'Tiada peranti IoT lagi',
  },
  'เครื่องช่วยประหยัดพลังงาน GE Energy Tech สำหรับลดการใช้ไฟฟ้าในระบบ 3 เฟส': {
    zh: 'GE Energy Tech 三相节能设备，降低用电',
    vi: 'Thiết bị tiết kiệm GE Energy Tech cho hệ 3 pha',
    ja: 'GE Energy Tech 三相省エネ装置',
    'zh-tw': 'GE Energy Tech 三相節能設備，降低用電',
    ms: 'Peranti penjimatan GE Energy Tech untuk 3 fasa',
  },
  'อุปกรณ์ IoT': { zh: 'IoT 设备', vi: 'Thiết bị IoT', ja: 'IoT機器', 'zh-tw': 'IoT 設備', ms: 'Peranti IoT' },
  'เครื่องประหยัดพลังงาน': { zh: '节能设备', vi: 'Máy tiết kiệm năng lượng', ja: '省エネ装置', 'zh-tw': '節能設備', ms: 'Penjimat tenaga' },
  'บริการ / ติดตั้ง': { zh: '安装 / 服务', vi: 'Dịch vụ / Lắp đặt', ja: '設置・サービス', 'zh-tw': '安裝 / 服務', ms: 'Pemasangan / Perkhidmatan' },
  'อื่นๆ': { zh: '其他', vi: 'Khác', ja: 'その他', 'zh-tw': '其他', ms: 'Lain-lain' },
  'เครื่องประหยัดพลังงานจาก Partner Dashboard': {
    zh: '来自合作伙伴仪表板的节能设备',
    vi: 'Máy tiết kiệm từ Partner Dashboard',
    ja: 'パートナーダッシュボードの省エネ機',
    'zh-tw': '來自合作夥伴儀表板的節能設備',
    ms: 'Penjimat tenaga dari Partner Dashboard',
  },
  'อุปกรณ์ IoT จาก Partner Dashboard': {
    zh: '来自合作伙伴仪表板的 IoT 设备',
    vi: 'Thiết bị IoT từ Partner Dashboard',
    ja: 'パートナーダッシュボードのIoT機器',
    'zh-tw': '來自合作夥伴儀表板的 IoT 設備',
    ms: 'Peranti IoT dari Partner Dashboard',
  },
  'เลือกภาษา': { zh: '选择语言', vi: 'Chọn ngôn ngữ', ja: '言語を選択', 'zh-tw': '選擇語言', ms: 'Pilih bahasa' },
  'ออนไลน์': { zh: '在线', vi: 'Trực tuyến', ja: 'オンライン', 'zh-tw': '線上', ms: 'Dalam talian' },
  'ออฟไลน์': { zh: '离线', vi: 'Ngoại tuyến', ja: 'オフライン', 'zh-tw': '離線', ms: 'Luar talian' },
  'ไม่มีข้อมูล': { zh: '无数据', vi: 'Không có dữ liệu', ja: 'データなし', 'zh-tw': '無資料', ms: 'Tiada data' },
  'กำลังโหลดข้อมูลอุปกรณ์...': { zh: '正在加载设备数据...', vi: 'Đang tải dữ liệu thiết bị...', ja: '機器データ読込中...', 'zh-tw': '正在載入設備資料...', ms: 'Memuatkan data peranti...' },
  ...CD_EXTRA_CATALOG,
};

const MONTHS = {
  th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  vi: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  'zh-tw': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  ms: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'],
};

export function cdMonthLabel(locale, monthIndex) {
  const loc = normalizeCdLocale(locale);
  const idx = Math.max(0, Math.min(11, Number(monthIndex) - 1));
  const row = MONTHS[loc] || MONTHS.en;
  return row[idx];
}

export function cdCompanyName(locale) {
  const loc = normalizeCdLocale(locale);
  return GET_AUTH_COMPANY[loc] || GET_AUTH_COMPANY.en || GET_AUTH_COMPANY.th;
}

/** BCP 47 tag for Intl date/time formatting */
export function cdLocaleTag(locale) {
  const loc = normalizeCdLocale(locale);
  const map = {
    th: 'th-TH',
    ko: 'ko-KR',
    en: 'en-GB',
    zh: 'zh-CN',
    vi: 'vi-VN',
    ja: 'ja-JP',
    'zh-tw': 'zh-TW',
    ms: 'ms-MY',
  };
  return map[loc] || 'en-GB';
}

export function L(locale, th, ko, en) {
  const loc = normalizeCdLocale(locale);
  if (loc === 'th') return th;
  if (loc === 'ko') return ko;
  if (loc === 'en') return en;
  const extra = CD_EXTRA[th];
  if (extra?.[loc]) return extra[loc];
  return ko || en;
}

/** Translate with `{key}` placeholders (keys must exist in CD_EXTRA or L args). */
export function Lfmt(locale, th, ko, en, vars = {}) {
  let text = L(locale, th, ko, en);
  for (const [key, value] of Object.entries(vars)) {
    text = text.split(`{${key}}`).join(String(value));
  }
  return text;
}

/** e.g. LSuffix(locale, 'ก่อน', '이전', 'Before', 'THB') → "ก่อน (THB)" */
export function LSuffix(locale, th, ko, en, suffix) {
  return `${L(locale, th, ko, en)} (${suffix})`;
}

export function applyCdLocale(setLocale, code) {
  const normalized = normalizeCdLocale(code);
  if (!CD_VALID_LOCALES.includes(code) && !CD_VALID_LOCALES.includes(normalized)) return;
  const use = CD_VALID_LOCALES.includes(code) ? code : normalized;
  setLocale(use);
  try {
    localStorage.setItem('locale', use);
    localStorage.setItem(CD_LANG_KEY, use);
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: use } }));
    window.dispatchEvent(new CustomEvent('ge-lang-changed', { detail: use }));
  } catch {
    /* ignore */
  }
}

export function cdWelcomeText(locale, name) {
  const loc = normalizeCdLocale(locale);
  const n = name || '';
  const t = {
    th: `ยินดีต้อนรับ, ${n}`,
    ko: `${n}님, 환영합니다`,
    en: `Welcome, ${n}`,
    zh: `欢迎，${n}`,
    vi: `Chào mừng, ${n}`,
    ja: `ようこそ、${n}`,
    'zh-tw': `歡迎，${n}`,
    ms: `Selamat datang, ${n}`,
  };
  return t[loc] || t.en;
}

const PRODUCT_CATEGORY_LABEL = {
  [PARTNER_CATEGORY.IOT]: {
    th: PARTNER_CATEGORY.IOT,
    ko: 'IoT 장비',
    en: 'IoT Devices',
    zh: 'IoT 设备',
    vi: 'Thiết bị IoT',
    ja: 'IoT機器',
    'zh-tw': 'IoT 設備',
    ms: 'Peranti IoT',
  },
  [PARTNER_CATEGORY.ENERGY]: {
    th: PARTNER_CATEGORY.ENERGY,
    ko: '에너지 세이버',
    en: 'Energy Saver',
    zh: '节能设备',
    vi: 'Máy tiết kiệm năng lượng',
    ja: '省エネ装置',
    'zh-tw': '節能設備',
    ms: 'Penjimat tenaga',
  },
  [PARTNER_CATEGORY.SERVICE]: {
    th: PARTNER_CATEGORY.SERVICE,
    ko: '설치 / 서비스',
    en: 'Installation / Service',
    zh: '安装 / 服务',
    vi: 'Dịch vụ / Lắp đặt',
    ja: '設置・サービス',
    'zh-tw': '安裝 / 服務',
    ms: 'Pemasangan / Perkhidmatan',
  },
  [PARTNER_CATEGORY.OTHER]: {
    th: PARTNER_CATEGORY.OTHER,
    ko: '기타',
    en: 'Other',
    zh: '其他',
    vi: 'Khác',
    ja: 'その他',
    'zh-tw': '其他',
    ms: 'Lain-lain',
  },
};

const CATALOG_DESCRIPTION_I18N = {
  'เครื่องประหยัดพลังงานจาก Partner Dashboard': {
    th: 'เครื่องประหยัดพลังงานจาก Partner Dashboard',
    ko: '파트너 대시보드 에너지 세이버',
    en: 'Energy saver from Partner Dashboard',
    zh: '来自合作伙伴仪表板的节能设备',
    vi: 'Máy tiết kiệm từ Partner Dashboard',
    ja: 'パートナーダッシュボードの省エネ機',
    'zh-tw': '來自合作夥伴儀表板的節能設備',
    ms: 'Penjimat tenaga dari Partner Dashboard',
  },
  'อุปกรณ์ IoT จาก Partner Dashboard': {
    th: 'อุปกรณ์ IoT จาก Partner Dashboard',
    ko: '파트너 대시보드 IoT 장비',
    en: 'IoT device from Partner Dashboard',
    zh: '来自合作伙伴仪表板的 IoT 设备',
    vi: 'Thiết bị IoT từ Partner Dashboard',
    ja: 'パートナーダッシュボードのIoT機器',
    'zh-tw': '來自合作夥伴儀表板的 IoT 設備',
    ms: 'Peranti IoT dari Partner Dashboard',
  },
};

function pickLocaleRow(row, locale) {
  if (!row) return '';
  const loc = normalizeCdLocale(locale);
  if (row[loc]) return row[loc];
  if (loc === 'th' && row.th) return row.th;
  if (loc === 'ko' && row.ko) return row.ko;
  if (loc === 'en' && row.en) return row.en;
  return row.en || row.ko || row.th || '';
}

/** Partner DB category name → UI label for all dashboard locales. */
export function cdProductCategoryLabel(locale, rawName) {
  const key = String(rawName || '').trim();
  if (!key) return '';

  let row = PRODUCT_CATEGORY_LABEL[key];
  if (!row) {
    if (isPartnerEnergyCategory(key)) row = PRODUCT_CATEGORY_LABEL[PARTNER_CATEGORY.ENERGY];
    else if (isPartnerIotCategory(key)) row = PRODUCT_CATEGORY_LABEL[PARTNER_CATEGORY.IOT];
    else if (/บริการ|ติดตั้ง|service|install/i.test(key)) {
      row = PRODUCT_CATEGORY_LABEL[PARTNER_CATEGORY.SERVICE];
    } else if (/อื่น|other/i.test(key)) {
      row = PRODUCT_CATEGORY_LABEL[PARTNER_CATEGORY.OTHER];
    }
  }

  if (row) return pickLocaleRow(row, locale);

  const loc = normalizeCdLocale(locale);
  const extra = CD_EXTRA[key];
  if (extra?.[loc]) return extra[loc];
  if (loc === 'th') return key;

  return key;
}

/** Default partner catalog blurbs; product-specific text (brand · model) unchanged. */
export function cdCatalogDescription(locale, rawDescription) {
  const key = String(rawDescription || '').trim();
  if (!key || key === '-') return '-';

  const row = CATALOG_DESCRIPTION_I18N[key];
  if (row) return pickLocaleRow(row, locale);

  const extra = CD_EXTRA[key];
  if (extra) {
    const loc = normalizeCdLocale(locale);
    if (loc === 'th') return key;
    return extra[loc] || key;
  }

  return key;
}

export function readCdLocale() {
  if (typeof window === 'undefined') return 'th';
  try {
    const ge = localStorage.getItem(CD_LANG_KEY);
    const loc = localStorage.getItem('locale');
    const pick = ge || loc;
    if (pick && CD_VALID_LOCALES.includes(pick)) return pick;
    if (pick && ALIASES[pick]) return ALIASES[pick];
  } catch {
    /* ignore */
  }
  return 'th';
}
