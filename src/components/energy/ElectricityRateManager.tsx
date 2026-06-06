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

  // --- Bill history states ---
  const [devices, setDevices] = useState<Array<{ deviceID: number; deviceName: string; customer_id?: number }>>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null)
  const [billRows, setBillRows] = useState<Array<{ billMonth: string; energyKwh?: number | null; billCost?: number | null; peakKw?: number | null; peakCost?: number | null }>>([])
  const [breakerSizeAmp, setBreakerSizeAmp] = useState<number | null>(null)
  const [billNote, setBillNote] = useState<string | null>(null)
  const [billLoading, setBillLoading] = useState(false)

  // helper: build last 12 months rows (YYYY-MM-01)
  function buildLast12Months() {
    const rows: any[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.toISOString().slice(0, 10).slice(0, 7) // YYYY-MM
      rows.push({ billMonth: `${m}-01`, energyKwh: null, billCost: null, peakKw: null, peakCost: null })
    }
    return rows
  }

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

  // Load devices for linking bill history to a meter
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/ge-energy/devices-setting?site=${site}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load devices')
        if (!mounted) return
        setDevices(Array.isArray(json.devices) ? json.devices : [])
      } catch (e: unknown) {
        // ignore device loading errors for this panel
      }
    })()
    return () => { mounted = false }
  }, [site])

  // Load bill history for selected device
  useEffect(() => {
    let mounted = true
    if (!selectedDeviceId) {
      setBillRows(buildLast12Months())
      setBreakerSizeAmp(null)
      setBillNote(null)
      return
    }
    ;(async () => {
      try {
        setBillLoading(true)
        const res = await fetch(`/api/ge-energy/bill-history?deviceId=${selectedDeviceId}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load bill history')
        if (!mounted) return
        const bills = Array.isArray(json.bills) ? json.bills : []
        // Map bills into 12-month structure, defaulting missing months
        const base = buildLast12Months()
        const byMonth = new Map(bills.map((b: any) => [String(b.billMonth).slice(0, 10), b]))
        const mapped = base.map((r: any) => {
          const key = String(r.billMonth).slice(0, 10)
          const found = byMonth.get(key)
          return {
            billMonth: r.billMonth,
            energyKwh: found ? found.energyKwh : null,
            billCost: found ? found.billCost : null,
            peakKw: found ? found.peakKw : null,
            peakCost: found ? found.peakCost : null,
          }
        })
        setBillRows(mapped)
        setBreakerSizeAmp(json.breakerSizeAmp ?? null)
        setBillNote(null)
      } catch (e: unknown) {
        setBillRows(buildLast12Months())
        setBreakerSizeAmp(null)
      } finally {
        if (mounted) setBillLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [selectedDeviceId])

  const saveBillHistory = async () => {
    if (!selectedDeviceId) {
      setError('Select a device to save bill history')
      return
    }
    try {
      setSaving(true)
      const rows = billRows.map((r) => ({ billMonth: String(r.billMonth).slice(0, 10), energyKwh: r.energyKwh ?? null, billCost: r.billCost ?? null, peakKw: r.peakKw ?? null, peakCost: r.peakCost ?? null }))
      const customerId = devices.find((d) => d.deviceID === selectedDeviceId)?.customer_id ?? null
      const res = await fetch('/api/ge-energy/bill-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDeviceId, customerId, site, breakerSizeAmp, note: billNote, rows }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save bill history')
      setError(null)
      // refresh
      const reloadRes = await fetch(`/api/ge-energy/bill-history?deviceId=${selectedDeviceId}`, { cache: 'no-store' })
      const reloadJson = await reloadRes.json()
      if (reloadRes.ok && reloadJson.success) {
        const bills = Array.isArray(reloadJson.bills) ? reloadJson.bills : []
        const base = buildLast12Months()
        const byMonth = new Map(bills.map((b: any) => [String(b.billMonth).slice(0, 10), b]))
        const mapped = base.map((r: any) => {
          const key = String(r.billMonth).slice(0, 10)
          const found = byMonth.get(key)
          return {
            billMonth: r.billMonth,
            energyKwh: found ? found.energyKwh : null,
            billCost: found ? found.billCost : null,
            peakKw: found ? found.peakKw : null,
            peakCost: found ? found.peakCost : null,
          }
        })
        setBillRows(mapped)
        setBreakerSizeAmp(reloadJson.breakerSizeAmp ?? breakerSizeAmp)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save bill history')
    } finally {
      setSaving(false)
    }
  }

  const deleteBillHistoryForDevice = async () => {
    if (!selectedDeviceId) {
      setError('Select a device to delete bill history')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/ge-energy/bill-history?deviceId=${selectedDeviceId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete bill history')
      setBillRows(buildLast12Months())
      setBreakerSizeAmp(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete bill history')
    } finally {
      setSaving(false)
    }
  }

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

      {/* Bill history input (past 12 months) */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-800">บันทึกบิลค่าไฟย้อนหลัง (12 เดือน)</h3>
        <p className="text-xs text-gray-500 mb-3">กรอกข้อมูลบิลค่าไฟย้อนหลัง เพื่อผูกเข้ากับมิเตอร์และใช้ในการวิเคราะห์</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <label>
            <span className="block text-xs text-gray-500 mb-1">เลือกมิเตอร์ (ผูกข้อมูล)</span>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={selectedDeviceId ?? ''} onChange={(e) => setSelectedDeviceId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">-- เลือกมิเตอร์ --</option>
              {devices.map((d) => (
                <option key={d.deviceID} value={d.deviceID}>{d.deviceName} · {d.deviceID}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-xs text-gray-500 mb-1">ขนาดเบรคเกอร์ (A)</span>
            <input type="number" step="1" min="0" value={breakerSizeAmp ?? ''} onChange={(e) => setBreakerSizeAmp(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="block text-xs text-gray-500 mb-1">หมายเหตุ</span>
            <input type="text" value={billNote ?? ''} onChange={(e) => setBillNote(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="หมายเหตุ" />
          </label>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl mb-3">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">เดือน</th>
                <th className="text-left px-3 py-2">ปริมาณ (kWh)</th>
                <th className="text-left px-3 py-2">ยอดเงิน (บาท)</th>
                <th className="text-left px-3 py-2">Peak kW</th>
                <th className="text-left px-3 py-2">Peak cost</th>
              </tr>
            </thead>
            <tbody>
              {(billLoading ? buildLast12Months() : billRows).map((r, idx) => (
                <tr key={r.billMonth} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <input type="month" value={String(r.billMonth).slice(0,7)} onChange={(e) => {
                      const copy = [...billRows]
                      copy[idx] = { ...copy[idx], billMonth: `${e.target.value}-01` }
                      setBillRows(copy)
                    }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-36" />
                  </td>
                  <td className="px-3 py-2"><input type="number" step="0.01" min="0" value={r.energyKwh ?? ''} onChange={(e) => { const copy = [...billRows]; copy[idx] = { ...copy[idx], energyKwh: e.target.value === '' ? null : Number(e.target.value) }; setBillRows(copy) }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-28" /></td>
                  <td className="px-3 py-2"><input type="number" step="0.01" min="0" value={r.billCost ?? ''} onChange={(e) => { const copy = [...billRows]; copy[idx] = { ...copy[idx], billCost: e.target.value === '' ? null : Number(e.target.value) }; setBillRows(copy) }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-32" /></td>
                  <td className="px-3 py-2"><input type="number" step="0.01" min="0" value={r.peakKw ?? ''} onChange={(e) => { const copy = [...billRows]; copy[idx] = { ...copy[idx], peakKw: e.target.value === '' ? null : Number(e.target.value) }; setBillRows(copy) }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-28" /></td>
                  <td className="px-3 py-2"><input type="number" step="0.01" min="0" value={r.peakCost ?? ''} onChange={(e) => { const copy = [...billRows]; copy[idx] = { ...copy[idx], peakCost: e.target.value === '' ? null : Number(e.target.value) }; setBillRows(copy) }} className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-32" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <button onClick={saveBillHistory} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm">
            <Save className="w-4 h-4" /> บันทึกบิลย้อนหลัง
          </button>
          <button onClick={deleteBillHistoryForDevice} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-red-200 text-red-600 px-4 py-2 text-sm">
            ลบข้อมูลย้อนหลัง
          </button>
        </div>
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
