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
  geId: string;
  seriesNo: string;
  ipAddress: string;
  beforeMeterNo: string;
  metricsMeterNo: string;
  site: string;
  location: string;
  status: string;
  latitude: string;
  longitude: string;
  userEmail: string;
  partnerEmail: string;
  phone: string;
  passPhone: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  required: string;
  phDeviceName: string;
  phGeId: string;
  phSeriesNo: string;
  phLocation: string;
  phPassPhone: string;
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
};

const th: Copy = {
  back: 'กลับ',
  title: 'เพิ่มอุปกรณ์ใหม่',
  subtitle: 'ลงทะเบียนมิเตอร์และอุปกรณ์ในระบบ',
  sectionDevice: 'ข้อมูลอุปกรณ์',
  sectionDeviceSub: 'Device Information',
  sectionLocation: 'สถานที่และสถานะ',
  sectionLocationSub: 'Location & Status',
  sectionOwner: 'ข้อมูลเจ้าของ / ติดต่อ',
  sectionOwnerSub: 'Owner & Contact',
  sectionCustomer: 'ข้อมูลลูกค้า',
  sectionCustomerSub: 'Customer Info (Optional)',
  deviceName: 'ชื่ออุปกรณ์',
  geId: 'GE ID (geID)',
  seriesNo: 'Series No.',
  ipAddress: 'IP Address',
  beforeMeterNo: 'Before Meter No. (CH1)',
  metricsMeterNo: 'Metrics Meter No. (CH2)',
  site: 'Site / ประเทศ',
  location: 'Location / สถานที่',
  status: 'Status',
  latitude: 'Latitude',
  longitude: 'Longitude',
  userEmail: 'User Email (U_email)',
  partnerEmail: 'Partner Email (P_email)',
  phone: 'Phone',
  passPhone: 'Pass Phone',
  customerName: 'Customer Name',
  customerPhone: 'Customer Phone',
  customerAddress: 'Customer Address',
  required: '*',
  phDeviceName: 'เช่น Energy Meter CT-01',
  phGeId: 'เช่น GE-2024-001',
  phSeriesNo: 'หมายเลขซีรีส์',
  phLocation: 'เช่น Bangkok, Thailand',
  phPassPhone: 'รหัสผ่านโทรศัพท์',
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
};

const ko: Copy = {
  back: '뒤로',
  title: '새 장치 추가',
  subtitle: '시스템에 미터 및 장치 등록',
  sectionDevice: '장치 정보',
  sectionDeviceSub: 'Device Information',
  sectionLocation: '위치 및 상태',
  sectionLocationSub: 'Location & Status',
  sectionOwner: '소유자 / 연락처',
  sectionOwnerSub: 'Owner & Contact',
  sectionCustomer: '고객 정보',
  sectionCustomerSub: 'Customer Info (Optional)',
  deviceName: '장치명',
  geId: 'GE ID (geID)',
  seriesNo: 'Series No.',
  ipAddress: 'IP Address',
  beforeMeterNo: 'Before Meter No. (CH1)',
  metricsMeterNo: 'Metrics Meter No. (CH2)',
  site: 'Site / 국가',
  location: 'Location / 위치',
  status: 'Status',
  latitude: 'Latitude',
  longitude: 'Longitude',
  userEmail: 'User Email (U_email)',
  partnerEmail: 'Partner Email (P_email)',
  phone: 'Phone',
  passPhone: 'Pass Phone',
  customerName: 'Customer Name',
  customerPhone: 'Customer Phone',
  customerAddress: 'Customer Address',
  required: '*',
  phDeviceName: '예: Energy Meter CT-01',
  phGeId: '예: GE-2024-001',
  phSeriesNo: '시리얼 번호',
  phLocation: '예: Seoul, Korea',
  phPassPhone: '전화 비밀번호',
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
};

const en: Copy = {
  back: 'Back',
  title: 'Add New Device',
  subtitle: 'Register a meter and device in the system',
  sectionDevice: 'Device Information',
  sectionDeviceSub: 'Device Information',
  sectionLocation: 'Location & Status',
  sectionLocationSub: 'Location & Status',
  sectionOwner: 'Owner & Contact',
  sectionOwnerSub: 'Owner & Contact',
  sectionCustomer: 'Customer Information',
  sectionCustomerSub: 'Customer Info (Optional)',
  deviceName: 'Device Name',
  geId: 'GE ID (geID)',
  seriesNo: 'Series No.',
  ipAddress: 'IP Address',
  beforeMeterNo: 'Before Meter No. (CH1)',
  metricsMeterNo: 'Metrics Meter No. (CH2)',
  site: 'Site / Country',
  location: 'Location',
  status: 'Status',
  latitude: 'Latitude',
  longitude: 'Longitude',
  userEmail: 'User Email (U_email)',
  partnerEmail: 'Partner Email (P_email)',
  phone: 'Phone',
  passPhone: 'Pass Phone',
  customerName: 'Customer Name',
  customerPhone: 'Customer Phone',
  customerAddress: 'Customer Address',
  required: '*',
  phDeviceName: 'e.g. Energy Meter CT-01',
  phGeId: 'e.g. GE-2024-001',
  phSeriesNo: 'Serial number',
  phLocation: 'e.g. Bangkok, Thailand',
  phPassPhone: 'Phone password',
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
};

const catalog: Record<AddMachineLocale, Copy> = { th, ko, en };

export function addMachineT(locale: string): Copy {
  return catalog[resolveAddMachineLocale(locale)];
}
