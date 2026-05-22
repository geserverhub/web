'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { languageStorageKey, supportedLanguages } from '@/lib/data';
import { parseJsonResponse } from '@/lib/parse-json-response';

const translations = {
  th: {
    brand: 'MOMOGE SPACE',
    title: 'AI SMART ENERGY MONITORING PLATFORM',
    subtitle: 'ระบบมอนิเตอริ่งพลังงานไฟฟ้า',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    usernamePlaceholder: 'กรอกชื่อผู้ใช้',
    passwordPlaceholder: 'กรอกรหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signingIn: 'กำลังเข้าสู่ระบบ...',
    backHome: '← กลับหน้าหลัก',
    invalidCredentials: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    connectionError: 'เชื่อมต่อไม่สำเร็จ',
    serverError: 'เซิร์ฟเวอร์ไม่พร้อม — ลองรีสตาร์ท dev server หรือรัน npx prisma generate',
  },
  en: {
    brand: 'MOMOGE SPACE',
    title: 'AI SMART ENERGY MONITORING PLATFORM',
    subtitle: 'Smart electricity energy monitoring system',
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'Enter username',
    passwordPlaceholder: 'Enter password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    backHome: '← Back to home',
    invalidCredentials: 'Invalid username or password',
    connectionError: 'Connection error',
    serverError: 'Server unavailable — restart dev server or run npx prisma generate',
  },
  ko: {
    brand: 'MOMOGE SPACE',
    title: 'AI SMART ENERGY MONITORING PLATFORM',
    subtitle: '스마트 전력 에너지 모니터링 시스템',
    username: '사용자명',
    password: '비밀번호',
    usernamePlaceholder: '사용자명 입력',
    passwordPlaceholder: '비밀번호 입력',
    signIn: '로그인',
    signingIn: '로그인 중...',
    backHome: '← 홈으로',
    invalidCredentials: '사용자명 또는 비밀번호가 올바르지 않습니다',
    connectionError: '연결 오류',
    serverError: '서버 오류 — dev server 재시작 또는 npx prisma generate 실행',
  },
};

const langOptions = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
];

export default function EnergyDashboardLoginPage() {
  const router = useRouter();
  const [language, setLanguage] = useState('th');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = (key) => translations[language]?.[key] || translations.th[key] || key;

  useEffect(() => {
    const saved = localStorage.getItem(languageStorageKey);
    if (saved && supportedLanguages.includes(saved)) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, pageName: '/energy-dashboard' }),
      });

      const data = await parseJsonResponse(res);

      if (data._html || data._parseError) {
        setError(
          data._parseError
            ? `${t('serverError')} (${data._preview || 'non-JSON'})`
            : (data.error || t('serverError'))
        );
        return;
      }

      if (data.error && !res.ok) {
        setError(data.error);
        return;
      }

      if (!res.ok) {
        setError(data.error || t('invalidCredentials'));
        return;
      }

      localStorage.setItem('energy_system_token', data.token || '');
      localStorage.setItem('energy_system_user', JSON.stringify({
        userId: data.userId,
        username: data.username,
        name: data.name,
        email: data.email,
        site: data.site,
        typeID: data.typeID,
        departmentID: data.departmentID,
      }));

      router.push('/energy-dashboard/current-monitor');
    } catch (err) {
      setError(err.message || t('connectionError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'inline-flex',
        gap: 6,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(3,105,161,0.2)',
        borderRadius: 999,
        padding: 4,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}>
        {langOptions.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12,
              color: language === lang.code ? '#fff' : '#0369a1',
              background: language === lang.code
                ? 'linear-gradient(135deg, #0369a1, #0c4a6e)'
                : 'transparent',
            }}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/momoge/Logo-brand.png"
            alt="Momoge Logo"
            width={100}
            height={100}
            style={{
              display: 'inline-block',
              marginBottom: 16,
              objectFit: 'contain',
              width: 'auto',
              height: 100,
              maxWidth: 160,
              background: 'transparent',
            }}
          />
          <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            {t('brand')}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 1.6 }}>
            {t('subtitle')}
          </p>
          <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
            <span>goeunserverhub@gmail.com</span>
            <span style={{ margin: '0 6px' }}>·</span>
            <span>010-8105-0384</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {t('username')}
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder={t('usernamePlaceholder')}
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  borderRadius: 10, border: '2px solid #e5e7eb',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#0369a1'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={t('passwordPlaceholder')}
                style={{
                  width: '100%', padding: '10px 38px 10px 38px',
                  borderRadius: 10, border: '2px solid #e5e7eb',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#0369a1'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              color: '#dc2626', fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#7dd3fc' : 'linear-gradient(135deg, #0369a1, #0c4a6e)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            href="/"
            style={{ fontSize: 13, color: '#0369a1', textDecoration: 'none' }}
            onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}
          >
            {t('backHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
