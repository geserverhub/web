'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocaleProvider } from '@/lib/LocaleContext';
import { SiteProvider, useSite } from '@/lib/SiteContext';
import CustomerDashboardHeader from '@/components/customer/CustomerDashboardHeader';
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
    return <div className="cd-loading">Loading…</div>;
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
