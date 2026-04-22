'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/LocaleContext'
import {
  ArrowRight,
  Layout as LayoutIcon,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Wifi,
} from 'lucide-react'

type DeviceRow = {
  deviceID?: number | string
  deviceName?: string | null
  ksaveID?: string | null
  site?: string | null
  U_email?: string | null
  P_email?: string | null
  phone?: string | null
  ipAddress?: string | null
  location?: string | null
  beforeMeterNo?: string | null
  metricsMeterNo?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: unknown
}

const LOCALE_MAP: Record<string, string> = {
  th: 'th-TH',
  ko: 'ko-KR',
  en: 'en-US',
  cn: 'zh-CN',
  vn: 'vi-VN',
  ms: 'ms-MY'
}

const isEnabledStatus = (status?: string | null) => {
  const normalized = String(status || '').trim().toLowerCase()
  return ['on', 'ok', 'active', 'enable', 'enabled'].includes(normalized)
}

const formatDateTime = (value: string | null | undefined, locale: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(LOCALE_MAP[locale] || 'en-US')
}

const normalizeSiteValue = (site?: string | null, location?: string | null) => {
  const candidates = [site, location]

  for (const candidate of candidates) {
    const normalized = String(candidate || '').trim().toLowerCase()
    if (['thailand', 'korea', 'vietnam', 'malaysia'].includes(normalized)) {
      return normalized
    }
  }

  return 'thailand'
}

export default function MeterSetingPage() {
  const { locale } = useLocale()
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'other'>('all')
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const copy = {
    th: {
      badge: 'Meter Seting',
      title: 'การจัดการมิเตอร์',
      subtitle: 'แสดงข้อมูลจากตาราง devices โดยตรง',
      totalDevices: 'อุปกรณ์ทั้งหมด',
      enabledDevices: 'สถานะพร้อมใช้งาน',
      locations: 'จำนวนสถานที่',
      addDevice: 'เพิ่มอุปกรณ์',
      refresh: 'รีเฟรช',
      listTitle: 'รายการมิเตอร์',
      search: 'ค้นหา',
      searchPlaceholder: 'ค้นหาจากชื่ออุปกรณ์, KSAVE ID, อีเมล, สถานที่, IP',
      statusFilter: 'ตัวกรองสถานะ',
      allStatus: 'ทุกสถานะ',
      enabled: 'พร้อมใช้งาน',
      other: 'สถานะอื่น',
      no: 'ลำดับ',
      deviceId: 'Device ID',
      deviceName: 'ชื่ออุปกรณ์',
      ownerEmail: 'Owner',
      location: 'Location',
      phone: 'Phone',
      ipAddress: 'IP Address',
      beforeMeter: 'Before Meter',
      metricsMeter: 'Metrics Meter',
      registerDate: 'Register Date',
      lastUpdate: 'Last Update',
      status: 'Status',
      actions: 'Actions',
      open: 'เปิด',
      noData: 'ไม่พบข้อมูลอุปกรณ์',
      showing: 'แสดง',
      to: 'ถึง',
      of: 'จาก',
      entries: 'รายการ'
    },
    ko: {
      badge: 'Meter Seting',
      title: '미터 설정',
      subtitle: 'devices 테이블 데이터를 직접 표시합니다',
      totalDevices: '전체 장치',
      enabledDevices: '사용 가능 상태',
      locations: '위치 수',
      addDevice: '장치 추가',
      refresh: '새로 고침',
      listTitle: '미터 목록',
      search: '검색',
      searchPlaceholder: '장치명, KSAVE ID, 이메일, 위치, IP로 검색',
      statusFilter: '상태 필터',
      allStatus: '전체 상태',
      enabled: '사용 가능',
      other: '기타 상태',
      no: '번호',
      deviceId: 'Device ID',
      deviceName: '장치명',
      ownerEmail: 'Owner',
      location: 'Location',
      phone: 'Phone',
      ipAddress: 'IP Address',
      beforeMeter: 'Before Meter',
      metricsMeter: 'Metrics Meter',
      registerDate: 'Register Date',
      lastUpdate: 'Last Update',
      status: 'Status',
      actions: 'Actions',
      open: '열기',
      noData: '장치 데이터가 없습니다',
      showing: '표시',
      to: '부터',
      of: '/',
      entries: '개 항목'
    },
    en: {
      badge: 'Meter Seting',
      title: 'Meter Management',
      subtitle: 'Showing data directly from the devices table',
      totalDevices: 'Total Devices',
      enabledDevices: 'Enabled Status',
      locations: 'Locations',
      addDevice: 'Add Device',
      refresh: 'Refresh',
      listTitle: 'Meter List',
      search: 'Search',
      searchPlaceholder: 'Search by device name, KSAVE ID, email, location, IP',
      statusFilter: 'Status Filter',
      allStatus: 'All Statuses',
      enabled: 'Enabled',
      other: 'Other Status',
      no: 'No',
      deviceId: 'Device ID',
      deviceName: 'Device Name',
      ownerEmail: 'Owner',
      location: 'Location',
      phone: 'Phone',
      ipAddress: 'IP Address',
      beforeMeter: 'Before Meter',
      metricsMeter: 'Metrics Meter',
      registerDate: 'Register Date',
      lastUpdate: 'Last Update',
      status: 'Status',
      actions: 'Actions',
      open: 'Open',
      noData: 'No device data found',
      showing: 'Showing',
      to: 'to',
      of: 'of',
      entries: 'entries'
    }
  }[locale] || {
    badge: 'Meter Seting',
    title: 'Meter Management',
    subtitle: 'Showing data directly from the devices table',
    totalDevices: 'Total Devices',
    enabledDevices: 'Enabled Status',
    locations: 'Locations',
    addDevice: 'Add Device',
    refresh: 'Refresh',
    listTitle: 'Meter List',
    search: 'Search',
    searchPlaceholder: 'Search by device name, KSAVE ID, email, location, IP',
    statusFilter: 'Status Filter',
    allStatus: 'All Statuses',
    enabled: 'Enabled',
    other: 'Other Status',
    no: 'No',
    deviceId: 'Device ID',
    deviceName: 'Device Name',
    ownerEmail: 'Owner',
    location: 'Location',
    phone: 'Phone',
    ipAddress: 'IP Address',
    beforeMeter: 'Before Meter',
    metricsMeter: 'Metrics Meter',
    registerDate: 'Register Date',
    lastUpdate: 'Last Update',
    status: 'Status',
    actions: 'Actions',
    open: 'Open',
    noData: 'No device data found',
    showing: 'Showing',
    to: 'to',
    of: 'of',
    entries: 'entries'
  }

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/kenergy/meter-seting')
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load devices')
      }

      setDevices(Array.isArray(json.devices) ? json.devices : [])
      setError(null)
    } catch (err: unknown) {
      setDevices([])
      setError(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, statusFilter, entriesPerPage])

  const query = searchText.trim().toLowerCase()
  const filteredDevices = devices.filter((device) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'enabled'
          ? isEnabledStatus(device.status as string | null | undefined)
          : !isEnabledStatus(device.status as string | null | undefined)

    if (!matchesStatus) return false
    if (!query) return true

    const haystack = [
      device.deviceID,
      device.deviceName,
      device.ksaveID,
      device.U_email,
      device.P_email,
      device.phone,
      device.ipAddress,
      device.location,
      device.status
    ]
      .map((value) => String(value || '').toLowerCase())
      .join(' ')

    return haystack.includes(query)
  })

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / entriesPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * entriesPerPage
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + entriesPerPage)
  const enabledCount = devices.filter((device) => isEnabledStatus(device.status as string | null | undefined)).length
  const uniqueLocations = new Set(
    devices
      .map((device) => String(device.location || '').trim())
      .filter(Boolean)
  ).size

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <div className="p-5 space-y-5 bg-gray-50 min-h-screen">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-600 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <LayoutIcon className="w-3.5 h-3.5" /> {copy.badge}
            </div>
            <h1 className="text-3xl font-black text-white mb-1">{copy.title}</h1>
            <p className="text-cyan-100 text-sm">{copy.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20 min-w-[96px]">
              <Server className="w-4 h-4 text-white/70 mb-1" />
              <span className="text-2xl font-black text-white leading-none">{devices.length}</span>
              <span className="text-cyan-100 text-xs mt-0.5">{copy.totalDevices}</span>
            </div>
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20 min-w-[96px]">
              <Wifi className="w-4 h-4 text-white/70 mb-1" />
              <span className="text-2xl font-black text-white leading-none">{enabledCount}</span>
              <span className="text-cyan-100 text-xs mt-0.5">{copy.enabledDevices}</span>
            </div>
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20 min-w-[96px]">
              <MapPin className="w-4 h-4 text-white/70 mb-1" />
              <span className="text-2xl font-black text-white leading-none">{uniqueLocations}</span>
              <span className="text-cyan-100 text-xs mt-0.5">{copy.locations}</span>
            </div>
            <Link
              href="/add-machine"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-sky-700 font-bold text-sm rounded-xl hover:bg-sky-50 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> {copy.addDevice}
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-sky-50 focus:border-sky-400 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'enabled' | 'other')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-sky-50 focus:border-sky-400 outline-none min-w-[180px]"
            >
              <option value="all">{copy.statusFilter}: {copy.allStatus}</option>
              <option value="enabled">{copy.statusFilter}: {copy.enabled}</option>
              <option value="other">{copy.statusFilter}: {copy.other}</option>
            </select>
          </div>
          <button
            onClick={fetchDevices}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> {copy.refresh}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{copy.listTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">{copy.search}: {filteredDevices.length}</p>
          </div>
          <select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading...</div>
          ) : filteredDevices.length === 0 ? (
            <div className="py-16 text-center text-gray-400">{copy.noData}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.no}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.deviceId}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.deviceName}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">KSAVE ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.ownerEmail}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.location}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.phone}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.ipAddress}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.beforeMeter}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.metricsMeter}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.registerDate}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.lastUpdate}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.status}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{copy.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDevices.map((device, index) => {
                      const statusText = String(device.status || 'unknown')
                      const statusEnabled = isEnabledStatus(device.status as string | null | undefined)
                      const targetSite = normalizeSiteValue(device.site, device.location)

                      return (
                        <tr key={String(device.deviceID || index)} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{startIndex + index + 1}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-700">{device.deviceID || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{device.deviceName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-mono">{device.ksaveID || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{device.U_email || device.P_email || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{device.location || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{device.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-mono">{device.ipAddress || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{device.beforeMeterNo || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{device.metricsMeterNo || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(device.created_at, locale)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(device.updated_at, locale)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${
                              statusEnabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard?device=${encodeURIComponent(String(device.deviceID || ''))}&ksave=${encodeURIComponent(String(device.ksaveID || ''))}&site=${encodeURIComponent(targetSite)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 text-sm"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              {copy.open}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
                <div className="text-sm text-gray-600">
                  {copy.showing} {filteredDevices.length === 0 ? 0 : startIndex + 1} {copy.to} {Math.min(startIndex + paginatedDevices.length, filteredDevices.length)} {copy.of} {filteredDevices.length} {copy.entries}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-40"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    «
                  </button>
                  <button
                    className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-40"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    ‹
                  </button>
                  <button className="px-3 py-1.5 bg-sky-600 text-white rounded text-sm">
                    {safeCurrentPage}
                  </button>
                  <button
                    className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-40"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    ›
                  </button>
                  <button
                    className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-40"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    »
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
