'use client';

import Link from 'next/link';
import { ERP_DEV_COPY } from '@/lib/ge-energy-erp-i18n';

export default function ErpDevelopersHub({ lang, onNavigate }) {
  const t = ERP_DEV_COPY[lang] || ERP_DEV_COPY.th;

  const items = [
    {
      id: 'erp-page-access',
      title: t.accessTitle,
      desc: t.accessDesc,
      icon: '🔐',
    },
    {
      id: 'erp-user-create',
      title: t.userTitle,
      desc: t.userDesc,
      icon: '👤',
    },
  ];

  return (
    <div className="geerp-dev-hub">
      {items.map((item) => (
        <article key={item.id} className="geerp-dev-hub-card">
          <span className="geerp-dev-hub-icon" aria-hidden>
            {item.icon}
          </span>
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
          {onNavigate ? (
            <button type="button" className="geerp-dev-hub-btn" onClick={() => onNavigate(item.id)}>
              {t.open}
            </button>
          ) : (
            <Link href={`/ge-energy-erp?d=rnd&p=${item.id}`} className="geerp-dev-hub-btn">
              {t.open}
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
