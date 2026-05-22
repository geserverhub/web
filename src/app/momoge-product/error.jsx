'use client';

import { useEffect } from 'react';

export default function MomogeProductError({ error, reset }) {
  useEffect(() => {
    console.error('[momoge-product error boundary]', error);
  }, [error]);

  return (
    <main className="momo-page">
      <div className="momo-card" style={{ maxWidth: 520, margin: '4rem auto', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>페이지를 불러오지 못했습니다</h2>
        <p style={{ margin: '0 0 16px', color: '#166534', fontSize: 14 }}>
          {error?.message || 'Something went wrong'}
        </p>
        <button type="button" className="momo-btn-primary" onClick={() => reset()}>
          다시 시도
        </button>
      </div>
    </main>
  );
}
