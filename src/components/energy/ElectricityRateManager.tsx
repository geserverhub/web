'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'

type RateRule = {
  id: number
  site: string
  ratePerKwh: number
  effectiveFrom: string | null
  effectiveTo: string | null
  label: string | null
  isActive: boolean
}

type Props = {
  site: 'thailand' | 'korea' | 'vietnam' | 'malaysia'
  locale: string
}

const copyMap: Record<string, Record<string, string>> = {
  th: {
    title: 'ตั้งค่าอัตราค่าไฟ',
    subtitle: 'ปรับค่าไฟต่อหน่วย และกำหนดช่วงเวลาเพื่อใช้คำนวณค่าไฟ',
    unitRate: 'ค่าไฟต่อหน่วย (ต่อ kWh)',
    periodFrom: 'เริ่มใช้',
    periodTo: 'สิ้นสุด',
    note: 'หมายเหตุ',
    save: 'บันทึกอัตรา',
    loading: 'กำลังโหลด...',
    empty: 'ยังไม่มีข้อมูลอัตราค่าไฟ',
    actions: 'จัดการ',
    rate: 'อัตรา',
    period: 'ช่วงเวลา',
    allTime: 'ตลอดเวลา',
    active: 'ใช้งาน',
    inactive: 'ปิดใช้งาน',
  },
  ko: {
    title: '전기요금 설정',
    subtitle: 'kWh 단가와 기간별 요금 규칙을 설정합니다',
    unitRate: '단가 (kWh당)',
    periodFrom: '시작일',
    periodTo: '종료일',
    note: '메모',
    save: '요금 저장',
    loading: '불러오는 중...',
    empty: '등록된 요금 규칙이 없습니다',
    actions: '관리',
    rate: '요금',
    period: '기간',
    allTime: '상시 적용',
    active: '사용',
    inactive: '비활성',
  },
  en: {
    title: 'Electricity Rate Settings',
    subtitle: 'Set per-kWh rates and optional effective date ranges',
    unitRate: 'Rate per kWh',
    periodFrom: 'Effective from',
    periodTo: 'Effective to',
    note: 'Note',
    save: 'Save Rate',
    loading: 'Loading...',
    empty: 'No electricity rates yet',
    actions: 'Actions',
    rate: 'Rate',
    period: 'Period',
    allTime: 'Always',
    active: 'Active',
    inactive: 'Inactive',
  },
}

function formatDatetimeForInput(value: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return ''
  const tzMs = d.getTimezoneOffset() * 60 * 1000
  return new Date(d.getTime() - tzMs).toISOString().slice(0, 16)
}

export default function ElectricityRateManager({ site, locale }: Props) {
  const C = copyMap[locale] || copyMap.en
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState<RateRule[]>([])
  const [editId, setEditId] = useState<number | null>(null)
  const [ratePerKwh, setRatePerKwh] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [effectiveTo, setEffectiveTo] = useState('')
  const [label, setLabel] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const siteSymbol = useMemo(() => {
    if (site === 'korea') return '₩'
    if (site === 'vietnam') return '₫'
    if (site === 'malaysia') return 'RM'
    return '฿'
  }, [site])

  const loadRules = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/ge-energy/electricity-rates?site=${site}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load rates')
      setRules(Array.isArray(json.data?.rules) ? json.data.rules : [])
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load rates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [site])

  const resetForm = () => {
    setEditId(null)
    setRatePerKwh('')
    setEffectiveFrom('')
    setEffectiveTo('')
    setLabel('')
    setIsActive(true)
  }

  const fillForEdit = (rule: RateRule) => {
    setEditId(rule.id)
    setRatePerKwh(String(rule.ratePerKwh))
    setEffectiveFrom(formatDatetimeForInput(rule.effectiveFrom))
    setEffectiveTo(formatDatetimeForInput(rule.effectiveTo))
    setLabel(rule.label || '')
    setIsActive(rule.isActive)
  }

  const saveRule = async () => {
    const rate = Number(ratePerKwh)
    if (!Number.isFinite(rate) || rate <= 0) {
      setError('Rate per kWh must be greater than 0')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/ge-energy/electricity-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId || undefined,
          site,
          ratePerKwh: rate,
          effectiveFrom: effectiveFrom || null,
          effectiveTo: effectiveTo || null,
          label: label || null,
          isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save rate')
      setRules(Array.isArray(json.data?.rules) ? json.data.rules : [])
      setError(null)
      resetForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save rate')
    } finally {
      setSaving(false)
    }
  }

  const removeRule = async (id: number) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/ge-energy/electricity-rates?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete rate')
      await loadRules()
      if (editId === id) resetForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete rate')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{C.title}</h2>
        <p className="text-sm text-gray-500">{C.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <label className="xl:col-span-1">
          <span className="block text-xs text-gray-500 mb-1">{C.unitRate}</span>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={ratePerKwh}
            onChange={(e) => setRatePerKwh(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder={`${siteSymbol} 0.0000`}
          />
        </label>
        <label>
          <span className="block text-xs text-gray-500 mb-1">{C.periodFrom}</span>
          <input
            type="datetime-local"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label>
          <span className="block text-xs text-gray-500 mb-1">{C.periodTo}</span>
          <input
            type="datetime-local"
            value={effectiveTo}
            onChange={(e) => setEffectiveTo(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label>
          <span className="block text-xs text-gray-500 mb-1">{C.note}</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder={C.note}
          />
        </label>
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-gray-600 mt-5">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {isActive ? C.active : C.inactive}
          </label>
          <div className="flex gap-2">
            <button
              onClick={saveRule}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm disabled:opacity-60"
            >
              {editId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {C.save}
            </button>
            {editId && (
              <button
                onClick={resetForm}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">{C.rate}</th>
              <th className="text-left px-3 py-2">{C.period}</th>
              <th className="text-left px-3 py-2">{C.note}</th>
              <th className="text-left px-3 py-2">{C.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={4}>{C.loading}</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={4}>{C.empty}</td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-semibold">
                    {siteSymbol} {Number(rule.ratePerKwh).toLocaleString()}
                    <span className="ml-2 text-xs text-gray-500">/kWh</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {rule.effectiveFrom || rule.effectiveTo
                      ? `${rule.effectiveFrom ? new Date(rule.effectiveFrom).toLocaleString() : '...'} - ${rule.effectiveTo ? new Date(rule.effectiveTo).toLocaleString() : '...'}`
                      : C.allTime}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{rule.label || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fillForEdit(rule)}
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
