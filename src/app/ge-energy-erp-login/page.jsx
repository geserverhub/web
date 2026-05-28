'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { parseJsonResponse } from '@/lib/parse-json-response';
import { formatFetchError } from '@/lib/db-connect-error';
import { erpHubApiUrl, erpHubFetchHeaders } from '@/lib/erp-hub-api';
import {
  GE_ENERGY_ERP_TOKEN_KEY,
  GE_ENERGY_ERP_USER_KEY,
  GE_ENERGY_ERP_PAGES_KEY,
} from '@/lib/ge-storage-keys';
import { erpApiHeaders } from '@/lib/erp-api-auth';
import {
  ERP_COMPANY_NAMES,
  ERP_LOGIN_COPY,
  readErpLang,
  writeErpLang,
} from '@/lib/ge-energy-erp-i18n';
import ErpLangSwitcher from '@/components/ge-energy-erp/ErpLangSwitcher';
import './ge-energy-erp-login.css';

export default function GeEnergyErpLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState('th');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = readErpLang();
    setLang(saved);
    writeErpLang(saved);
  }, []);

  function handleLangChange(code) {
    setLang(code);
    writeErpLang(code);
  }

  const t = ERP_LOGIN_COPY[lang] || ERP_LOGIN_COPY.th;
  const company = ERP_COMPANY_NAMES[lang] || ERP_COMPANY_NAMES.th;
  const formTitle = t.formTitle || t.title;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(erpHubApiUrl('/api/user/login'), {
        method: 'POST',
        headers: erpHubFetchHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username, password, pageName: '/ge-energy-erp' }),
      });

      const data = await parseJsonResponse(res);

      if (data._html || data._parseError) {
        setError(data.error || t.server);
        return;
      }

      if (!res.ok) {
        setError(data.error || t.invalid);
        return;
      }

      localStorage.setItem(GE_ENERGY_ERP_TOKEN_KEY, data.token || '');
      const userPayload = {
        userId: data.userId,
        username: data.username,
        name: data.name,
        email: data.email,
        role: data.role,
        clientId: data.clientId ?? null,
      };
      localStorage.setItem(GE_ENERGY_ERP_USER_KEY, JSON.stringify(userPayload));

      try {
        const aclRes = await fetch(erpHubApiUrl('/api/ge-energy-erp/me/pages'), {
          headers: erpHubFetchHeaders(erpApiHeaders()),
        });
        const aclData = await aclRes.json();
        if (aclData.pages) {
          localStorage.setItem(GE_ENERGY_ERP_PAGES_KEY, JSON.stringify(aclData.pages));
        }
      } catch {
        /* ignore */
      }

      router.push('/ge-energy-erp');
    } catch (err) {
      setError(formatFetchError(err) || t.connection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="geerp-login-page">
      <ErpLangSwitcher
        lang={lang}
        onChange={handleLangChange}
        className="geerp-login-lang"
        ariaLabel={t.langLabel}
      />

      <div className="geerp-login-shell">
        <aside className="geerp-login-hero">
          <div className="geerp-login-hero-inner">
            <div className="geerp-login-hero-brand">
              <Image
                src="/ge-energyTech/138568-transparent.png"
                alt="GE Energy Tech"
                width={56}
                height={56}
                className="geerp-login-logo"
                priority
              />
              <div>
                <p className="geerp-login-hero-name">GE Energy Tech</p>
                <span className="geerp-login-badge">{t.badge}</span>
              </div>
            </div>

            <h1 className="geerp-login-hero-title">{t.title}</h1>
            <p className="geerp-login-company">{company}</p>
          </div>
        </aside>

        <main className="geerp-login-panel">
          <div className="geerp-login-card">
            <header className="geerp-login-form-head">
              <h2 className="geerp-login-form-title">{formTitle}</h2>
            </header>

            <form onSubmit={handleSubmit} className="geerp-login-form">
              <div className="geerp-login-field">
                <label className="geerp-login-label" htmlFor="geerp-username">
                  {t.username}
                </label>
                <div className="geerp-login-input-wrap">
                  <User size={18} className="geerp-login-input-icon" aria-hidden />
                  <input
                    id="geerp-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder={t.usernamePh}
                    className="geerp-login-input"
                  />
                </div>
              </div>

              <div className="geerp-login-field">
                <label className="geerp-login-label" htmlFor="geerp-password">
                  {t.password}
                </label>
                <div className="geerp-login-input-wrap">
                  <Lock size={18} className="geerp-login-input-icon" aria-hidden />
                  <input
                    id="geerp-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t.passwordPh}
                    className="geerp-login-input"
                  />
                  <button
                    type="button"
                    className="geerp-login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="geerp-login-error" role="alert">
                  {error}
                </div>
              ) : null}

              <button type="submit" className="geerp-login-submit" disabled={loading}>
                <LogIn size={18} aria-hidden />
                {loading ? t.signingIn : t.signIn}
              </button>
            </form>

            <div className="geerp-login-divider" role="presentation">
              <span />
            </div>

            <footer className="geerp-login-footer">
              <div className="geerp-login-footer-actions">
                <Link href="/register-geet" className="geerp-login-link-btn">
                  {t.register}
                </Link>
                <Link
                  href="/ge-energy-tech/login"
                  className="geerp-login-link-btn geerp-login-link-btn--outline"
                >
                  {t.platformSignIn}
                </Link>
              </div>
              <Link href="/ge-energy-tech" className="geerp-login-back">
                <ArrowLeft size={16} aria-hidden />
                {t.back.replace(/^←\s*/, '')}
              </Link>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
