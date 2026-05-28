'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { geEnergyTechApiUrl, portalHubHref } from '@/lib/ge-energy-tech-api';
import {
  buildOrderTimeline,
  getOrderStatusLabels,
  getOrderStatusLocale,
} from '@/lib/ge-energy-tech/order-status-i18n';
import {
  GEET_LANG_OPTIONS,
  getTrackingCopy,
  readGeetLang,
  writeGeetLang,
} from '@/lib/ge-energy-tech/customer-tools-i18n';
import '../ge-energy-tech.css';
import '../ge-energy-tech-auth.css';

function statusBadgeClass(statusKey) {
  if (statusKey === 'delivered') return 'get-track-status-badge get-track-status-badge--delivered';
  if (statusKey === 'shipped') return 'get-track-status-badge get-track-status-badge--shipped';
  if (statusKey === 'pending') return 'get-track-status-badge get-track-status-badge--pending';
  return 'get-track-status-badge';
}

function localizeOrderResult(order, lang) {
  if (!order?.statusKey) return order;
  const labels = getOrderStatusLabels(lang);
  return {
    ...order,
    status: labels[order.statusKey] || order.status,
    timeline: buildOrderTimeline(order.statusKey, labels),
  };
}

export default function ShippingTrackingPage() {
  const [lang, setLang] = useState('th');
  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLang(readGeetLang());
  }, []);

  useEffect(() => {
    setResult((prev) => (prev ? localizeOrderResult(prev, lang) : null));
  }, [lang]);

  const t = useMemo(() => getTrackingCopy(lang), [lang]);
  const dateLocale = useMemo(() => getOrderStatusLocale(lang), [lang]);

  function handleLangChange(code) {
    setLang(code);
    writeGeetLang(code);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(geEnergyTechApiUrl('/api/ge-energy-tech/order-tracking'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          email: mode === 'email' ? email.trim() : '',
          orderId: mode === 'order' ? orderId.trim() : '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.order) {
        setError(data?.error || t.notFound);
        return;
      }
      setResult(localizeOrderResult(data.order, lang));
    } catch {
      setError(t.notFound);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="get-track-page">
      <div className="get-track-shell">
        <div className="get-track-brand">
          <Image
            src="/ge-energyTech/138568-transparent.png"
            alt={t.brandName}
            width={48}
            height={48}
            priority
          />
          <span>{t.brandName}</span>
        </div>

        <div className="get-track-card">
          <div className="get-auth-lang" role="group" aria-label={t.langLabel}>
            <div className="get-auth-lang-inner">
              {GEET_LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  className={opt.code === lang ? 'is-active' : ''}
                  onClick={() => handleLangChange(opt.code)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <h1 className="get-track-title">{t.title}</h1>
          <p className="get-track-sub">{t.sub}</p>

          <form onSubmit={onSubmit}>
            <div className="get-track-tabs" role="tablist" aria-label={t.title}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'email'}
                className={`get-track-tab${mode === 'email' ? ' is-active' : ''}`}
                onClick={() => setMode('email')}
              >
                {t.byEmail}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'order'}
                className={`get-track-tab${mode === 'order' ? ' is-active' : ''}`}
                onClick={() => setMode('order')}
              >
                {t.byOrder}
              </button>
            </div>

            {mode === 'email' ? (
              <div className="get-track-field">
                <label htmlFor="track-email">{t.email}</label>
                <input
                  id="track-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  required
                />
              </div>
            ) : (
              <div className="get-track-field">
                <label htmlFor="track-order">{t.orderId}</label>
                <input
                  id="track-order"
                  type="text"
                  autoComplete="off"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder={t.orderPlaceholder}
                  required
                />
              </div>
            )}

            {error ? (
              <p className="get-track-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="get-track-submit" disabled={loading}>
              {loading ? t.searching : t.find}
            </button>
          </form>

          {result ? (
            <div className="get-track-result">
              <div className="get-track-result-head">
                <div>
                  <p className="get-track-result-label">{t.orderNo}</p>
                  <span className="get-track-order-id">{result.orderId}</span>
                </div>
                <span className={statusBadgeClass(result.statusKey)}>{result.status}</span>
              </div>
              <p className="get-track-meta">
                {t.updatedAt}:{' '}
                {new Date(result.updatedAt).toLocaleString(dateLocale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <h2 className="get-track-timeline-title">{t.timeline}</h2>
              <ul className="get-track-timeline">
                {result.timeline.map((step) => (
                  <li key={step.statusKey || step.step} className={step.done ? 'is-done' : ''}>
                    <span className="get-track-dot" aria-hidden>
                      {step.done ? '✓' : ''}
                    </span>
                    <span className="get-track-step-text">{step.step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <footer className="get-track-footer">
            <Link href="/ge-energy-tech" className="get-track-back">
              ← {t.back}
            </Link>
            <nav className="get-track-hub-links" aria-label={t.platformNav}>
              <a href={portalHubHref('/register-geet')}>{t.register}</a>
              <a href={portalHubHref('/ge-energy-tech/login')}>{t.signIn}</a>
              <a href={portalHubHref('/ge-energy-erp-login')}>{t.admin}</a>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}
