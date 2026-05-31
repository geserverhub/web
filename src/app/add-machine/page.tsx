'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Server } from 'lucide-react'

const SITES = [
  { value: 'thailand', label: '🇹🇭 Thailand' },
  { value: 'korea',    label: '🇰🇷 Korea' },
  { value: 'vietnam',  label: '🇻🇳 Vietnam' },
  { value: 'malaysia', label: '🇲🇾 Malaysia' },
]

export default function AddMachinePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    deviceName: '',
    geID: '',
    series_no: '',
    ipAddress: '',
    location: '',
    site: 'thailand',
    status: 'OK',
    beforeMeterNo: '1',
    metricsMeterNo: '2',
    U_email: '',
    P_email: '',
    phone: '',
    pass_phone: '',
    latitude: '',
    longitude: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('energy_system_token')
    if (!token) router.replace('/energy-dashboard-login')
  }, [router])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/ge-energy/meter-seting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to add device')
      setSuccess(true)
      setTimeout(() => router.push('/energy-dashboard/meter-seting'), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const INPUT = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 outline-none text-sm transition-all'
  const LABEL = 'block text-xs font-semibold text-gray-600 mb-1.5'

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #065f46 100%)', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft size={15} /> กลับ
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Server size={22} color="#fff" />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>เพิ่มอุปกรณ์ใหม่</div>
            <div style={{ color: '#a7f3d0', fontSize: 12 }}>Add New Device / Machine</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '28px auto', padding: '0 20px' }}>
        <form onSubmit={handleSubmit}>
          {/* Device Info */}
          <Section title="ข้อมูลอุปกรณ์" subtitle="Device Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>ชื่ออุปกรณ์ <span style={{ color: '#dc2626' }}>*</span></label>
                <input required className={INPUT} value={form.deviceName} onChange={set('deviceName')} placeholder="เช่น Energy Meter CT-01" />
              </div>
              <div>
                <label className={LABEL}>GE ID (geID)</label>
                <input className={INPUT} value={form.geID} onChange={set('geID')} placeholder="เช่น GE-2024-001" />
              </div>
              <div>
                <label className={LABEL}>Series No.</label>
                <input className={INPUT} value={form.series_no} onChange={set('series_no')} placeholder="หมายเลขซีรีส์" />
              </div>
              <div>
                <label className={LABEL}>IP Address</label>
                <input className={INPUT} value={form.ipAddress} onChange={set('ipAddress')} placeholder="192.168.1.100" />
              </div>
              <div>
                <label className={LABEL}>Before Meter No.</label>
                <input className={INPUT} value={form.beforeMeterNo} onChange={set('beforeMeterNo')} placeholder="1" />
              </div>
              <div>
                <label className={LABEL}>Metrics Meter No.</label>
                <input className={INPUT} value={form.metricsMeterNo} onChange={set('metricsMeterNo')} placeholder="2" />
              </div>
            </div>
          </Section>

          {/* Location & Status */}
          <Section title="สถานที่และสถานะ" subtitle="Location & Status">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Site / ประเทศ</label>
                <select className={INPUT} value={form.site} onChange={set('site')}>
                  {SITES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Location / สถานที่</label>
                <input className={INPUT} value={form.location} onChange={set('location')} placeholder="เช่น Bangkok, Thailand" />
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select className={INPUT} value={form.status} onChange={set('status')}>
                  <option value="OK">✅ OK</option>
                  <option value="ON">🟢 ON</option>
                  <option value="active">🟢 Active</option>
                  <option value="disabled">🔴 Disabled</option>
                  <option value="maintenance">🟡 Maintenance</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Latitude</label>
                <input className={INPUT} type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="13.736717" />
              </div>
              <div>
                <label className={LABEL}>Longitude</label>
                <input className={INPUT} type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="100.523186" />
              </div>
            </div>
          </Section>

          {/* Owner / Contact */}
          <Section title="ข้อมูลเจ้าของ / ติดต่อ" subtitle="Owner & Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>User Email (U_email)</label>
                <input className={INPUT} type="email" value={form.U_email} onChange={set('U_email')} placeholder="user@example.com" />
              </div>
              <div>
                <label className={LABEL}>Partner Email (P_email)</label>
                <input className={INPUT} type="email" value={form.P_email} onChange={set('P_email')} placeholder="partner@example.com" />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input className={INPUT} value={form.phone} onChange={set('phone')} placeholder="+66 81 234 5678" />
              </div>
              <div>
                <label className={LABEL}>Pass Phone</label>
                <input className={INPUT} value={form.pass_phone} onChange={set('pass_phone')} placeholder="รหัสผ่านโทรศัพท์" />
              </div>
            </div>
          </Section>

          {/* Customer */}
          <Section title="ข้อมูลลูกค้า" subtitle="Customer Info (Optional)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Customer Name</label>
                <input className={INPUT} value={form.customerName} onChange={set('customerName')} placeholder="ชื่อลูกค้า" />
              </div>
              <div>
                <label className={LABEL}>Customer Phone</label>
                <input className={INPUT} value={form.customerPhone} onChange={set('customerPhone')} placeholder="เบอร์โทรลูกค้า" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Customer Address</label>
                <textarea className={INPUT} rows={2} value={form.customerAddress} onChange={set('customerAddress')} placeholder="ที่อยู่ลูกค้า" style={{ resize: 'vertical' }} />
              </div>
            </div>
          </Section>

          {/* Actions */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d1fae5', padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            {error && (
              <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', color: '#dc2626', fontSize: 13 }}>
                ❌ {error}
              </div>
            )}
            {success && (
              <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', color: '#16a34a', fontSize: 13, fontWeight: 700 }}>
                ✅ เพิ่มอุปกรณ์สำเร็จ กำลังกลับไปหน้า Meter Setting...
              </div>
            )}
            {!error && !success && <div style={{ flex: 1 }} />}
            <button
              type="button"
              onClick={() => router.back()}
              style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || success}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 10, border: 'none', background: saving || success ? '#6ee7b7' : 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving || success ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}
            >
              <Save size={16} />
              {saving ? 'กำลังบันทึก...' : 'บันทึกอุปกรณ์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d1fae5', padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#064e3b' }}>{title}</h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
