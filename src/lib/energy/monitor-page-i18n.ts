export type MonitorPageLocale = 'th' | 'en' | 'ko' | 'cn' | 'vn' | 'ms';

export type MonitorPageStrings = {
  realTimeMeasurements: string;
  live: string;
  loading: string;
  selectCustomer: string;
  selectDevice: string;
  noLocation: string;
  noDeviceSelected: string;
  noDeviceSelectedHint: string;
  loadingMonitoring: string;
  deviceCount: string;
  devicesCount: string;
  voltageLineToLine: string;
  current: string;
  power: string;
  totalPower: string;
  reactivePower: string;
  apparentPower: string;
  frequency: string;
  powerFactor: string;
  energy: string;
  thd: string;
  thdBefore: string;
  thdAfter: string;
  ch1Input: string;
  ch2Output: string;
  meterBefore: string;
  meterAfter: string;
  beforeGeInstall: string;
  afterGeInstall: string;
  energyAndSavings: string;
  ch1EnergyBefore: string;
  ch2EnergyAfter: string;
  energySaved: string;
  co2Saved: string;
  thdReduction: string;
  trendChart: string;
  showLimits: string;
  plot: string;
  export: string;
  loadingChart: string;
  noDataDateRange: string;
  changeDatePlot: string;
  noDataSelectedDate: string;
  energyTrendKwh: string;
  energyUsage: string;
  offPeak: string;
  onPeak: string;
  energyCost: string;
  energyHistoricalKwh: string;
  eventViewer: string;
  show: string;
  entries: string;
  allTypes: string;
  search: string;
  colDate: string;
  colData: string;
  colType: string;
  colMessage: string;
  colStatus: string;
  colActions: string;
  noTableData: string;
  showingEntries: string;
  phase1: string;
  phase2: string;
  phase3: string;
  minute: string;
  hour: string;
  day: string;
  voltageL1: string;
  voltageL2: string;
  voltageL3: string;
  currentL1: string;
  currentL2: string;
  currentL3: string;
  activePowerKw: string;
  reactivePowerKvar: string;
  apparentPowerKva: string;
  frequencyHz: string;
  energyKwh: string;
  energySavedKwh: string;
  thdBeforePct: string;
  thdAfterPct: string;
  zoomIn: string;
  zoomOut: string;
  pan: string;
  reset: string;
  upperLimit: string;
  lowerLimit: string;
  alert: string;
  warning: string;
  info: string;
  failedLoad: string;
  networkError: string;
  energyAxisKwH: string;
};

const en: MonitorPageStrings = {
  realTimeMeasurements: 'Real-time electrical measurements',
  live: 'Live',
  loading: 'Loading…',
  selectCustomer: 'Select Customer',
  selectDevice: 'Select Device',
  noLocation: 'No location',
  noDeviceSelected: 'No device selected',
  noDeviceSelectedHint: 'Choose a device from the dropdown above to view live data',
  loadingMonitoring: 'Loading monitoring data…',
  deviceCount: 'device',
  devicesCount: 'devices',
  voltageLineToLine: 'Voltage (Line-to-Line)',
  current: 'Current',
  power: 'Power',
  totalPower: 'Total Power',
  reactivePower: 'Reactive Power',
  apparentPower: 'Apparent Power',
  frequency: 'Frequency',
  powerFactor: 'Power Factor',
  energy: 'Energy',
  thd: 'Total Harmonic Distortion (THD)',
  thdBefore: 'THD Before',
  thdAfter: 'THD After',
  ch1Input: 'CH1 · INPUT',
  ch2Output: 'CH2 · OUTPUT',
  meterBefore: 'Meter Before',
  meterAfter: 'Meter After',
  beforeGeInstall: 'Before GE Installation',
  afterGeInstall: 'After GE Installation',
  energyAndSavings: 'Energy & Savings',
  ch1EnergyBefore: 'CH1 Energy (Before)',
  ch2EnergyAfter: 'CH2 Energy (After)',
  energySaved: 'Energy Saved',
  co2Saved: 'CO₂ Saved',
  thdReduction: 'THD Reduction',
  trendChart: 'Trend Chart',
  showLimits: 'Show Limits',
  plot: 'Plot',
  export: 'Export',
  loadingChart: 'Loading chart data…',
  noDataDateRange: 'No data in the selected date range',
  changeDatePlot: 'Try changing the date range and click Plot',
  noDataSelectedDate: 'No data for the selected date',
  energyTrendKwh: 'Energy Trend (KWH)',
  energyUsage: 'Energy Usage',
  offPeak: 'OFF PEAK',
  onPeak: 'ON PEAK',
  energyCost: 'Energy Cost',
  energyHistoricalKwh: 'ENERGY HISTORICAL (KWH)',
  eventViewer: 'EVENT VIEWER',
  show: 'Show',
  entries: 'entries',
  allTypes: 'All Types',
  search: 'Search…',
  colDate: 'Date',
  colData: 'Data',
  colType: 'Type',
  colMessage: 'Message',
  colStatus: 'Status',
  colActions: 'Actions',
  noTableData: 'No data available in table',
  showingEntries: 'Showing 0 to 0 of 0 entries',
  phase1: 'Phase 1',
  phase2: 'Phase 2',
  phase3: 'Phase 3',
  minute: 'minute',
  hour: 'hour',
  day: 'day',
  voltageL1: 'Voltage LN1 (V)',
  voltageL2: 'Voltage LN2 (V)',
  voltageL3: 'Voltage LN3 (V)',
  currentL1: 'Current L1 (A)',
  currentL2: 'Current L2 (A)',
  currentL3: 'Current L3 (A)',
  activePowerKw: 'Active Power (kW)',
  reactivePowerKvar: 'Reactive Power (kVAr)',
  apparentPowerKva: 'Apparent Power (kVA)',
  frequencyHz: 'Frequency (Hz)',
  energyKwh: 'Energy (kWh)',
  energySavedKwh: 'Energy Saved (kWh)',
  thdBeforePct: 'THD Before (%)',
  thdAfterPct: 'THD After (%)',
  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  pan: 'Pan',
  reset: 'Reset',
  upperLimit: 'Upper (240V)',
  lowerLimit: 'Lower (210V)',
  alert: 'Alert',
  warning: 'Warning',
  info: 'Info',
  failedLoad: 'Failed to load monitoring data',
  networkError: 'Network error',
  energyAxisKwH: 'Energy (kWh)',
};

const th: MonitorPageStrings = {
  ...en,
  realTimeMeasurements: 'การวัดไฟฟ้าแบบเรียลไทม์',
  live: 'สด',
  loading: 'กำลังโหลด…',
  selectCustomer: 'เลือกลูกค้า',
  selectDevice: 'เลือกอุปกรณ์',
  noLocation: 'ไม่ระบุสถานที่',
  noDeviceSelected: 'ยังไม่ได้เลือกอุปกรณ์',
  noDeviceSelectedHint: 'เลือกอุปกรณ์จากรายการด้านบนเพื่อดูข้อมูลสด',
  loadingMonitoring: 'กำลังโหลดข้อมูลมอนิเตอร์…',
  deviceCount: 'เครื่อง',
  devicesCount: 'เครื่อง',
  voltageLineToLine: 'แรงดัน (สาย-สาย)',
  current: 'กระแส',
  power: 'กำลังไฟ',
  totalPower: 'กำลังไฟรวม',
  reactivePower: 'กำลังไฟรีแอคทีฟ',
  apparentPower: 'กำลังไฟที่แสดง',
  frequency: 'ความถี่',
  powerFactor: 'Power Factor',
  energy: 'พลังงาน',
  thd: 'Total Harmonic Distortion (THD)',
  thdBefore: 'THD ก่อนติดตั้ง',
  thdAfter: 'THD หลังติดตั้ง',
  ch1Input: 'CH1 · INPUT',
  ch2Output: 'CH2 · OUTPUT',
  meterBefore: 'มิเตอร์ก่อนติดตั้ง',
  meterAfter: 'มิเตอร์หลังติดตั้ง',
  beforeGeInstall: 'ก่อนติดตั้ง GE',
  afterGeInstall: 'หลังติดตั้ง GE',
  energyAndSavings: 'พลังงานและการประหยัด',
  ch1EnergyBefore: 'พลังงาน CH1 (ก่อน)',
  ch2EnergyAfter: 'พลังงาน CH2 (หลัง)',
  energySaved: 'พลังงานที่ประหยัด',
  co2Saved: 'CO₂ ที่ลดได้',
  thdReduction: 'THD ลดลง',
  trendChart: 'กราฟแนวโน้ม',
  showLimits: 'แสดงขีดจำกัด',
  plot: 'พล็อต',
  export: 'ส่งออก',
  loadingChart: 'กำลังโหลดกราฟ…',
  noDataDateRange: 'ไม่พบข้อมูลในช่วงวันที่เลือก',
  changeDatePlot: 'ลองเปลี่ยนช่วงวันที่แล้วกด Plot',
  noDataSelectedDate: 'ไม่มีข้อมูลในวันที่เลือก',
  energyTrendKwh: 'แนวโน้มพลังงาน (kWh)',
  energyUsage: 'การใช้พลังงาน',
  offPeak: 'นอก peak',
  onPeak: 'peak',
  energyCost: 'ค่าไฟ',
  energyHistoricalKwh: 'ประวัติพลังงาน (kWh)',
  eventViewer: 'ดูเหตุการณ์',
  show: 'แสดง',
  entries: 'รายการ',
  allTypes: 'ทุกประเภท',
  search: 'ค้นหา…',
  colDate: 'วันที่',
  colData: 'ข้อมูล',
  colType: 'ประเภท',
  colMessage: 'ข้อความ',
  colStatus: 'สถานะ',
  colActions: 'การดำเนินการ',
  noTableData: 'ไม่มีข้อมูลในตาราง',
  showingEntries: 'แสดง 0 ถึง 0 จาก 0 รายการ',
  phase1: 'เฟส 1',
  phase2: 'เฟส 2',
  phase3: 'เฟส 3',
  minute: 'นาที',
  hour: 'ชั่วโมง',
  day: 'วัน',
  zoomIn: 'ขยาย',
  zoomOut: 'ย่อ',
  pan: 'เลื่อน',
  reset: 'รีเซ็ต',
  upperLimit: 'บน (240V)',
  lowerLimit: 'ล่าง (210V)',
  alert: 'แจ้งเตือน',
  warning: 'คำเตือน',
  info: 'ข้อมูล',
  failedLoad: 'โหลดข้อมูลมอนิเตอร์ไม่สำเร็จ',
  networkError: 'เครือข่ายขัดข้อง',
  energyAxisKwH: 'พลังงาน (kWh)',
};

const ko: MonitorPageStrings = {
  ...en,
  realTimeMeasurements: '실시간 전력 측정',
  live: '실시간',
  loading: '로딩 중…',
  selectCustomer: '고객 선택',
  selectDevice: '장치 선택',
  noLocation: '위치 없음',
  noDeviceSelected: '선택된 장치 없음',
  noDeviceSelectedHint: '위 드롭다운에서 장치를 선택하면 실시간 데이터를 볼 수 있습니다',
  loadingMonitoring: '모니터링 데이터 로딩 중…',
  deviceCount: '장치',
  devicesCount: '장치',
  voltageLineToLine: '전압 (선간)',
  current: '전류',
  power: '전력',
  totalPower: '총 전력',
  reactivePower: '무효 전력',
  apparentPower: '피상 전력',
  frequency: '주파수',
  powerFactor: '역률',
  energy: '에너지',
  thd: '고조파 왜곡률 (THD)',
  thdBefore: '설치 전 THD',
  thdAfter: '설치 후 THD',
  meterBefore: '설치 전 미터',
  meterAfter: '설치 후 미터',
  beforeGeInstall: 'GE 설치 전',
  afterGeInstall: 'GE 설치 후',
  energyAndSavings: '에너지 및 절감',
  ch1EnergyBefore: 'CH1 에너지 (설치 전)',
  ch2EnergyAfter: 'CH2 에너지 (설치 후)',
  energySaved: '절약 에너지',
  co2Saved: 'CO₂ 절감',
  thdReduction: 'THD 감소',
  trendChart: '추세 차트',
  showLimits: '한계 표시',
  plot: 'Plot',
  export: 'Export',
  loadingChart: '차트 로딩 중…',
  noDataDateRange: '선택한 기간에 데이터가 없습니다',
  changeDatePlot: '날짜 범위를 변경한 후 Plot을 클릭하세요',
  noDataSelectedDate: '선택한 날짜에 데이터가 없습니다',
  phase1: '상 1',
  phase2: '상 2',
  phase3: '상 3',
};

const cn: MonitorPageStrings = {
  ...en,
  realTimeMeasurements: '实时电力测量',
  live: '实时',
  loading: '加载中…',
  selectCustomer: '选择客户',
  selectDevice: '选择设备',
  noLocation: '无位置',
  noDeviceSelected: '未选择设备',
  noDeviceSelectedHint: '请从上方下拉列表选择设备以查看实时数据',
  loadingMonitoring: '正在加载监控数据…',
  deviceCount: '台设备',
  devicesCount: '台设备',
  voltageLineToLine: '电压（线间）',
  current: '电流',
  power: '功率',
  totalPower: '总功率',
  reactivePower: '无功功率',
  apparentPower: '视在功率',
  frequency: '频率',
  powerFactor: '功率因数',
  energy: '电能',
  thd: '总谐波失真 (THD)',
  thdBefore: '安装前 THD',
  thdAfter: '安装后 THD',
  meterBefore: '安装前电表',
  meterAfter: '安装后电表',
  beforeGeInstall: 'GE 安装前',
  afterGeInstall: 'GE 安装后',
  energyAndSavings: '能源与节约',
  ch1EnergyBefore: 'CH1 电能（安装前）',
  ch2EnergyAfter: 'CH2 电能（安装后）',
  energySaved: '节约电能',
  co2Saved: 'CO₂ 减排',
  thdReduction: 'THD 降低',
  trendChart: '趋势图',
  showLimits: '显示限值',
  plot: '绘图',
  export: '导出',
  loadingChart: '正在加载图表…',
  noDataDateRange: '所选日期范围内无数据',
  changeDatePlot: '请更改日期范围后点击 Plot',
  noDataSelectedDate: '所选日期无数据',
  phase1: '相 1',
  phase2: '相 2',
  phase3: '相 3',
};

const vn: MonitorPageStrings = {
  ...en,
  realTimeMeasurements: 'Do luong dien thoi gian thuc',
  live: 'Truc tiep',
  loading: 'Dang tai…',
  selectCustomer: 'Chon khach hang',
  selectDevice: 'Chon thiet bi',
  noLocation: 'Khong co vi tri',
  noDeviceSelected: 'Chua chon thiet bi',
  noDeviceSelectedHint: 'Chon thiet bi tu danh sach phia tren de xem du lieu truc tiep',
  loadingMonitoring: 'Dang tai du lieu giam sat…',
  deviceCount: 'thiet bi',
  devicesCount: 'thiet bi',
  voltageLineToLine: 'Dien ap (Line-to-Line)',
  current: 'Dong dien',
  power: 'Cong suat',
  totalPower: 'Tong cong suat',
  reactivePower: 'Cong suat phan khang',
  apparentPower: 'Cong suat bieu kien',
  frequency: 'Tan so',
  powerFactor: 'He so cong suat',
  energy: 'Nang luong',
  thd: 'Total Harmonic Distortion (THD)',
  thdBefore: 'THD truoc lap dat',
  thdAfter: 'THD sau lap dat',
  meterBefore: 'Dong ho truoc',
  meterAfter: 'Dong ho sau',
  beforeGeInstall: 'Truoc lap dat GE',
  afterGeInstall: 'Sau lap dat GE',
  energyAndSavings: 'Nang luong & tiet kiem',
  ch1EnergyBefore: 'Nang luong CH1 (truoc)',
  ch2EnergyAfter: 'Nang luong CH2 (sau)',
  energySaved: 'Nang luong tiet kiem',
  co2Saved: 'CO₂ giam',
  thdReduction: 'Giam THD',
  trendChart: 'Bieu do xu huong',
  showLimits: 'Hien gioi han',
  plot: 'Plot',
  export: 'Export',
  loadingChart: 'Dang tai bieu do…',
  noDataDateRange: 'Khong co du lieu trong khoang ngay da chon',
  changeDatePlot: 'Thu doi khoang ngay va nhan Plot',
  noDataSelectedDate: 'Khong co du lieu trong ngay da chon',
  phase1: 'Pha 1',
  phase2: 'Pha 2',
  phase3: 'Pha 3',
};

const ms: MonitorPageStrings = {
  ...en,
  realTimeMeasurements: 'Pengukuran elektrik masa nyata',
  live: 'Langsung',
  loading: 'Memuatkan…',
  selectCustomer: 'Pilih Pelanggan',
  selectDevice: 'Pilih Peranti',
  noLocation: 'Tiada lokasi',
  noDeviceSelected: 'Tiada peranti dipilih',
  noDeviceSelectedHint: 'Pilih peranti dari menu lungsur di atas untuk melihat data langsung',
  loadingMonitoring: 'Memuatkan data pemantauan…',
  deviceCount: 'peranti',
  devicesCount: 'peranti',
  voltageLineToLine: 'Voltan (Line-to-Line)',
  current: 'Arus',
  power: 'Kuasa',
  totalPower: 'Jumlah Kuasa',
  reactivePower: 'Kuasa Reaktif',
  apparentPower: 'Kuasa Ketara',
  frequency: 'Frekuensi',
  powerFactor: 'Faktor Kuasa',
  energy: 'Tenaga',
  thd: 'Total Harmonic Distortion (THD)',
  thdBefore: 'THD Sebelum',
  thdAfter: 'THD Selepas',
  meterBefore: 'Meter Sebelum',
  meterAfter: 'Meter Selepas',
  beforeGeInstall: 'Sebelum Pemasangan GE',
  afterGeInstall: 'Selepas Pemasangan GE',
  energyAndSavings: 'Tenaga & Penjimatan',
  ch1EnergyBefore: 'Tenaga CH1 (Sebelum)',
  ch2EnergyAfter: 'Tenaga CH2 (Selepas)',
  energySaved: 'Tenaga Dijimatkan',
  co2Saved: 'CO₂ Dijimatkan',
  thdReduction: 'Pengurangan THD',
  trendChart: 'Carta Trend',
  showLimits: 'Tunjuk Had',
  plot: 'Plot',
  export: 'Export',
  loadingChart: 'Memuatkan carta…',
  noDataDateRange: 'Tiada data dalam julat tarikh dipilih',
  changeDatePlot: 'Cuba ubah julat tarikh dan klik Plot',
  noDataSelectedDate: 'Tiada data untuk tarikh dipilih',
  phase1: 'Fasa 1',
  phase2: 'Fasa 2',
  phase3: 'Fasa 3',
};

const PACKS: Record<MonitorPageLocale, MonitorPageStrings> = { th, en, ko, cn, vn, ms };

export function normalizeMonitorLocale(locale: string): MonitorPageLocale {
  const key = String(locale || 'en').toLowerCase();
  if (key.startsWith('th')) return 'th';
  if (key.startsWith('ko')) return 'ko';
  if (key.startsWith('cn') || key.startsWith('zh')) return 'cn';
  if (key.startsWith('vn') || key.startsWith('vi')) return 'vn';
  if (key.startsWith('ms')) return 'ms';
  return 'en';
}

export function getMonitorPageT(locale: string): MonitorPageStrings {
  return PACKS[normalizeMonitorLocale(locale)] ?? en;
}
