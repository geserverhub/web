'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { geEnergyTechApiUrl, portalHubHref } from '@/lib/ge-energy-tech-api';
import {
  GEET_LANG_OPTIONS,
  getAfterSalesCopy,
  readGeetLang,
} from '@/lib/ge-energy-tech/customer-tools-i18n';
import '../ge-energy-tech.css';
import '../ge-energy-tech-auth.css';

export default function AfterSalesChatPage() {
  const [lang, setLang] = useState('th');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const l = readGeetLang();
    setLang(l);
    const copy = getAfterSalesCopy(l);
    setMessages([{ id: 'welcome', role: 'agent', text: copy.welcome }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

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
        inputRef.current?.focus();
      }, 600);
    } catch {
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'agent', text: t.welcome }]);
        setTyping(false);
      }, 400);
    }
  }

  return (
    <div className="get-track-page">
      <div className="get-track-shell get-chat-shell">
        <div className="get-track-brand">
          <Image
            src="/ge-energyTech/138568-transparent.png"
            alt="GE Energy Tech"
            width={48}
            height={48}
            priority
          />
          <span>GE Energy Tech</span>
        </div>

        <div className="get-track-card get-chat-card">
          <div className="get-auth-lang" role="group" aria-label="Language">
            <div className="get-auth-lang-inner">
              {GEET_LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  className={opt.code === lang ? 'is-active' : ''}
                  onClick={() => {
                    setLang(opt.code);
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('ge-energy-tech-lang', opt.code);
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <header className="get-chat-head">
            <div className="get-chat-head-icon" aria-hidden>
              💬
            </div>
            <div className="get-chat-head-text">
              <h1>{t.title}</h1>
              <p>{t.sub}</p>
            </div>
            <span className="get-chat-status">
              <span className="get-chat-status-dot" aria-hidden />
              Live
            </span>
          </header>

          <div className="get-chat-window" role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`get-chat-msg get-chat-msg--${m.role === 'user' ? 'user' : 'agent'}`}
              >
                <span className="get-chat-avatar" aria-hidden>
                  {m.role === 'user' ? 'You' : 'GE'}
                </span>
                <div className="get-chat-bubble">{m.text}</div>
              </div>
            ))}
            {typing ? (
              <div className="get-chat-typing">
                <span className="get-chat-avatar" aria-hidden>
                  GE
                </span>
                <div>
                  <div className="get-chat-typing-dots" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="get-chat-typing-label">{t.typing}</span>
                </div>
              </div>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          <form className="get-chat-compose" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              className="get-chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.placeholder}
              autoComplete="off"
              disabled={typing}
            />
            <button type="submit" className="get-chat-send" disabled={typing || !text.trim()}>
              {t.send}
            </button>
          </form>

          <footer className="get-track-footer">
            <Link href="/ge-energy-tech" className="get-track-back">
              ← {t.back}
            </Link>
            <nav className="get-track-hub-links" aria-label="Platform">
              <a href={portalHubHref('/register-geet')}>Register</a>
              <a href={portalHubHref('/ge-energy-tech/login')}>Sign In</a>
              <a href={portalHubHref('/ge-energy-tech/shipping-tracking')}>Tracking</a>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}
