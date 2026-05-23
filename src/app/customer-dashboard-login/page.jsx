'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Smartphone } from 'lucide-react';
import { parseJsonResponse } from '@/lib/parse-json-response';
import { GE_ADMIN_TOKEN_KEY, GE_ADMIN_USER_KEY } from '@/lib/ge-storage-keys';
import './customer-dashboard-login.css';

const LOGO_SRC = '/momoge/Logo-brand.png?v=3';

const companyNames = {
  th: 'บริษัท จีอี อีเนอร์จี่ เทค จำกัด',
  en: 'GE Energy Tech Co., Ltd.',
  ko: '(주식회사)지이 에너지텍',
};

const copy = {
  th: {
    mobileHint: 'เข้าใช้งานบนสมาร์ทโฟน',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    usernamePh: 'กรอกชื่อผู้ใช้',
    passwordPh: 'กรอกรหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signingIn: 'กำลังเข้าสู่ระบบ…',
    back: '← กลับหน้าเมนูหลัก',
    invalid: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    connection: 'เชื่อมต่อไม่สำเร็จ',
    server: 'เซิร์ฟเวอร์ไม่พร้อม — ลองใหม่อีกครั้ง',
  },
  en: {
    mobileHint: 'Sign in on your smartphone',
    username: 'Username',
    password: 'Password',
    usernamePh: 'Enter username',
    passwordPh: 'Enter password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    back: '← Main menu',
    invalid: 'Invalid username or password',
    connection: 'Connection error',
    server: 'Server unavailable — try again',
  },
  ko: {
    mobileHint: '스마트폰으로 로그인',
    username: '사용자명',
    password: '비밀번호',
    usernamePh: '사용자명 입력',
    passwordPh: '비밀번호 입력',
    signIn: '로그인',
    signingIn: '로그인 중…',
    back: '← 메인 메뉴',
    invalid: '사용자명 또는 비밀번호가 올바르지 않습니다',
    connection: '연결 오류',
    server: '서버를 사용할 수 없습니다',
  },
};

export default function CustomerDashboardLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState('th');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = copy[lang] || copy.th;
  const company = companyNames[lang] || companyNames.th;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, pageName: '/customer-dashboard' }),
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
      localStorage.setItem(GE_ADMIN_USER_KEY, JSON.stringify({
        userId: data.userId,
        username: data.username,
        name: data.name,
        email: data.email,
        site: data.site,
        typeID: data.typeID,
        departmentID: data.departmentID,
      }));

      router.push('/customer-dashboard');
    } catch (err) {
      setError(err?.message || t.connection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cdl-page">
      <div
        className="cdl-lang"
        style={{
          position: 'absolute',
          top: 'max(0.75rem, env(safe-area-inset-top))',
          right: 'max(0.75rem, env(safe-area-inset-right))',
          zIndex: 2,
          display: 'inline-flex',
          gap: 2,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(22,101,52,0.25)',
          borderRadius: 999,
          padding: 3,
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        }}
      >
        {[
          { code: 'th', label: 'ไทย' },
          { code: 'ko', label: '한국어' },
          { code: 'en', label: 'EN' },
        ].map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLang(opt.code)}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '4px 9px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 10,
              color: lang === opt.code ? '#fff' : '#166534',
              background:
                lang === opt.code
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="cdl-card">
        <header className="cdl-brand">
          <div className="cdl-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_SRC}
              alt={company}
              width={200}
              height={88}
              className="cdl-logo"
            />
          </div>
          <h1 className="cdl-title">{company}</h1>
          <div className="cdl-mobile-badge">
            <Smartphone size={14} strokeWidth={2.5} aria-hidden />
            {t.mobileHint}
          </div>
          <p className="cdl-contact">
            goeunserverhub@gmail.com
            <span aria-hidden> · </span>
            010-8105-0384
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="cdl-field">
            <label className="cdl-label" htmlFor="cdl-username">
              {t.username}
            </label>
            <div className="cdl-input-wrap">
              <User size={18} className="cdl-input-icon" aria-hidden />
              <input
                id="cdl-username"
                type="text"
                inputMode="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t.usernamePh}
                className="cdl-input"
              />
            </div>
          </div>

          <div className="cdl-field">
            <label className="cdl-label" htmlFor="cdl-password">
              {t.password}
            </label>
            <div className="cdl-input-wrap">
              <Lock size={18} className="cdl-input-icon" aria-hidden />
              <input
                id="cdl-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t.passwordPh}
                className="cdl-input"
              />
              <button
                type="button"
                className="cdl-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error ? <div className="cdl-error" role="alert">{error}</div> : null}

          <button type="submit" className="cdl-submit" disabled={loading}>
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>

        <footer className="cdl-footer">
          <a href="/energy-dashboard/dashboard" className="cdl-back">
            {t.back}
          </a>
        </footer>
      </div>
    </div>
  );
}
