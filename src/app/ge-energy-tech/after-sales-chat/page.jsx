'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { geEnergyTechApiUrl } from '@/lib/ge-energy-tech-api';
import {
  GEET_LANG_OPTIONS,
  getAfterSalesCopy,
  readGeetLang,
} from '@/lib/ge-energy-tech/customer-tools-i18n';
import '../ge-energy-tech.css';

export default function AfterSalesChatPage() {
  const [lang, setLang] = useState('th');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const l = readGeetLang();
    setLang(l);
    const t = getAfterSalesCopy(l);
    setMessages([{ id: 'welcome', role: 'agent', text: t.welcome }]);
  }, []);

  const t = useMemo(() => getAfterSalesCopy(lang), [lang]);

  async function sendMessage(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || typing) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: body };
    setMessages((prev) => [...prev, userMsg]);
    setText('');
    setTyping(true);

    try {
      const res = await fetch(geEnergyTechApiUrl('/api/ge-energy-tech/after-sales-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, message: body }),
      });
      const data = await res.json();
      const reply = data?.reply || t.welcome;

      setTimeout(() => {
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'agent', text: reply }]);
        setTyping(false);
      }, 500);
    } catch {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'agent', text: t.welcome }]);
      setTyping(false);
    }
  }

  return (
    <div className="get-auth-page" style={{ minHeight: '100svh' }}>
      <div className="get-auth-card get-auth-card--wide">
        <div className="get-auth-lang" role="group" aria-label="Language">
          <div className="get-auth-lang-inner">
            {GEET_LANG_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                className={opt.code === lang ? 'is-active' : ''}
                onClick={() => {
                  setLang(opt.code);
                  if (typeof window !== 'undefined') localStorage.setItem('ge-energy-tech-lang', opt.code);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <h1 className="get-auth-title" style={{ marginTop: 8 }}>{t.title}</h1>
        <p className="get-auth-sub">{t.sub}</p>

        <div className="get-meter-preview-card" style={{ minHeight: 280, marginTop: 10, padding: 10, display: 'block', borderStyle: 'solid' }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                marginBottom: 8,
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  fontSize: 14,
                  lineHeight: 1.45,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: m.role === 'user' ? '#dcfce7' : '#eef2ff',
                  color: '#0f172a',
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing ? <div style={{ color: '#64748b', fontSize: 13 }}>{t.typing}</div> : null}
        </div>

        <form onSubmit={sendMessage} style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <input
            className="get-auth-input get-auth-input--plain"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
          />
          <button type="submit" className="get-auth-submit" style={{ width: 120 }} disabled={typing || !text.trim()}>
            {t.send}
          </button>
        </form>

        <div style={{ marginTop: 14 }}>
          <Link href="/ge-energy-tech" className="get-auth-back">{t.back}</Link>
        </div>
      </div>
    </div>
  );
}
