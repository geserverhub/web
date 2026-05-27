'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { parseJsonResponse } from '@/lib/parse-json-response';
import { GE_ADMIN_TOKEN_KEY, GE_ADMIN_USER_KEY } from '@/lib/ge-storage-keys';
import {
  GET_AUTH_COMPANY,
  GET_AUTH_LANG_OPTIONS,
  GET_LOGIN_COPY,
  readGetAuthLang,
  writeGetAuthLang,
} from '@/lib/ge-energy-tech-auth-i18n';
import '../ge-energy-tech-auth.css';

export default function GeEnergyTechLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState('th');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = readGetAuthLang();
    setLang(saved);
    writeGetAuthLang(saved);
    if (typeof window !== 'undefined') {
      const registered = new URLSearchParams(window.location.search).get('registered');
      if (registered === '1') {
        setNotice((GET_LOGIN_COPY[saved] || GET_LOGIN_COPY.th).registered);
      }
    }
  }, []);

  function handleLangChange(code) {
    setLang(code);
    writeGetAuthLang(code);
    if (notice) {
      setNotice((GET_LOGIN_COPY[code] || GET_LOGIN_COPY.th).registered);
    }
  }

  const t = GET_LOGIN_COPY[lang] || GET_LOGIN_COPY.th;
  const company = GET_AUTH_COMPANY[lang] || GET_AUTH_COMPANY.th;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          pageName: '/ge-energy-tech/login',
        }),
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

      localStorage.setItem(GE_ADMIN_TOKEN_KEY, data.token || '');
      localStorage.setItem(
        GE_ADMIN_USER_KEY,
        JSON.stringify({
          userId: data.userId,
          username: data.username,
          name: data.name,
          email: data.email,
          clientId: data.clientId ?? null,
          phone: data.phone ?? null,
          site: data.site,
          typeID: data.typeID,
          departmentID: data.departmentID,
        })
      );

      router.push('/customer-dashboard');
    } catch (err) {
      setError(err?.message || t.connection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="get-auth-page get-auth-page--login">
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

      <div className="get-auth-card">
        <header className="get-auth-brand">
          <Image
            src="/ge-energyTech/138568-transparent.png"
            alt=""
            width={72}
            height={72}
            className="get-auth-logo"
            priority
          />
          <p className="get-auth-brand-name">GE Energy Tech</p>
          <span className="get-auth-badge">{t.badge}</span>
          <p className="get-auth-company">{company}</p>
          <h1 className="get-auth-title">{t.title}</h1>
          <p className="get-auth-sub">{t.sub}</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="get-login-username">
              {t.username}
            </label>
            <div className="get-auth-input-wrap">
              <User size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="get-login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t.usernamePh}
                className="get-auth-input"
              />
            </div>
          </div>

          <div className="get-auth-field">
            <label className="get-auth-label" htmlFor="get-login-password">
              {t.password}
            </label>
            <div className="get-auth-input-wrap">
              <Lock size={18} className="get-auth-input-icon" aria-hidden />
              <input
                id="get-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t.passwordPh}
                className="get-auth-input"
              />
              <button
                type="button"
                className="get-auth-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {notice ? <div className="get-auth-success" role="status">{notice}</div> : null}
          {error ? <div className="get-auth-error" role="alert">{error}</div> : null}

          <button type="submit" className="get-auth-submit" disabled={loading}>
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>

        <footer className="get-auth-footer">
          <Link href="/register-geet" className="get-auth-link-btn get-auth-link-btn--primary get-auth-link-btn--block">
            {t.register}
          </Link>
          <Link href="/ge-energy-tech" className="get-auth-back">
            {t.back}
          </Link>
        </footer>
      </div>
    </div>
  );
}

