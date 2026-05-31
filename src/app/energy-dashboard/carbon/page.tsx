'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLocale } from '@/lib/LocaleContext'
import { useSite } from '@/lib/SiteContext'
import {
  Leaf, RefreshCw, Plus, Search, Trash2, Edit2,
  Zap, Wind, TrendingDown, X, Check,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CarbonRecord {
  carbonID: number
  meterID: string
  LocationID: string
  serailID: string | null
  deviceID: number | null
  power_record_id: number | null
  power_preinstall_id: number | null
  carbon_kg: number | null
  energy_kwh: number | null
  reduction_percent: number | null
  record_date: string | null
  note: string | null
  created_at: string
  updated_at: string
  // joined
  locationName: string | null
  site: string | null
  deviceName: string | null
  geID: string | null
  meterType: string | null
  meterNo: string | null
  powerRecordTime: string | null
  metrics_kWh: number | null
  before_kWh: number | null
  powerCO2Reduction: number | null
}

interface Summary {
  totalCarbonKg: number
  totalEnergyKwh: number
  totalReduction: number
}

const copy: Record<string, Record<string, string>> = {
  th: {
    title: 'คาร์บอน & พลังงาน',
    subtitle: 'บันทึกการลดการปล่อย CO₂ และการประหยัดพลังงาน',
    badge: 'Carbon Tracker',
    totalCarbon: 'CO₂ รวม (kg)',
    totalEnergy: 'พลังงานรวม (kWh)',
    totalReduction: 'ลด CO₂ รวม (kg)',
    search: 'ค้นหาสถานที่ / อุปกรณ์…',
    addRecord: 'เพิ่มบันทึก',
    refresh: 'รีเฟรช',
    noData: 'ยังไม่มีข้อมูลคาร์บอน',
    location: 'สถานที่',
    device: 'อุปกรณ์',
    meter: 'มิเตอร์',
    carbonKg: 'CO₂ (kg)',
    energyKwh: 'พลังงาน (kWh)',
    reduction: 'ลดลง (%)',
    date: 'วันที่',
    note: 'หมายเหตุ',
    actions: 'จัดการ',
    confirmDelete: 'ยืนยันการลบ?',
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    meterID: 'Meter ID',
    locationID: 'Location ID',
    serialID: 'Serial ID',
    powerRecord: 'Power Record ID',
    preinstall: 'Preinstall Record ID',
    editRecord: 'แก้ไขบันทึก',
    addNew: 'เพิ่มบันทึกใหม่',
  },
  en: {
    title: 'Carbon & Energy',
    subtitle: 'Track CO₂ emission reductions and energy savings',
    badge: 'Carbon Tracker',
    totalCarbon: 'Total CO₂ (kg)',
    totalEnergy: 'Total Energy (kWh)',
    totalReduction: 'CO₂ Reduced (kg)',
    search: 'Search location / device…',
    addRecord: 'Add Record',
    refresh: 'Refresh',
    noData: 'No carbon records yet',
    location: 'Location',
    device: 'Device',
    meter: 'Meter',
    carbonKg: 'CO₂ (kg)',
    energyKwh: 'Energy (kWh)',
    reduction: 'Reduction (%)',
    date: 'Date',
    note: 'Note',
    actions: 'Actions',
    confirmDelete: 'Confirm delete?',
    cancel: 'Cancel',
    save: 'Save',
    meterID: 'Meter ID',
    locationID: 'Location ID',
    serialID: 'Serial ID',
    powerRecord: 'Power Record ID',
    preinstall: 'Preinstall Record ID',
    editRecord: 'Edit Record',
    addNew: 'Add New Record',
  },
  ko: {
    title: '탄소 & 에너지',
    subtitle: 'CO₂ 배출 감소 및 에너지 절약 추적',
    badge: 'Carbon Tracker',
    totalCarbon: '총 CO₂ (kg)',
    totalEnergy: '총 에너지 (kWh)',
    totalReduction: 'CO₂ 감소 (kg)',
    search: '위치 / 장치 검색…',
    addRecord: '기록 추가',
    refresh: '새로고침',
    noData: '탄소 기록이 없습니다',
    location: '위치',
    device: '장치',
    meter: '미터',
    carbonKg: 'CO₂ (kg)',
    energyKwh: '에너지 (kWh)',
    reduction: '감소율 (%)',
    date: '날짜',
    note: '메모',
    actions: '관리',
    confirmDelete: '삭제하시겠습니까?',
    cancel: '취소',
    save: '저장',
    meterID: 'Meter ID',
    locationID: 'Location ID',
    serialID: 'Serial ID',
    powerRecord: 'Power Record ID',
    preinstall: 'Preinstall Record ID',
    editRecord: '기록 수정',
    addNew: '새 기록 추가',
  },
}

const fmt = (v: number | null | undefined, decimals = 2) =>
  v == null ? '—' : Number(v).toFixed(decimals)

const fmtDate = (v: string | null | undefined) => {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString() } catch { return v }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalFormState {
  carbonID?: number
  meterID: string
  LocationID: string
  serailID: string
  deviceID: string
  power_record_id: string
  power_preinstall_id: string
  carbon_kg: string
  energy_kwh: string
  reduction_percent: string
  record_date: string
  note: string
}

const emptyForm = (): ModalFormState => ({
  meterID: '', LocationID: '', serailID: '', deviceID: '',
  power_record_id: '', power_preinstall_id: '',
  carbon_kg: '', energy_kwh: '', reduction_percent: '',
  record_date: '', note: '',
})

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CarbonPage() {
  const { locale } = useLocale()
  const { selectedSite } = useSite()
  const t = copy[locale] ?? copy.en

  const [records, setRecords] = useState<CarbonRecord[]>([])
  const [summary, setSummary] = useState<Summary>({ totalCarbonKg: 0, totalEnergyKwh: 0, totalReduction: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deletingID, setDeletingID] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ModalFormState>(emptyForm())
  const [saving, setSaving] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/ge-energy/carbon-records?site=${selectedSite}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      setRecords(data.records || [])
      setSummary(data.summary || { totalCarbonKg: 0, totalEnergyKwh: 0, totalReduction: 0 })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [selectedSite])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    return !q
      || (r.locationName ?? '').toLowerCase().includes(q)
      || (r.LocationID ?? '').toLowerCase().includes(q)
      || (r.deviceName ?? '').toLowerCase().includes(q)
      || (r.geID ?? '').toLowerCase().includes(q)
      || (r.meterID ?? '').toLowerCase().includes(q)
  })

  const openAdd = () => { setForm(emptyForm()); setShowModal(true) }
  const openEdit = (r: CarbonRecord) => {
    setForm({
      carbonID: r.carbonID,
      meterID: r.meterID ?? '',
      LocationID: r.LocationID ?? '',
      serailID: r.serailID ?? '',
      deviceID: r.deviceID != null ? String(r.deviceID) : '',
      power_record_id: r.power_record_id != null ? String(r.power_record_id) : '',
      power_preinstall_id: r.power_preinstall_id != null ? String(r.power_preinstall_id) : '',
      carbon_kg: r.carbon_kg != null ? String(r.carbon_kg) : '',
      energy_kwh: r.energy_kwh != null ? String(r.energy_kwh) : '',
      reduction_percent: r.reduction_percent != null ? String(r.reduction_percent) : '',
      record_date: r.record_date ? r.record_date.slice(0, 10) : '',
      note: r.note ?? '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const isEdit = !!form.carbonID
      const payload = {
        carbonID: form.carbonID,
        meterID: form.meterID,
        LocationID: form.LocationID,
        serailID: form.serailID || null,
        deviceID: form.deviceID ? Number(form.deviceID) : null,
        power_record_id: form.power_record_id ? Number(form.power_record_id) : null,
        power_preinstall_id: form.power_preinstall_id ? Number(form.power_preinstall_id) : null,
        carbon_kg: form.carbon_kg ? Number(form.carbon_kg) : null,
        energy_kwh: form.energy_kwh ? Number(form.energy_kwh) : null,
        reduction_percent: form.reduction_percent ? Number(form.reduction_percent) : null,
        record_date: form.record_date || null,
        note: form.note || null,
      }
      const res = await fetch('/api/ge-energy/carbon-records', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      setShowModal(false)
      fetchRecords()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/ge-energy/carbon-records?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setDeletingID(null)
      fetchRecords()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const f = (k: keyof ModalFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="energy-page h-full flex flex-col gap-4">

      {/* Hero */}
      <div className="energy-hero shrink-0">
        <div className="energy-hero-inner px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
              <Leaf className="w-3.5 h-3.5" /> {t.badge}
            </div>
            <h1 className="text-2xl font-black text-white mb-0.5">{t.title}</h1>
            <p className="text-emerald-100 text-xs">{t.subtitle}</p>
          </div>

          {/* KPI cards */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-5 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
              <div className="text-center">
                <Wind className="w-4 h-4 text-white mx-auto mb-0.5" />
                <p className="text-lg font-black text-white leading-none">{fmt(summary.totalCarbonKg, 2)}</p>
                <p className="text-emerald-100 text-[10px] mt-0.5">{t.totalCarbon}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <Zap className="w-4 h-4 text-white mx-auto mb-0.5" />
                <p className="text-lg font-black text-white leading-none">{fmt(summary.totalEnergyKwh, 1)}</p>
                <p className="text-emerald-100 text-[10px] mt-0.5">{t.totalEnergy}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <TrendingDown className="w-4 h-4 text-white mx-auto mb-0.5" />
                <p className="text-lg font-black text-white leading-none">{fmt(summary.totalReduction, 2)}</p>
                <p className="text-emerald-100 text-[10px] mt-0.5">{t.totalReduction}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={t.search}
                  className="pl-8 pr-3 py-2 bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-xs text-white placeholder-white/60 focus:outline-none focus:bg-white/30 w-48"
                />
              </div>
              <button onClick={openAdd}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-all shadow-md">
                <Plus className="w-3.5 h-3.5" /> {t.addRecord}
              </button>
              <button onClick={fetchRecords}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl border border-white/20 transition-all">
                <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-red-500">
            <p className="text-sm">{error}</p>
            <button onClick={fetchRecords} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
              {t.refresh}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            <Leaf className="w-10 h-10 text-gray-200" />
            <p className="text-sm">{t.noData}</p>
            <button onClick={openAdd}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> {t.addRecord}
            </button>
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[t.location, t.device, t.meter, t.carbonKg, t.energyKwh, t.reduction, t.date, t.note, t.actions]
                  .map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.carbonID} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800">{r.locationName || r.LocationID}</p>
                    <p className="text-xs text-gray-400">{r.LocationID}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{r.deviceName || '—'}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.geID || r.serailID || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-gray-700">{r.meterID}</p>
                    <p className="text-xs text-gray-400">{r.meterType || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-emerald-700">{fmt(r.carbon_kg, 4)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-blue-700">{fmt(r.energy_kwh, 3)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.reduction_percent != null
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                          <TrendingDown className="w-3 h-3" />{fmt(r.reduction_percent, 1)}%
                        </span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(r.record_date)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{r.note || '—'}</td>
                  <td className="px-4 py-3">
                    {deletingID === r.carbonID ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(r.carbonID)}
                          className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeletingID(null)}
                          className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeletingID(r.carbonID)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                {form.carbonID ? t.editRecord : t.addNew}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Required */}
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.meterID} required value={form.meterID} onChange={f('meterID')} />
                <Field label={t.locationID} required value={form.LocationID} onChange={f('LocationID')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.serialID} value={form.serailID} onChange={f('serailID')} />
                <Field label="Device ID" value={form.deviceID} onChange={f('deviceID')} type="number" />
              </div>

              {/* FK refs */}
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.powerRecord} value={form.power_record_id} onChange={f('power_record_id')} type="number" />
                <Field label={t.preinstall} value={form.power_preinstall_id} onChange={f('power_preinstall_id')} type="number" />
              </div>

              {/* Calculations */}
              <div className="grid grid-cols-3 gap-3">
                <Field label={t.carbonKg} value={form.carbon_kg} onChange={f('carbon_kg')} type="number" step="0.0001" />
                <Field label={t.energyKwh} value={form.energy_kwh} onChange={f('energy_kwh')} type="number" step="0.001" />
                <Field label={t.reduction} value={form.reduction_percent} onChange={f('reduction_percent')} type="number" step="0.01" />
              </div>

              <Field label={t.date} value={form.record_date} onChange={f('record_date')} type="date" />

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.note}</label>
                <textarea
                  value={form.note} onChange={f('note')} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
                {t.cancel}
              </button>
              <button onClick={handleSave} disabled={saving || !form.meterID || !form.LocationID}
                className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reusable field component ─────────────────────────────────────────────────
function Field({
  label, value, onChange, type = 'text', step, required,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  step?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} onChange={onChange} step={step} required={required}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
      />
    </div>
  )
}
