'use client';

import { useEffect, useMemo } from 'react';
import {
  CHUNK_RECOVERY_INLINE_SCRIPT,
  hardReloadForStaleChunk,
  isChunkLoadError,
  reloadOnceForStaleChunk,
} from '@/lib/chunk-recovery';

export default function GlobalError({ error, reset }) {
  const chunkError = useMemo(() => isChunkLoadError(error), [error]);

  useEffect(() => {
    console.error('[global error boundary]', error);
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
        <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY_INLINE_SCRIPT }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>เกิดข้อผิดพลาด</h2>
        <p style={{ margin: '0 0 8px', fontSize: 14, color: '#94a3b8', maxWidth: 420, textAlign: 'center' }}>
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
            background: '#f97316',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {chunkError ? 'รีเฟรช / Refresh' : 'ลองใหม่'}
        </button>
      </body>
    </html>
  );
}
