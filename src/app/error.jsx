'use client';

import { useEffect, useMemo } from 'react';
import {
  hardReloadForStaleChunk,
  isChunkLoadError,
  reloadOnceForStaleChunk,
} from '@/lib/chunk-recovery';

export default function Error({ error, reset }) {
  const chunkError = useMemo(() => isChunkLoadError(error), [error]);

  useEffect(() => {
    console.error('[app error boundary]', error);
    if (chunkError) reloadOnceForStaleChunk();
  }, [error, chunkError]);

  function handleRetry() {
    if (chunkError) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`chunk-reload:${window.location.pathname}`);
      }
      hardReloadForStaleChunk();
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
      <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>เกิดข้อผิดพลาด</h2>
      <p style={{ margin: '0 0 8px', fontSize: 14, color: '#166534', maxWidth: 420, textAlign: 'center' }}>
        {chunkError
          ? 'แอปมีการอัปเดต กรุณารีเฟรชหน้าเว็บ / The app was updated — please refresh.'
          : (error?.message || 'Something went wrong')}
      </p>
      {chunkError ? (
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b', maxWidth: 420, textAlign: 'center' }}>
          กด Ctrl+Shift+R หรือปุ่มด้านล่าง
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
        {chunkError ? 'รีเฟรช / Refresh' : 'ลองใหม่'}
      </button>
    </main>
  );
}
