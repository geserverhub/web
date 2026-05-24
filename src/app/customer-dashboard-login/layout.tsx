import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'GE Energy Tech — เข้าสู่ระบบลูกค้า',
  description: 'ล็อกอินลูกค้า — ใช้งานบนสมาร์ทโฟน',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#047857',
};

export default function CustomerDashboardLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
