export type ComparePageLocale = 'th' | 'en' | 'ko' | 'cn' | 'vn' | 'ms';

export type ComparePageStrings = {
  title: string;
  subtitle: string;
  back: string;
  refresh: string;
  site: string;
  seriesNo: string;
  allSites: string;
  allSeries: string;
  showingDevices: string;
  loading: string;
  errorPrefix: string;
  noReadings: string;
  noFilterMatch: string;
  beforeMeter: string;
  metricsMeter: string;
  online: string;
  offline: string;
  geId: string;
  seriesNoLabel: string;
  powerSavings: string;
  powerReduction: string;
  energySaved: string;
  powerTrend: string;
  waitingTh: string;
  waitingEn: string;
  parameter: string;
  before: string;
  current: string;
  savings: string;
  beforeChart: string;
  afterChart: string;
  currentA: string;
  failedLoad: string;
};

const en: ComparePageStrings = {
  title: 'Compare Monitoring — Power Savings Analysis',
  subtitle: 'Compare Power Before vs Current Metrics to analyze energy savings',
  back: 'Back',
  refresh: 'Refresh',
  site: 'Site',
  seriesNo: 'Series No',
  allSites: 'All Sites',
  allSeries: 'All Series',
  showingDevices: 'Showing {shown} of {total} devices',
  loading: 'Loading…',
  errorPrefix: 'Error',
  noReadings: 'No recent readings',
  noFilterMatch: 'No devices match the selected filters',
  beforeMeter: 'Before Meter',
  metricsMeter: 'Metrics Meter',
  online: 'ONLINE',
  offline: 'OFFLINE',
  geId: 'GE ID',
  seriesNoLabel: 'Series No.',
  powerSavings: 'Power Savings',
  powerReduction: 'Power Reduction',
  energySaved: 'Energy Saved',
  powerTrend: 'Power Trend (W) — Before vs After',
  waitingTh: 'รอแสดงข้อมูลเมื่อเชื่อมต่อ',
  waitingEn: 'Waiting for live data…',
  parameter: 'Parameter',
  before: 'Before',
  current: 'Current',
  savings: 'Savings',
  beforeChart: 'Before (W)',
  afterChart: 'After (W)',
  currentA: 'Current (A)',
  failedLoad: 'Failed to load',
};

const th: ComparePageStrings = {
  ...en,
  title: 'เปรียบเทียบการมอนิเตอร์ — วิเคราะห์การประหยัดพลังงาน',
  subtitle: 'เปรียบเทียบกำลังไฟก่อน vs หลังติดตั้ง GE เพื่อวิเคราะห์การประหยัด',
  back: 'กลับ',
  refresh: 'รีเฟรช',
  site: 'ไซต์',
  seriesNo: 'Series No',
  allSites: 'ทุกไซต์',
  allSeries: 'ทุก Series',
  showingDevices: 'แสดง {shown} จาก {total} อุปกรณ์',
  loading: 'กำลังโหลด…',
  errorPrefix: 'ข้อผิดพลาด',
  noReadings: 'ไม่มีข้อมูลล่าสุด',
  noFilterMatch: 'ไม่มีอุปกรณ์ตรงกับตัวกรอง',
  beforeMeter: 'มิเตอร์ก่อนติดตั้ง',
  metricsMeter: 'มิเตอร์หลังติดตั้ง',
  online: 'ออนไลน์',
  offline: 'ออฟไลน์',
  powerSavings: 'การประหยัดพลังงาน',
  powerReduction: 'ลดกำลังไฟ',
  energySaved: 'พลังงานที่ประหยัด',
  powerTrend: 'แนวโน้มกำลังไฟ (W) — ก่อน vs หลัง',
  parameter: 'พารามิเตอร์',
  before: 'ก่อน',
  current: 'ปัจจุบัน',
  savings: 'ประหยัด',
  beforeChart: 'ก่อน (W)',
  afterChart: 'หลัง (W)',
  currentA: 'กระแส (A)',
  failedLoad: 'โหลดไม่สำเร็จ',
};

const ko: ComparePageStrings = {
  ...en,
  title: '모니터링 비교 — 전력 절감 분석',
  subtitle: '설치 전후 전력을 비교하여 에너지 절감을 분석합니다',
  back: '뒤로',
  refresh: '새로고침',
  site: '사이트',
  allSites: '모든 사이트',
  allSeries: '모든 시리즈',
  showingDevices: '{total}개 중 {shown}개 표시',
  loading: '로딩 중…',
  noReadings: '최근 데이터 없음',
  noFilterMatch: '선택한 필터와 일치하는 장치 없음',
  beforeMeter: '설치 전 미터',
  metricsMeter: '설치 후 미터',
  online: '온라인',
  offline: '오프라인',
  powerSavings: '전력 절감',
  powerReduction: '전력 감소',
  energySaved: '절약 에너지',
  powerTrend: '전력 추세 (W) — 설치 전 vs 후',
  parameter: '파라미터',
  before: '설치 전',
  current: '현재',
  savings: '절감',
  beforeChart: '설치 전 (W)',
  afterChart: '설치 후 (W)',
  currentA: '전류 (A)',
  failedLoad: '로드 실패',
};

const cn: ComparePageStrings = {
  ...en,
  title: '对比监控 — 节能分析',
  subtitle: '对比安装前后功率以分析节能效果',
  back: '返回',
  refresh: '刷新',
  site: '站点',
  allSites: '所有站点',
  allSeries: '所有系列',
  showingDevices: '显示 {shown} / {total} 台设备',
  loading: '加载中…',
  noReadings: '无最近读数',
  noFilterMatch: '没有符合筛选条件的设备',
  beforeMeter: '安装前电表',
  metricsMeter: '安装后电表',
  online: '在线',
  offline: '离线',
  powerSavings: '节能',
  powerReduction: '功率降低',
  energySaved: '节约电能',
  powerTrend: '功率趋势 (W) — 安装前 vs 后',
  parameter: '参数',
  before: '安装前',
  current: '当前',
  savings: '节约',
  beforeChart: '安装前 (W)',
  afterChart: '安装后 (W)',
  currentA: '电流 (A)',
  failedLoad: '加载失败',
};

const vn: ComparePageStrings = {
  ...en,
  title: 'So sanh giam sat — Phan tich tiet kiem nang luong',
  subtitle: 'So sanh cong suat truoc va sau de phan tich tiet kiem',
  back: 'Quay lai',
  refresh: 'Lam moi',
  site: 'Trang',
  allSites: 'Tat ca trang',
  allSeries: 'Tat ca series',
  showingDevices: 'Hien thi {shown}/{total} thiet bi',
  loading: 'Dang tai…',
  noReadings: 'Khong co du lieu gan day',
  noFilterMatch: 'Khong co thiet bi phu hop bo loc',
  beforeMeter: 'Dong ho truoc',
  metricsMeter: 'Dong ho sau',
  online: 'TRUC TUYEN',
  offline: 'NGOAI TUYEN',
  powerSavings: 'Tiet kiem cong suat',
  powerReduction: 'Giam cong suat',
  energySaved: 'Nang luong tiet kiem',
  powerTrend: 'Xu huong cong suat (W) — Truoc vs Sau',
  parameter: 'Tham so',
  before: 'Truoc',
  current: 'Hien tai',
  savings: 'Tiet kiem',
  beforeChart: 'Truoc (W)',
  afterChart: 'Sau (W)',
  currentA: 'Dong dien (A)',
  failedLoad: 'Tai that bai',
};

const ms: ComparePageStrings = {
  ...en,
  title: 'Banding Pemantauan — Analisis Penjimatan Kuasa',
  subtitle: 'Bandingkan kuasa sebelum vs selepas untuk analisis penjimatan',
  back: 'Kembali',
  refresh: 'Muat semula',
  site: 'Tapak',
  allSites: 'Semua Tapak',
  allSeries: 'Semua Siri',
  showingDevices: 'Menunjukkan {shown} daripada {total} peranti',
  loading: 'Memuatkan…',
  noReadings: 'Tiada bacaan terkini',
  noFilterMatch: 'Tiada peranti sepadan penapis',
  beforeMeter: 'Meter Sebelum',
  metricsMeter: 'Meter Selepas',
  online: 'DALAM TALIAN',
  offline: 'LUAR TALIAN',
  powerSavings: 'Penjimatan Kuasa',
  powerReduction: 'Pengurangan Kuasa',
  energySaved: 'Tenaga Dijimatkan',
  powerTrend: 'Trend Kuasa (W) — Sebelum vs Selepas',
  parameter: 'Parameter',
  before: 'Sebelum',
  current: 'Semasa',
  savings: 'Penjimatan',
  beforeChart: 'Sebelum (W)',
  afterChart: 'Selepas (W)',
  currentA: 'Arus (A)',
  failedLoad: 'Gagal memuatkan',
};

const PACKS: Record<ComparePageLocale, ComparePageStrings> = { th, en, ko, cn, vn, ms };

export function normalizeCompareLocale(locale: string): ComparePageLocale {
  const key = String(locale || 'en').toLowerCase();
  if (key.startsWith('th')) return 'th';
  if (key.startsWith('ko')) return 'ko';
  if (key.startsWith('cn') || key.startsWith('zh')) return 'cn';
  if (key.startsWith('vn') || key.startsWith('vi')) return 'vn';
  if (key.startsWith('ms')) return 'ms';
  return 'en';
}

export function getComparePageT(locale: string): ComparePageStrings {
  return PACKS[normalizeCompareLocale(locale)] ?? en;
}

export function formatCompareDevices(template: string, shown: number, total: number): string {
  return template.replace('{shown}', String(shown)).replace('{total}', String(total));
}
