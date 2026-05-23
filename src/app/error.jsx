'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[app error boundary]', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#f0fdf4',
        color: '#14532d',
        padding: 24,
      }}
    >
      <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>오류가 발생했습니다</h2>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#166534', maxWidth: 420, textAlign: 'center' }}>
        {error?.message || 'Something went wrong'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          border: 'none',
          background: '#16a34a',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        다시 시도
      </button>
    </main>
  );
}
