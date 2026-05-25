'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLASSROOM_TOKEN_KEY } from '@/lib/classroom-storage-keys';
import './online-classroom.css';

export default function OnlineClassroomLayout({ children }) {
  const router = useRouter();
  const [authState, setAuthState] = useState('checking');

  useEffect(() => {
    let redirectTimer;

    function goLogin() {
      setAuthState('redirect');
      router.replace('/online-classroom-login');
      redirectTimer = window.setTimeout(() => {
        if (!window.location.pathname.includes('online-classroom-login')) {
          window.location.assign('/online-classroom-login');
        }
      }, 800);
    }

    try {
      const token = localStorage.getItem(CLASSROOM_TOKEN_KEY)?.trim();
      if (!token) {
        goLogin();
      } else {
        setAuthState('ready');
      }
    } catch {
      window.location.assign('/online-classroom-login');
    }

    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [router]);

  if (authState !== 'ready') {
    return (
      <div className="oc-loading">
        {authState === 'redirect'
          ? 'กำลังไปหน้าเข้าสู่ระบบ… / Redirecting to login…'
          : 'Loading…'}
        <noscript>
          <p style={{ marginTop: 12 }}>
            <a href="/online-classroom-login">เข้าสู่ระบบ / Sign in</a>
          </p>
        </noscript>
      </div>
    );
  }

  return <div className="oc-root">{children}</div>;
}
