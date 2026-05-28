import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import CustomerDashboardShell from './CustomerDashboardShell';
import {
  CHUNK_RECOVERY_INLINE_SCRIPT,
  CUSTOMER_DASHBOARD_AUTH_INLINE_SCRIPT,
} from '@/lib/chunk-recovery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'GE Energy Tech — Customer Dashboard',
  description: 'Energy comparison report for customers',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#047857',
};

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="customer-dashboard-chunk-recovery" strategy="beforeInteractive">
        {CHUNK_RECOVERY_INLINE_SCRIPT}
      </Script>
      <Script id="customer-dashboard-auth-recovery" strategy="beforeInteractive">
        {CUSTOMER_DASHBOARD_AUTH_INLINE_SCRIPT}
      </Script>
      <CustomerDashboardShell>{children}</CustomerDashboardShell>
    </>
  );
}
