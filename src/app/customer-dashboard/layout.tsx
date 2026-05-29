import type { Metadata, Viewport } from 'next';
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
      <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY_INLINE_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: CUSTOMER_DASHBOARD_AUTH_INLINE_SCRIPT }} />
      <CustomerDashboardShell>{children}</CustomerDashboardShell>
    </>
  );
}
