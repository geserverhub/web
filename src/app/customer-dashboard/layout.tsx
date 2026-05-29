import type { Metadata, Viewport } from 'next';
import CustomerDashboardShell from './CustomerDashboardShell';

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
  return <CustomerDashboardShell>{children}</CustomerDashboardShell>;
}
