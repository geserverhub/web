export type EqLocale = 'th' | 'ko' | 'en' | 'cn' | 'vn' | 'ms';
export type EqUiLocale = EqLocale;

export const EQ_PRINT_LOCALES: EqLocale[] = ['th', 'ko', 'en', 'cn', 'vn', 'ms'];

export const EQ_PRINT_LOCALE_LABELS: Record<EqLocale, string> = {
  th: 'ไทย',
  ko: '한국어',
  en: 'English',
  cn: '中文',
  vn: 'Tiếng Việt',
  ms: 'Bahasa Melayu',
};

export type EqPrintLangMeta = {
  label: string;
  flag: string;
  code: string;
};

/** UI metadata for report language picker */
export const EQ_PRINT_LANG_META: Record<EqLocale, EqPrintLangMeta> = {
  th: { label: 'ไทย', flag: '🇹🇭', code: 'TH' },
  ko: { label: '한국어', flag: '🇰🇷', code: 'KO' },
  en: { label: 'English', flag: '🇺🇸', code: 'EN' },
  cn: { label: '中文', flag: '🇨🇳', code: 'ZH' },
  vn: { label: 'Tiếng Việt', flag: '🇻🇳', code: 'VI' },
  ms: { label: 'Bahasa Melayu', flag: '🇲🇾', code: 'MS' },
};

type EqStrings = {
  pageTitle: string;
  pageSubtitle: string;
  tagline: string;
  location: string;
  allLocations: string;
  selectMeter: string;
  noMeters: string;
  live: string;
  offline: string;
  lastUpdate: string;
  recordingPeriod: string;
  refresh: string;
  loading: string;
  noMeter: string;
  chartTitle: string;
  noChart: string;
  l1: string;
  l2: string;
  l3: string;
  avg: string;
  totalPhase: string;
  beforeCurrent: string;
  afterCurrent: string;
  thd: string;
  powerFactor: string;
  frequency: string;
  errorLoad: string;
  openReport: string;
  reportTitle: string;
  reportSubtitle: string;
  printReport: string;
  printLang: string;
  printLangHint: string;
  device: string;
  meterId: string;
  reportGenerated: string;
  reportId: string;
  summary: string;
  realtimeNote: string;
  signature: string;
  preparedBy: string;
  date: string;
  customerInfo: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  noCustomerSelected: string;
  selectMeterHint: string;
  addMeter: string;
  ownerEmail: string;
  connection: string;
  online: string;
  deviceOffline: string;
  waitingForMeter: string;
  waitingForData: string;
  meterModel: string;
  voltage: string;
  current: string;
  activePower: string;
  reactivePower: string;
  apparentPower: string;
  energyKwh: string;
  powerMetrics: string;
  statusPanelTitle: string;
  meterStatusTitle: string;
  currentStatusTitle: string;
  ch1StatusTitle: string;
  ch2StatusTitle: string;
  statusNormal: string;
  statusWaiting: string;
  statusOffline: string;
  statusNoData: string;
  statusPhases: string;
  reportPageBadge: string;
  dbMigrationHint: string;
};

const th: EqStrings = {
  pageTitle: 'เพิ่มมิเตอร์เพื่อเก็บค่า',
  pageSubtitle: 'เลือกมิเตอร์ที่ติดตั้งในระบบและดูค่ากระแสไฟแบบเรียลไทม์',
  tagline: 'การวิเคราะห์คุณภาพพลังงาน ก่อนการติดตั้ง',
  location: 'โลเคชั่น',
  allLocations: 'ทุกโลเคชั่น',
  selectMeter: 'เลือกมิเตอร์ในระบบ',
  noMeters: 'ไม่พบมิเตอร์ในพื้นที่นี้',
  live: 'สด',
  offline: 'ออฟไลน์',
  lastUpdate: 'อัปเดตล่าสุด',
  recordingPeriod: 'ช่วงเวลาบันทึก',
  refresh: 'รีเฟรช',
  loading: 'กำลังโหลด…',
  noMeter: 'กรุณาเลือกมิเตอร์เพื่อดูค่ากระแสไฟ',
  chartTitle: 'กราฟกระแส 30 นาทีล่าสุด',
  noChart: 'ยังไม่มีข้อมูลกราฟ',
  l1: 'เฟส L1',
  l2: 'เฟส L2',
  l3: 'เฟส L3',
  avg: 'เฉลี่ย 3 เฟส',
  totalPhase: 'รวม 3 เฟส',
  beforeCurrent: 'กระแสก่อนติดตั้ง (CH1)',
  afterCurrent: 'กระแสหลังติดตั้ง (CH2)',
  thd: 'THD',
  powerFactor: 'Power Factor',
  frequency: 'ความถี่',
  errorLoad: 'โหลดข้อมูลไม่สำเร็จ',
  openReport: 'รายงานการวิเคราะห์กระแสไฟ',
  reportTitle: 'รายงานการวิเคราะห์กระแสไฟ',
  reportSubtitle: 'รายงานคุณภาพพลังงานแบบเรียลไทม์จากมิเตอร์ที่เลือก',
  printReport: 'พิมพ์รายงาน',
  printLang: 'ภาษารายงาน',
  printLangHint: 'เลือกภาษาสำหรับเอกสารที่พิมพ์',
  device: 'อุปกรณ์',
  meterId: 'รหัสมิเตอร์',
  reportGenerated: 'วันที่จัดทำรายงาน',
  reportId: 'เลขที่รายงาน',
  summary: 'สรุปค่ากระแสไฟ',
  realtimeNote: 'ข้อมูลอ้างอิงจากการวัดแบบเรียลไทม์ผ่านระบบ GE IoT',
  signature: 'ลายมือชื่อผู้จัดทำ',
  preparedBy: 'ผู้จัดทำรายงาน',
  date: 'วันที่',
  customerInfo: 'ข้อมูลลูกค้า',
  customerName: 'ชื่อลูกค้า',
  customerPhone: 'เบอร์โทร',
  customerAddress: 'ที่อยู่',
  noCustomerSelected: 'เลือกมิเตอร์เพื่อดูข้อมูลลูกค้า',
  selectMeterHint: 'มิเตอร์ที่เลือกจะแสดงลูกค้าที่ผูกไว้',
  addMeter: 'เพิ่มมิเตอร์',
  ownerEmail: 'อีเมลเจ้าของ',
  connection: 'สถานะ',
  online: 'ออนไลน์',
  deviceOffline: 'ออฟไลน์',
  waitingForMeter: 'เลือกมิเตอร์ด้านบน — ระบบพร้อมรับค่าเรียลไทม์',
  waitingForData: 'รอรับค่าจากมิเตอร์…',
  meterModel: 'มิเตอร์ EM4374',
  voltage: 'แรงดันไฟฟ้า',
  current: 'กระแสไฟฟ้า',
  activePower: 'กำลังไฟฟ้าจริง (P)',
  reactivePower: 'กำลังรีแอกทีฟ (Q)',
  apparentPower: 'กำลังปรากฏ (S)',
  energyKwh: 'พลังงานสะสม (kWh)',
  powerMetrics: 'กำลังไฟฟ้า · THD · ความถี่ · พลังงาน',
  statusPanelTitle: 'สถานะการทำงาน',
  meterStatusTitle: 'สถานะมิเตอร์',
  currentStatusTitle: 'สถานะกระแสไฟ',
  ch1StatusTitle: 'กระแส CH1',
  ch2StatusTitle: 'กระแส CH2',
  statusNormal: 'ทำงานปกติ',
  statusWaiting: 'รอรับค่า',
  statusOffline: 'ออฟไลน์',
  statusNoData: 'ยังไม่มีข้อมูล',
  statusPhases: 'เฟสที่มีสัญญาณ',
  reportPageBadge: '14 หมวด · สถานะ Good / Warning / Critical · สารบัญรายงานด้านล่าง',
  dbMigrationHint:
    'ฐานข้อมูลรายงานยังไม่พร้อม — รัน npm run db:migrate-energy-quality-report',
};

const ko: EqStrings = {
  pageTitle: '측정 미터 추가',
  pageSubtitle: '설치된 미터를 선택하고 실시간 전류를 확인합니다',
  tagline: '설치 전 전력 품질 분석',
  location: '위치',
  allLocations: '전체 위치',
  selectMeter: '시스템 미터 선택',
  noMeters: '이 위치에 미터가 없습니다',
  live: '실시간',
  offline: '오프라인',
  lastUpdate: '마지막 업데이트',
  recordingPeriod: '기록 기간',
  refresh: '새로고침',
  loading: '로딩 중…',
  noMeter: '미터를 선택하면 전류를 볼 수 있습니다',
  chartTitle: '최근 30분 전류 추이',
  noChart: '차트 데이터 없음',
  l1: 'L1 상',
  l2: 'L2 상',
  l3: 'L3 상',
  avg: '3상 평균',
  totalPhase: '3상 합계',
  beforeCurrent: '설치 전 전류 (CH1)',
  afterCurrent: '설치 후 전류 (CH2)',
  thd: 'THD',
  powerFactor: '역률',
  frequency: '주파수',
  errorLoad: '데이터 로드 실패',
  openReport: '전류 분석 보고서',
  reportTitle: '전류 분석 보고서',
  reportSubtitle: '선택한 미터의 실시간 전력 품질 보고서',
  printReport: '보고서 인쇄',
  printLang: '보고서 언어',
  printLangHint: '인쇄 문서에 사용할 언어를 선택하세요',
  device: '장치',
  meterId: '미터 ID',
  reportGenerated: '보고서 작성일',
  reportId: '보고서 번호',
  summary: '전류 요약',
  realtimeNote: 'GE IoT 시스템의 실시간 측정 데이터를 기반으로 합니다',
  signature: '작성자 서명',
  preparedBy: '보고서 작성자',
  date: '날짜',
  customerInfo: '고객 정보',
  customerName: '고객명',
  customerPhone: '전화번호',
  customerAddress: '주소',
  noCustomerSelected: '미터를 선택하면 고객 정보가 표시됩니다',
  selectMeterHint: '선택한 미터에 연결된 고객',
  addMeter: '미터 추가',
  ownerEmail: '소유자 이메일',
  connection: '상태',
  online: '온라인',
  deviceOffline: '오프라인',
  waitingForMeter: '위에서 미터를 선택하세요 — 실시간 수신 대기 중',
  waitingForData: '전류 값 수신 대기 중…',
  meterModel: 'EM4374 미터',
  voltage: '전압',
  current: '전류',
  activePower: '유효 전력 (P)',
  reactivePower: '무효 전력 (Q)',
  apparentPower: '피상 전력 (S)',
  energyKwh: '적산 전력 (kWh)',
  powerMetrics: '전력 · THD · 주파수 · 적산',
  statusPanelTitle: '운전 상태',
  meterStatusTitle: '미터 상태',
  currentStatusTitle: '전류 상태',
  ch1StatusTitle: 'CH1 전류',
  ch2StatusTitle: 'CH2 전류',
  statusNormal: '정상',
  statusWaiting: '수신 대기',
  statusOffline: '오프라인',
  statusNoData: '데이터 없음',
  statusPhases: '신호 있는 상',
  reportPageBadge: '14개 섹션 · Good / Warning / Critical 상태 · 아래 목차',
  dbMigrationHint:
    '리포트 DB가 준비되지 않음 — npm run db:migrate-energy-quality-report 실행',
};

const en: EqStrings = {
  pageTitle: 'Add Meters for Monitoring',
  pageSubtitle: 'Select installed meters and view live current readings',
  tagline: 'Energy Quality Analysis Before Installation',
  location: 'Location',
  allLocations: 'All locations',
  selectMeter: 'Select system meter',
  noMeters: 'No meters in this location',
  live: 'LIVE',
  offline: 'Offline',
  lastUpdate: 'Last update',
  recordingPeriod: 'Recording period',
  refresh: 'Refresh',
  loading: 'Loading…',
  noMeter: 'Select a meter to view live current',
  chartTitle: 'Current trend (last 30 min)',
  noChart: 'No chart data yet',
  l1: 'Phase L1',
  l2: 'Phase L2',
  l3: 'Phase L3',
  avg: '3-phase average',
  totalPhase: '3-phase total',
  beforeCurrent: 'Before install current (CH1)',
  afterCurrent: 'After install current (CH2)',
  thd: 'THD',
  powerFactor: 'Power Factor',
  frequency: 'Frequency',
  errorLoad: 'Failed to load data',
  openReport: 'Current Analysis Report',
  reportTitle: 'Current Analysis Report',
  reportSubtitle: 'Real-time energy quality report for the selected meter',
  printReport: 'Print report',
  printLang: 'Report language',
  printLangHint: 'Choose the language for the printed report',
  device: 'Device',
  meterId: 'Meter ID',
  reportGenerated: 'Report date',
  reportId: 'Report ID',
  summary: 'Current summary',
  realtimeNote: 'Data sourced from real-time GE IoT metering',
  signature: 'Authorized signature',
  preparedBy: 'Prepared by',
  date: 'Date',
  customerInfo: 'Customer information',
  customerName: 'Customer name',
  customerPhone: 'Phone',
  customerAddress: 'Address',
  noCustomerSelected: 'Select a meter to view linked customer',
  selectMeterHint: 'Customer bound to selected meter',
  addMeter: 'Add meter',
  ownerEmail: 'Owner email',
  connection: 'Status',
  online: 'Online',
  deviceOffline: 'Offline',
  waitingForMeter: 'Select a meter above — ready to receive live data',
  waitingForData: 'Waiting for meter readings…',
  meterModel: 'EM4374 Meter',
  voltage: 'Voltage',
  current: 'Current',
  activePower: 'Active Power (P)',
  reactivePower: 'Reactive Power (Q)',
  apparentPower: 'Apparent Power (S)',
  energyKwh: 'Energy (kWh)',
  powerMetrics: 'Power · THD · Frequency · Energy',
  statusPanelTitle: 'Operation status',
  meterStatusTitle: 'Meter status',
  currentStatusTitle: 'Current status',
  ch1StatusTitle: 'CH1 current',
  ch2StatusTitle: 'CH2 current',
  statusNormal: 'Normal',
  statusWaiting: 'Waiting',
  statusOffline: 'Offline',
  statusNoData: 'No data',
  statusPhases: 'Active phases',
  reportPageBadge: '14 sections · Good / Warning / Critical status · table of contents below',
  dbMigrationHint:
    'Report database not ready — run npm run db:migrate-energy-quality-report',
};

const cn: EqStrings = {
  pageTitle: '添加电表采集',
  pageSubtitle: '选择已安装电表并查看实时电流',
  tagline: '安装前电能质量分析',
  location: '位置',
  allLocations: '全部位置',
  selectMeter: '选择系统电表',
  noMeters: '此位置无电表',
  live: '实时',
  offline: '离线',
  lastUpdate: '最后更新',
  recordingPeriod: '记录时段',
  refresh: '刷新',
  loading: '加载中…',
  noMeter: '请选择电表查看实时电流',
  chartTitle: '最近30分钟电流趋势',
  noChart: '暂无图表数据',
  l1: 'L1相',
  l2: 'L2相',
  l3: 'L3相',
  avg: '三相平均',
  totalPhase: '三相合计',
  beforeCurrent: '安装前电流 (CH1)',
  afterCurrent: '安装后电流 (CH2)',
  thd: 'THD',
  powerFactor: '功率因数',
  frequency: '频率',
  errorLoad: '加载数据失败',
  openReport: '电流分析报告',
  reportTitle: '电流分析报告',
  reportSubtitle: '所选电表的实时电能质量报告',
  printReport: '打印报告',
  printLang: '报告语言',
  printLangHint: '选择打印报告使用的语言',
  device: '设备',
  meterId: '电表编号',
  reportGenerated: '报告日期',
  reportId: '报告编号',
  summary: '电流摘要',
  realtimeNote: '数据来自GE IoT实时计量系统',
  signature: '授权签名',
  preparedBy: '报告编制人',
  date: '日期',
  customerInfo: '客户信息',
  customerName: '客户姓名',
  customerPhone: '电话',
  customerAddress: '地址',
  noCustomerSelected: '选择电表查看关联客户',
  selectMeterHint: '所选电表绑定的客户',
  addMeter: '添加电表',
  ownerEmail: '所有者邮箱',
  connection: '状态',
  online: '在线',
  deviceOffline: '离线',
  waitingForMeter: '请在上方选择电表 — 系统就绪等待实时数据',
  waitingForData: '等待接收电表读数…',
  meterModel: 'EM4374 电表',
  voltage: '电压',
  current: '电流',
  activePower: '有功功率 (P)',
  reactivePower: '无功功率 (Q)',
  apparentPower: '视在功率 (S)',
  energyKwh: '累计电能 (kWh)',
  powerMetrics: '功率 · THD · 频率 · 电能',
  statusPanelTitle: '运行状态',
  meterStatusTitle: '电表状态',
  currentStatusTitle: '电流状态',
  ch1StatusTitle: 'CH1 电流',
  ch2StatusTitle: 'CH2 电流',
  statusNormal: '正常运行',
  statusWaiting: '等待数据',
  statusOffline: '离线',
  statusNoData: '暂无数据',
  statusPhases: '有信号相',
  reportPageBadge: '14 节 · Good / Warning / Critical 状态 · 下方目录',
  dbMigrationHint:
    '报告数据库未就绪 — 运行 npm run db:migrate-energy-quality-report',
};

const vn: EqStrings = {
  pageTitle: 'Thêm đồng hồ thu thập',
  pageSubtitle: 'Chọn đồng hồ đã lắp đặt và xem dòng điện thời gian thực',
  tagline: 'Phân tích chất lượng năng lượng trước lắp đặt',
  location: 'Vị trí',
  allLocations: 'Tất cả vị trí',
  selectMeter: 'Chọn đồng hồ trong hệ thống',
  noMeters: 'Không có đồng hồ tại vị trí này',
  live: 'Trực tiếp',
  offline: 'Ngoại tuyến',
  lastUpdate: 'Cập nhật lần cuối',
  recordingPeriod: 'Khoảng thời gian ghi',
  refresh: 'Làm mới',
  loading: 'Đang tải…',
  noMeter: 'Chọn đồng hồ để xem dòng điện',
  chartTitle: 'Xu hướng dòng điện 30 phút gần nhất',
  noChart: 'Chưa có dữ liệu biểu đồ',
  l1: 'Pha L1',
  l2: 'Pha L2',
  l3: 'Pha L3',
  avg: 'Trung bình 3 pha',
  totalPhase: 'Tổng 3 pha',
  beforeCurrent: 'Dòng trước lắp đặt (CH1)',
  afterCurrent: 'Dòng sau lắp đặt (CH2)',
  thd: 'THD',
  powerFactor: 'Hệ số công suất',
  frequency: 'Tần số',
  errorLoad: 'Tải dữ liệu thất bại',
  openReport: 'Báo cáo phân tích dòng điện',
  reportTitle: 'Báo cáo phân tích dòng điện',
  reportSubtitle: 'Báo cáo chất lượng năng lượng thời gian thực cho đồng hồ đã chọn',
  printReport: 'In báo cáo',
  printLang: 'Ngôn ngữ báo cáo',
  printLangHint: 'Chọn ngôn ngữ cho báo cáo in',
  device: 'Thiết bị',
  meterId: 'Mã đồng hồ',
  reportGenerated: 'Ngày lập báo cáo',
  reportId: 'Mã báo cáo',
  summary: 'Tóm tắt dòng điện',
  realtimeNote: 'Dữ liệu từ hệ thống đo GE IoT thời gian thực',
  signature: 'Chữ ký người lập',
  preparedBy: 'Người lập báo cáo',
  date: 'Ngày',
  customerInfo: 'Thông tin khách hàng',
  customerName: 'Tên khách hàng',
  customerPhone: 'Điện thoại',
  customerAddress: 'Địa chỉ',
  noCustomerSelected: 'Chọn đồng hồ để xem khách hàng liên kết',
  selectMeterHint: 'Khách hàng gắn với đồng hồ đã chọn',
  addMeter: 'Thêm đồng hồ',
  ownerEmail: 'Email chủ sở hữu',
  connection: 'Trạng thái',
  online: 'Trực tuyến',
  deviceOffline: 'Ngoại tuyến',
  waitingForMeter: 'Chọn đồng hồ phía trên — sẵn sàng nhận dữ liệu trực tiếp',
  waitingForData: 'Đang chờ dữ liệu từ công tơ…',
  meterModel: 'Công tơ EM4374',
  voltage: 'Điện áp',
  current: 'Dòng điện',
  activePower: 'Công suất tác dụng (P)',
  reactivePower: 'Công suất phản kháng (Q)',
  apparentPower: 'Công suất biểu kiến (S)',
  energyKwh: 'Điện năng (kWh)',
  powerMetrics: 'Công suất · THD · Tần số · Điện năng',
  statusPanelTitle: 'Trạng thái vận hành',
  meterStatusTitle: 'Trạng thái công tơ',
  currentStatusTitle: 'Trạng thái dòng điện',
  ch1StatusTitle: 'Dòng CH1',
  ch2StatusTitle: 'Dòng CH2',
  statusNormal: 'Bình thường',
  statusWaiting: 'Đang chờ',
  statusOffline: 'Ngoại tuyến',
  statusNoData: 'Chưa có dữ liệu',
  statusPhases: 'Pha có tín hiệu',
  reportPageBadge: '14 mục · trạng thái Good / Warning / Critical · mục lục bên dưới',
  dbMigrationHint:
    'CSDL báo cáo chưa sẵn sàng — chạy npm run db:migrate-energy-quality-report',
};

const ms: EqStrings = {
  pageTitle: 'Tambah Meter untuk Pemantauan',
  pageSubtitle: 'Pilih meter terpasang dan lihat arus masa nyata',
  tagline: 'Analisis Kualiti Tenaga Sebelum Pemasangan',
  location: 'Lokasi',
  allLocations: 'Semua lokasi',
  selectMeter: 'Pilih meter sistem',
  noMeters: 'Tiada meter di lokasi ini',
  live: 'Langsung',
  offline: 'Luar talian',
  lastUpdate: 'Kemas kini terakhir',
  recordingPeriod: 'Tempoh rakaman',
  refresh: 'Muat semula',
  loading: 'Memuatkan…',
  noMeter: 'Pilih meter untuk lihat arus langsung',
  chartTitle: 'Trend arus 30 minit terakhir',
  noChart: 'Tiada data carta',
  l1: 'Fasa L1',
  l2: 'Fasa L2',
  l3: 'Fasa L3',
  avg: 'Purata 3 fasa',
  totalPhase: 'Jumlah 3 fasa',
  beforeCurrent: 'Arus sebelum pasang (CH1)',
  afterCurrent: 'Arus selepas pasang (CH2)',
  thd: 'THD',
  powerFactor: 'Faktor Kuasa',
  frequency: 'Frekuensi',
  errorLoad: 'Gagal memuatkan data',
  openReport: 'Laporan Analisis Arus',
  reportTitle: 'Laporan Analisis Arus',
  reportSubtitle: 'Laporan kualiti tenaga masa nyata untuk meter terpilih',
  printReport: 'Cetak laporan',
  printLang: 'Bahasa laporan',
  printLangHint: 'Pilih bahasa untuk laporan cetak',
  device: 'Peranti',
  meterId: 'ID Meter',
  reportGenerated: 'Tarikh laporan',
  reportId: 'ID Laporan',
  summary: 'Ringkasan arus',
  realtimeNote: 'Data daripada pengukuran GE IoT masa nyata',
  signature: 'Tandatangan',
  preparedBy: 'Disediakan oleh',
  date: 'Tarikh',
  customerInfo: 'Maklumat pelanggan',
  customerName: 'Nama pelanggan',
  customerPhone: 'Telefon',
  customerAddress: 'Alamat',
  noCustomerSelected: 'Pilih meter untuk lihat pelanggan berkaitan',
  selectMeterHint: 'Pelanggan yang diikat pada meter terpilih',
  addMeter: 'Tambah meter',
  ownerEmail: 'E-mel pemilik',
  connection: 'Status',
  online: 'Dalam talian',
  deviceOffline: 'Luar talian',
  waitingForMeter: 'Pilih meter di atas — sedia terima data langsung',
  waitingForData: 'Menunggu bacaan meter…',
  meterModel: 'Meter EM4374',
  voltage: 'Voltan',
  current: 'Arus',
  activePower: 'Kuasa Aktif (P)',
  reactivePower: 'Kuasa Reaktif (Q)',
  apparentPower: 'Kuasa Ketara (S)',
  energyKwh: 'Tenaga (kWh)',
  powerMetrics: 'Kuasa · THD · Frekuensi · Tenaga',
  statusPanelTitle: 'Status operasi',
  meterStatusTitle: 'Status meter',
  currentStatusTitle: 'Status arus',
  ch1StatusTitle: 'Arus CH1',
  ch2StatusTitle: 'Arus CH2',
  statusNormal: 'Normal',
  statusWaiting: 'Menunggu',
  statusOffline: 'Luar talian',
  statusNoData: 'Tiada data',
  statusPhases: 'Fasa aktif',
  reportPageBadge: '14 bahagian · status Good / Warning / Critical · kandungan di bawah',
  dbMigrationHint:
    'Pangkalan data laporan belum sedia — jalankan npm run db:migrate-energy-quality-report',
};

const catalog: Record<EqLocale, EqStrings> = { th, ko, en, cn, vn, ms };

export function eqT(locale: string): EqStrings {
  const key = (['th', 'ko', 'en', 'cn', 'vn', 'ms'].includes(locale) ? locale : 'en') as EqLocale;
  return catalog[key];
}

export function formatEqDateTime(
  value: string | number | Date | null | undefined,
  locale: EqLocale,
): string {
  if (value == null || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(eqDateLocale(locale), { timeZone: 'Asia/Bangkok' });
}

const HISTORY_PERIOD_HOURS: Record<EqLocale, (h: number) => string> = {
  th: (h) => `${h} ชั่วโมง`,
  ko: (h) => `${h}시간`,
  en: (h) => `${h} hours`,
  cn: (h) => `${h} 小时`,
  vn: (h) => `${h} giờ`,
  ms: (h) => `${h} jam`,
};

export function formatHistoryPeriodHours(hours: number, locale: EqLocale): string {
  const fn = HISTORY_PERIOD_HOURS[locale] ?? HISTORY_PERIOD_HOURS.en;
  return fn(hours);
}

export function eqDateLocale(locale: EqLocale): string {
  const map: Record<EqLocale, string> = {
    th: 'th-TH',
    ko: 'ko-KR',
    en: 'en-US',
    cn: 'zh-CN',
    vn: 'vi-VN',
    ms: 'ms-MY',
  };
  return map[locale];
}

export function eqHtmlLang(locale: EqLocale): string {
  const map: Record<EqLocale, string> = {
    th: 'th',
    ko: 'ko',
    en: 'en',
    cn: 'zh-CN',
    vn: 'vi',
    ms: 'ms',
  };
  return map[locale];
}

export function fmtA(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(digits, 2),
  });
}
