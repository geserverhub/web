import Link from 'next/link';

/** Ensure App Router 404 is static so Next 15.5 does not fall back to pages/_error. */
export const dynamic = 'force-static';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        background: '#f8fafc',
        color: '#0f172a',
      }}
    >
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>404</h1>
      <p style={{ margin: '0 0 20px', color: '#64748b' }}>ไม่พบหน้าที่ต้องการ / Page not found</p>
      <Link
        href="/ge-energy-tech"
        style={{
          padding: '10px 18px',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #16a34a, #1565c0)',
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        กลับหน้าแรก / Home
      </Link>
    </main>
  );
}
