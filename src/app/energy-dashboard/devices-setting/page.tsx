'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import { Search, Edit2, Trash2, Settings, Server, Wifi, WifiOff, RefreshCw, X, Save, Phone, MapPin, User, Plus, Eye } from 'lucide-react';
import GeocodeMapPickerModal from '@/components/energy/GeocodeMapPickerModal';

interface Device {
  deviceID?: number;
  deviceName?: string;
  name?: string;
  GEsaveID?: string;
  seriesNo?: string;
  type?: string;
  owner?: string;
  U_email?: string;
  connection?: 'ONLINE' | 'OFFLINE';
  ipAddress?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  customer_id?: number | null;
  lastUpdate?: string;
  timeSinceUpdate?: string;
  registerDate?: string;
  created_at?: string;
  customerName?: string;
  customerNameEn?: string;
  customerNameKr?: string;
  customerPhone?: string;
  customerAddress?: string;
  location?: string;
  site?: string;
  record_scope?: 'pre_install' | 'installed' | 'in_out';
  // momoge_cus fields
  mmgID?: number | null;
  meterID?: string | null;
  LocationID?: string | null;
  serailID?: string | null;
}

type DeviceForm = Omit<Partial<Device>, 'latitude' | 'longitude'> & {
  latitude?: string;
  longitude?: string;
};

interface CustomerResult {
  cusID: number;
  fullname?: string | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  companyEn?: string | null;
  house_number?: string | null;
  moo?: string | null;
  tambon?: string | null;
  amphoe?: string | null;
  province?: string | null;
  postcode?: string | null;
}

const customerCompanyEnFallbackMap: Record<string, string> = {
  'บริษัท ไทยเกษตร อินดัสเทรียล จำกัด': 'Thai Kaset Industrial Co., Ltd.',
  'บริษัท คาลเท็กซ์ (ไทยแลนด์) จำกัด': 'Caltex (Thailand) Co., Ltd.',
  'บริษัท ซัสโก้ จำกัด': 'SUSCO Co., Ltd.',
  'บริษัท ซีเจ มอร์ จำกัด': 'CJ MORE Co., Ltd.',
  'บริษัท ท็อปซูเปอร์มาร์เก็ต จำกัด': 'Tops Supermarket Co., Ltd.',
  'บริษัท บีซีพีจี จำกัด (มหาชน)': 'BCPG Public Company Limited',
  'บริษัท พีทีจี เอ็นเนอร์ยี่ จำกัด': 'PTG Energy Co., Ltd.',
  'บริษัท เจแอนด์อี ไลท์ติ้ง จำกัด': 'J&E Lighting Co., Ltd.',
  'บริษัท เชลล์ (ประเทศไทย) จำกัด': 'Shell (Thailand) Co., Ltd.',
  'บริษัท โลตัส โก เฟรช จำกัด': 'Lotus Go Fresh Co., Ltd.',
  'ห้างหุ้นส่วนจำกัด ลอว์สัน 108': 'Lawson 108 Limited Partnership'
};

const getCustomerCompanyEn = (customer: CustomerResult) => {
  const explicitEn = (customer.companyEn || '').trim();
  if (explicitEn) return explicitEn;

  const companyTh = (customer.company || '').trim();
  if (!companyTh) return '';

  return customerCompanyEnFallbackMap[companyTh] || '';
};

interface ProductResponse {
  products?: Array<{ name?: string | null }>;
}

export default function DevicesSettingPage() {
  const { selectedSite } = useSite();
  const { t, locale } = useLocale();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDeviceName, setSearchDeviceName] = useState('');
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [viewingDevice, setViewingDevice] = useState<Device | null>(null);
  const [editForm, setEditForm] = useState<DeviceForm>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [productNames, setProductNames] = useState<string[]>([]);
  const [addForm, setAddForm] = useState<DeviceForm>({
    deviceName: '',
    GEsaveID: '',
    seriesNo: '',
    ipAddress: '',
    phone: '',
    location: '',
    latitude: '',
    longitude: '',
    customerName: '',
    customerNameEn: '',
    customerPhone: '',
    customerAddress: '',
    customer_id: null,
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [installationType, setInstallationType] = useState<'pre_install' | 'installed' | 'in_out'>('installed');
  const [addFormSite, setAddFormSite] = useState<'thailand' | 'korea'>('thailand');
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<'add' | 'edit'>('add');
  const [editingRecordScope, setEditingRecordScope] = useState<number | null>(null);
  const [selectedRecordScope, setSelectedRecordScope] = useState<'pre_install' | 'installed' | 'in_out' | null>(null);
  const [updatingRecordScope, setUpdatingRecordScope] = useState(false);
  const [editMmgID, setEditMmgID] = useState<number | null>(null);
  const [editMeterID, setEditMeterID] = useState('');
  const [editLocationID, setEditLocationID] = useState('');
  const [editSerailID, setEditSerailID] = useState('');
  const [editNameKR, setEditNameKR] = useState('');
  const [addMeterID, setAddMeterID] = useState('');
  const [addLocationID, setAddLocationID] = useState('');
  const [addSerailID, setAddSerailID] = useState('');
  const [addNameKR, setAddNameKR] = useState('');
  const [savingCusDirect, setSavingCusDirect] = useState(false);
  const [saveCusMsgDirect, setSaveCusMsgDirect] = useState<string | null>(null);

  useEffect(() => { setClientReady(true); }, []);

  const siteCode = (site: string | undefined) => {
    switch (site) {
      case 'korea': return 'KR';
      case 'vietnam': return 'VN';
      case 'malaysia': return 'MY';
      default: return 'TH';
    }
  };

  const todayStamp = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  };

  const nextGEsaveId = (site: string | undefined) => {
    const code = siteCode(site);
    const regex = new RegExp(`^GE-${code}-(\\d{6})$`);
    const current = devices
      .filter(d => (d.site || '').toLowerCase() === (site || '').toLowerCase())
      .map(d => {
        const match = (d.GEsaveID || '').toUpperCase().match(regex);
        return match ? Number(match[1]) : 0;
      })
      .reduce((max, n) => Math.max(max, n), 0);
    const next = String(current + 1).padStart(6, '0');
    return `GE-${code}-${next}`;
  };

  const nextSerialNo = (site: string | undefined) => {
    const code = siteCode(site);
    const dateStr = todayStamp();
    const regex = new RegExp(`^ZE KOR-C-(\\d{8})-${code}(\\d{6})$`, 'i');
    const maxSeq = devices
      .filter(d => (d.site || '').toLowerCase() === (site || '').toLowerCase())
      .map(d => d.seriesNo || '')
      .reduce((acc, sn) => {
        const match = String(sn).toUpperCase().match(regex);
        if (match && match[1] === dateStr) {
          const seq = Number(match[2]);
          return Math.max(acc, seq);
        }
        return acc;
      }, 0);
    const next = String(maxSeq + 1).padStart(6, '0');
    return `ZE KOR-C-${dateStr}-${code}${next}`;
  };

  const parseCoordinate = (value?: string) => {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  };

  const siteDisplayLocation = (site: 'thailand' | 'korea') =>
    site === 'korea' ? (locale === 'ko' ? '대한민국' : 'Korea') : locale === 'th' ? 'ประเทศไทย' : 'Thailand';

  function openMapPicker(target: 'add' | 'edit') {
    setMapPickerTarget(target);
    setMapPickerOpen(true);
  }

  function applyMapCoordinates(lat: string, lng: string) {
    if (mapPickerTarget === 'add') {
      setAddForm((f) => ({ ...f, latitude: lat, longitude: lng }));
      return;
    }
    setEditForm((f) => ({ ...f, latitude: lat, longitude: lng }));
  }

  const mapPickerSite =
    mapPickerTarget === 'add'
      ? addFormSite
      : (editForm.location?.toLowerCase().includes('korea') || editForm.location?.includes('เกาหลี') ? 'korea' : 'thailand');

  const mapPickerAddress =
    mapPickerTarget === 'add'
      ? addForm.customerAddress || addForm.location || ''
      : editForm.customerAddress || editForm.location || '';

  const mapPickerLat =
    mapPickerTarget === 'add' ? addForm.latitude : editForm.latitude;

  const mapPickerLng =
    mapPickerTarget === 'add' ? addForm.longitude : editForm.longitude;

  // Preload product names for the device selector
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/ge-energy/products?limit=200&sortBy=name');
        const json = (await res.json()) as ProductResponse;
        if (json?.products?.length) {
          setProductNames(
            json.products
              .map((product) => product.name?.trim() || '')
              .filter((name): name is string => Boolean(name))
          );
        }
      } catch (err) {
        console.warn('Unable to load products for device selector', err);
      }
    };
    loadProducts();
  }, []);

  // Shared customer search helper
  const fetchCustomers = async (term: string) => {
    setCustomerLoading(true);
    try {
      const trimmed = term.trim();
      const url = trimmed.length > 0
        ? `/api/customers?q=${encodeURIComponent(trimmed)}`
        : '/api/customers'; // default list
      const res = await fetch(url);
      const json = await res.json();
      if (json?.success && Array.isArray(json.customers)) {
        setCustomerResults(json.customers);
      } else {
        setCustomerResults([]);
      }
    } catch (err) {
      console.warn('customer search failed', err);
      setCustomerResults([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Search customers for add modal
  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(customerSearchTerm), 250);
    return () => clearTimeout(t);
  }, [customerSearchTerm]);

  const saveCusInfoDirect = async () => {
    const missing: string[] = [];
    if (!addForm.customerName?.trim()) missing.push(ui.customerNameLabel);
    if (!addForm.customerNameEn?.trim()) missing.push(ui.customerNameEnLabel);
    if (!addNameKR?.trim()) missing.push(ui.customerNameKrLabel);
    if (!addForm.customerPhone?.trim()) missing.push(ui.phoneLabel);
    if (!addForm.customerAddress?.trim()) missing.push(ui.addressLabel);
    const latVal = addForm.latitude !== '' && addForm.latitude != null ? parseFloat(String(addForm.latitude)) : NaN;
    const lngVal = addForm.longitude !== '' && addForm.longitude != null ? parseFloat(String(addForm.longitude)) : NaN;
    if (isNaN(latVal)) missing.push(ui.latitudeLabel);
    if (isNaN(lngVal)) missing.push(ui.longitudeLabel);
    if (missing.length > 0) {
      setSaveCusMsgDirect((ui.pleaseFill || 'กรุณากรอก') + ': ' + missing.join(', '));
      return;
    }
    setSavingCusDirect(true);
    setSaveCusMsgDirect(null);
    try {
      const res = await fetch('/api/ge-energy/momoge-cus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameTH: addForm.customerName.trim(),
          nameEN: addForm.customerNameEn!.trim(),
          nameKR: addNameKR.trim() || null,
          phone: addForm.customerPhone!.trim(),
          address: addForm.customerAddress!.trim(),
          latitude: latVal,
          longitude: lngVal,
          meterID: addMeterID ? Number(addMeterID) : null,
          LocationID: addLocationID ? Number(addLocationID) : null,
          serailID: addSerailID || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveCusMsgDirect('✓ บันทึกสำเร็จ');
      } else {
        setSaveCusMsgDirect('เกิดข้อผิดพลาด: ' + (json.error || 'unknown'));
      }
    } catch (err) {
      setSaveCusMsgDirect('เกิดข้อผิดพลาด');
      console.error('[saveCusInfoDirect]', err);
    } finally {
      setSavingCusDirect(false);
    }
  };

  function openEdit(device: Device) {
    setEditingDevice(device);
    setEditForm({
      deviceName: device.deviceName || device.name || '',
      owner: device.owner || device.U_email || '',
      ipAddress: device.ipAddress || '',
      phone: device.phone || '',
      customerName: device.customerName || '',
      customerNameEn: device.customerNameEn || '',
      customerPhone: device.customerPhone || '',
      customerAddress: device.customerAddress || '',
      location: device.location || '',
      latitude: device.latitude !== null && device.latitude !== undefined ? String(device.latitude) : '',
      longitude: device.longitude !== null && device.longitude !== undefined ? String(device.longitude) : '',
    });
    setSaveMsg(null);
    // Load existing momoge_cus record for this device
    setEditMmgID(null); setEditMeterID(''); setEditLocationID(''); setEditSerailID(''); setEditNameKR('');
    if (device.deviceID) {
      fetch(`/api/ge-energy/momoge-cus?deviceId=${device.deviceID}`)
        .then(r => r.json())
        .then(j => {
          const rec = j.records?.[0];
          if (rec) {
            setEditMmgID(rec.mmgID ?? null);
            setEditMeterID(rec.meterID ?? '');
            setEditLocationID(rec.LocationID ?? '');
            setEditSerailID(rec.serailID ?? '');
            setEditNameKR(rec.nameKR ?? '');
          }
        })
        .catch(() => {});
    }
  }

  function openView(device: Device) {
    setViewingDevice(device);
  }

  async function handleDelete(device: Device) {
    if (!device.deviceID) return;

    const deviceName = device.deviceName || device.name || device.GEsaveID || 'this device';
    const confirmMsg = locale === 'ko'
      ? `정말 "${deviceName}"을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      : locale === 'th'
      ? `คุณแน่ใจหรือไม่ที่จะลบ "${deviceName}"?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`
      : `Are you sure you want to delete "${deviceName}"?\n\nThis action cannot be undone.`;

    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch(`/api/ge-energy/devices-setting?deviceId=${device.deviceID}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        // Refresh device list
        await fetchDevices();
      } else {
        alert(data.error || 'Failed to delete device');
      }
    } catch (err: unknown) {
      console.error('Delete device error:', err);
      alert('Network error. Please try again.');
    }
  }

  async function saveEdit() {
    if (!editingDevice?.deviceID) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/ge-energy/devices-setting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: editingDevice.deviceID,
          ...editForm,
          latitude: parseCoordinate(editForm.latitude),
          longitude: parseCoordinate(editForm.longitude),
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Upsert momoge_cus customer record
        const cusPayload = {
          device_id: editingDevice.deviceID,
          nameTH: editForm.customerName || null,
          nameEN: editForm.customerNameEn || null,
          nameKR: editNameKR || null,
          phone: editForm.customerPhone || null,
          address: editForm.customerAddress || null,
          latitude: parseCoordinate(editForm.latitude) ?? null,
          longitude: parseCoordinate(editForm.longitude) ?? null,
          meterID: editMeterID || null,
          LocationID: editLocationID || null,
          serailID: editSerailID || editForm.seriesNo || null,
        };
        if (editMmgID) {
          await fetch('/api/ge-energy/momoge-cus', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mmgID: editMmgID, ...cusPayload }),
          }).catch(() => {});
        } else {
          await fetch('/api/ge-energy/momoge-cus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cusPayload),
          }).catch(() => {});
        }
        setSaveMsg('saved');
        await fetchDevices();
        setTimeout(() => setEditingDevice(null), 800);
      } else {
        setSaveMsg('error');
      }
    } catch {
      setSaveMsg('error');
    }
    setSaving(false);
  }

  async function updateRecordScope() {
    if (!editingRecordScope || !selectedRecordScope) return;
    
    setUpdatingRecordScope(true);
    try {
      const res = await fetch('/api/ge-energy/devices-setting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: editingRecordScope,
          recordScope: selectedRecordScope
        })
      });
      
      const json = await res.json();
      if (json.success) {
        await fetchDevices();
        setEditingRecordScope(null);
        setSelectedRecordScope(null);
      }
    } catch (err) {
      console.error('Error updating record scope:', err);
    }
    setUpdatingRecordScope(false);
  }

  function openAddModal() {
    const site: 'thailand' | 'korea' =
      selectedSite === 'korea' ? 'korea' : 'thailand';
    setAddFormSite(site);
    setAddForm({
      deviceName: '',
      GEsaveID: '',
      seriesNo: '',
      ipAddress: '',
      phone: '',
      location: siteDisplayLocation(site),
      latitude: '',
      longitude: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customer_id: null,
    });
    setInstallationType('installed');
    setCustomerSearchTerm('');
    setCustomerResults([]);
    setCreateMsg(null);
    setAddMeterID(''); setAddLocationID(''); setAddSerailID(''); setAddNameKR('');
    setShowAddModal(true);
  }

  async function saveAdd() {
    if (!addForm.deviceName?.trim()) {
      setCreateMsg('error');
      return;
    }
    if (!addForm.seriesNo?.trim()) {
      setCreateMsg('กรุณากรอกหมายเลขซีเรียล / Serial no');
      return;
    }

    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch('/api/ge-energy/devices-setting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          customerId: addForm.customer_id ?? null,
          latitude: parseCoordinate(addForm.latitude),
          longitude: parseCoordinate(addForm.longitude),
          site: addFormSite,
          location: addForm.location?.trim() || siteDisplayLocation(addFormSite),
          recordScope: installationType
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Create momoge_cus customer record linked to the new device
        const newDeviceId = json.device?.deviceID;
        if (newDeviceId) {
          await fetch('/api/ge-energy/momoge-cus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: newDeviceId,
              nameTH: addForm.customerName || null,
              nameEN: addForm.customerNameEn || null,
              nameKR: addNameKR || null,
              phone: addForm.customerPhone || null,
              address: addForm.customerAddress || null,
              latitude: parseCoordinate(addForm.latitude) ?? null,
              longitude: parseCoordinate(addForm.longitude) ?? null,
              meterID: addMeterID || null,
              LocationID: addLocationID || null,
              serailID: addSerailID || addForm.seriesNo || null,
            }),
          }).catch(() => {});
        }
        setCreateMsg('saved');
        await fetchDevices();
        setTimeout(() => setShowAddModal(false), 600);
      } else {
        setCreateMsg(json.error || json.message || 'error');
      }
    } catch {
      setCreateMsg('error');
    } finally {
      setCreating(false);
    }
  }

  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Show every device across all sites (bound by deviceID PK), not just the
      // currently selected site.
      const response = await fetch(`/api/ge-energy/devices-setting?site=all`);
      const data = await response.json();

      if (data.success) {
        setDevices(data.devices || []);
      } else {
        setError(data.error || 'Failed to fetch devices');
      }
    } catch (err: unknown) {
      console.error('Fetch devices error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch devices from API
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Filter devices by table search
  const filteredDevices = devices.filter(device =>
    (device.customerName || '').toLowerCase().includes(searchDeviceName.toLowerCase()) ||
    (device.customerPhone || '').toLowerCase().includes(searchDeviceName.toLowerCase()) ||
    (device.customerAddress || '').toLowerCase().includes(searchDeviceName.toLowerCase())
  );

  const onlineCount = devices.filter(d => d.connection === 'ONLINE').length;

  // Avoid hydration mismatch: render a stable placeholder until the client mounts
  if (!clientReady) {
    return (
      <div className="energy-page">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-6 bg-gray-200 rounded w-56" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  // After mount, use the selected locale directly so text updates when language changes
  const resolvedLocale = String(locale || '').toLowerCase();
  const uiLocale = resolvedLocale.startsWith('th')
    ? 'th'
    : resolvedLocale.startsWith('ko')
      ? 'ko'
      : 'en';

  const ui = (() => {
    switch (uiLocale) {
      case 'th':
        return {
          heroSubtitle: 'จัดการอุปกรณ์และข้อมูลลูกค้าทั้งหมด',
          total: 'ทั้งหมด',
          online: 'ออนไลน์',
          offline: 'ออฟไลน์',
          searchPlaceholder: 'ค้นหา ชื่อลูกค้า, เบอร์โทร, ที่อยู่...',
          refresh: 'รีเฟรช',
          addDevice: 'เพิ่มเครื่อง',
          deviceList: 'รายการอุปกรณ์',
          loading: 'กำลังโหลดข้อมูล...',
          retry: 'ลองใหม่',
          notFound: 'ไม่พบอุปกรณ์',
          email: 'อีเมล',
          ipAddress: 'IP Address',
          lastUpdate: 'อัปเดตล่าสุด',
          registerDate: 'วันที่ลงทะเบียน',
          tableHeaders: ['#', 'แก้ไข', 'ชื่อเครื่อง', 'รหัสมิเตอร์', 'ชื่อลูกค้า', 'เบอร์โทร', 'ที่อยู่', 'อีเมลเจ้าของ', 'ประเภทมิเตอร์', 'สถานะ', 'IP Address', 'อัปเดตล่าสุด', 'ลงทะเบียน'],
          settingsBadge: 'ตั้งค่าอุปกรณ์',
          edit: 'แก้ไข',
          delete: 'ลบ',
          showing: 'แสดง',
          fromTotal: 'รายการ จากทั้งหมด',
          devicesUnit: 'เครื่อง',
          customerInfo: 'ข้อมูลลูกค้า',
          customerNameLabel: 'ชื่อลูกค้า / Customer Name (ไทย)',
          customerNamePlaceholder: 'ชื่อ-นามสกุลลูกค้า (ภาษาไทย)',
          customerNameEnLabel: 'ชื่อลูกค้า (ภาษาอังกฤษ)',
          customerNameEnPlaceholder: 'Customer Name (English)',
          customerNameKrLabel: 'ชื่อลูกค้า (ภาษาเกาหลี)',
          customerNameKrPlaceholder: '고객 이름 (한국어)',
          saveCusInfo: 'บันทึกข้อมูลลูกค้า',
          pleaseFill: 'กรุณากรอก',
          phoneLabel: 'เบอร์โทร / Phone',
          phonePlaceholder: 'เช่น 02-123-4567 หรือ +66 81-234-5678',
          addressLabel: 'ที่อยู่ / Address',
          addressPlaceholder: 'ที่อยู่เต็ม เช่น บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์',
          deviceInfo: 'ข้อมูลอุปกรณ์',
          deviceNameLabel: 'ชื่อเครื่อง / Device Name',
          ownerEmailLabel: 'อีเมลเจ้าของ / Owner Email',
          serialNoLabel: 'หมายเลขซีเรียล / Serial no',
          locationLabel: 'สถานที่ / Location',
          locationNameLabel: 'ประเทศ / Country',
          siteThailand: 'ไทย',
          siteKorea: 'เกาหลี',
          meterCodeLabel: 'รหัสมิเตอร์ / Meter code',
          meterCodePlaceholder: 'กรอกเอง',
          latitudeLabel: 'ละติจูด / Latitude',
          longitudeLabel: 'ลองจิจูด / Longitude',
          geocodeBtn: 'ค้นหาพิกัดจากที่อยู่',
          geocodeHint: 'เปิดแผนที่ ค้นหาที่อยู่ และเลือกพิกัดบนแผนที่',
          mapPickerTitle: 'เลือกพิกัดบนแผนที่',
          mapPickerSearch: 'ค้นหาที่อยู่...',
          mapPickerSearchBtn: 'ค้นหา',
          mapPickerApply: 'ใช้พิกัดนี้',
          mapPickerClickHint: 'คลิกบนแผนที่หรือลากหมุดเพื่อปรับตำแหน่ง',
          mapPickerNotFound: 'ไม่พบพิกัดจากที่อยู่นี้',
          devicePhoneLabel: 'เบอร์โทรเครื่องมิเตอร์ / Meter Phone',
          deviceNamePlaceholder: 'ชื่อเครื่อง',
          ownerEmailPlaceholder: 'อีเมลเจ้าของ',
          locationPlaceholder: 'สถานที่',
          devicePhonePlaceholder: 'เช่น 02-123-4567 หรือ +66 81-234-5678',
          serialNoPlaceholder: 'กรอกเอง',
          saving: 'กำลังบันทึก...',
          saved: '✓ บันทึกแล้ว!',
          save: 'บันทึก',
          cancel: 'ยกเลิก',
          close: 'ปิด',
          search: 'ค้นหา',
          saveError: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
          deviceConfigTitle: 'การตั้งค่าอุปกรณ์',
          statusOnline: 'ออนไลน์',
          statusOffline: 'ออฟไลน์',
          addTitle: 'เพิ่มอุปกรณ์ใหม่',
          addHint: 'กรอกข้อมูลอุปกรณ์และลูกค้าเพื่อสร้างเครื่องใหม่',
          create: 'เพิ่มเครื่อง',
          creating: 'กำลังเพิ่ม...',
          created: '✓ เพิ่มสำเร็จ!',
          createError: 'เพิ่มไม่สำเร็จ กรุณาตรวจสอบชื่อเครื่องแล้วลองใหม่',
          deviceNameRequired: 'ชื่อเครื่องจำเป็นต้องกรอก',
          installationTypeLabel: '📦 ประเภทการติดตั้งมิเตอร์ / Installation meter Type',
          preInstallLabel: 'มิเตอร์ INPUT',
          preInstallDesc: 'Meter INPUT',
          installedLabel: 'มิเตอร์ OUTPUT',
          installedDesc: 'Meter OUTPUT',
          inOutLabel: 'มิเตอร์ IN-OUT',
          inOutDesc: 'Meter IN-OUT',
          customerSearchPlaceholder: 'ค้นหา ชื่อลูกค้า, เบอร์โทร, ที่อยู่...'
        };
      case 'ko':
        return {
          heroSubtitle: '장치 및 고객 정보를 관리합니다',
          total: '전체',
          online: '온라인',
          offline: '오프라인',
          searchPlaceholder: '고객명, 전화번호, 주소 검색...',
          refresh: '새로고침',
          addDevice: '장치 추가',
          deviceList: '장치 목록',
          loading: '데이터를 불러오는 중...',
          retry: '다시 시도',
          notFound: '장치를 찾을 수 없습니다',
          email: '이메일',
          ipAddress: 'IP 주소',
          lastUpdate: '최근 업데이트',
          registerDate: '등록일',
          tableHeaders: ['#', '수정', '장치명', 'GE ID', '고객명', '전화번호', '주소', '소유자 이메일', '설치 유형', '상태', 'IP 주소', '최근 업데이트', '등록일'],
          settingsBadge: '장치 설정',
          edit: '수정',
          delete: '삭제',
          showing: '표시',
          fromTotal: '개 / 전체',
          devicesUnit: '대',
          customerInfo: '고객 정보',
          customerNameLabel: '고객명 (태국어)',
          customerNamePlaceholder: '고객 이름 입력 (태국어)',
          customerNameEnLabel: '고객명 (영어)',
          customerNameEnPlaceholder: 'Customer Name (English)',
          customerNameKrLabel: '고객명 (한국어)',
          customerNameKrPlaceholder: '고객 이름 입력 (한국어)',
          saveCusInfo: '고객 정보 저장',
          pleaseFill: '입력해주세요',
          phoneLabel: '전화번호 / Phone',
          phonePlaceholder: '예: 02-123-4567 또는 +82 10-1234-5678',
          addressLabel: '주소 / Address',
          addressPlaceholder: '상세 주소 입력',
          deviceInfo: '장치 정보',
          deviceNameLabel: '장치명 / Device Name',
          ownerEmailLabel: '소유자 이메일 / Owner Email',
          serialNoLabel: '시리얼 번호 / Serial no',
          locationLabel: '위치 / Location',
          locationNameLabel: '국가 / Country',
          siteThailand: '태국',
          siteKorea: '한국',
          meterCodeLabel: '미터 코드 / Meter code',
          meterCodePlaceholder: '직접 입력',
          latitudeLabel: '위도 / Latitude',
          longitudeLabel: '경도 / Longitude',
          geocodeBtn: '주소로 좌표 검색',
          geocodeHint: '지도를 열어 주소를 검색하고 좌표를 선택합니다',
          mapPickerTitle: '지도에서 좌표 선택',
          mapPickerSearch: '주소 검색...',
          mapPickerSearchBtn: '검색',
          mapPickerApply: '좌표 적용',
          mapPickerClickHint: '지도를 클릭하거나 마커를 드래그하여 위치를 조정하세요',
          mapPickerNotFound: '주소로 좌표를 찾을 수 없습니다',
          devicePhoneLabel: '미터 전화번호 / Meter Phone',
          deviceNamePlaceholder: '장치명',
          ownerEmailPlaceholder: '소유자 이메일',
          locationPlaceholder: '위치',
          devicePhonePlaceholder: '예: 02-123-4567 또는 +82 10-1234-5678',
          serialNoPlaceholder: '직접 입력',
          saving: '저장 중...',
          saved: '✓ 저장 완료!',
          save: '저장',
          cancel: '취소',
          close: '닫기',
          search: '검색',
          saveError: '오류가 발생했습니다. 다시 시도해주세요.',
          deviceConfigTitle: '장치 구성',
          statusOnline: '온라인',
          statusOffline: '오프라인',
          addTitle: '새 장치 추가',
          addHint: '새 장치를 생성하려면 장치/고객 정보를 입력하세요',
          create: '추가',
          creating: '추가 중...',
          created: '✓ 추가 완료!',
          createError: '추가 실패. 장치명을 확인 후 다시 시도하세요.',
          deviceNameRequired: '장치명은 필수입니다',
          installationTypeLabel: '📦 미터 설치 유형 / Installation meter Type',
          preInstallLabel: '미터 INPUT',
          preInstallDesc: 'Meter INPUT',
          installedLabel: '미터 OUTPUT',
          installedDesc: 'Meter OUTPUT',
          inOutLabel: '미터 IN-OUT',
          inOutDesc: 'Meter IN-OUT',
          customerSearchPlaceholder: '고객명, 전화, 주소 검색...'
        };
      default:
        return {
          heroSubtitle: 'Manage all devices and customer information',
          total: 'Total',
          online: 'Online',
          offline: 'Offline',
          searchPlaceholder: 'Search customer name, phone, address...',
          refresh: 'Refresh',
          addDevice: 'Add Device',
          deviceList: 'Device List',
          loading: 'Loading data...',
          retry: 'Retry',
          notFound: 'No devices found',
          email: 'Email',
          ipAddress: 'IP Address',
          lastUpdate: 'Last Update',
          registerDate: 'Register Date',
          tableHeaders: ['#', 'Edit', 'Device Name', 'Meter code', 'Customer Name', 'Phone', 'Address', 'Owner Email', 'Meter Type', 'Status', 'IP Address', 'Last Update', 'Registered'],
          settingsBadge: 'Device Settings',
          edit: 'Edit',
          delete: 'Delete',
          showing: 'Showing',
          fromTotal: 'items of',
          devicesUnit: 'devices',
          customerInfo: 'Customer Info',
          customerNameLabel: 'Customer Name (Thai)',
          customerNamePlaceholder: 'Customer name in Thai',
          customerNameEnLabel: 'Customer Name (English)',
          customerNameEnPlaceholder: 'Customer full name in English',
          customerNameKrLabel: 'Customer Name (Korean)',
          customerNameKrPlaceholder: '고객 이름 (한국어)',
          saveCusInfo: 'Save Customer Info',
          pleaseFill: 'Please fill in',
          phoneLabel: 'Phone',
          phonePlaceholder: 'e.g. +66 81-234-5678',
          addressLabel: 'Address',
          addressPlaceholder: 'Full address',
          deviceInfo: 'Device Info',
          deviceNameLabel: 'Device Name',
          ownerEmailLabel: 'Owner Email',
          serialNoLabel: 'Serial no',
          locationLabel: 'Location',
          locationNameLabel: 'Country',
          siteThailand: 'Thailand',
          siteKorea: 'Korea',
          meterCodeLabel: 'Meter code',
          meterCodePlaceholder: 'Enter manually',
          latitudeLabel: 'Latitude',
          longitudeLabel: 'Longitude',
          geocodeBtn: 'Find coordinates from address',
          geocodeHint: 'Open map, search address, and pick coordinates on the map',
          mapPickerTitle: 'Pick coordinates on map',
          mapPickerSearch: 'Search address...',
          mapPickerSearchBtn: 'Search',
          mapPickerApply: 'Use coordinates',
          mapPickerClickHint: 'Click the map or drag the pin to adjust the location',
          mapPickerNotFound: 'No coordinates found for this address',
          devicePhoneLabel: 'Meter phone',
          deviceNamePlaceholder: 'Device Name',
          ownerEmailPlaceholder: 'email@example.com',
          locationPlaceholder: 'Location',
          devicePhonePlaceholder: 'e.g. +66 81-234-5678',
          serialNoPlaceholder: 'Enter manually',
          saving: 'Saving...',
          saved: '✓ Saved!',
          save: 'Save',
          cancel: 'Cancel',
          close: 'Close',
          search: 'Search',
          saveError: 'An error occurred. Please try again.',
          deviceConfigTitle: 'Device Configuration',
          statusOnline: 'Online',
          statusOffline: 'Offline',
          addTitle: 'Add New Device',
          addHint: 'Fill in device and customer information to create a new device',
          create: 'Create Device',
          creating: 'Creating...',
          created: '✓ Created!',
          createError: 'Create failed. Please check required fields and try again.',
          deviceNameRequired: 'Device name is required',
          installationTypeLabel: '📦 Installation meter Type',
          preInstallLabel: 'Meter INPUT',
          preInstallDesc: 'Meter INPUT',
          installedLabel: 'Meter OUTPUT',
          installedDesc: 'Meter OUTPUT',
          inOutLabel: 'Meter IN-OUT',
          inOutDesc: 'Meter IN-OUT',
          customerSearchPlaceholder: 'Search customer name, phone, address...'
        };
    }
  })();

  // Avoid hydration mismatch: render a stable placeholder until the client mounts
  if (!clientReady) {
    return (
      <div className="energy-page">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-6 bg-gray-200 rounded w-56" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="energy-page space-y-4 md:space-y-5">

      {/* Hero */}
      <div className="energy-hero rounded-2xl md:rounded-3xl">
        <div className="energy-hero-inner px-5 py-6 md:px-8 md:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full mb-3 ring-1 ring-white/20">
              <Settings className="w-3.5 h-3.5 text-emerald-200" /> {ui.settingsBadge}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">{ui.deviceConfigTitle}</h1>
            <p className="text-emerald-100 text-sm">{ui.heroSubtitle}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 self-stretch sm:self-auto">
            {[
              { icon: Server,  val: devices.length,                   label: ui.total, color: 'bg-white/15 border-white/10' },
              { icon: Wifi,    val: onlineCount,                       label: ui.online,  color: 'bg-emerald-500/20 border-emerald-400/20' },
              { icon: WifiOff, val: devices.length - onlineCount,      label: ui.offline, color: 'bg-red-500/20 border-red-400/20'  },
            ].map(kpi => (
              <div key={kpi.label} className={`flex flex-col items-center ${kpi.color} backdrop-blur-sm rounded-2xl px-4 py-3 min-w-[72px] border flex-1 sm:flex-none`}>
                <kpi.icon className="w-4 h-4 text-white/60 mb-1" />
                <span className="text-2xl font-black text-white leading-none">{kpi.val}</span>
                <span className="text-slate-300 text-xs mt-0.5">{kpi.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Refresh bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchDeviceName}
              onChange={e => setSearchDeviceName(e.target.value)}
              placeholder={ui.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
            />
          </div>
          <button onClick={fetchDevices} disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition whitespace-nowrap">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            {ui.refresh}
          </button>
          <button onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-green-800 shadow-sm transition whitespace-nowrap">
            <Plus className="w-4 h-4" />
            {ui.addDevice}
          </button>
        </div>
      </div>

      {/* Device List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-600" />
        <div className="px-4 py-4 md:px-6 md:py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-500" />
            {t('deviceList') || ui.deviceList}
            <span className="ml-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{filteredDevices.length}</span>
          </h2>
        </div>

        <div className="p-3 md:p-4">
          {loading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-gray-500 text-sm">{ui.loading}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <WifiOff className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button onClick={fetchDevices} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">{ui.retry}</button>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
              <Server className="w-12 h-12 opacity-30" />
              <p className="text-sm">{ui.notFound}</p>
            </div>
          ) : (
            <>
              {/* ── Mobile cards (< md) ── */}
              <div className="md:hidden space-y-3">
                {filteredDevices.map((device) => (
                  <div key={device.deviceID} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">
                          {device.deviceName || device.name || '-'}
                        </span>
                        <p className="text-xs text-gray-400 font-mono mt-1">{device.GEsaveID || '-'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                          device.connection === 'ONLINE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {device.connection === 'ONLINE' ? <Wifi className="w-3 h-3"/> : <WifiOff className="w-3 h-3"/>}
                          {device.connection === 'ONLINE' ? ui.statusOnline : device.connection === 'OFFLINE' ? ui.statusOffline : '-'}
                        </span>
                        <div className="flex gap-1.5">
                          <button onClick={() => openView(device)} className="w-8 h-8 bg-green-600 text-white rounded-xl flex items-center justify-center shadow hover:bg-green-700 transition">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(device)} className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow hover:bg-blue-700 transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(device)} className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center shadow hover:bg-red-600 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Customer info - keeping context */}
                    {(device.customerName || device.customerPhone) && (
                      <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
                        {device.customerName && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-800">{device.customerName}</span>
                          </div>
                        )}
                        {device.customerPhone && (
                          <a href={`tel:${device.customerPhone}`} className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            {device.customerPhone}
                          </a>
                        )}
                        {device.customerAddress && (
                          <div className="flex items-start gap-2 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                            <span className="leading-snug">{device.customerAddress}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Device meta */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                        <p className="text-gray-400 mb-0.5">{ui.email}</p>
                        <p className="font-medium text-gray-700 truncate">{device.owner || device.U_email || '-'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                        <p className="text-gray-400 mb-0.5">{ui.ipAddress}</p>
                        <p className="font-medium text-gray-700 font-mono">{device.ipAddress || '-'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                        <p className="text-gray-400 mb-0.5">{ui.lastUpdate}</p>
                        <p className={`font-semibold ${device.connection === 'ONLINE' ? 'text-emerald-600' : 'text-red-500'}`}>{device.timeSinceUpdate || '-'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                        <p className="text-gray-400 mb-0.5">{ui.registerDate}</p>
                        <p className="font-medium text-gray-700">{device.registerDate || device.created_at || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Desktop table (≥ md) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                      {ui.tableHeaders.map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDevices.map((device, index) => (
                      <tr key={device.deviceID} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
                        <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{index + 1}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <button onClick={() => openView(device)} className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700 transition shadow-sm" title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openEdit(device)} className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition shadow-sm" title={ui.edit}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(device)} className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition shadow-sm" title={ui.delete}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm">
                            {device.deviceName || device.name || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 font-mono">{device.GEsaveID || '-'}</td>
                        <td className="px-4 py-3.5">
                          {device.customerName
                            ? <span className="flex items-center gap-1.5 font-semibold text-gray-800"><User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0"/>{device.customerName}</span>
                            : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          {device.customerPhone
                            ? <a href={`tel:${device.customerPhone}`} className="flex items-center gap-1.5 text-blue-600 font-semibold hover:underline">
                                <Phone className="w-3.5 h-3.5 flex-shrink-0"/>{device.customerPhone}
                              </a>
                            : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px]">
                          {device.customerAddress
                            ? <span className="flex items-start gap-1.5 text-gray-600 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5"/>
                                <span className="line-clamp-2">{device.customerAddress}</span>
                              </span>
                            : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[140px] truncate">{device.owner || device.U_email || '-'}</td>
                        
                        {/* Installation Type Column */}
                        <td className="px-4 py-3.5">
                          {editingRecordScope === device.deviceID ? (
                            <div className="flex gap-2 items-center">
                              <select
                                value={selectedRecordScope || device.record_scope || 'installed'}
                                onChange={(e) => setSelectedRecordScope(e.target.value as 'pre_install' | 'installed' | 'in_out')}
                                className="px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pre_install">📝 {ui.preInstallLabel || 'Pre-Install'}</option>
                                <option value="installed">✓ {ui.installedLabel || 'Installed'}</option>
                                <option value="in_out">🔄 {ui.inOutLabel || 'IN-OUT'}</option>
                              </select>
                              <button
                                onClick={updateRecordScope}
                                disabled={updatingRecordScope}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRecordScope(null);
                                  setSelectedRecordScope(null);
                                }}
                                className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                device.record_scope === 'pre_install'
                                  ? 'bg-blue-100 text-blue-700'
                                  : device.record_scope === 'in_out'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-green-100 text-green-700'
                              }`}>
                                {device.record_scope === 'pre_install' ? '📝' : device.record_scope === 'in_out' ? '🔄' : '✓'} {device.record_scope === 'pre_install' ? (ui.preInstallLabel || 'Pre-Install') : device.record_scope === 'in_out' ? (ui.inOutLabel || 'IN-OUT') : (ui.installedLabel || 'Installed')}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingRecordScope(device.deviceID || null);
                                  setSelectedRecordScope(device.record_scope || 'installed');
                                }}
                                className="w-6 h-6 text-gray-400 hover:text-blue-600 flex items-center justify-center"
                                title="แก้ไข"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            device.connection === 'ONLINE'
                              ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-red-100 text-red-600 ring-1 ring-red-200'
                          }`}>
                            {device.connection === 'ONLINE' ? <Wifi className="w-3 h-3"/> : <WifiOff className="w-3 h-3"/>}
                            {device.connection === 'ONLINE' ? ui.statusOnline : device.connection === 'OFFLINE' ? ui.statusOffline : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 font-mono">{device.ipAddress || '-'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-semibold ${device.connection === 'ONLINE' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {device.timeSinceUpdate || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{device.registerDate || device.created_at || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination info */}
          {!loading && !error && filteredDevices.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
              {ui.showing} {filteredDevices.length} {ui.fromTotal} {devices.length} {ui.devicesUnit}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Edit Modal */}
      {/* View Modal */}
      {viewingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium">Device ID: {viewingDevice.deviceID}</p>
                <h2 className="text-white font-bold text-lg">{viewingDevice.deviceName || viewingDevice.name}</h2>
              </div>
              <button onClick={() => setViewingDevice(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Customer info */}
              {(viewingDevice.customerName || viewingDevice.customerPhone || viewingDevice.customerAddress) && (
                <div className="bg-green-50/60 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {ui.customerInfo}
                    {viewingDevice.mmgID && <span className="ml-auto text-green-500 font-normal normal-case">mmgID: {viewingDevice.mmgID}</span>}
                  </p>
                  {viewingDevice.customerName && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameLabel}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                        {viewingDevice.customerName}
                      </div>
                    </div>
                  )}
                  {viewingDevice.customerNameEn && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameEnLabel}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                        {viewingDevice.customerNameEn}
                      </div>
                    </div>
                  )}
                  {viewingDevice.customerNameKr && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameKrLabel}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                        {viewingDevice.customerNameKr}
                      </div>
                    </div>
                  )}
                  {viewingDevice.customerPhone && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{ui.phoneLabel}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`tel:${viewingDevice.customerPhone}`} className="text-blue-600 hover:underline">
                          {viewingDevice.customerPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  {viewingDevice.customerAddress && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{ui.addressLabel}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{viewingDevice.customerAddress}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Device info */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{ui.deviceInfo}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.meterCodeLabel || 'รหัสมิเตอร์'}</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-mono">
                      {viewingDevice.GEsaveID || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.ipAddress}</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-mono">
                      {viewingDevice.ipAddress || '-'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.locationNameLabel || ui.locationLabel}</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                    {viewingDevice.location || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.ownerEmailLabel}</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                    {viewingDevice.owner || viewingDevice.U_email || '-'}
                  </div>
                </div>
                {(viewingDevice.latitude || viewingDevice.longitude) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{ui.latitudeLabel}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                        {viewingDevice.latitude || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{ui.longitudeLabel}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                        {viewingDevice.longitude || '-'}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${
                      viewingDevice.connection === 'ONLINE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {viewingDevice.connection === 'ONLINE' ? <Wifi className="w-3 h-3"/> : <WifiOff className="w-3 h-3"/>}
                      {viewingDevice.connection === 'ONLINE' ? ui.statusOnline : ui.statusOffline}
                    </span>
                  </div>
                </div>
                {viewingDevice.timeSinceUpdate && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.lastUpdate}</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
                      {viewingDevice.timeSinceUpdate}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
              <button onClick={() => { setViewingDevice(null); openEdit(viewingDevice); }}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md">
                <Edit2 className="w-4 h-4" />
                {ui.edit}
              </button>
              <button onClick={() => setViewingDevice(null)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                {ui.close || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium">ID: {editingDevice.deviceID}</p>
                <h2 className="text-white font-bold text-lg">{editForm.deviceName || editingDevice.deviceName}</h2>
              </div>
              <button onClick={() => setEditingDevice(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Customer info */}
              <div className="bg-blue-50/60 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {ui.customerInfo}
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameLabel}</label>
                  <input value={editForm.customerName ?? ''} onChange={e => setEditForm(f => ({...f, customerName: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.customerNamePlaceholder} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameEnLabel}</label>
                  <input value={editForm.customerNameEn ?? ''} onChange={e => setEditForm(f => ({...f, customerNameEn: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.customerNameEnPlaceholder} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameKrLabel}</label>
                  <input value={editNameKR} onChange={e => setEditNameKR(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.customerNameKrPlaceholder} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.phoneLabel}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={editForm.customerPhone ?? ''} onChange={e => setEditForm(f => ({...f, customerPhone: e.target.value}))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={ui.phonePlaceholder} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.addressLabel}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <textarea rows={3} value={editForm.customerAddress ?? ''} onChange={e => setEditForm(f => ({...f, customerAddress: e.target.value}))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder={ui.addressPlaceholder} />
                  </div>
                </div>
                {/* momoge_cus identifiers */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Meter ID</label>
                    <input value={editMeterID} onChange={e => setEditMeterID(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="meter-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Location ID</label>
                    <input value={editLocationID} onChange={e => setEditLocationID(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="loc-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Serial ID</label>
                    <input value={editSerailID} onChange={e => setEditSerailID(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="SN-..." />
                  </div>
                </div>
                {editMmgID && (
                  <p className="text-xs text-gray-400">mmgID: {editMmgID}</p>
                )}
              </div>
              {/* Device info */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{ui.deviceInfo}</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.deviceNameLabel}</label>
                  <input value={editForm.deviceName ?? ''} onChange={e => setEditForm(f => ({...f, deviceName: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.deviceNamePlaceholder} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.ownerEmailLabel}</label>
                  <input value={editForm.owner ?? ''} onChange={e => setEditForm(f => ({...f, owner: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.ownerEmailPlaceholder} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.locationNameLabel || ui.locationLabel}</label>
                  <input value={editForm.location ?? ''} onChange={e => setEditForm(f => ({...f, location: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.locationPlaceholder} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.latitudeLabel}</label>
                    <input value={editForm.latitude ?? ''} onChange={e => setEditForm(f => ({...f, latitude: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="13.7563" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.longitudeLabel}</label>
                    <input value={editForm.longitude ?? ''} onChange={e => setEditForm(f => ({...f, longitude: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="100.5018" />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => openMapPicker('edit')}
                    className="w-full px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    {ui.geocodeBtn}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">{ui.geocodeHint}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.ipAddress}</label>
                  <input value={editForm.ipAddress ?? ''} onChange={e => setEditForm(f => ({...f, ipAddress: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="192.168.x.x" />
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md">
                <Save className="w-4 h-4" />
                {saving ? ui.saving : saveMsg === 'saved' ? ui.saved : ui.save}
              </button>
              <button onClick={() => setEditingDevice(null)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                {ui.cancel}
              </button>
            </div>
            {saveMsg === 'error' && (
              <p className="px-6 pb-4 text-red-500 text-xs text-center">{ui.saveError}</p>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">{ui.addTitle}</h2>
                <p className="text-white/80 text-xs mt-0.5">{ui.addHint}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Installation Type Selection */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 space-y-3 border border-amber-200">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">{ui.installationTypeLabel} *</p>
                <div className="grid grid-cols-3 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition ${
                    installationType === 'pre_install'
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}>
                    <input
                      type="radio"
                      name="installationType"
                      value="pre_install"
                      checked={installationType === 'pre_install'}
                      onChange={(e) => setInstallationType(e.target.value as 'pre_install' | 'installed' | 'in_out')}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-gray-800">{ui.preInstallLabel}</p>
                      <p className="text-xs text-gray-600">{ui.preInstallDesc}</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition ${
                    installationType === 'installed'
                      ? 'bg-green-100 border-green-500'
                      : 'bg-white border-gray-200 hover:border-green-300'
                  }`}>
                    <input
                      type="radio"
                      name="installationType"
                      value="installed"
                      checked={installationType === 'installed'}
                      onChange={(e) => setInstallationType(e.target.value as 'pre_install' | 'installed' | 'in_out')}
                      className="w-4 h-4 accent-green-600"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-gray-800">{ui.installedLabel}</p>
                      <p className="text-xs text-gray-600">{ui.installedDesc}</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition ${
                    installationType === 'in_out'
                      ? 'bg-purple-100 border-purple-500'
                      : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}>
                    <input
                      type="radio"
                      name="installationType"
                      value="in_out"
                      checked={installationType === 'in_out'}
                      onChange={(e) => setInstallationType(e.target.value as 'pre_install' | 'installed' | 'in_out')}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-gray-800">{ui.inOutLabel}</p>
                      <p className="text-xs text-gray-600">{ui.inOutDesc}</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{ui.deviceInfo}</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.deviceNameLabel} *</label>
                  <div className="space-y-2">
                    <input
                      list="product-name-list"
                      value={addForm.deviceName ?? ''}
                      onChange={e => setAddForm(f => ({ ...f, deviceName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={ui.deviceNamePlaceholder}
                    />
                    <datalist id="product-name-list">
                      {productNames.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-500">
                      {ui.deviceNamePlaceholder || 'Search product name'} ({productNames.length} items)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.meterCodeLabel || 'รหัสมิเตอร์'}</label>
                  <input
                    value={addForm.GEsaveID ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, GEsaveID: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.meterCodePlaceholder || 'กรอกเอง'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.serialNoLabel}</label>
                  <input
                    value={addForm.seriesNo ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, seriesNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.serialNoPlaceholder || 'กรอกเอง'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.locationNameLabel || ui.locationLabel}</label>
                  <select
                    value={addFormSite}
                    onChange={(e) => {
                      const site = e.target.value as 'thailand' | 'korea';
                      setAddFormSite(site);
                      setAddForm((f) => ({ ...f, location: siteDisplayLocation(site) }));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="thailand">{ui.siteThailand || 'ไทย'}</option>
                    <option value="korea">{ui.siteKorea || 'เกาหลี'}</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.latitudeLabel}</label>
                    <input
                      value={addForm.latitude ?? ''}
                      onChange={e => setAddForm(f => ({ ...f, latitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="13.7563"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{ui.longitudeLabel}</label>
                    <input
                      value={addForm.longitude ?? ''}
                      onChange={e => setAddForm(f => ({ ...f, longitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="100.5018"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.devicePhoneLabel}</label>
                  <input
                    value={addForm.phone ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.devicePhonePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.ipAddress}</label>
                  <input
                    value={addForm.ipAddress ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, ipAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="192.168.x.x"
                  />
                </div>
              </div>

              <div className="bg-blue-50/60 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {ui.customerInfo}
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameLabel}</label>
                  <div className="space-y-2">
                    <input
                      value={addForm.customerName ?? ''}
                      onChange={e => setAddForm(f => ({ ...f, customerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={ui.customerNamePlaceholder}
                    />
                    <button
                      type="button"
                      disabled={savingCusDirect}
                      onClick={saveCusInfoDirect}
                      className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
                    >
                      {savingCusDirect ? ui.loading : ui.saveCusInfo}
                    </button>
                    {saveCusMsgDirect && (
                      <p className={`text-xs font-medium mt-1 ${saveCusMsgDirect.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>
                        {saveCusMsgDirect}
                      </p>
                    )}
                    {customerLoading && <p className="text-xs text-gray-500">{ui.loading}</p>}
                    {!customerLoading && customerResults.length > 0 && (
                      <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-sm">
                        {customerResults.map((c) => (
                          <button
                            key={c.cusID}
                            type="button"
                            onClick={() => {
                              const fullAddr = [c.house_number, c.moo, c.tambon, c.amphoe, c.province, c.postcode]
                                .filter(Boolean)
                                .join(' ');
                              const companyTh = c.company || '';
                              const companyEn = getCustomerCompanyEn(c);
                              setAddForm(f => ({
                                ...f,
                                customer_id: c.cusID,
                                customerName: companyTh || c.fullname || '',
                                customerNameEn: companyEn || f.customerNameEn || '',
                                customerPhone: c.phone || '',
                                customerAddress: fullAddr || f.customerAddress
                              }));
                              setCustomerResults([]);
                              setCustomerSearchTerm('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                          >
                            <div className="font-semibold text-gray-800">{c.company || c.fullname || '-'}</div>
                            {getCustomerCompanyEn(c) && (
                              <div className="text-xs font-medium text-emerald-700">{getCustomerCompanyEn(c)}</div>
                            )}
                            <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                              {c.phone && <span>{c.phone}</span>}
                              {c.email && <span>{c.email}</span>}
                              {c.fullname && <span>{c.fullname}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.phoneLabel}</label>
                  <input
                    value={addForm.customerPhone ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, customerPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.phonePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameEnLabel}</label>
                  <input
                    value={addForm.customerNameEn ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, customerNameEn: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.customerNameEnPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.customerNameKrLabel}</label>
                  <input
                    value={addNameKR}
                    onChange={e => setAddNameKR(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={ui.customerNameKrPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{ui.addressLabel}</label>
                  <textarea
                    rows={3}
                    value={addForm.customerAddress ?? ''}
                    onChange={e => setAddForm(f => ({ ...f, customerAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder={ui.addressPlaceholder}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => openMapPicker('add')}
                    className="w-full px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    {ui.geocodeBtn || 'ค้นหาพิกัดจากที่อยู่'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">{ui.geocodeHint}</p>
                </div>
                {/* momoge_cus identifiers */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Meter ID</label>
                    <input value={addMeterID} onChange={e => setAddMeterID(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="meter-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Location ID</label>
                    <input value={addLocationID} onChange={e => setAddLocationID(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="loc-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Serial ID</label>
                    <input value={addSerailID} onChange={e => setAddSerailID(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="SN-..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
              <button onClick={saveAdd} disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md">
                <Plus className="w-4 h-4" />
                {creating ? ui.creating : createMsg === 'saved' ? ui.created : ui.create}
              </button>
              <button onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                {ui.cancel}
              </button>
            </div>

            {createMsg && createMsg !== 'saved' && (
              <p className="px-6 pb-4 text-red-500 text-xs text-center">
                {createMsg === 'error'
                  ? ((addForm.deviceName ?? '').trim() ? ui.createError : ui.deviceNameRequired)
                  : createMsg}
              </p>
            )}
          </div>
        </div>
      )}

      <GeocodeMapPickerModal
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onApply={applyMapCoordinates}
        initialAddress={mapPickerAddress}
        initialLat={mapPickerLat}
        initialLng={mapPickerLng}
        site={mapPickerSite}
        labels={{
          title: ui.mapPickerTitle || ui.geocodeBtn,
          searchPlaceholder: ui.mapPickerSearch || ui.addressPlaceholder,
          searchBtn: ui.mapPickerSearchBtn || ui.search,
          apply: ui.mapPickerApply || ui.save,
          cancel: ui.cancel,
          clickHint: ui.mapPickerClickHint || ui.geocodeHint,
          lat: ui.latitudeLabel,
          lng: ui.longitudeLabel,
          searching: ui.loading,
          notFound: ui.mapPickerNotFound || 'Not found',
        }}
      />
    </>
  );
}
