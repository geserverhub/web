'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocaleProvider } from '@/lib/LocaleContext';
import { SiteProvider } from '@/lib/SiteContext';
import CustomerDashboardHeader from '@/components/customer/CustomerDashboardHeader';
import './customer-dashboard.css';

export default function CustomerDashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('k_system_admin_token');
    if (!token) {
      router.replace('/customer-dashboard-login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #064e3b, #047857)',
          color: '#d1fae5',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <LocaleProvider>
      <SiteProvider>
        <div className="cd-root">
          <CustomerDashboardHeader />
          {children}
        </div>
      </SiteProvider>
    </LocaleProvider>
  );
}
