'use client';

import { useEffect, useMemo } from 'react';

function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return (
    error?.name === 'ChunkLoadError' ||
    msg.includes('Loading chunk') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('ChunkLoadError')
  );
}

export default function Error({ error, reset }) {
  const chunkError = useMemo(() => isChunkLoadError(error), [error]);

  useEffect(() => {
    console.error('[app error boundary]', error);
    if (!chunkError || typeof window === 'undefined') return;

    const key = `chunk-reload:${window.location.pathname}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
    }
  }, [error, chunkError]);

  function handleRetry() {
    if (chunkError && typeof window !== 'undefined') {
      sessionStorage.removeItem(`chunk-reload:${window.location.pathname}`);
      window.location.reload();
      return;
    }
    reset();
  }

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
      <p style={{ margin: '0 0 8px', fontSize: 14, color: '#166534', maxWidth: 420, textAlign: 'center' }}>
        {chunkError
          ? '앱이 업데이트되어 페이지를 새로고침해야 합니다. / The app was updated — please refresh.'
          : (error?.message || 'Something went wrong')}
      </p>
      {chunkError ? (
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b', maxWidth: 420, textAlign: 'center' }}>
          Ctrl+Shift+R 또는 아래 버튼을 눌러주세요.
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleRetry}
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
        {chunkError ? '새로고침 / Refresh' : '다시 시도'}
      </button>
    </main>
  );
}
