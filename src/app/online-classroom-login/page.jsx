'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Smartphone, GraduationCap } from 'lucide-react';
import { parseJsonResponse } from '@/lib/parse-json-response';
import { CLASSROOM_TOKEN_KEY, CLASSROOM_USER_KEY } from '@/lib/classroom-storage-keys';
import './online-classroom-login.css';

const copy = {
  th: {
    portalName: 'ห้องเรียนออนไลน์',
    portalSub: 'GE SERVER HUB — E-Learning',
    mobileHint: 'เรียนได้ทุกที่ บนมือถือหรือแท็บเล็ต',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    usernamePh: 'กรอกชื่อผู้ใช้หรืออีเมล',
    passwordPh: 'กรอกรหัสผ่าน',
    signIn: 'เข้าสู่ห้องเรียน',
    signingIn: 'กำลังเข้าสู่ระบบ…',
    back: '← กลับหน้าเมนูหลัก',
    invalid: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    connection: 'เชื่อมต่อไม่สำเร็จ',
    server: 'เซิร์ฟเวอร์ไม่พร้อม — ลองใหม่อีกครั้ง',
  },
  en: {
    portalName: 'Online Classroom',
    portalSub: 'GE SERVER HUB — E-Learning',
    mobileHint: 'Learn anywhere on phone or tablet',
    username: 'Username',
    password: 'Password',
    usernamePh: 'Username or email',
    passwordPh: 'Enter password',
    signIn: 'Enter classroom',
    signingIn: 'Signing in…',
    back: '← Main menu',
    invalid: 'Invalid username or password',
    connection: 'Connection error',
    server: 'Server unavailable — try again',
  },
  ko: {
    portalName: '온라인 강의실',
    portalSub: 'GE SERVER HUB — E-Learning',
    mobileHint: '스마트폰·태블릿으로 수강',
    username: '사용자명',
    password: '비밀번호',
    usernamePh: '사용자명 또는 이메일',
    passwordPh: '비밀번호 입력',
    signIn: '강의실 입장',
    signingIn: '로그인 중…',
    back: '← 메인 메뉴',
    invalid: '사용자명 또는 비밀번호가 올바르지 않습니다',
    connection: '연결 오류',
    server: '서버를 사용할 수 없습니다',
  },
};

export default function OnlineClassroomLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState('th');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = copy[lang] || copy.th;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, pageName: '/online-classroom' }),
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

      localStorage.setItem(CLASSROOM_TOKEN_KEY, data.token || '');
      localStorage.setItem(
        CLASSROOM_USER_KEY,
        JSON.stringify({
          userId: data.userId,
          username: data.username,
          name: data.name,
          email: data.email,
          role: data.role,
          clientId: data.clientId ?? null,
        }),
      );

      router.push('/online-classroom');
    } catch (err) {
      setError(err?.message || t.connection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ocl-page">
      <div
        className="ocl-lang"
        style={{
          position: 'absolute',
          top: 'max(0.75rem, env(safe-area-inset-top))',
          right: 'max(0.75rem, env(safe-area-inset-right))',
          zIndex: 2,
          display: 'inline-flex',
          gap: 2,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(99,102,241,0.28)',
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
              color: lang === opt.code ? '#fff' : '#4338ca',
              background:
                lang === opt.code
                  ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                  : 'transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="ocl-card">
        <header className="ocl-brand">
          <div className="ocl-icon-wrap" aria-hidden>
            <GraduationCap size={32} strokeWidth={2.25} />
          </div>
          <h1 className="ocl-title">{t.portalName}</h1>
          <p className="ocl-subtitle">{t.portalSub}</p>
          <div className="ocl-mobile-badge">
            <Smartphone size={14} strokeWidth={2.5} aria-hidden />
            {t.mobileHint}
          </div>
          <p className="ocl-contact">
            goeunserverhub@gmail.com
            <span aria-hidden> · </span>
            010-8105-0384
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="ocl-field">
            <label className="ocl-label" htmlFor="ocl-username">
              {t.username}
            </label>
            <div className="ocl-input-wrap">
              <User size={18} className="ocl-input-icon" aria-hidden />
              <input
                id="ocl-username"
                type="text"
                inputMode="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t.usernamePh}
                className="ocl-input"
              />
            </div>
          </div>

          <div className="ocl-field">
            <label className="ocl-label" htmlFor="ocl-password">
              {t.password}
            </label>
            <div className="ocl-input-wrap">
              <Lock size={18} className="ocl-input-icon" aria-hidden />
              <input
                id="ocl-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t.passwordPh}
                className="ocl-input"
              />
              <button
                type="button"
                className="ocl-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="ocl-error" role="alert">
              {error}
            </div>
          ) : null}

          <button type="submit" className="ocl-submit" disabled={loading}>
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>

        <footer className="ocl-footer">
          <a href="/auth/select" className="ocl-back">
            {t.back}
          </a>
        </footer>
      </div>
    </div>
  );
}
