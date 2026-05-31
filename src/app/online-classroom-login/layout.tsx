import type { Metadata, Viewport } from 'next';
import { CHUNK_RECOVERY_INLINE_SCRIPT } from '@/lib/chunk-recovery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'ห้องเรียนออนไลน์ — เข้าสู่ระบบ',
  description: 'ล็อกอินเข้าห้องเรียนออนไลน์ GE Server Hub',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4338ca',
};

export default function OnlineClassroomLoginLayout({
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
