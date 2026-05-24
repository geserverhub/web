import type { Metadata, Viewport } from 'next';
import { CHUNK_RECOVERY_INLINE_SCRIPT } from '@/lib/chunk-recovery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY_INLINE_SCRIPT }} />
      {children}
    </>
  );
}
