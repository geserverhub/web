'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/lib/LocaleContext'
import { useSite } from '@/lib/SiteContext'
import {
  Activity, Zap, Wifi, WifiOff, RefreshCw, ArrowRight,
  Server, CheckCircle2, XCircle, Leaf,
  BarChart2, Monitor, Settings, ChevronRight, Search,
  Edit2, MapPin,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DashboardStats {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  energySaved: number
}

interface RecentDevice {
  deviceID: string
  deviceName: string
  recordScope?: 'installed' | 'pre_install' | string
  customerName?: string
  customerNameEn?: string
  customerPhone?: string
  customerAddress?: string
  seriesNo?: string
  ksaveID?: string
  metricsMeterNo?: string
  beforeMeterNo?: string
  ipAddress?: string
  location: string
  isOnline: boolean
  lastUpdate: string
  voltageLL: Array<number | null>
  currentABC: Array<number | null>
  beforeCurrentABC?: Array<number | null>
  avgCurrent: number | null
  avgBeforeCurrent?: number | null
  currentReduction?: number | null
  imbalancePercent: number | null
  thdABC?: Array<number | null>
  avgThd?: number | null
  // Power & Energy
  activePower?: number | null
  reactivePower?: number | null
  apparentPower?: number | null
  powerFactor?: number | null
  frequency?: number | null
  energyKwh?: number | null
  beforeKwh?: number | null
  beforeActivePower?: number | null
  beforeReactivePower?: number | null
  beforeApparentPower?: number | null
  beforePowerFactor?: number | null
  beforeFrequency?: number | null
  beforeThd?: number | null
  beforeLastUpdate?: string
  energyReduction?: number | null
  co2Reduction?: number | null
}

interface DashboardData {
  stats: DashboardStats
  recentDevices: RecentDevice[]
}

const normalizeDeviceKey = (device: Pick<RecentDevice, 'deviceID' | 'deviceName'>) => {
  const primaryKey = device.deviceID ?? device.deviceName ?? ''
  return String(primaryKey).trim().toUpperCase()
}

const normalizeLookupValue = (value: string | number | null | undefined) => {
  return String(value ?? '').trim().toUpperCase()
}

const getDeviceTimestamp = (device: Pick<RecentDevice, 'lastUpdate'>) => {
  if (!device.lastUpdate) return 0
  const timestamp = new Date(device.lastUpdate).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

const isPreInstallScope = (scope?: string | null) => {
  const normalized = String(scope || '').trim().toLowerCase()
  return normalized === 'pre_install' || normalized === 'pre-install' || normalized === 'preinstall'
}

const companyNameFallbackMap: Record<string, string> = {
  'บริษัท ซีเจ มอร์ จำกัด': 'CJ MORE Co., Ltd.',
  'บริษัท คาลเท็กซ์ (ไทยแลนด์) จำกัด': 'Caltex (Thailand) Co., Ltd.'
}

const getLocalizedCustomerName = (
  device: Pick<RecentDevice, 'customerName' | 'customerNameEn' | 'deviceName'>,
  locale: string
) => {
  const customerName = (device.customerName || '').trim()
  const customerNameEn = (device.customerNameEn || '').trim()

  if (locale === 'th') {
    return customerName || device.deviceName || '-'
  }

  const fallbackEn = customerName ? companyNameFallbackMap[customerName] : undefined
  return customerNameEn || fallbackEn || device.deviceName || customerName || '-'
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLocale()
  const { selectedSite, setSelectedSite } = useSite()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nowStr, setNowStr] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAllDevices, setShowAllDevices] = useState(false)
  const [showAllCurrentAnalysis, setShowAllCurrentAnalysis] = useState(false)
  const focusedDeviceParam = normalizeLookupValue(searchParams.get('device'))
  const focusedKsaveParam = normalizeLookupValue(searchParams.get('ksave'))
  const requestedSiteParam = String(searchParams.get('site') || '').trim().toLowerCase()
  const hasFocusedDevice = Boolean(focusedDeviceParam || focusedKsaveParam)

  useEffect(() => {
    if (!requestedSiteParam) return
    if (!['thailand', 'korea', 'vietnam', 'malaysia'].includes(requestedSiteParam)) return
    if (requestedSiteParam === selectedSite) return
    setSelectedSite(requestedSiteParam as 'thailand' | 'korea' | 'vietnam' | 'malaysia')
  }, [requestedSiteParam, selectedSite, setSelectedSite])

  // Reset location filter when country changes
  useEffect(() => {
    setSearchTerm('')
  }, [selectedSite])

  useEffect(() => {
    const localeMap: Record<string, string> = {
      th: 'th-TH',
      ko: 'ko-KR',
      en: 'en-US',
      cn: 'zh-CN',
      vn: 'vi-VN',
      ms: 'ms-MY',
    }
    const lang = localeMap[locale] ?? 'en-US'
    const d = new Date()
    setNowStr(
      d.toLocaleDateString(lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
    )
  }, [locale])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/kenergy/dashboard-stats?site=${selectedSite}`)
      const json = await res.json()
      if (json.success) { setData(json.data); setError(null) }
      else setError(json.error || 'Failed to load dashboard data')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [selectedSite])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  if (loading && !data) {
    return (
      <div className="p-5 space-y-5 animate-pulse">
        <div className="h-48 bg-gradient-to-r from-slate-200 to-slate-100 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  if (error && !data) {
    const errMsg = ({ th: 'โหลดแดชบอร์ดไม่สำเร็จ', ko: '대시보드를 불러오지 못했습니다' } as Record<string, string>)[locale] ?? 'Failed to load dashboard'
    const retryMsg = ({ th: 'ลองใหม่', ko: '다시 시도' } as Record<string, string>)[locale] ?? 'Retry'
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-3xl shadow-sm border border-red-100 p-10 max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-800 font-semibold mb-1">{errMsg}</p>
          <p className="text-gray-400 text-sm mb-5">{error}</p>
          <button onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors text-sm">
            <RefreshCw className="w-4 h-4" /> {retryMsg}
          </button>
        </div>
      </div>
    )
  }

  const stats = data?.stats || { totalDevices: 0, onlineDevices: 0, offlineDevices: 0, energySaved: 0 }
  const recentDevices = data?.recentDevices || []
  const uniqueRecentDevices = Array.from(
    recentDevices.reduce((deviceMap, device) => {
      const deviceKey = normalizeDeviceKey(device)
      const existingDevice = deviceMap.get(deviceKey)

      if (!existingDevice || getDeviceTimestamp(device) >= getDeviceTimestamp(existingDevice)) {
        deviceMap.set(deviceKey, device)
      }

      return deviceMap
    }, new Map<string, RecentDevice>()).values()
  )
  const onlineRate = stats.totalDevices > 0 ? Math.round((stats.onlineDevices / stats.totalDevices) * 100) : 0
  const searchQuery = searchTerm.trim().toLowerCase()
  const dashboardCopy = {
    th: {
      searchLabel: 'กรองตามสถานที่ติดตั้ง',
      searchPlaceholder: 'ทั้งหมด',
      searchResults: 'ผลการกรอง',
      clearSearch: 'ล้าง',
      allLocations: 'ทั้งหมด',
      noSearchResults: 'ไม่พบเครื่องที่ตรงกับคำค้น',
      viewAll: 'ดูทั้งหมด',
      viewLess: 'ดูน้อยลง',
      currentTitle: 'วิเคราะห์กระแสไฟก่อนติดตั้ง',
      currentSubtitle: 'แสดงเฉพาะรายการที่บันทึกเป็นประเภทก่อนติดตั้งจริงในฐานข้อมูลเท่านั้น',
      avgCurrent: 'กระแสเฉลี่ย',
      loadBalance: 'สมดุลโหลด',
      phaseCurrent: 'กระแสแต่ละเฟส',
      avgThd: 'THD เฉลี่ย',
      phaseThd: 'THD แต่ละเฟส',
      updatedAt: 'อัปเดตล่าสุด',
      analyze: 'ดูทั้งหมด',
      noCurrentData: 'ยังไม่มีรายการก่อนติดตั้งจริงที่บันทึกไว้',
      balanceGood: 'สมดุลดี',
      balanceWarn: 'ควรติดตาม',
      balanceRisk: 'ต่างกันสูง',
      beforeCurrentLabel: 'Before K-Save (ก่อนติดตั้ง 7-14 วัน)',
      beforeAvgCurrent: 'ค่าเฉลี่ยก่อนติดตั้ง',
      waitingMeter: 'รอรับข้อมูลจากมิเตอร์',
      modelLabel: 'รุ่น',
      meterNoLabel: 'เลขมิเตอร์',
      telLabel: 'โทร.',
      addressLabel: 'ที่อยู่',
      currentReduced: 'กระแสลดลง'
    },
    en: {
      searchLabel: 'Filter by Location',
      searchPlaceholder: 'All Locations',
      searchResults: 'Filtered Results',
      clearSearch: 'Clear',
      allLocations: 'All Locations',
      noSearchResults: 'No devices match your search',
      viewAll: 'View All',
      viewLess: 'View Less',
      currentTitle: 'Pre-Install Current Analysis',
      currentSubtitle: 'Showing only records saved in the database as pre-install devices.',
      avgCurrent: 'Avg Current',
      loadBalance: 'Load Balance',
      phaseCurrent: 'Phase Current',
      avgThd: 'Avg THD',
      phaseThd: 'Phase THD',
      updatedAt: 'Last Update',
      analyze: 'View All',
      noCurrentData: 'No pre-install records found',
      balanceGood: 'Balanced',
      balanceWarn: 'Monitor',
      balanceRisk: 'High Gap',
      beforeCurrentLabel: 'Before K-Save (7-14 days pre-install)',
      beforeAvgCurrent: 'Avg Before Install',
      waitingMeter: 'Waiting for meter data',
      modelLabel: 'Model',
      meterNoLabel: 'Meter No.',
      telLabel: 'Tel.',
      addressLabel: 'Address',
      currentReduced: 'Current Reduced'
    },
    ko: {
      searchLabel: '설치 위치로 필터',
      searchPlaceholder: '전체',
      searchResults: '필터 결과',
      clearSearch: '지우기',
      allLocations: '전체',
      noSearchResults: '검색 조건과 일치하는 장치가 없습니다',
      viewAll: '전체 보기',
      viewLess: '간단히 보기',
      currentTitle: '설치 전 전류 분석',
      currentSubtitle: '데이터베이스에 설치 전 항목으로 저장된 장치만 표시합니다.',
      avgCurrent: '평균 전류',
      loadBalance: '부하 밸런스',
      phaseCurrent: '상별 전류',
      avgThd: '평균 THD',
      phaseThd: '상별 THD',
      updatedAt: '최근 업데이트',
      analyze: '전체 보기',
      noCurrentData: '저장된 설치 전 항목이 없습니다',
      balanceGood: '양호',
      balanceWarn: '확인 필요',
      balanceRisk: '편차 큼',
      beforeCurrentLabel: 'K-Save 설치 전 (7-14일)',
      beforeAvgCurrent: '설치 전 평균 전류',
      waitingMeter: '미터 데이터 대기 중',
      modelLabel: '모델',
      meterNoLabel: '계량기 번호',
      telLabel: '전화',
      addressLabel: '주소',
      currentReduced: '전류 감소'
    },
    cn: {
      searchLabel: '按安装位置筛选',
      searchPlaceholder: '全部位置',
      searchResults: '筛选结果',
      clearSearch: '清除',
      allLocations: '全部位置',
      noSearchResults: '没有匹配搜索条件的设备',
      viewAll: '查看全部',
      viewLess: '收起',
      currentTitle: '安装前电流分析',
      currentSubtitle: '仅显示数据库中保存为安装前类型的记录。',
      avgCurrent: '平均电流',
      loadBalance: '负载平衡',
      phaseCurrent: '各相电流',
      avgThd: '平均THD',
      phaseThd: '各相THD',
      updatedAt: '最近更新',
      analyze: '查看全部',
      noCurrentData: '暂无已保存的安装前记录',
      balanceGood: '平衡良好',
      balanceWarn: '建议关注',
      balanceRisk: '差异较高',
      beforeCurrentLabel: 'Before K-Save（安装前7-14天）',
      beforeAvgCurrent: '安装前平均电流',
      waitingMeter: '等待表计数据',
      modelLabel: '型号',
      meterNoLabel: '电表编号',
      telLabel: '电话',
      addressLabel: '地址',
      currentReduced: '电流减少'
    },
    vn: {
      searchLabel: 'Loc theo vi tri lap dat',
      searchPlaceholder: 'Tat ca vi tri',
      searchResults: 'Ket qua loc',
      clearSearch: 'Xoa',
      allLocations: 'Tat ca vi tri',
      noSearchResults: 'Khong tim thay thiet bi phu hop',
      viewAll: 'Xem tat ca',
      viewLess: 'Thu gon',
      currentTitle: 'Phan tich dong dien truoc lap dat',
      currentSubtitle: 'Chi hien thi cac ban ghi duoc luu trong co so du lieu voi loai truoc lap dat.',
      avgCurrent: 'Dong dien TB',
      loadBalance: 'Can bang tai',
      phaseCurrent: 'Dong dien tung pha',
      avgThd: 'THD TB',
      phaseThd: 'THD tung pha',
      updatedAt: 'Cap nhat gan nhat',
      analyze: 'Xem tat ca',
      noCurrentData: 'Chua co ban ghi truoc lap dat',
      balanceGood: 'Can bang tot',
      balanceWarn: 'Nen theo doi',
      balanceRisk: 'Lech cao',
      beforeCurrentLabel: 'Before K-Save (7-14 ngày trước lắp)',
      beforeAvgCurrent: 'TB trước lắp đặt',
      waitingMeter: 'Cho du lieu dong ho',
      modelLabel: 'Model',
      meterNoLabel: 'So dong ho',
      telLabel: 'Dien thoai',
      addressLabel: 'Dia chi',
      currentReduced: 'Dong dien giam'
    },
    ms: {
      searchLabel: 'Tapis mengikut Lokasi',
      searchPlaceholder: 'Semua Lokasi',
      searchResults: 'Hasil Tapisan',
      clearSearch: 'Kosongkan',
      allLocations: 'Semua Lokasi',
      noSearchResults: 'Tiada peranti yang sepadan dengan carian anda',
      viewAll: 'Lihat Semua',
      viewLess: 'Lihat Kurang',
      currentTitle: 'Analisis Arus Sebelum Pemasangan',
      currentSubtitle: 'Hanya paparkan rekod yang disimpan dalam pangkalan data sebagai peranti sebelum pemasangan.',
      avgCurrent: 'Arus Purata',
      loadBalance: 'Keseimbangan Beban',
      phaseCurrent: 'Arus Setiap Fasa',
      avgThd: 'THD Purata',
      phaseThd: 'THD Setiap Fasa',
      updatedAt: 'Kemas Kini Terakhir',
      analyze: 'Lihat Semua',
      noCurrentData: 'Tiada rekod sebelum pemasangan dijumpai',
      balanceGood: 'Seimbang',
      balanceWarn: 'Perlu Dipantau',
      balanceRisk: 'Ketidakseimbangan Tinggi',
      beforeCurrentLabel: 'Before K-Save (7-14 hari sebelum pasang)',
      beforeAvgCurrent: 'Purata Sebelum Pasang',
      waitingMeter: 'Menunggu data meter',
      modelLabel: 'Model',
      meterNoLabel: 'No. Meter',
      telLabel: 'Tel.',
      addressLabel: 'Alamat',
      currentReduced: 'Arus Berkurang'
    }
  }[locale] ?? {
    searchLabel: 'Filter by Location',
    searchPlaceholder: 'All Locations',
    searchResults: 'Filtered Results',
    clearSearch: 'Clear',
    allLocations: 'All Locations',
    noSearchResults: 'No devices match your search',
    viewAll: 'View All',
    viewLess: 'View Less',
    currentTitle: 'Pre-Install Current Analysis',
    currentSubtitle: 'Showing only records saved in the database as pre-install devices.',
    avgCurrent: 'Avg Current',
    loadBalance: 'Load Balance',
    phaseCurrent: 'Phase Current',
    avgThd: 'Avg THD',
    phaseThd: 'Phase THD',
    updatedAt: 'Last Update',
    analyze: 'View All',
    noCurrentData: 'No pre-install records found',
    balanceGood: 'Balanced',
    balanceWarn: 'Monitor',
    balanceRisk: 'High Gap',
    beforeCurrentLabel: 'Before K-Save (7-14 days pre-install)',
    beforeAvgCurrent: 'Avg Before Install',
    waitingMeter: 'Waiting for meter data',
    modelLabel: 'Model',
    meterNoLabel: 'Meter No.',
    telLabel: 'Tel.',
    addressLabel: 'Address',
    currentReduced: 'Current Reduced'
  }

  const uiCopy = {
    th: {
      dashboardTitle: 'แดชบอร์ด',
      totalTag: 'ทั้งหมด',
      totalDevices: 'อุปกรณ์ทั้งหมด',
      onlineDevices: 'ออนไลน์',
      offlineDevices: 'ออฟไลน์',
      energySavedLabel: 'พลังงานที่ประหยัด',
      failedToLoadDashboard: 'โหลดแดชบอร์ดไม่สำเร็จ',
      retry: 'ลองใหม่',
      systemBadge: 'K Energy Save System',
      kpiDevices: 'อุปกรณ์',
      kpiOnline: 'ออนไลน์',
      kpiKwhSaved: 'kWh ที่ประหยัด',
      refresh: 'รีเฟรช',
      live: 'สด',
      onlineSuffix: 'ออนไลน์',
      alert: 'แจ้งเตือน',
      needsAttention: 'ต้องตรวจสอบ',
      systemHealth: 'สถานะระบบ',
      autoRefresh60s: 'รีเฟรชอัตโนมัติทุก 60 วินาที',
      onlineRate: 'อัตราออนไลน์',
      online: 'ออนไลน์',
      offline: 'ออฟไลน์',
      co2Reduced: 'CO₂ ลดลง',
      kwhSaved: 'kWh ที่ประหยัด',
      quickActions: 'การดำเนินการด่วน',
      liveMonitor: 'มอนิเตอร์สด',
      realTimeData: 'ข้อมูลเรียลไทม์',
      analytics: 'วิเคราะห์',
      chartsReports: 'กราฟ & รายงาน',
      devices: 'อุปกรณ์',
      allDevices: 'อุปกรณ์ทั้งหมด',
      settings: 'ตั้งค่า',
      systemConfig: 'ตั้งค่าระบบ',
      voltageLineToLine: 'แรงดัน (สาย-สาย)',
      current: 'กระแส',
      thd: 'THD',
      trendTitle: 'แนวโน้มกระแส (30 นาทีล่าสุด)',
      reduction: 'ลดลง',
      beforeKsave: 'ก่อน K-Save',
      afterKsave: 'หลัง K-Save'
    },
    ko: {
      dashboardTitle: '대시보드',
      totalTag: '전체',
      totalDevices: '전체 장치',
      onlineDevices: '온라인 장치',
      offlineDevices: '오프라인 장치',
      energySavedLabel: '절약 전력량',
      failedToLoadDashboard: '대시보드를 불러오지 못했습니다',
      retry: '다시 시도',
      systemBadge: 'K Energy Save 시스템',
      kpiDevices: '장치',
      kpiOnline: '온라인',
      kpiKwhSaved: '절약 kWh',
      refresh: '새로 고침',
      live: '실시간',
      onlineSuffix: '온라인',
      alert: '경보',
      needsAttention: '확인 필요',
      systemHealth: '시스템 상태',
      autoRefresh60s: '60초마다 자동 새로 고침',
      onlineRate: '온라인 비율',
      online: '온라인',
      offline: '오프라인',
      co2Reduced: 'CO₂ 감소',
      kwhSaved: 'kWh 절약',
      quickActions: '빠른 작업',
      liveMonitor: '실시간 모니터',
      realTimeData: '실시간 데이터',
      analytics: '분석',
      chartsReports: '차트 & 보고서',
      devices: '장치',
      allDevices: '모든 장치',
      settings: '설정',
      systemConfig: '시스템 설정',
      voltageLineToLine: '전압 (선간)',
      current: '전류',
      thd: 'THD',
      trendTitle: '전류 추세 (최근 30분)',
      reduction: '감소',
      beforeKsave: 'K-Save 이전',
      afterKsave: 'K-Save 이후'
    },
    en: {
      dashboardTitle: 'Dashboard',
      totalTag: 'Total',
      totalDevices: 'Total Devices',
      onlineDevices: 'Online Devices',
      offlineDevices: 'Offline Devices',
      energySavedLabel: 'Energy Saved',
      failedToLoadDashboard: 'Failed to load dashboard',
      retry: 'Retry',
      systemBadge: 'K Energy Save System',
      kpiDevices: 'Devices',
      kpiOnline: 'Online',
      kpiKwhSaved: 'kWh Saved',
      refresh: 'Refresh',
      live: 'Live',
      onlineSuffix: 'online',
      alert: 'Alert',
      needsAttention: 'need attention',
      systemHealth: 'System Health',
      autoRefresh60s: 'Auto-refresh every 60s',
      onlineRate: 'Online Rate',
      online: 'Online',
      offline: 'Offline',
      co2Reduced: 'CO₂ reduced',
      kwhSaved: 'kWh saved',
      quickActions: 'Quick Actions',
      liveMonitor: 'Live Monitor',
      realTimeData: 'Real-time data',
      analytics: 'Analytics',
      chartsReports: 'Charts & Reports',
      devices: 'Devices',
      allDevices: 'All devices',
      settings: 'Settings',
      systemConfig: 'System config',
      voltageLineToLine: 'Voltage (Line-to-Line)',
      current: 'Current',
      thd: 'THD',
      trendTitle: 'Current Trend (Last 30 min)',
      reduction: 'Reduction',
      beforeKsave: 'Before K-Save',
      afterKsave: 'After K-Save'
    },
    cn: {
      dashboardTitle: '仪表板',
      totalTag: '总计',
      totalDevices: '设备总数',
      onlineDevices: '在线设备',
      offlineDevices: '离线设备',
      energySavedLabel: '节省电量',
      failedToLoadDashboard: '无法加载仪表板',
      retry: '重试',
      systemBadge: 'K Energy Save 系统',
      kpiDevices: '设备',
      kpiOnline: '在线',
      kpiKwhSaved: '已节省 kWh',
      refresh: '刷新',
      live: '实时',
      onlineSuffix: '在线',
      alert: '警报',
      needsAttention: '需要关注',
      systemHealth: '系统健康',
      autoRefresh60s: '每 60 秒自动刷新',
      onlineRate: '在线率',
      online: '在线',
      offline: '离线',
      co2Reduced: '减少 CO₂',
      kwhSaved: '已节省 kWh',
      quickActions: '快捷操作',
      liveMonitor: '实时监控',
      realTimeData: '实时数据',
      analytics: '分析',
      chartsReports: '图表与报告',
      devices: '设备',
      allDevices: '所有设备',
      settings: '设置',
      systemConfig: '系统配置',
      voltageLineToLine: '电压（线间）',
      current: '电流',
      thd: 'THD',
      trendTitle: '电流趋势（最近 30 分钟）',
      reduction: '降幅',
      beforeKsave: 'K-Save 前',
      afterKsave: 'K-Save 后'
    },
    vn: {
      dashboardTitle: 'Bang Dieu Khien',
      totalTag: 'Tong',
      totalDevices: 'Tong thiet bi',
      onlineDevices: 'Thiet bi truc tuyen',
      offlineDevices: 'Thiet bi ngoai tuyen',
      energySavedLabel: 'Nang luong tiet kiem',
      failedToLoadDashboard: 'Khong the tai bang dieu khien',
      retry: 'Thu lai',
      systemBadge: 'K Energy Save System',
      kpiDevices: 'Thiet bi',
      kpiOnline: 'Truc tuyen',
      kpiKwhSaved: 'kWh tiet kiem',
      refresh: 'Lam moi',
      live: 'Truc tiep',
      onlineSuffix: 'truc tuyen',
      alert: 'Canh bao',
      needsAttention: 'can kiem tra',
      systemHealth: 'Suc khoe he thong',
      autoRefresh60s: 'Tu dong lam moi moi 60 giay',
      onlineRate: 'Ty le truc tuyen',
      online: 'Truc tuyen',
      offline: 'Ngoai tuyen',
      co2Reduced: 'CO₂ giam',
      kwhSaved: 'kWh tiet kiem',
      quickActions: 'Thao tac nhanh',
      liveMonitor: 'Giam sat truc tiep',
      realTimeData: 'Du lieu thoi gian thuc',
      analytics: 'Phan tich',
      chartsReports: 'Bieu do & Bao cao',
      devices: 'Thiet bi',
      allDevices: 'Tat ca thiet bi',
      settings: 'Cai dat',
      systemConfig: 'Cau hinh he thong',
      voltageLineToLine: 'Dien ap (Line-to-Line)',
      current: 'Dong dien',
      thd: 'THD',
      trendTitle: 'Xu huong dong dien (30 phut gan nhat)',
      reduction: 'Giam',
      beforeKsave: 'Truoc K-Save',
      afterKsave: 'Sau K-Save'
    },
    ms: {
      dashboardTitle: 'Papan Pemuka',
      totalTag: 'Jumlah',
      totalDevices: 'Jumlah Peranti',
      onlineDevices: 'Peranti Dalam Talian',
      offlineDevices: 'Peranti Luar Talian',
      energySavedLabel: 'Tenaga Dijimatkan',
      failedToLoadDashboard: 'Gagal memuatkan papan pemuka',
      retry: 'Cuba Lagi',
      systemBadge: 'K Energy Save System',
      kpiDevices: 'Peranti',
      kpiOnline: 'Dalam Talian',
      kpiKwhSaved: 'kWh Dijimatkan',
      refresh: 'Muat Semula',
      live: 'Langsung',
      onlineSuffix: 'dalam talian',
      alert: 'Amaran',
      needsAttention: 'perlu perhatian',
      systemHealth: 'Kesihatan Sistem',
      autoRefresh60s: 'Muat semula automatik setiap 60 saat',
      onlineRate: 'Kadar Dalam Talian',
      online: 'Dalam Talian',
      offline: 'Luar Talian',
      co2Reduced: 'CO₂ dikurangkan',
      kwhSaved: 'kWh dijimatkan',
      quickActions: 'Tindakan Pantas',
      liveMonitor: 'Pemantau Langsung',
      realTimeData: 'Data masa nyata',
      analytics: 'Analitik',
      chartsReports: 'Carta & Laporan',
      devices: 'Peranti',
      allDevices: 'Semua peranti',
      settings: 'Tetapan',
      systemConfig: 'Konfigurasi sistem',
      voltageLineToLine: 'Voltan (Line-to-Line)',
      current: 'Arus',
      thd: 'THD',
      trendTitle: 'Trend Arus (30 minit terakhir)',
      reduction: 'Pengurangan',
      beforeKsave: 'Sebelum K-Save',
      afterKsave: 'Selepas K-Save'
    }
  }[locale] ?? {
    dashboardTitle: 'Dashboard',
    totalTag: 'Total',
    totalDevices: 'Total Devices',
    onlineDevices: 'Online Devices',
    offlineDevices: 'Offline Devices',
    energySavedLabel: 'Energy Saved',
    failedToLoadDashboard: 'Failed to load dashboard',
    retry: 'Retry',
    systemBadge: 'K Energy Save System',
    kpiDevices: 'Devices',
    kpiOnline: 'Online',
    kpiKwhSaved: 'kWh Saved',
    refresh: 'Refresh',
    live: 'Live',
    onlineSuffix: 'online',
    alert: 'Alert',
    needsAttention: 'need attention',
    systemHealth: 'System Health',
    autoRefresh60s: 'Auto-refresh every 60s',
    onlineRate: 'Online Rate',
    online: 'Online',
    offline: 'Offline',
    co2Reduced: 'CO₂ reduced',
    kwhSaved: 'kWh saved',
    quickActions: 'Quick Actions',
    liveMonitor: 'Live Monitor',
    realTimeData: 'Real-time data',
    analytics: 'Analytics',
    chartsReports: 'Charts & Reports',
    devices: 'Devices',
    allDevices: 'All devices',
    settings: 'Settings',
    systemConfig: 'System config',
    voltageLineToLine: 'Voltage (Line-to-Line)',
    current: 'Current',
    thd: 'THD',
    trendTitle: 'Current Trend (Last 30 min)',
    reduction: 'Reduction',
    beforeKsave: 'Before K-Save',
    afterKsave: 'After K-Save'
  }

  const uniqueLocations = Array.from(
    new Set(uniqueRecentDevices.map(d => d.location).filter(Boolean))
  ).sort() as string[]

  const matchesFocusedDevice = (device: RecentDevice) => {
    if (!hasFocusedDevice) return true
    const matchesDevice = focusedDeviceParam
      ? normalizeLookupValue(device.deviceID) === focusedDeviceParam || normalizeLookupValue(device.deviceName) === focusedDeviceParam
      : false
    const matchesKsave = focusedKsaveParam
      ? normalizeLookupValue(device.ksaveID) === focusedKsaveParam
      : false
    return matchesDevice || matchesKsave
  }

  const matchesSearch = (device: RecentDevice) => {
    if (!searchQuery) return true
    return (device.location ?? '').toLowerCase() === searchQuery
  }

  const searchedDevices = uniqueRecentDevices.filter(matchesSearch).filter(matchesFocusedDevice)
  const filteredRecentDevices = searchedDevices.filter((device) => {
    if (isPreInstallScope(device.recordScope)) return false
    return Boolean(device.lastUpdate)
  })
  const filteredCurrentAnalysisDevices = searchedDevices.filter((device) => {
    if (!isPreInstallScope(device.recordScope)) return false
    return Boolean(device.beforeLastUpdate || device.lastUpdate)
  })
  const visibleRecentDevices = showAllDevices ? filteredRecentDevices : filteredRecentDevices.slice(0, 6)
  const visibleCurrentAnalysisDevices = showAllCurrentAnalysis
    ? filteredCurrentAnalysisDevices
    : filteredCurrentAnalysisDevices.slice(0, 6)

  const formatAmp = (value: number | null) => value === null ? '--' : `${value.toFixed(1)} A`
  const formatTime = (value: string) => value ? new Date(value).toLocaleString() : '-'
  const getBalanceState = (imbalancePercent: number | null) => {
    if (imbalancePercent === null) {
      return {
        label: '--',
        className: 'bg-gray-100 text-gray-500 border-gray-200'
      }
    }
    if (imbalancePercent <= 10) {
      return {
        label: dashboardCopy.balanceGood,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    }
    if (imbalancePercent <= 20) {
      return {
        label: dashboardCopy.balanceWarn,
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      }
    }
    return {
      label: dashboardCopy.balanceRisk,
      className: 'bg-rose-50 text-rose-700 border-rose-200'
    }
  }

  return (
    <div className="p-5 space-y-5 bg-gray-50 min-h-screen">
      {hasFocusedDevice && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-sky-800">Focused Device View</p>
            <p className="text-xs text-sky-700 mt-1">
              Showing dashboard cards for {searchParams.get('ksave') || searchParams.get('device') || 'selected device'} only.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
          >
            Clear Focus
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-xl" />

        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
              {uiCopy.systemBadge}
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {uiCopy.dashboardTitle}
            </h1>
            <p className="text-emerald-100 text-sm">{nowStr}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {[
              { val: stats.totalDevices, label: uiCopy.kpiDevices },
              { val: `${onlineRate}%`, label: uiCopy.kpiOnline },
              { val: stats.energySaved.toLocaleString(), label: uiCopy.kpiKwhSaved },
            ].map(kpi => (
              <div key={kpi.label} className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 min-w-[88px] border border-white/20">
                <span className="text-2xl font-bold text-white leading-none">{kpi.val}</span>
                <span className="text-emerald-200 text-xs mt-1">{kpi.label}</span>
              </div>
            ))}
            <button onClick={fetchDashboardData} title={uiCopy.refresh}
              className="p-3 bg-white/15 hover:bg-white/25 rounded-xl border border-white/20 transition-all">
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Devices */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white group hover:shadow-xl transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-1 -top-6 w-16 h-16 bg-white/5 rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Server className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
              {uiCopy.totalTag}
            </span>
          </div>
          <p className="text-4xl font-black text-white leading-none mb-1">{stats.totalDevices}</p>
          <p className="text-blue-100 text-xs font-medium">{uiCopy.totalDevices}</p>
        </div>

        {/* Online */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg p-5 text-white group hover:shadow-xl transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
              {uiCopy.live}
            </span>
          </div>
          <p className="text-4xl font-black text-white leading-none mb-1">{stats.onlineDevices}</p>
          <p className="text-emerald-100 text-xs font-medium mb-3">{uiCopy.onlineDevices}</p>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${onlineRate}%` }} />
          </div>
          <p className="text-emerald-100 text-xs mt-1 text-right">{onlineRate}% {uiCopy.onlineSuffix}</p>
        </div>

        {/* Offline */}
        <div className={`relative overflow-hidden rounded-2xl shadow-lg p-5 text-white group hover:shadow-xl transition-all ${
          stats.offlineDevices > 0
            ? 'bg-gradient-to-br from-red-500 to-rose-600'
            : 'bg-gradient-to-br from-slate-400 to-slate-500'
        }`}>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <WifiOff className="w-5 h-5 text-white" />
            </div>
            {stats.offlineDevices > 0 && (
              <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full animate-pulse">
                ⚠ {uiCopy.alert}
              </span>
            )}
          </div>
          <p className="text-4xl font-black text-white leading-none mb-1">{stats.offlineDevices}</p>
          <p className="text-red-100 text-xs font-medium">{uiCopy.offlineDevices}</p>
          {stats.offlineDevices > 0 && (
            <p className="text-white/70 text-xs mt-2">{stats.offlineDevices} {uiCopy.devices} {uiCopy.needsAttention}</p>
          )}
        </div>

        {/* Energy Saved */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg p-5 text-white group hover:shadow-xl transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
              kWh
            </span>
          </div>
          <p className="text-4xl font-black text-white leading-none mb-1">{stats.energySaved.toLocaleString()}</p>
          <p className="text-amber-100 text-xs font-medium mb-2">{uiCopy.energySavedLabel}</p>
          <div className="flex items-center gap-1.5">
            <Leaf className="w-3 h-3 text-white/70" />
            <span className="text-white/70 text-xs">~{(stats.energySaved * 0.5).toLocaleString()} kg {uiCopy.co2Reduced}</span>
          </div>
        </div>

      </div>

      {/* ── System Health + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* System Health */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" /> {uiCopy.systemHealth}
            </h2>
            <span className="text-xs text-gray-400">{uiCopy.autoRefresh60s}</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600 font-medium flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" /> {uiCopy.onlineRate}
                </span>
                <span className={`font-bold ${onlineRate >= 80 ? 'text-emerald-600' : onlineRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                  {onlineRate}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${onlineRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : onlineRate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${onlineRate}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3">
                <div className="p-2 bg-emerald-100 rounded-lg"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                <div>
                  <p className="text-xl font-bold text-emerald-700">{stats.onlineDevices}</p>
                  <p className="text-xs text-emerald-600">{uiCopy.online}</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-xl p-3 ${stats.offlineDevices > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className={`p-2 rounded-lg ${stats.offlineDevices > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <XCircle className={`w-4 h-4 ${stats.offlineDevices > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${stats.offlineDevices > 0 ? 'text-red-600' : 'text-gray-500'}`}>{stats.offlineDevices}</p>
                  <p className={`text-xs ${stats.offlineDevices > 0 ? 'text-red-500' : 'text-gray-400'}`}>{uiCopy.offline}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1 flex-wrap">
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-100">
                <Leaf className="w-3.5 h-3.5" /> {uiCopy.co2Reduced} ~{(stats.energySaved * 0.5).toLocaleString()} kg
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-100">
                <Zap className="w-3.5 h-3.5" /> {stats.energySaved.toLocaleString()} {uiCopy.kwhSaved}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
            <ChevronRight className="w-4 h-4 text-gray-400" /> {uiCopy.quickActions}
          </h2>
          <div className="space-y-1.5">
            {[
              { icon: Monitor,  label: uiCopy.liveMonitor, desc: uiCopy.realTimeData,   href: '/monitor',    cls: 'text-blue-500 bg-blue-50 hover:bg-blue-100' },
              { icon: BarChart2,label: uiCopy.analytics,    desc: uiCopy.chartsReports, href: '/analytics',  cls: 'text-purple-500 bg-purple-50 hover:bg-purple-100' },
              { icon: Server,   label: uiCopy.devices,      desc: uiCopy.allDevices,      href: '/overview',   cls: 'text-teal-500 bg-teal-50 hover:bg-teal-100' },
              { icon: Settings, label: uiCopy.settings,     desc: uiCopy.systemConfig,    href: '/settings',   cls: 'text-gray-500 bg-gray-50 hover:bg-gray-100' },
            ].map(item => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group text-left">
                <div className={`p-2 rounded-lg transition-colors ${item.cls}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            {(() => {
              const siteLabel: Record<string, { flag: string; region: Record<string, string> }> = {
                thailand: { flag: '🇹🇭', region: { th: 'กรองตามจังหวัด', en: 'Filter by Province', ko: '태국 주별 필터', cn: '按省份筛选 (泰国)', vn: 'Lọc theo tỉnh (Thái Lan)', ms: 'Tapis mengikut Wilayah (Thai)' } },
                korea:    { flag: '🇰🇷', region: { th: 'กรองตามเมือง (เกาหลี)', en: 'Filter by City (Korea)', ko: '시/도별 필터', cn: '按城市筛选 (韩国)', vn: 'Lọc theo thành phố (Hàn Quốc)', ms: 'Tapis mengikut Bandar (Korea)' } },
                vietnam:  { flag: '🇻🇳', region: { th: 'กรองตามจังหวัด (เวียดนาม)', en: 'Filter by Province (Vietnam)', ko: '베트남 주별 필터', cn: '按省份筛选 (越南)', vn: 'Lọc theo tỉnh (Việt Nam)', ms: 'Tapis mengikut Wilayah (Vietnam)' } },
                malaysia: { flag: '🇲🇾', region: { th: 'กรองตามรัฐ (มาเลเซีย)', en: 'Filter by State (Malaysia)', ko: '말레이시아 주별 필터', cn: '按州筛选 (马来西亚)', vn: 'Lọc theo Bang (Malaysia)', ms: 'Tapis mengikut Negeri (Malaysia)' } },
              }
              const cfg = siteLabel[selectedSite] ?? siteLabel.thailand
              const regionLabel = cfg.region[locale] ?? cfg.region.en
              return (
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="mr-1.5">{cfg.flag}</span>{regionLabel}
                </label>
              )
            })()}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-3 text-sm text-gray-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50 appearance-none cursor-pointer"
              >
                <option value="">{dashboardCopy.searchPlaceholder}</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc.toLowerCase()}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 min-w-[120px]">
              <p className="text-xs font-medium text-emerald-700 mb-1">{dashboardCopy.searchResults}</p>
              <p className="text-2xl font-bold text-emerald-900">{searchedDevices.length}</p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {dashboardCopy.clearSearch}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Devices ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-base font-semibold text-gray-800">
              {t('recentDevices') || 'Recent Devices'}
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium">
              {filteredRecentDevices.length}
            </span>
          </div>
          {filteredRecentDevices.length > 6 && (
            <button
              onClick={() => setShowAllDevices((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
            >
              {showAllDevices ? dashboardCopy.viewLess : dashboardCopy.viewAll}
              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showAllDevices ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        <div className="p-5">
          {filteredRecentDevices.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Server className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm font-medium">
                {searchQuery ? dashboardCopy.noSearchResults : (t('noDevices') || 'No devices found')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {visibleRecentDevices.map((device) => {
                const fmtA   = (v: number | null | undefined) => v != null ? `${Number(v).toFixed(1)} A` : '--'
                const fmtPct = (v: number | null | undefined) => v != null ? `${Number(v).toFixed(1)}%` : '--'
                const fmtKwh = (v: number | null | undefined) => v != null ? `${Number(v).toFixed(2)} kWh` : '--'
                const bal = getBalanceState(device.imbalancePercent)
                const beforePhases = [
                  { label: 'L1', value: device.beforeCurrentABC?.[0], thd: device.beforeThd ?? null, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                  { label: 'L2', value: device.beforeCurrentABC?.[1], thd: device.beforeThd ?? null, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'L3', value: device.beforeCurrentABC?.[2], thd: device.beforeThd ?? null, color: 'bg-violet-50 text-violet-700 border-violet-200' }
                ]
                const afterPhases = [
                  { label: 'L1', value: device.currentABC?.[0], thd: device.thdABC?.[0], color: 'bg-orange-50 text-orange-700 border-orange-200' },
                  { label: 'L2', value: device.currentABC?.[1], thd: device.thdABC?.[1], color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'L3', value: device.currentABC?.[2], thd: device.thdABC?.[2], color: 'bg-violet-50 text-violet-700 border-violet-200' }
                ]

                return (
                  <div key={device.deviceID}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200">

                    {/* ── Card Header ── */}
                    <div className={`px-4 py-3.5 flex items-start justify-between gap-2 ${
                      device.isOnline
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                        : 'bg-gradient-to-r from-slate-500 to-gray-600'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            device.isOnline
                              ? 'bg-white/20 text-white border border-white/30'
                              : 'bg-white/15 text-white/80 border border-white/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              device.isOnline ? 'bg-green-300 animate-pulse' : 'bg-gray-300'
                            }`} />
                            {device.isOnline ? uiCopy.online : uiCopy.offline}
                          </span>
                        </div>
                        <p className="font-bold text-white text-sm leading-tight">
                          {getLocalizedCustomerName(device, locale)}
                        </p>
                        {device.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                            <span className="text-[11px] text-white/70">{device.location}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/devices-setting?device=${device.deviceID}`)}
                        className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 transition-colors flex-shrink-0 mt-0.5"
                        title="Edit device">
                        <Edit2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>

                    {/* ── Two Meters Side by Side ── */}
                    <div className="grid grid-cols-2 divide-x divide-gray-100">

                      {/* Meter 1 — Before K-Save */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-b border-red-100">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
                            {uiCopy.beforeKsave}
                          </span>
                        </div>
                        <div className="p-3 space-y-1.5 flex-1">

                        {/* Device info — always shown */}
                        <div className="space-y-0.5">
                          <div className="flex flex-col items-center justify-center py-3 text-center">
                            <span className="text-2xl mb-1.5">🔌</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{dashboardCopy.waitingMeter}</span>
                          </div>
                          <div className="rounded-lg bg-gray-50 border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                            <div className="flex justify-between items-center px-2.5 py-1.5">
                              <span className="text-[10px] text-gray-400 font-medium">{dashboardCopy.modelLabel}</span>
                              <span className="text-[10px] font-bold text-gray-700">{device.deviceName || '–'}</span>
                            </div>
                            <div className="flex justify-between items-center px-2.5 py-1.5">
                              <span className="text-[10px] text-gray-400 font-medium">{dashboardCopy.meterNoLabel}</span>
                              <span className={`text-[10px] font-bold ${device.beforeMeterNo ? 'text-blue-600' : 'text-gray-400'}`}>
                                {device.beforeMeterNo ? `# ${device.beforeMeterNo}` : '–'}
                              </span>
                            </div>
                            <div className="flex justify-between items-start px-2.5 py-1.5 gap-2">
                              <span className="text-[10px] text-gray-400 font-medium shrink-0">S/N</span>
                              <span className="text-[10px] font-bold text-gray-700 text-right break-all">{device.seriesNo || '–'}</span>
                            </div>
                            <div className="flex justify-between items-center px-2.5 py-1.5">
                              <span className="text-[10px] text-gray-400 font-medium">K-Save ID</span>
                              <span className="text-[10px] font-bold text-emerald-600">{device.ksaveID || '–'}</span>
                            </div>
                            <div className="flex justify-between items-center px-2.5 py-1.5">
                              <span className="text-[10px] text-gray-400 font-medium">{dashboardCopy.telLabel}</span>
                              <span className="text-[10px] font-bold text-gray-700">{device.customerPhone || '–'}</span>
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-2">
                            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide block mb-0.5">{dashboardCopy.addressLabel}</span>
                            <p className="text-[10px] text-gray-600 leading-snug">{device.customerAddress || '–'}</p>
                          </div>

                          {/* Before Metrics Panel */}
                          <div className="mt-2 border-t border-gray-100 pt-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">{dashboardCopy.avgCurrent}</p>
                                <p className="text-sm font-extrabold text-amber-900 leading-none">{fmtA(device.avgBeforeCurrent)}</p>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">{dashboardCopy.loadBalance}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${bal.className}`}>
                                    {bal.label}
                                  </span>
                                  <span className="text-xs font-bold text-gray-700">
                                    {device.imbalancePercent === null ? '--' : `${device.imbalancePercent.toFixed(1)}%`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">{uiCopy.voltageLineToLine}</p>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: 'L1-L2', value: device.voltageLL?.[0], color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                                  { label: 'L2-L3', value: device.voltageLL?.[1], color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                                  { label: 'L3-L1', value: device.voltageLL?.[2], color: 'bg-teal-50 text-teal-700 border-teal-200' }
                                ].map((volt) => (
                                  <div key={volt.label} className={`rounded-xl border px-2.5 py-2 text-center ${volt.color}`}>
                                    <p className="text-[10px] font-bold mb-0.5">{volt.label}</p>
                                    <p className="text-sm font-extrabold">{volt.value == null ? '0.0' : Number(volt.value).toFixed(1)} V</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">{dashboardCopy.phaseCurrent} & {uiCopy.thd}</p>
                              <div className="grid grid-cols-3 gap-2">
                                {beforePhases.map((phase) => (
                                  <div key={phase.label} className={`rounded-xl border overflow-hidden ${phase.color}`}>
                                    <div className="px-2.5 py-1 border-b border-current/10">
                                      <p className="text-xs font-extrabold">{phase.label}</p>
                                    </div>
                                    <div className="px-2.5 py-2 space-y-1">
                                      <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{uiCopy.current}</p>
                                        <p className="text-sm font-extrabold leading-tight">{fmtA(phase.value)}</p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{uiCopy.thd}</p>
                                        <p className="text-sm font-extrabold leading-tight">{phase.thd == null ? '--' : `${Number(phase.thd).toFixed(1)}%`}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-2.5 flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-purple-600">{dashboardCopy.avgThd}</p>
                              <p className="text-sm font-extrabold text-purple-900">{device.beforeThd == null ? '--' : `${Number(device.beforeThd).toFixed(1)}%`}</p>
                            </div>

                            <div className="flex items-center justify-between pt-0.5 border-t border-gray-100 text-[10px] text-gray-400">
                              <span className="font-medium uppercase tracking-wide">{dashboardCopy.updatedAt}</span>
                              <span className="font-semibold text-gray-600">{formatTime(device.beforeLastUpdate || device.lastUpdate)}</span>
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>

                      {/* Meter 2 — After K-Save */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border-b border-emerald-100">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                            {uiCopy.afterKsave}
                          </span>
                        </div>
                        <div className="p-3 space-y-1.5 flex-1">

                        {/* Device info — always shown */}
                        <div className="space-y-0.5">
                          <div className="flex flex-col items-center justify-center py-3 text-center">
                            <span className="text-2xl mb-1.5">📊</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{dashboardCopy.waitingMeter}</span>
                          </div>
                          <div className="rounded-lg bg-gray-50 border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                              <div className="flex justify-between items-center px-2.5 py-1.5">
                                <span className="text-[10px] text-gray-400 font-medium">{dashboardCopy.meterNoLabel}</span>
                                <span className={`text-[10px] font-bold ${device.metricsMeterNo ? 'text-emerald-600' : 'text-gray-400'}`}>
                                  {device.metricsMeterNo ? `# ${device.metricsMeterNo}` : '–'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center px-2.5 py-1.5">
                                <span className="text-[10px] text-gray-400 font-medium">K-Save ID</span>
                                <span className="text-[10px] font-bold text-emerald-600">{device.ksaveID || '–'}</span>
                              </div>
                              <div className="flex justify-between items-start px-2.5 py-1.5 gap-2">
                                <span className="text-[10px] text-gray-400 font-medium shrink-0">S/N</span>
                                <span className="text-[10px] font-bold text-gray-700 text-right break-all">{device.seriesNo || '–'}</span>
                              </div>
                              <div className="flex justify-between items-center px-2.5 py-1.5">
                                <span className="text-[10px] text-gray-400 font-medium">IP</span>
                                <span className="text-[10px] font-bold text-gray-600">{device.ipAddress || '–'}</span>
                              </div>
                              <div className="flex justify-between items-center px-2.5 py-1.5">
                                <span className="text-[10px] text-gray-400 font-medium">{dashboardCopy.telLabel}</span>
                                <span className="text-[10px] font-bold text-gray-700">{device.customerPhone || '–'}</span>
                              </div>
                            </div>
                            <div className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-2">
                              <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide block mb-0.5">{dashboardCopy.addressLabel}</span>
                              <p className="text-[10px] text-gray-600 leading-snug">{device.customerAddress || '–'}</p>
                            </div>

                            {/* After Metrics Panel */}
                            <div className="mt-2 border-t border-gray-100 pt-2 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">{dashboardCopy.avgCurrent}</p>
                                  <p className="text-sm font-extrabold text-amber-900 leading-none">{fmtA(device.avgCurrent)}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">{dashboardCopy.loadBalance}</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${bal.className}`}>
                                      {bal.label}
                                    </span>
                                    <span className="text-xs font-bold text-gray-700">
                                      {device.imbalancePercent === null ? '--' : `${device.imbalancePercent.toFixed(1)}%`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">{uiCopy.voltageLineToLine}</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { label: 'L1-L2', value: device.voltageLL?.[0], color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                                    { label: 'L2-L3', value: device.voltageLL?.[1], color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                                    { label: 'L3-L1', value: device.voltageLL?.[2], color: 'bg-teal-50 text-teal-700 border-teal-200' }
                                  ].map((volt) => (
                                    <div key={volt.label} className={`rounded-xl border px-2.5 py-2 text-center ${volt.color}`}>
                                      <p className="text-[10px] font-bold mb-0.5">{volt.label}</p>
                                      <p className="text-sm font-extrabold">{volt.value == null ? '0.0' : Number(volt.value).toFixed(1)} V</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">{dashboardCopy.phaseCurrent} & {uiCopy.thd}</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {afterPhases.map((phase) => (
                                    <div key={phase.label} className={`rounded-xl border overflow-hidden ${phase.color}`}>
                                      <div className="px-2.5 py-1 border-b border-current/10">
                                        <p className="text-xs font-extrabold">{phase.label}</p>
                                      </div>
                                      <div className="px-2.5 py-2 space-y-1">
                                        <div>
                                          <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{uiCopy.current}</p>
                                          <p className="text-sm font-extrabold leading-tight">{fmtA(phase.value)}</p>
                                        </div>
                                        <div>
                                          <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{uiCopy.thd}</p>
                                          <p className="text-sm font-extrabold leading-tight">{phase.thd == null ? '--' : `${Number(phase.thd).toFixed(1)}%`}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-2.5 flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-purple-600">{dashboardCopy.avgThd}</p>
                                <p className="text-sm font-extrabold text-purple-900">{device.avgThd == null ? '--' : `${Number(device.avgThd).toFixed(1)}%`}</p>
                              </div>

                              <div className="flex items-center justify-between pt-0.5 border-t border-gray-100 text-[10px] text-gray-400">
                                <span className="font-medium uppercase tracking-wide">{dashboardCopy.updatedAt}</span>
                                <span className="font-semibold text-gray-600">{formatTime(device.lastUpdate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Summary Footer ── */}
                    <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {device.currentReduction != null && (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-200">
                            ↓ {fmtPct(device.currentReduction)} {uiCopy.reduction}
                          </span>
                        )}
                        {device.energyReduction != null && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                            ⚡ {fmtKwh(device.energyReduction)} saved
                          </span>
                        )}
                        {device.co2Reduction != null && (
                          <span className="inline-flex items-center gap-1 bg-lime-100 text-lime-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-lime-200">
                            🌿 {Number(device.co2Reduction).toFixed(2)} kg CO₂
                          </span>
                        )}
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full border ${bal.className}`}>
                          {bal.label}
                          {device.imbalancePercent != null && (
                            <span className="ml-1 opacity-70">{fmtPct(device.imbalancePercent)}</span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {formatTime(device.lastUpdate)}
                      </span>
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Pre-install Current Analysis ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-50 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">{dashboardCopy.currentTitle}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{dashboardCopy.currentSubtitle}</p>
            </div>
          </div>
          {filteredCurrentAnalysisDevices.length > 6 && (
            <button
              onClick={() => setShowAllCurrentAnalysis((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-semibold hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-all"
            >
              {showAllCurrentAnalysis ? dashboardCopy.viewLess : dashboardCopy.viewAll}
              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showAllCurrentAnalysis ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        <div className="p-5">
          {filteredCurrentAnalysisDevices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Activity className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm font-medium">
                {searchQuery ? dashboardCopy.noSearchResults : dashboardCopy.noCurrentData}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {visibleCurrentAnalysisDevices.map((device) => {
                const balanceState = getBalanceState(device.imbalancePercent)
                const phases = [
                  { label: 'L1', value: device.currentABC[0], thd: device.thdABC?.[0], color: 'bg-orange-50 text-orange-700 border-orange-200' },
                  { label: 'L2', value: device.currentABC[1], thd: device.thdABC?.[1], color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'L3', value: device.currentABC[2], thd: device.thdABC?.[2], color: 'bg-violet-50 text-violet-700 border-violet-200' }
                ]

                return (
                  <div key={device.deviceID} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200">

                    {/* ── Card Header ── */}
                    <div className={`px-4 py-3.5 ${device.isOnline ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-slate-500 to-gray-600'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm leading-tight">
                            {getLocalizedCustomerName(device, locale)}
                          </p>
                          {device.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                              <span className="text-[11px] text-white/70">{device.location}</span>
                            </div>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold flex-shrink-0 ${
                          device.isOnline
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-white/15 text-white/80 border-white/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${device.isOnline ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`} />
                          {device.isOnline ? uiCopy.online : uiCopy.offline}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">

                    {/* ── Before K-Save Baseline ── */}
                      <div className="rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-red-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
                              {dashboardCopy.beforeCurrentLabel}
                            </p>
                          </div>
                          {device.currentReduction != null && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                              ▼ {device.currentReduction.toFixed(1)}% {dashboardCopy.currentReduced}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 p-3">
                          <div className="rounded-lg bg-white border border-red-200 px-2 py-2 text-center shadow-sm">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-red-400 mb-0.5">{dashboardCopy.beforeAvgCurrent}</p>
                            <p className="text-sm font-extrabold text-red-900">{formatAmp(device.avgBeforeCurrent ?? null)}</p>
                          </div>
                          {[
                            { label: 'L1', value: device.beforeCurrentABC?.[0] ?? null },
                            { label: 'L2', value: device.beforeCurrentABC?.[1] ?? null },
                            { label: 'L3', value: device.beforeCurrentABC?.[2] ?? null }
                          ].map(phase => (
                            <div key={phase.label} className="rounded-lg bg-white border border-orange-200 px-2 py-2 text-center shadow-sm">
                              <p className="text-[9px] font-bold text-orange-500 mb-0.5">{phase.label}</p>
                              <p className="text-sm font-extrabold text-orange-900">{formatAmp(phase.value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    {/* ── KPI Row ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">{dashboardCopy.avgCurrent}</p>
                        <p className="text-2xl font-extrabold text-amber-900 leading-none">{formatAmp(device.avgCurrent)}</p>
                      </div>
                      <div className={`rounded-xl border px-4 py-3 ${balanceState.className.replace('text-', 'border-').split(' ')[0]} bg-white border-gray-200`}>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">{dashboardCopy.loadBalance}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${balanceState.className}`}>
                            {balanceState.label}
                          </span>
                          <span className="text-sm font-bold text-gray-700">
                            {device.imbalancePercent === null ? '--' : `${device.imbalancePercent.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Voltage ── */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
                        {uiCopy.voltageLineToLine}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'L1-L2', value: device.voltageLL[0], color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                          { label: 'L2-L3', value: device.voltageLL[1], color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                          { label: 'L3-L1', value: device.voltageLL[2], color: 'bg-teal-50 text-teal-700 border-teal-200' }
                        ].map((volt) => (
                          <div key={volt.label} className={`rounded-xl border px-3 py-2.5 text-center ${volt.color}`}>
                            <p className="text-[10px] font-bold mb-1">{volt.label}</p>
                            <p className="text-sm font-extrabold">{volt.value?.toFixed(1) || '0.0'} V</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Current Trend Chart ── */}
                    <CurrentTrendChart
                      deviceId={device.deviceID}
                      recordScope={device.recordScope}
                      currentReduction={device.currentReduction}
                      labels={{
                        trendTitle: uiCopy.trendTitle,
                        reduction: uiCopy.reduction,
                        before: uiCopy.beforeKsave,
                        after: uiCopy.afterKsave
                      }}
                    />

                    {/* ── Phase Current & THD ── */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
                        {dashboardCopy.phaseCurrent} & {uiCopy.thd}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {phases.map((phase) => (
                          <div key={phase.label} className={`rounded-xl border overflow-hidden ${phase.color}`}>
                            <div className="px-3 py-1.5 border-b border-current/10">
                              <p className="text-xs font-extrabold">{phase.label}</p>
                            </div>
                            <div className="px-3 py-2 space-y-1.5">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{uiCopy.current}</p>
                                <p className="text-sm font-extrabold leading-tight">{formatAmp(phase.value)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{uiCopy.thd}</p>
                                <p className="text-sm font-extrabold leading-tight">
                                  {phase.thd === null || phase.thd === undefined ? '--' : `${phase.thd.toFixed(1)}%`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Avg THD ── */}
                    <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-purple-600">{dashboardCopy.avgThd}</p>
                      <p className="text-xl font-extrabold text-purple-900">
                        {device.avgThd === null || device.avgThd === undefined ? '--' : `${device.avgThd.toFixed(1)}%`}
                      </p>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400">
                      <span className="font-medium uppercase tracking-wide">{dashboardCopy.updatedAt}</span>
                      <span className="font-semibold text-gray-600">{formatTime(device.lastUpdate)}</span>
                    </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

// Current Trend Chart Component
type TrendPoint = {
  time: string
  beforeAvg: number | null
  afterAvg: number | null
}

type PhaseStats = {
  before: [number | null, number | null, number | null]
  after: [number | null, number | null, number | null]
}

function CurrentTrendChart({
  deviceId,
  recordScope,
  currentReduction,
  labels
}: {
  deviceId: string | number
  recordScope?: string
  currentReduction?: number | null
  labels: {
    trendTitle: string
    reduction: string
    before: string
    after: string
  }
}) {
  const [chartData, setChartData] = useState<TrendPoint[]>([])
  const [latestPhases, setLatestPhases] = useState<PhaseStats | null>(null)
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchHistory = async () => {
      try {
        const scopeParam = recordScope ? `&scope=${encodeURIComponent(String(recordScope))}` : ''
        const res = await fetch(`/api/kenergy/current-history?deviceId=${encodeURIComponent(String(deviceId))}&hours=0.5${scopeParam}`)
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        if (json.success && json.data) {
          setChartData(json.data.chartData || [])
          if (json.data.stats) {
            setLatestPhases({
              before: [
                json.data.stats.currentBefore?.L1 ?? null,
                json.data.stats.currentBefore?.L2 ?? null,
                json.data.stats.currentBefore?.L3 ?? null
              ],
              after: [
                json.data.stats.currentAfter?.L1 ?? null,
                json.data.stats.currentAfter?.L2 ?? null,
                json.data.stats.currentAfter?.L3 ?? null
              ]
            })
          }
        }
      } catch {
        // silent – chart will show "no data" state
      } finally {
        if (!cancelled) setChartLoading(false)
      }
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [deviceId, recordScope])

  const deviceLabel = String(deviceId).trim()

  if (chartLoading) {
    return (
      <div className="mb-3">
        <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl border-2 border-gray-200 p-4 h-48 flex items-center justify-center">
          <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="mb-3">
      <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
            {labels.trendTitle}
          </p>
          <div className="flex items-center gap-2">
            {deviceLabel && (
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-gray-500 border border-gray-200">
                {deviceLabel}
              </span>
            )}
            {currentReduction && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                ↓ {currentReduction.toFixed(1)}% {labels.reduction}
              </span>
            )}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-gray-400 text-xs">
            No data in last 30 min
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9 }}
                stroke="#9ca3af"
                interval="preserveEnd"
                tickMargin={5}
              />
              <YAxis
                tick={{ fontSize: 9 }}
                stroke="#9ca3af"
                domain={['auto', 'auto']}
                tickMargin={5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '11px',
                  padding: '8px'
                }}
                formatter={(value: number | string) => [`${value} A`, '']}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                iconType="line"
              />
              <Line
                type="natural"
                dataKey="beforeAvg"
                stroke="#ef4444"
                strokeWidth={3}
                name={labels.before}
                dot={false}
                animationDuration={800}
              />
              <Line
                type="natural"
                dataKey="afterAvg"
                stroke="#22c55e"
                strokeWidth={3}
                name={labels.after}
                dot={false}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {latestPhases && (
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            {(['L1', 'L2', 'L3'] as const).map((phase, idx) => (
              <div key={phase} className="bg-white rounded-lg p-1.5 border border-gray-200">
                <p className="text-[9px] text-gray-500 uppercase">{phase}</p>
                <div className="flex justify-between text-[10px] font-semibold mt-0.5">
                  <span className="text-red-600">
                    {latestPhases.before[idx] !== null ? `${latestPhases.before[idx]!.toFixed(1)} A` : '--'}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600">
                    {latestPhases.after[idx] !== null ? `${latestPhases.after[idx]!.toFixed(1)} A` : '--'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
