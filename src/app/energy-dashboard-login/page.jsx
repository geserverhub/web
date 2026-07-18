'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { languageStorageKey, supportedLanguages } from '@/lib/data';
import { parseJsonResponse } from '@/lib/parse-json-response';

const translations = {
  th: {
    brand: 'GE ENERGY TECH',
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
    serverDown: 'เซิร์ฟเวอร์ไม่ทำงาน — รัน npm run dev:wsl ใน WSL แล้วเปิด http://<WSL-IP>:3005',
    serverError: 'เซิร์ฟเวอร์ไม่พร้อม — ลองรีสตาร์ท dev server หรือรัน npx prisma generate',
    dbUnavailable: 'เชื่อมต่อฐานข้อมูลไม่ได้ — รัน npm run dev:wsl ใน WSL แล้วลองใหม่',
  },
  en: {
    brand: 'GE ENERGY TECH',
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
    serverDown: 'Dev server is not running. Run npm run dev:wsl in WSL, then open http://<WSL-IP>:3005',
    serverError: 'Server unavailable — restart dev server or run npx prisma generate',
    dbUnavailable: 'Database unavailable — run npm run dev:wsl in WSL, then open the site again',
  },
  ko: {
    brand: 'GE ENERGY TECH',
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
    serverDown: '서버가 꺼져 있습니다. WSL에서 npm run dev:wsl 실행 후 http://<WSL-IP>:3005 로 접속하세요.',
    serverError: 'DB 연결 실패 — WSL에서 npm run dev:wsl 실행 후 다시 로그인하세요',
    dbUnavailable: '데이터베이스에 연결할 수 없습니다. WSL에서 npm run dev:wsl 을 실행한 뒤 http://localhost:3005 또는 WSL IP로 접속하세요.',
  },
};

const langOptions = [
  { code: 'th', label: 'ไทย' },
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
];

const LOGO_SRC = '/ge-energyTech/138568.jpg';

const HOME_URL = 'https://ge-serverhub.com';

const companyNames = {
  th: 'บริษัท จีอี อีเนอร์จี่ เทค จำกัด',
  en: 'GE Energy Tech Co., Ltd.',
  ko: '(주식회사)지이 에너지텍',
};

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

      if (res.status === 503 || data.error?.includes('Database')) {
        setError(t('dbUnavailable') || data.error);
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
        role: data.role,
        site: data.site,
        typeID: data.typeID,
        departmentID: data.departmentID,
      }));

      router.push('/energy-dashboard/current-monitor');
    } catch (err) {
      const msg = String(err?.message || '');
      setError(
        msg === 'Failed to fetch' || msg.includes('fetch')
          ? t('serverDown')
          : msg || t('connectionError')
      );
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
      background: 'linear-gradient(135deg, #15803d 0%, #166534 45%, #0c4a6e 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'inline-flex',
        gap: 2,
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(22,101,52,0.25)',
        borderRadius: 999,
        padding: 3,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        {langOptions.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '3px 8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 10,
              lineHeight: 1.2,
              color: language === lang.code ? '#fff' : '#166534',
              background: language === lang.code
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            maxWidth: 'min(72vw, 200px)',
            margin: '0 auto 10px',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_SRC}
              alt="GE Energy Tech"
              width={200}
              height={88}
              style={{
                display: 'block',
                margin: '0 auto',
                objectFit: 'contain',
                width: '100%',
                height: 'auto',
                maxHeight: 88,
                background: 'transparent',
              }}
            />
          </div>
          <p style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#166534',
            margin: '0 0 6px',
            lineHeight: 1.35,
          }}>
            {companyNames[language] || companyNames.th}
          </p>
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
            href={HOME_URL}
            style={{ fontSize: 13, color: '#0369a1', textDecoration: 'none' }}
          >
            {t('backHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
