'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Save, Trash2 } from 'lucide-react'

type BillRow = {
  billMonth: string // YYYY-MM-01
  energyKwh: string
  billCost: string
  peakKw: string
  peakCost: string
}

type DeviceOption = {
  deviceID: string
  deviceName: string
  customerName?: string
}

type CustomerOption = {
  customerName: string
  customer_id?: number
}

function lastNMonths(n = 12) {
  const r: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    r.push(`${yyyy}-${mm}-01`)
  }
  return r.reverse()
}

export default function BillHistoryManager({ site, locale }: { site: string; locale: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [devices, setDevices] = useState<DeviceOption[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [breakerSizeAmp, setBreakerSizeAmp] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [rows, setRows] = useState<BillRow[]>(() => lastNMonths(12).map((m) => ({ billMonth: m, energyKwh: '', billCost: '', peakKw: '', peakCost: '' })))
  const [message, setMessage] = useState<string | null>(null)

  const copy = useMemo(() => ({
    title: 'บันทึกข้อมูลบิลค่าไฟย้อนหลัง (12 เดือน)',
    selectDevice: 'เลือกมิเตอร์',
    selectCustomer: 'เลือกลูกค้า (เชื่อม)',
    breakerSize: 'ขนาดเบรคเกอร์ (A)',
    note: 'หมายเหตุ',
    load: 'โหลด',
    save: 'บันทึกประวัติ',
    delete: 'ลบประวัติ',
    loading: 'กำลังโหลด...',
  }), [])

  const loadDevicesAndCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const [devRes, cusRes] = await Promise.all([
        fetch(`/api/ge-energy/devices-setting?site=${encodeURIComponent(site)}`),
        fetch(`/api/ge-energy/customers-by-site?site=${encodeURIComponent(site)}`),
      ])
      const devJson = await devRes.json()
      const cusJson = await cusRes.json()
      setDevices(Array.isArray(devJson.devices || devJson.data) ? (devJson.devices || devJson.data).map((d: any) => ({ deviceID: String(d.deviceID ?? ''), deviceName: d.deviceName ?? String(d.deviceID), customerName: d.customerName })) : [])
      setCustomers(Array.isArray(cusJson.customers) ? cusJson.customers.map((c: any) => ({ customerName: c.customerName, customer_id: c.customer_id })) : [])
    } catch (err) {
      console.error('Failed to load devices/customers', err)
    } finally {
      setLoading(false)
    }
  }, [site])

  useEffect(() => {
    loadDevicesAndCustomers()
  }, [loadDevicesAndCustomers])

  // Load bill history for device
  const loadHistory = useCallback(async (id: string | null) => {
    if (!id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/ge-energy/bill-history?deviceId=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load bill history')
      const bills = Array.isArray(json.bills) ? json.bills : []
      const map = new Map<string, any>(bills.map((b: any) => [String(b.billMonth).slice(0, 10), b]))
      const template = lastNMonths(12)
      const merged = template.map((m) => {
        const found = map.get(m)
        return {
          billMonth: m,
          energyKwh: found && found.energyKwh != null ? String(found.energyKwh) : '',
          billCost: found && found.billCost != null ? String(found.billCost) : '',
          peakKw: found && found.peakKw != null ? String(found.peakKw) : '',
          peakCost: found && found.peakCost != null ? String(found.peakCost) : '',
        }
      })
      setRows(merged)
      setBreakerSizeAmp(json.breakerSizeAmp != null ? String(json.breakerSizeAmp) : '')
      setMessage(null)
    } catch (err: any) {
      console.error(err)
      setMessage(err?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory(deviceId)
  }, [deviceId, loadHistory])

  const setRowValue = (index: number, key: keyof Omit<BillRow, 'billMonth'>, value: string) => {
    setRows((r) => r.map((row, i) => i === index ? { ...row, [key]: value } : row))
  }

  const save = async () => {
    if (!deviceId) { setMessage('Select a device first'); return }
    try {
      setSaving(true)
      setMessage(null)
      const payload = {
        deviceId: Number(deviceId),
        customerId: customers.find((c) => c.customerName === customerName)?.customer_id ?? null,
        site,
        breakerSizeAmp: breakerSizeAmp ? Number(breakerSizeAmp) : null,
        note: note || null,
        rows: rows.map((r) => ({ billMonth: r.billMonth, energyKwh: r.energyKwh === '' ? null : Number(r.energyKwh), billCost: r.billCost === '' ? null : Number(r.billCost), peakKw: r.peakKw === '' ? null : Number(r.peakKw), peakCost: r.peakCost === '' ? null : Number(r.peakCost) }))
      }
      const res = await fetch('/api/ge-energy/bill-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save')
      setMessage('Saved')
      await loadHistory(deviceId)
    } catch (err: any) {
      setMessage(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const removeAll = async () => {
    if (!deviceId) { setMessage('Select a device first'); return }
    try {
      setSaving(true)
      const res = await fetch(`/api/ge-energy/bill-history?deviceId=${encodeURIComponent(deviceId)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete')
      setRows(lastNMonths(12).map((m) => ({ billMonth: m, energyKwh: '', billCost: '', peakKw: '', peakCost: '' })))
      setBreakerSizeAmp('')
      setMessage('Deleted')
    } catch (err: any) {
      setMessage(err?.message || 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  const filteredDevices = useMemo(() => {
    if (!customerName) return devices
    return devices.filter((d) => d.customerName === customerName)
  }, [devices, customerName])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{copy.title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label>
          <span className="block text-xs text-gray-500 mb-1">{copy.selectCustomer}</span>
          <select value={customerName ?? ''} onChange={(e) => setCustomerName(e.target.value || null)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">--</option>
            {customers.map((c) => <option key={c.customerName} value={c.customerName}>{c.customerName}</option>)}
          </select>
        </label>

        <label>
          <span className="block text-xs text-gray-500 mb-1">{copy.selectDevice}</span>
          <select value={deviceId ?? ''} onChange={(e) => setDeviceId(e.target.value || null)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">--</option>
            {filteredDevices.map((d) => <option key={d.deviceID} value={d.deviceID}>{d.deviceName} · {d.deviceID}</option>)}
          </select>
        </label>

        <label>
          <span className="block text-xs text-gray-500 mb-1">{copy.breakerSize}</span>
          <input type="number" min="0" value={breakerSizeAmp} onChange={(e) => setBreakerSizeAmp(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-2">{copy.note}</label>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Month</th>
              <th className="text-left px-3 py-2">kWh</th>
              <th className="text-left px-3 py-2">Cost</th>
              <th className="text-left px-3 py-2">Peak kW</th>
              <th className="text-left px-3 py-2">Peak Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.billMonth} className="border-t border-gray-100">
                <td className="px-3 py-2">{r.billMonth.slice(0,7)}</td>
                <td className="px-3 py-2">
                  <input type="number" step="0.01" min="0" value={r.energyKwh} onChange={(e) => setRowValue(i, 'energyKwh', e.target.value)} className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" step="0.01" min="0" value={r.billCost} onChange={(e) => setRowValue(i, 'billCost', e.target.value)} className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" step="0.01" min="0" value={r.peakKw} onChange={(e) => setRowValue(i, 'peakKw', e.target.value)} className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" step="0.01" min="0" value={r.peakCost} onChange={(e) => setRowValue(i, 'peakCost', e.target.value)} className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && <div className="text-sm text-gray-600">{message}</div>}

      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm">
          <Save className="w-4 h-4" /> {copy.save}
        </button>
        <button onClick={removeAll} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-red-200 text-red-600 px-4 py-2 text-sm">
          <Trash2 className="w-4 h-4" /> {copy.delete}
        </button>
        <button onClick={() => loadHistory(deviceId)} disabled={!deviceId || loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm">
          <RefreshCw className="w-4 h-4" /> {copy.load}
        </button>
      </div>
    </div>
  )
}
