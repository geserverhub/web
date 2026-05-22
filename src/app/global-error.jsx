'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="th">
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#0f172a',
          color: '#e2e8f0',
          padding: 24,
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>เกิดข้อผิดพลาด</h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', maxWidth: 420, textAlign: 'center' }}>
          {error?.message || 'Something went wrong'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#f97316',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ลองใหม่
        </button>
      </body>
    </html>
  );
}
