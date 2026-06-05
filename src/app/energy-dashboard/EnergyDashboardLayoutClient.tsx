'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocaleProvider } from '@/lib/LocaleContext';
import { SiteProvider } from '@/lib/SiteContext';
import ClientLayout from '@/components/energy/ClientLayout';
import {
  ENERGY_SYSTEM_TOKEN_KEY,
  ENERGY_SYSTEM_USER_KEY,
} from '@/lib/ge-storage-keys';
import {
  ensureEnergyDashboardAuthRedirect,
  installChunkRecoveryClient,
} from '@/lib/chunk-recovery';
import { isJwtExpiredUnsafe, readJwtPortalUnsafe } from '@/lib/portal-jwt';

function isValidEnergySession(): boolean {
  try {
    const token = localStorage.getItem(ENERGY_SYSTEM_TOKEN_KEY)?.trim();
    if (!token || isJwtExpiredUnsafe(token)) return false;
    return readJwtPortalUnsafe(token) === 'energy';
  } catch {
    return false;
  }
}

function clearEnergySession() {
  try {
    localStorage.removeItem(ENERGY_SYSTEM_TOKEN_KEY);
    localStorage.removeItem(ENERGY_SYSTEM_USER_KEY);
  } catch {
    /* ignore */
  }
}

export default function EnergyDashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useLayoutEffect(() => {
    ensureEnergyDashboardAuthRedirect();
    return installChunkRecoveryClient();
  }, []);

  useEffect(() => {
    if (!isValidEnergySession()) {
      clearEnergySession();
      router.replace('/energy-dashboard-login');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)',
          color: '#065f46',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <SiteProvider storageKey="energy_selectedSite">
      <LocaleProvider>
        <ClientLayout>{children}</ClientLayout>
      </LocaleProvider>
    </SiteProvider>
  );
}
