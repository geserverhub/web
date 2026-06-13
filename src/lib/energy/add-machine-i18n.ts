export type AddMachineLocale = 'th' | 'ko' | 'en';

export function resolveAddMachineLocale(locale: string): AddMachineLocale {
  if (locale === 'th' || locale === 'ko' || locale === 'en') return locale;
  return 'en';
}

type Copy = {
  back: string;
  title: string;
  subtitle: string;
  sectionDevice: string;
  sectionDeviceSub: string;
  sectionLocation: string;
  sectionLocationSub: string;
  sectionOwner: string;
  sectionOwnerSub: string;
  sectionCustomer: string;
  sectionCustomerSub: string;
  deviceName: string;
  GEsaveID: string;
  seriesNo: string;
  ipAddress: string;
  beforeMeterNo: string;
  metricsMeterNo: string;
  site: string;
  location: string;
  status: string;
  latitude: string;
  longitude: string;
  customerLoginEmail: string;
  customerLoginPassword: string;
  customerLoginPasswordConfirm: string;
  phone: string;
  customerLoginHint: string;
  customerLoginEmailDup: string;
  customerLoginCreated: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  required: string;
  phDeviceName: string;
  phGeId: string;
  phSeriesNo: string;
  phLocation: string;
  phCustomerLoginPassword: string;
  phCustomerName: string;
  phCustomerPhone: string;
  phCustomerAddress: string;
  statusOk: string;
  statusOn: string;
  statusActive: string;
  statusDisabled: string;
  statusMaintenance: string;
  cancel: string;
  save: string;
  saving: string;
  success: string;
  errorGeneric: string;
  errorFailed: string;
  errorPasswordMismatch: string;
};

const th: Copy = {
  back: 'กลับ',
  title: 'เพิ่มอุปกรณ์ใหม่',
  subtitle: 'ลงทะเบียนมิเตอร์และอุปกรณ์ในระบบ',
  sectionDevice: 'ข้อมูลอุปกรณ์',
  sectionDeviceSub: 'Device Information',
  sectionLocation: 'สถานที่และสถานะ',
  sectionLocationSub: 'Location & Status',
  sectionOwner: 'บัญชีลูกค้า (Customer Login)',
  sectionOwnerSub: 'สร้างบัญชีสำหรับล็อกอิน Customer Dashboard',
  sectionCustomer: 'ข้อมูลลูกค้า',
  sectionCustomerSub: 'Customer Info (Optional)',
  deviceName: 'ชื่ออุปกรณ์',
  GEsaveID: 'GE ID (GEsaveID)',
  seriesNo: 'Series No.',
  ipAddress: 'IP Address',
  beforeMeterNo: 'Before Meter No. (CH1)',
  metricsMeterNo: 'Metrics Meter No. (CH2)',
  site: 'Site / ประเทศ',
  location: 'Location / สถานที่',
  status: 'Status',
  latitude: 'Latitude',
  longitude: 'Longitude',
  customerLoginEmail: 'อีเมลล์ลูกค้า (ใช้ล็อกอิน)',
  customerLoginPassword: 'พาสเวิร์ด',
  customerLoginPasswordConfirm: 'ยืนยันพาสเวิร์ด',
  phone: 'เบอร์โทร',
  customerLoginHint: 'ลูกค้าใช้อีเมลล์และพาสเวิร์ดนี้ล็อกอินที่หน้า Customer Dashboard',
  customerLoginEmailDup: 'อีเมลล์นี้มีบัญชีอยู่แล้ว — ระบบจะผูกมิเตอร์เข้าบัญชีเดิม',
  customerLoginCreated: 'สร้างบัญชีลูกค้าสำเร็จ',
  customerName: 'ชื่อลูกค้า',
  customerPhone: 'เบอร์โทรลูกค้า',
  customerAddress: 'ที่อยู่ลูกค้า',
  required: '*',
  phDeviceName: 'เช่น Energy Meter CT-01',
  phGeId: 'เช่น GE-2024-001',
  phSeriesNo: 'หมายเลขซีรีส์',
  phLocation: 'เช่น Bangkok, Thailand',
  phCustomerLoginPassword: 'อย่างน้อย 6 ตัวอักษร',
  phCustomerName: 'ชื่อลูกค้า',
  phCustomerPhone: 'เบอร์โทรลูกค้า',
  phCustomerAddress: 'ที่อยู่ลูกค้า',
  statusOk: 'OK',
  statusOn: 'ON',
  statusActive: 'Active',
  statusDisabled: 'Disabled',
  statusMaintenance: 'Maintenance',
  cancel: 'ยกเลิก',
  save: 'บันทึกอุปกรณ์',
  saving: 'กำลังบันทึก...',
  success: 'เพิ่มอุปกรณ์สำเร็จ กำลังกลับไปหน้า Meter Setting...',
  errorGeneric: 'เกิดข้อผิดพลาด',
  errorFailed: 'ไม่สามารถเพิ่มอุปกรณ์ได้',
  errorPasswordMismatch: 'พาสเวิร์ดไม่ตรงกัน',
};

const ko: Copy = {
  back: '뒤로',
  title: '새 장치 추가',
  subtitle: '시스템에 미터 및 장치 등록',
  sectionDevice: '장치 정보',
  sectionDeviceSub: 'Device Information',
  sectionLocation: '위치 및 상태',
  sectionLocationSub: 'Location & Status',
  sectionOwner: '고객 로그인 계정',
  sectionOwnerSub: 'Customer Dashboard 로그인용 계정 생성',
  sectionCustomer: '고객 정보',
  sectionCustomerSub: 'Customer Info (Optional)',
  deviceName: '장치명',
  GEsaveID: 'GE ID (GEsaveID)',
  seriesNo: 'Series No.',
  ipAddress: 'IP Address',
  beforeMeterNo: 'Before Meter No. (CH1)',
  metricsMeterNo: 'Metrics Meter No. (CH2)',
  site: 'Site / 국가',
  location: 'Location / 위치',
  status: 'Status',
  latitude: 'Latitude',
  longitude: 'Longitude',
  customerLoginEmail: '고객 이메일 (로그인용)',
  customerLoginPassword: '비밀번호',
  customerLoginPasswordConfirm: '비밀번호 확인',
  phone: '전화번호',
  customerLoginHint: '고객은 이 이메일/비밀번호로 Customer Dashboard에 로그인합니다',
  customerLoginEmailDup: '이미 존재하는 이메일 — 기존 계정에 미터가 연결됩니다',
  customerLoginCreated: '고객 계정이 생성되었습니다',
  customerName: '고객명',
  customerPhone: '고객 전화번호',
  customerAddress: '고객 주소',
  required: '*',
  phDeviceName: '예: Energy Meter CT-01',
  phGeId: '예: GE-2024-001',
  phSeriesNo: '시리얼 번호',
  phLocation: '예: Seoul, Korea',
  phCustomerLoginPassword: '최소 6자 이상',
  phCustomerName: '고객명',
  phCustomerPhone: '고객 전화번호',
  phCustomerAddress: '고객 주소',
  statusOk: 'OK',
  statusOn: 'ON',
  statusActive: 'Active',
  statusDisabled: 'Disabled',
  statusMaintenance: 'Maintenance',
  cancel: '취소',
  save: '장치 저장',
  saving: '저장 중...',
  success: '장치가 추가되었습니다. Meter Setting으로 이동합니다...',
  errorGeneric: '오류가 발생했습니다',
  errorFailed: '장치를 추가하지 못했습니다',
  errorPasswordMismatch: '비밀번호가 일치하지 않습니다',
};

const en: Copy = {
  back: 'Back',
  title: 'Add New Device',
  subtitle: 'Register a meter and device in the system',
  sectionDevice: 'Device Information',
  sectionDeviceSub: 'Device Information',
  sectionLocation: 'Location & Status',
  sectionLocationSub: 'Location & Status',
  sectionOwner: 'Customer Login Account',
  sectionOwnerSub: 'Create credentials for Customer Dashboard login',
  sectionCustomer: 'Customer Information',
  sectionCustomerSub: 'Customer Info (Optional)',
  deviceName: 'Device Name',
  GEsaveID: 'GE ID (GEsaveID)',
  seriesNo: 'Series No.',
  ipAddress: 'IP Address',
  beforeMeterNo: 'Before Meter No. (CH1)',
  metricsMeterNo: 'Metrics Meter No. (CH2)',
  site: 'Site / Country',
  location: 'Location',
  status: 'Status',
  latitude: 'Latitude',
  longitude: 'Longitude',
  customerLoginEmail: 'Customer Email (login)',
  customerLoginPassword: 'Password',
  customerLoginPasswordConfirm: 'Confirm Password',
  phone: 'Phone',
  customerLoginHint: 'Customer uses this email & password to log in at Customer Dashboard',
  customerLoginEmailDup: 'Email already exists — meter will be linked to the existing account',
  customerLoginCreated: 'Customer account created',
  customerName: 'Customer Name',
  customerPhone: 'Customer Phone',
  customerAddress: 'Customer Address',
  required: '*',
  phDeviceName: 'e.g. Energy Meter CT-01',
  phGeId: 'e.g. GE-2024-001',
  phSeriesNo: 'Serial number',
  phLocation: 'e.g. Bangkok, Thailand',
  phCustomerLoginPassword: 'At least 6 characters',
  phCustomerName: 'Customer name',
  phCustomerPhone: 'Customer phone',
  phCustomerAddress: 'Customer address',
  statusOk: 'OK',
  statusOn: 'ON',
  statusActive: 'Active',
  statusDisabled: 'Disabled',
  statusMaintenance: 'Maintenance',
  cancel: 'Cancel',
  save: 'Save Device',
  saving: 'Saving...',
  success: 'Device added successfully. Redirecting to Meter Setting...',
  errorGeneric: 'An error occurred',
  errorFailed: 'Failed to add device',
  errorPasswordMismatch: 'Passwords do not match',
};

const catalog: Record<AddMachineLocale, Copy> = { th, ko, en };

export function addMachineT(locale: string): Copy {
  return catalog[resolveAddMachineLocale(locale)];
}
