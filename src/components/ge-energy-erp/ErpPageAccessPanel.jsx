'use client';

import { useEffect, useState } from 'react';
import { ERP_DEV_COPY } from '@/lib/ge-energy-erp-i18n';
import { defaultPageAccessMap } from '@/lib/erp-pages';
import { erpApiHeaders } from '@/lib/erp-api-auth';
import ErpPageAclMatrix from './ErpPageAclMatrix';

export default function ErpPageAccessPanel({ lang }) {
  const t = ERP_DEV_COPY[lang] || ERP_DEV_COPY.th;
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [pages, setPages] = useState(() => defaultPageAccessMap(lang));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadUsers() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/ge-energy-erp/users', { headers: erpApiHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t.loadError);
        if (!active) return;
        setUsers(data.users || []);
        if (data.users?.[0]) setUserId(data.users[0].id);
      } catch (err) {
        if (active) setError(err.message || t.loadError);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUsers();
    return () => {
      active = false;
    };
  }, [t.loadError]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function loadPages() {
      setError('');
      try {
        const res = await fetch(`/api/ge-energy-erp/users/${userId}/pages`, {
          headers: erpApiHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t.loadError);
        if (active) setPages({ ...defaultPageAccessMap(lang), ...data.pages });
      } catch (err) {
        if (active) setError(err.message || t.loadError);
      }
    }
    loadPages();
    return () => {
      active = false;
    };
  }, [userId, lang, t.loadError]);

  async function handleSave(e) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/ge-energy-erp/users/${userId}/pages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...erpApiHeaders() },
        body: JSON.stringify({ pages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.saveError);
      setPages(data.pages || pages);
      setMessage(t.saved);
    } catch (err) {
      setError(err.message || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="geerp-dev-panel" onSubmit={handleSave}>
      <p className="geerp-dev-panel-intro">{t.accessIntro}</p>

      <label className="geerp-field geerp-field--row">
        <span>{t.selectUser}</span>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          disabled={loading || !users.length}
        >
          {!users.length ? <option value="">{t.noUsers}</option> : null}
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.username} ({u.username || u.email})
            </option>
          ))}
        </select>
      </label>

      {error ? <div className="geerp-dev-alert geerp-dev-alert--error">{error}</div> : null}
      {message ? <div className="geerp-dev-alert geerp-dev-alert--ok">{message}</div> : null}

      <ErpPageAclMatrix lang={lang} pages={pages} onChange={setPages} disabled={!userId || saving} />

      <button type="submit" className="geerp-save-btn" disabled={!userId || saving}>
        {saving ? t.saving : t.savePermissions}
      </button>
    </form>
  );
}
