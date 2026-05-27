'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Mail, User, Building2, Phone, Cpu, Hash, MapPin, Globe, Wifi } from 'lucide-react';
import {
  GET_AUTH_COMPANY,
  GET_AUTH_LANG_OPTIONS,
  GET_REGISTER_COPY,
  readGetAuthLang,
  writeGetAuthLang,
} from '@/lib/ge-energy-tech-auth-i18n';
import '@/app/ge-energy-tech/ge-energy-tech-auth.css';

const INITIAL_FORM = {
  name: '',
  company: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  confirm: '',
  deviceSerial: '',
  deviceModel: '',
  deviceConnectionType: '',
  deviceSimPhone: '',
  deviceWifiDetail: '',
  installAddress: '',
  installPostal: '',
  installCountry: '',
};

export default function GeEnergyTechRegisterPage() {
  const router = useRouter();
  const [lang, setLang] = useState('th');
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = readGetAuthLang();
    setLang(saved);
    writeGetAuthLang(saved);
  }, []);

  function handleLangChange(code) {
    setLang(code);
    writeGetAuthLang(code);
  }

  const t = GET_REGISTER_COPY[lang] || GET_REGISTER_COPY.th;
  const company = GET_AUTH_COMPANY[lang] || GET_AUTH_COMPANY.th;

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function onConnectionTypeChange(type) {
    setForm((f) => ({
      ...f,
      deviceConnectionType: type,
      deviceSimPhone: type === 'sim' ? f.deviceSimPhone : '',
      deviceWifiDetail: type === 'wifi' ? f.deviceWifiDetail : '',
    }));
  }

  function validateDeviceBase() {
    return (
      form.deviceSerial.trim() &&
      form.deviceModel.trim() &&
      form.installAddress.trim() &&
      form.installPostal.trim() &&
      form.installCountry.trim()
    );
  }

  function validateDeviceConnection() {
    if (form.deviceConnectionType === 'sim') return Boolean(form.deviceSimPhone.trim());
    if (form.deviceConnectionType === 'wifi') return Boolean(form.deviceWifiDetail.trim());
    return false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validateDeviceBase()) {
      setError(t.deviceRequired);
      return;
    }
    if (!form.deviceConnectionType) {
      setError(t.deviceConnRequired);
      return;
    }
    if (form.deviceConnectionType === 'sim' && !form.deviceSimPhone.trim()) {
      setError(t.deviceSimRequired);
      return;
    }
    if (form.deviceConnectionType === 'wifi' && !form.deviceWifiDetail.trim()) {
      setError(t.deviceWifiRequired);
      return;
    }
    if (form.password !== form.confirm) {
      setError(t.mismatch);
      return;
    }
    if (form.password.length < 8) {
      setError(t.minPassword);
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone,
        username: form.username,
        password: form.password,
        lang,
        device: {
          serial: form.deviceSerial.trim(),
          model: form.deviceModel.trim(),
          connectionType: form.deviceConnectionType,
          simPhone: form.deviceConnectionType === 'sim' ? form.deviceSimPhone.trim() : '',
          wifiDetail: form.deviceConnectionType === 'wifi' ? form.deviceWifiDetail.trim() : '',
          installAddress: form.installAddress.trim(),
          installPostal: form.installPostal.trim(),
          installCountry: form.installCountry.trim(),
        },
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t.genericError);
      return;
    }

    router.push('/ge-energy-tech/login?registered=1');
  }

  return (
    <div className="get-auth-page">
      <div className="get-auth-lang" role="group" aria-label={t.langLabel}>
        <div className="get-auth-lang-inner">
          {GET_AUTH_LANG_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              className={lang === opt.code ? 'is-active' : ''}
              onClick={() => handleLangChange(opt.code)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="get-auth-card get-auth-card--wide">
        <header className="get-auth-brand">
          <Image
            src="/ge-energyTech/138568-transparent.png"
            alt="GE Energy Tech"
            width={72}
            height={72}
            className="get-auth-logo"
            priority
          />
          <span className="get-auth-badge">{t.badge}</span>
          <p className="get-auth-company">{company}</p>
          <h1 className="get-auth-title">{t.title}</h1>
          <p className="get-auth-sub">{t.sub}</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="reg-name">{t.name}</label>
            <div className="get-auth-input-wrap">
              <User size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={onChange}
                className="get-auth-input"
              />
            </div>
          </div>

          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="reg-company">{t.company}</label>
            <div className="get-auth-input-wrap">
              <Building2 size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="reg-company"
                name="company"
                type="text"
                autoComplete="organization"
                value={form.company}
                onChange={onChange}
                className="get-auth-input"
              />
            </div>
          </div>

          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="reg-email">{t.email}</label>
            <div className="get-auth-input-wrap">
              <Mail size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={onChange}
                className="get-auth-input"
              />
            </div>
          </div>

          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="reg-phone">{t.phone}</label>
            <div className="get-auth-input-wrap">
              <Phone size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={onChange}
                className="get-auth-input"
              />
            </div>
          </div>

          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="reg-username">{t.username}</label>
            <div className="get-auth-input-wrap">
              <User size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="reg-username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={onChange}
                className="get-auth-input"
              />
            </div>
          </div>

          <section className="get-auth-device-card" aria-labelledby="device-section-title">
            <h2 id="device-section-title">{t.deviceTitle}</h2>
            <p>{t.deviceSub}</p>

            <div className="get-auth-field">
              <label className="get-auth-label" htmlFor="reg-device-serial">{t.deviceSerial}</label>
              <div className="get-auth-input-wrap">
                <Hash size={18} className="get-auth-input-icon" aria-hidden />
                <input
                  id="reg-device-serial"
                  name="deviceSerial"
                  type="text"
                  required
                  value={form.deviceSerial}
                  onChange={onChange}
                  placeholder={t.deviceSerialPh}
                  className="get-auth-input"
                />
              </div>
            </div>

            <div className="get-auth-field">
              <label className="get-auth-label" htmlFor="reg-device-model">{t.deviceModel}</label>
              <div className="get-auth-input-wrap">
                <Cpu size={18} className="get-auth-input-icon" aria-hidden />
                <input
                  id="reg-device-model"
                  name="deviceModel"
                  type="text"
                  required
                  value={form.deviceModel}
                  onChange={onChange}
                  placeholder={t.deviceModelPh}
                  className="get-auth-input"
                />
              </div>
            </div>

            <fieldset className="get-auth-conn-fieldset">
              <legend className="get-auth-label">{t.deviceConnection}</legend>
              <div className="get-auth-conn-options">
                <label className="get-auth-conn-option">
                  <input
                    type="radio"
                    name="deviceConnectionType"
                    value="sim"
                    checked={form.deviceConnectionType === 'sim'}
                    onChange={() => onConnectionTypeChange('sim')}
                  />
                  <span>{t.deviceConnSim}</span>
                </label>
                <label className="get-auth-conn-option">
                  <input
                    type="radio"
                    name="deviceConnectionType"
                    value="wifi"
                    checked={form.deviceConnectionType === 'wifi'}
                    onChange={() => onConnectionTypeChange('wifi')}
                  />
                  <span>{t.deviceConnWifi}</span>
                </label>
              </div>
            </fieldset>

            {form.deviceConnectionType === 'sim' ? (
              <div className="get-auth-field">
                <label className="get-auth-label" htmlFor="reg-device-sim">{t.deviceSimPhone}</label>
                <div className="get-auth-input-wrap">
                  <Phone size={18} className="get-auth-input-icon" aria-hidden />
                  <input
                    id="reg-device-sim"
                    name="deviceSimPhone"
                    type="tel"
                    required
                    value={form.deviceSimPhone}
                    onChange={onChange}
                    placeholder={t.deviceSimPh}
                    className="get-auth-input"
                  />
                </div>
              </div>
            ) : null}

            {form.deviceConnectionType === 'wifi' ? (
              <div className="get-auth-field">
                <label className="get-auth-label" htmlFor="reg-device-wifi">{t.deviceWifiDetail}</label>
                <div className="get-auth-input-wrap">
                  <Wifi size={18} className="get-auth-input-icon" aria-hidden />
                  <input
                    id="reg-device-wifi"
                    name="deviceWifiDetail"
                    type="text"
                    required
                    value={form.deviceWifiDetail}
                    onChange={onChange}
                    placeholder={t.deviceWifiPh}
                    className="get-auth-input"
                  />
                </div>
              </div>
            ) : null}

            <div className="get-auth-field">
              <label className="get-auth-label" htmlFor="reg-install-address">{t.installAddress}</label>
              <textarea
                id="reg-install-address"
                name="installAddress"
                required
                rows={3}
                value={form.installAddress}
                onChange={onChange}
                placeholder={t.installAddressPh}
                className="get-auth-textarea"
              />
            </div>

            <div className="get-auth-row">
              <div className="get-auth-field">
                <label className="get-auth-label" htmlFor="reg-install-postal">{t.installPostal}</label>
                <div className="get-auth-input-wrap">
                  <MapPin size={18} className="get-auth-input-icon" aria-hidden />
                  <input
                    id="reg-install-postal"
                    name="installPostal"
                    type="text"
                    required
                    value={form.installPostal}
                    onChange={onChange}
                    placeholder={t.installPostalPh}
                    className="get-auth-input"
                  />
                </div>
              </div>
              <div className="get-auth-field">
                <label className="get-auth-label" htmlFor="reg-install-country">{t.installCountry}</label>
                <div className="get-auth-input-wrap">
                  <Globe size={18} className="get-auth-input-icon" aria-hidden />
                  <input
                    id="reg-install-country"
                    name="installCountry"
                    type="text"
                    required
                    autoComplete="country-name"
                    value={form.installCountry}
                    onChange={onChange}
                    placeholder={t.installCountryPh}
                    className="get-auth-input"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="reg-password">{t.password}</label>
            <div className="get-auth-input-wrap">
              <Lock size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={onChange}
                className="get-auth-input"
              />
            </div>
          </div>

          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="reg-confirm">{t.confirm}</label>
            <div className="get-auth-input-wrap">
              <Lock size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="reg-confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={onChange}
                className="get-auth-input"
              />
            </div>
          </div>

          {error ? <div className="get-auth-error" role="alert">{error}</div> : null}

          <button type="submit" className="get-auth-submit" disabled={loading}>
            {loading ? t.submitting : t.submit}
          </button>
        </form>

        <footer className="get-auth-footer">
          <div className="get-auth-footer-actions">
            <Link href="/ge-energy-tech/login" className="get-auth-link-btn get-auth-link-btn--primary">
              {t.signIn}
            </Link>
          </div>
          <Link href="/ge-energy-tech" className="get-auth-back">
            {t.back}
          </Link>
        </footer>
      </div>
    </div>
  );
}
