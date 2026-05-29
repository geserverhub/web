'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/LocaleContext';
import CustomerDashboardLangSwitcher from '@/components/customer/CustomerDashboardLangSwitcher';
import { formatEnergyDisplayUser } from '@/lib/energy/display-user';
import { cdCompanyName } from '@/lib/customer-dashboard-i18n';
import { GE_ADMIN_USER_KEY } from '@/lib/ge-storage-keys';

const LOGO_SRC = '/momoge/Logo-brand.png?v=3';

type StoredUser = {
  username?: string;
  name?: string;
  role?: string;
};

export default function CustomerDashboardHeader() {
  const { locale } = useLocale();
  const company = cdCompanyName(locale);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(GE_ADMIN_USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  const { displayName, displayRole } = formatEnergyDisplayUser(user);

  return (
    <header className="cd-header">
      <Link href="/customer-dashboard" className="cd-header-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt={company} className="cd-header-logo" />
        <span className="cd-header-company">{company}</span>
      </Link>

      <div className="cd-header-actions">
        {mounted && displayName ? (
          <>
            <div className="cd-user-chip" title={displayName}>
              <span className="cd-user-avatar">{displayName.charAt(0).toUpperCase()}</span>
              <span className="cd-user-meta">
                <span className="cd-user-name">{displayName}</span>
                {displayRole ? <span className="cd-user-role">{displayRole}</span> : null}
              </span>
            </div>
            <Link href="/customer-dashboard" className="cd-user-mobile" title={displayName} aria-label={displayName}>
              {displayName.charAt(0).toUpperCase()}
            </Link>
          </>
        ) : null}
        <CustomerDashboardLangSwitcher />
      </div>
    </header>
  );
}
