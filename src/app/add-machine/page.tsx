'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Server, Eye, EyeOff, Info } from 'lucide-react';
import { useLocale } from '@/lib/LocaleContext';
import EnergyLangSwitcher from '@/components/energy/EnergyLangSwitcher';
import { addMachineT, resolveAddMachineLocale } from '@/lib/energy/add-machine-i18n';

const SITES = [
  { value: 'thailand', flag: '🇹🇭' },
  { value: 'korea', flag: '🇰🇷' },
  { value: 'vietnam', flag: '🇻🇳' },
  { value: 'malaysia', flag: '🇲🇾' },
];

const SITE_LABELS: Record<string, Record<'th' | 'ko' | 'en', string>> = {
  thailand: { th: 'ไทย', ko: '태국', en: 'Thailand' },
  korea: { th: 'เกาหลี', ko: '한국', en: 'Korea' },
  vietnam: { th: 'เวียดนาม', ko: '베트남', en: 'Vietnam' },
  malaysia: { th: 'มาเลเซีย', ko: '말레이시아', en: 'Malaysia' },
};

export default function AddMachinePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const lang = resolveAddMachineLocale(locale);
  const ui = addMachineT(lang);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accountNote, setAccountNote] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    deviceName: '',
    GEsaveID: '',
    series_no: '',
    ipAddress: '',
    location: '',
    site: 'thailand',
    status: 'OK',
    beforeMeterNo: '1',
    metricsMeterNo: '2',
    customerLoginEmail: '',
    customerLoginPassword: '',
    customerLoginPasswordConfirm: '',
    phone: '',
    latitude: '',
    longitude: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('energy_system_token');
    if (!token) router.replace('/energy-dashboard-login');
  }, [router]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setAccountNote('');

    const email = form.customerLoginEmail.trim();
    const pw = form.customerLoginPassword.trim();
    const pw2 = form.customerLoginPasswordConfirm.trim();

    if (email && pw && pw !== pw2) {
      setError(ui.errorPasswordMismatch);
      return;
    }
    if (email && !pw) {
      setError(lang === 'th' ? 'กรุณากรอกพาสเวิร์ด' : lang === 'ko' ? '비밀번호를 입력하세요' : 'Please enter a password');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/ge-energy/meter-seting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName: form.deviceName,
          GEsaveID: form.GEsaveID,
          series_no: form.series_no,
          ipAddress: form.ipAddress,
          location: form.location,
          site: form.site,
          status: form.status,
          beforeMeterNo: form.beforeMeterNo,
          metricsMeterNo: form.metricsMeterNo,
          phone: form.phone,
          latitude: form.latitude,
          longitude: form.longitude,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerAddress: form.customerAddress,
          customerLoginEmail: form.customerLoginEmail || undefined,
          customerLoginPassword: form.customerLoginPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || ui.errorFailed);

      if (data.accountStatus === 'created') setAccountNote(ui.customerLoginCreated);
      else if (data.accountStatus === 'existing') setAccountNote(ui.customerLoginEmailDup);

      setSuccess(true);
      setTimeout(() => router.push('/energy-dashboard/meter-seting'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ui.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  const INPUT =
    'w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 outline-none text-sm transition-all';
  const LABEL = 'block text-xs font-semibold text-gray-600 mb-1.5';

  const statusOptions = [
    { value: 'OK', label: `✅ ${ui.statusOk}` },
    { value: 'ON', label: `🟢 ${ui.statusOn}` },
    { value: 'active', label: `🟢 ${ui.statusActive}` },
    { value: 'disabled', label: `🔴 ${ui.statusDisabled}` },
    { value: 'maintenance', label: `🟡 ${ui.statusMaintenance}` },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #065f46 100%)',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              borderRadius: 10,
              padding: '7px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={15} /> {ui.back}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Server size={22} color="#fff" />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{ui.title}</div>
              <div style={{ color: '#a7f3d0', fontSize: 12 }}>{ui.subtitle}</div>
            </div>
          </div>
        </div>
        <EnergyLangSwitcher className="shadow-md" />
      </div>

      <div style={{ maxWidth: 860, margin: '28px auto', padding: '0 20px' }}>
        <form onSubmit={handleSubmit}>
          <Section title={ui.sectionDevice} subtitle={ui.sectionDeviceSub}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>
                  {ui.deviceName} <span style={{ color: '#dc2626' }}>{ui.required}</span>
                </label>
                <input
                  required
                  className={INPUT}
                  value={form.deviceName}
                  onChange={set('deviceName')}
                  placeholder={ui.phDeviceName}
                />
              </div>
              <div>
                <label className={LABEL}>{ui.GEsaveID}</label>
                <input className={INPUT} value={form.GEsaveID} onChange={set('GEsaveID')} placeholder={ui.phGeId} />
              </div>
              <div>
                <label className={LABEL}>{ui.seriesNo}</label>
                <input className={INPUT} value={form.series_no} onChange={set('series_no')} placeholder={ui.phSeriesNo} />
              </div>
              <div>
                <label className={LABEL}>{ui.ipAddress}</label>
                <input className={INPUT} value={form.ipAddress} onChange={set('ipAddress')} placeholder="192.168.1.100" />
              </div>
              <div>
                <label className={LABEL}>{ui.beforeMeterNo}</label>
                <input className={INPUT} value={form.beforeMeterNo} onChange={set('beforeMeterNo')} placeholder="1" />
              </div>
              <div>
                <label className={LABEL}>{ui.metricsMeterNo}</label>
                <input className={INPUT} value={form.metricsMeterNo} onChange={set('metricsMeterNo')} placeholder="2" />
              </div>
            </div>
          </Section>

          <Section title={ui.sectionLocation} subtitle={ui.sectionLocationSub}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>{ui.site}</label>
                <select className={INPUT} value={form.site} onChange={set('site')}>
                  {SITES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.flag} {SITE_LABELS[s.value][lang]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>{ui.location}</label>
                <input className={INPUT} value={form.location} onChange={set('location')} placeholder={ui.phLocation} />
              </div>
              <div>
                <label className={LABEL}>{ui.status}</label>
                <select className={INPUT} value={form.status} onChange={set('status')}>
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>{ui.latitude}</label>
                <input
                  className={INPUT}
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={set('latitude')}
                  placeholder="13.736717"
                />
              </div>
              <div>
                <label className={LABEL}>{ui.longitude}</label>
                <input
                  className={INPUT}
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={set('longitude')}
                  placeholder="100.523186"
                />
              </div>
            </div>
          </Section>

          {/* ── Customer Login Account ── */}
          <Section title={ui.sectionOwner} subtitle={ui.sectionOwnerSub}>
            {/* hint banner */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            }}>
              <Info size={15} style={{ color: '#3b82f6', marginTop: 1, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#1d4ed8', lineHeight: 1.5 }}>
                {ui.customerLoginHint}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LABEL}>{ui.customerLoginEmail}</label>
                <input
                  className={INPUT}
                  type="email"
                  value={form.customerLoginEmail}
                  onChange={set('customerLoginEmail')}
                  placeholder="customer@example.com"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={LABEL}>{ui.customerLoginPassword}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={INPUT}
                    type={showPassword ? 'text' : 'password'}
                    value={form.customerLoginPassword}
                    onChange={set('customerLoginPassword')}
                    placeholder={ui.phCustomerLoginPassword}
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>{ui.customerLoginPasswordConfirm}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={INPUT}
                    type={showConfirm ? 'text' : 'password'}
                    value={form.customerLoginPasswordConfirm}
                    onChange={set('customerLoginPasswordConfirm')}
                    placeholder={ui.phCustomerLoginPassword}
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>{ui.phone}</label>
                <input className={INPUT} value={form.phone} onChange={set('phone')} placeholder="+66 81 234 5678" />
              </div>
            </div>
          </Section>

          <Section title={ui.sectionCustomer} subtitle={ui.sectionCustomerSub}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>{ui.customerName}</label>
                <input className={INPUT} value={form.customerName} onChange={set('customerName')} placeholder={ui.phCustomerName} />
              </div>
              <div>
                <label className={LABEL}>{ui.customerPhone}</label>
                <input className={INPUT} value={form.customerPhone} onChange={set('customerPhone')} placeholder={ui.phCustomerPhone} />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{ui.customerAddress}</label>
                <textarea
                  className={INPUT}
                  rows={2}
                  value={form.customerAddress}
                  onChange={set('customerAddress')}
                  placeholder={ui.phCustomerAddress}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </Section>

          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #d1fae5',
              padding: '20px 24px',
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {error && (
              <div style={{ flex: 1, minWidth: 200, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', color: '#dc2626', fontSize: 13 }}>
                ❌ {error}
              </div>
            )}
            {success && (
              <div style={{ flex: 1, minWidth: 200, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', color: '#16a34a', fontSize: 13, fontWeight: 700 }}>
                ✅ {ui.success}
                {accountNote && <div style={{ fontWeight: 400, marginTop: 4 }}>🔑 {accountNote}</div>}
              </div>
            )}
            {!error && !success && <div style={{ flex: 1 }} />}
            <button
              type="button"
              onClick={() => router.back()}
              style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              {ui.cancel}
            </button>
            <button
              type="submit"
              disabled={saving || success}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 28px', borderRadius: 10, border: 'none',
                background: saving || success ? '#6ee7b7' : 'linear-gradient(135deg,#059669,#047857)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: saving || success ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(5,150,105,0.35)',
              }}
            >
              <Save size={16} />
              {saving ? ui.saving : ui.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  );
}
