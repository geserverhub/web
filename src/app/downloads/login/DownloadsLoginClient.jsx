"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getDownloadsT, normalizeDownloadsLocale } from "@/lib/downloads-translations";
import { hubFetchHeaders, hubJsonFetch } from "@/lib/hub-fetch";
import {
  getSoftwareDownloadSession,
  saveSoftwareDownloadSession,
} from "@/lib/software-download-session";
import DownloadsLangSwitcher from "../DownloadsLangSwitcher";

export default function DownloadsLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState("th");
  const t = useMemo(() => getDownloadsT(locale), [locale]);

  const [orderCode, setOrderCode] = useState(searchParams.get("order") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const returnTo = searchParams.get("returnTo") || "";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("downloads-lang");
      if (saved && ["th", "en", "ko"].includes(saved)) setLocale(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = normalizeDownloadsLocale(locale);
  }, [locale]);

  useEffect(() => {
    const session = getSoftwareDownloadSession();
    if (!session?.productSlug) return;
    const target = returnTo || session.appPath;
    if (target) router.replace(target);
  }, [returnTo, router]);

  async function handleSubmit(ev) {
    ev.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await hubJsonFetch("/api/software-downloads/orders/login", {
        method: "POST",
        headers: hubFetchHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          orderCode: orderCode.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      saveSoftwareDownloadSession({
        orderCode: data.order.orderCode,
        email: data.order.email,
        productSlug: data.order.productSlug,
        productTitle: data.order.productTitle,
        appPath: data.appPath,
      });

      setMessage(t.loginSuccess);
      const target =
        returnTo && returnTo.startsWith("/") ? returnTo : data.appPath || "/downloads";
      window.setTimeout(() => router.push(target), 400);
    } catch (err) {
      setError(err.message || t.loginInvalid);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="downloads-login min-vh-100 d-flex flex-column"
      style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 45%, #0f172a 100%)" }}
    >
      <header className="border-bottom border-secondary border-opacity-25 py-3">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2">
          <Link href="/" className="text-white text-decoration-none d-flex align-items-center gap-2">
            <img src="/logo-mark.svg" width={36} height={36} alt="" />
            <span>
              <strong className="d-block">GE SERVER HUB</strong>
              <small className="text-white-50">{t.headerSubtitle}</small>
            </span>
          </Link>
          <DownloadsLangSwitcher locale={locale} onChange={setLocale} />
        </div>
      </header>

      <main className="container flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="card border-0 shadow w-100" style={{ maxWidth: 440, background: "rgba(255,255,255,0.98)" }}>
          <div className="card-body p-4">
            <h1 className="h5 mb-2">{t.loginPageTitle}</h1>
            <p className="small text-muted mb-4">{t.loginPageSubtitle}</p>

            {error ? <div className="alert alert-danger py-2 small">{error}</div> : null}
            {message ? <div className="alert alert-success py-2 small">{message}</div> : null}

            <form onSubmit={handleSubmit} className="vstack gap-3">
              <div>
                <label className="form-label small">{t.orderCodeLabel}</label>
                <input
                  className="form-control"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  placeholder="AY6EGDEZ"
                  required
                />
              </div>
              <div>
                <label className="form-label small">{t.emailLabel}</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label small">{t.passwordLabel}</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={busy}>
                {busy ? t.loginSigningIn : t.loginSubmit}
              </button>
            </form>

            <p className="small text-muted mt-4 mb-0">
              <Link href="/downloads">{t.backToDownloads}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
