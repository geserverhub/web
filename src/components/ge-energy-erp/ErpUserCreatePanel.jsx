'use client';

import { useState } from 'react';
import { ERP_DEV_COPY } from '@/lib/ge-energy-erp-i18n';
import { defaultPageAccessMap } from '@/lib/erp-pages';
import { erpApiHeaders } from '@/lib/erp-api-auth';
import ErpPageAclMatrix from './ErpPageAclMatrix';

const EMPTY = {
  username: '',
  name: '',
  email: '',
  password: '',
  role: 'CLIENT',
};

export default function ErpUserCreatePanel({ lang }) {
  const t = ERP_DEV_COPY[lang] || ERP_DEV_COPY.th;
  const [form, setForm] = useState(EMPTY);
  const [pages, setPages] = useState(() => defaultPageAccessMap(lang));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/ge-energy-erp/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...erpApiHeaders() },
        body: JSON.stringify({ ...form, pages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.saveError);
      setMessage(t.userCreated);
      setForm(EMPTY);
      setPages(defaultPageAccessMap(lang));
    } catch (err) {
      setError(err.message || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="geerp-dev-panel" onSubmit={handleSubmit}>
      <p className="geerp-dev-panel-intro">{t.userIntro}</p>

      <div className="geerp-form-grid">
        <label className="geerp-field">
          <span>{t.username}</span>
          <input
            type="text"
            required
            value={form.username}
            onChange={(e) => setField('username', e.target.value)}
            placeholder={t.usernamePh}
          />
        </label>
        <label className="geerp-field">
          <span>{t.displayName}</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t.displayNamePh}
          />
        </label>
        <label className="geerp-field">
          <span>{t.email}</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder={t.emailPh}
          />
        </label>
        <label className="geerp-field">
          <span>{t.password}</span>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            placeholder={t.passwordPh}
          />
        </label>
        <label className="geerp-field">
          <span>{t.role}</span>
          <select value={form.role} onChange={(e) => setField('role', e.target.value)}>
            <option value="CLIENT">{t.roleClient}</option>
            <option value="ADMIN">{t.roleAdmin}</option>
          </select>
        </label>
      </div>

      <h3 className="geerp-dev-subtitle">{t.pagePermissions}</h3>

      {error ? <div className="geerp-dev-alert geerp-dev-alert--error">{error}</div> : null}
      {message ? <div className="geerp-dev-alert geerp-dev-alert--ok">{message}</div> : null}

      <ErpPageAclMatrix lang={lang} pages={pages} onChange={setPages} disabled={saving} />

      <button type="submit" className="geerp-save-btn" disabled={saving}>
        {saving ? t.saving : t.createUser}
      </button>
    </form>
  );
}
