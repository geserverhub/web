'use client';

import { useEffect, useState } from 'react';
import { hardReloadForStaleChunk } from '@/lib/chunk-recovery';

export default function AppRefreshNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const hasRefreshFlag = params.get('_cb') || sessionStorage.getItem('ge-refresh-required') === '1';

    if (hasRefreshFlag) {
      setVisible(true);
      sessionStorage.setItem('ge-refresh-required', '1');
    }
  }, []);

  if (!visible) return null;

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 4000, background: 'linear-gradient(90deg, #7f1d1d 0%, #b91c1c 100%)', color: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,.18)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>แอปมีการอัปเดต กรุณารีเฟรชหน้าเว็บ / The app was updated — please refresh.</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>กด Ctrl+Shift+R หรือปุ่มด้านล่าง</div>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('ge-refresh-required');
            hardReloadForStaleChunk();
          }}
          style={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, background: '#fff', color: '#b91c1c', fontWeight: 800, padding: '8px 14px', cursor: 'pointer' }}
        >
          รีเฟรช / Refresh
        </button>
      </div>
    </div>
  );
}
