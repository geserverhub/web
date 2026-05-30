import type { Metadata, Viewport } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Momoge space — เข้าสู่ระบบลูกค้า',
  description: 'ล็อกอินลูกค้า — ใช้งานบนสมาร์ทโฟน',
  manifest: '/manifest-customer.json',
  appleWebApp: {
    capable: true,
    title: 'Momoge space',
    statusBarStyle: 'default',
  },
  icons: {
    apple: [{ url: '/momoge/Logo-brand.png' }],
  },
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
