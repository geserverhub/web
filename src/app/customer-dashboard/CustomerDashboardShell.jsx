'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocaleProvider } from '@/lib/LocaleContext';
import { SiteProvider, useSite } from '@/lib/SiteContext';
import CustomerDashboardHeader from '@/components/customer/CustomerDashboardHeader';
import { GE_ADMIN_TOKEN_KEY } from '@/lib/ge-storage-keys';
import './customer-dashboard.css';

function CustomerSiteInit({ children }) {
  const { setSelectedSite } = useSite();

  useEffect(() => {
    setSelectedSite('korea');
  }, [setSelectedSite]);

  return children;
}

export default function CustomerDashboardShell({ children }) {
  const router = useRouter();
  const [authState, setAuthState] = useState('checking');

  useEffect(() => {
    let redirectTimer;
    let safetyTimer;

    function goLogin() {
      setAuthState('redirect');
      router.replace('/customer-dashboard-login');
      redirectTimer = window.setTimeout(() => {
        if (!window.location.pathname.includes('customer-dashboard-login')) {
          window.location.assign('/customer-dashboard-login');
        }
      }, 800);
    }

    try {
      const token = localStorage.getItem(GE_ADMIN_TOKEN_KEY)?.trim();
      if (!token) {
        goLogin();
      } else {
        setAuthState('ready');
      }
    } catch {
      window.location.assign('/customer-dashboard-login');
    }

    safetyTimer = window.setTimeout(() => {
      setAuthState((current) => {
        if (current === 'ready') return current;
        const token = localStorage.getItem(GE_ADMIN_TOKEN_KEY)?.trim();
        if (token) return 'ready';
        if (current !== 'redirect') goLogin();
        return current;
      });
    }, 4000);

    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer);
      if (safetyTimer) window.clearTimeout(safetyTimer);
    };
  }, [router]);

  if (authState !== 'ready') {
    return (
      <div className="cd-loading">
        {authState === 'redirect'
          ? 'กำลังไปหน้าเข้าสู่ระบบ… / Redirecting to login…'
          : 'Loading…'}
        <noscript>
          <p style={{ marginTop: 12 }}>
            <a href="/customer-dashboard-login">เข้าสู่ระบบ / Sign in</a>
          </p>
        </noscript>
      </div>
    );
  }

  return (
    <LocaleProvider>
      <SiteProvider>
        <CustomerSiteInit>
          <div className="cd-root">
            <CustomerDashboardHeader />
            {children}
          </div>
        </CustomerSiteInit>
      </SiteProvider>
    </LocaleProvider>
  );
}
