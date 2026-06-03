"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  formatDownloadPrice,
  getDownloadsT,
  getProductDisplay,
  normalizeDownloadsLocale,
} from "@/lib/downloads-translations";
import DownloadsLangSwitcher from "./DownloadsLangSwitcher";

function downloadButtonLabel(product, t) {
  if (!product) return t.downloadBtn;
  if (product.free || product.price <= 0) return t.downloadFreeBtn;
  return t.downloadBtn;
}

export default function DownloadsClient() {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState("th");
  const t = useMemo(() => getDownloadsT(locale), [locale]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSlug, setSelectedSlug] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [lookupCode, setLookupCode] = useState(searchParams.get("order") || "");
  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") || "");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("downloads-lang");
      if (saved && ["th", "en", "ko"].includes(saved)) {
        setLocale(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = normalizeDownloadsLocale(locale);
  }, [locale]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/software-downloads/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.loadProductsFailed);
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [t.loadProductsFailed]);

  const refreshOrder = useCallback(
    async (code, mail) => {
      const orderCode = String(code || "").trim().toUpperCase();
      const em = String(mail || "").trim().toLowerCase();
      if (!orderCode || !em) return;
      const res = await fetch(
        `/api/software-downloads/orders/status?orderCode=${encodeURIComponent(orderCode)}&email=${encodeURIComponent(em)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.orderNotFound);
      setOrder(data.order);
      setLookupCode(orderCode);
      setLookupEmail(em);
      return data.order;
    },
    [t.orderNotFound]
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const code = searchParams.get("order");
    const em = searchParams.get("email");
    if (code && em) {
      void refreshOrder(code, em).catch(() => {});
    }
    if (searchParams.get("paid") === "1") {
      setMessage(t.paidSuccess);
    }
  }, [searchParams, refreshOrder, t.paidSuccess]);

  async function startOrder(slug) {
    const productSlug = slug || selectedSlug;
    const em = email.trim().toLowerCase();
    if (!productSlug) {
      setMessage(t.selectProgram);
      return;
    }
    if (!em.includes("@")) {
      setMessage(t.enterEmail);
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/software-downloads/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, email: em }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.createOrderFailed);

      setLookupCode(data.order.orderCode);
      setLookupEmail(em);
      setOrder(data.order);

      if (data.free) {
        setMessage(`${data.order.orderCode} — ${t.orderCreatedFree}`);
        return;
      }

      setMessage(t.payRedirect);

      const payRes = await fetch("/api/software-downloads/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: data.order.orderCode, email: em }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || t.checkoutFailed);
      if (payData.checkoutUrl) {
        window.location.href = payData.checkoutUrl;
        return;
      }
      setMessage(`${data.order.orderCode} — ${t.orderCreated}`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadSlip(ev) {
    ev.preventDefault();
    if (!order || !lookupEmail) return;
    const file = ev.target.elements.slip?.files?.[0];
    if (!file) {
      setMessage(t.chooseSlip);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("orderCode", lookupCode);
      fd.append("email", lookupEmail);
      fd.append("file", file);
      const res = await fetch("/api/software-downloads/orders/payment", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.uploadFailed);
      await refreshOrder(lookupCode, lookupEmail);
      setMessage(t.slipUploaded);
      ev.target.reset();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  function downloadFile() {
    if (!order?.paid) return;
    const url = `/api/software-downloads/orders/download?orderCode=${encodeURIComponent(lookupCode)}&email=${encodeURIComponent(lookupEmail)}`;
    window.location.href = url;
  }

  function statusLabel(status) {
    return t.status[status] || status;
  }

  return (
    <div className="downloads-page min-vh-100" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 45%, #0f172a 100%)" }}>
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

      <main className="container py-4 py-lg-5" style={{ maxWidth: 1100 }}>
        <div className="text-center text-white mb-4">
          <h1 className="h3 mb-2">{t.pageTitle}</h1>
          <p className="text-white-50 mb-0 small">{t.pageSubtitle}</p>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}
        {message ? <div className="alert alert-info">{message}</div> : null}

        <section className="mb-5">
          <h2 className="h6 text-white mb-3">{t.catalogTitle}</h2>
          {loading ? (
            <p className="text-white-50">{t.loading}</p>
          ) : (
            <div className="row g-3">
              {products.map((p) => {
                const display = getProductDisplay(p, locale);
                return (
                  <div key={p.slug} className="col-md-6 col-lg-4">
                    <article
                      className={`card h-100 border-0 shadow-sm ${selectedSlug === p.slug ? "ring-2 ring-primary" : ""}`}
                      style={{
                        background: "rgba(255,255,255,0.96)",
                        outline: selectedSlug === p.slug ? "2px solid #3b82f6" : undefined,
                      }}
                    >
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex align-items-start gap-2 mb-2">
                          {p.icon ? (
                            <img src={p.icon} alt="" width={48} height={48} style={{ objectFit: "contain" }} />
                          ) : null}
                          <div>
                            <h3 className="h6 mb-1">{display.title}</h3>
                            <span className="badge text-bg-secondary me-1">{p.platform}</span>
                            {p.version ? <span className="badge text-bg-light text-dark">v{p.version}</span> : null}
                          </div>
                        </div>
                        <p className="small text-muted flex-grow-1">{display.description}</p>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <strong className="text-primary">{formatDownloadPrice(p, locale, t)}</strong>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={busy}
                            onClick={() => {
                              setSelectedSlug(p.slug);
                              if (!email.includes("@")) {
                                setMessage(t.enterEmailFirst);
                                return;
                              }
                              void startOrder(p.slug);
                            }}
                          >
                            {downloadButtonLabel(p, t)}
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card border-0 shadow mb-4" style={{ background: "rgba(255,255,255,0.96)" }}>
          <div className="card-body">
            <h2 className="h6">{t.orderSection}</h2>
            <div className="row g-2 align-items-end">
              <div className="col-md-5">
                <label className="form-label small">{t.emailLabel}</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="col-md-5">
                <label className="form-label small">{t.selectLabel}</label>
                <select
                  className="form-select"
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {products.map((p) => {
                    const display = getProductDisplay(p, locale);
                    return (
                      <option key={p.slug} value={p.slug}>
                        {display.title} ({formatDownloadPrice(p, locale, t)})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="col-md-2">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  disabled={busy || !selectedSlug}
                  onClick={() => startOrder()}
                >
                  {downloadButtonLabel(products.find((p) => p.slug === selectedSlug), t)}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="card border-0 shadow" style={{ background: "rgba(255,255,255,0.96)" }}>
          <div className="card-body">
            <h2 className="h6">{t.lookupSection}</h2>
            <div className="row g-2 mb-3">
              <div className="col-sm-4">
                <label className="form-label small">{t.orderCodeLabel}</label>
                <input
                  className="form-control"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  placeholder="AB12CD34"
                />
              </div>
              <div className="col-sm-5">
                <label className="form-label small">{t.emailLabel}</label>
                <input
                  type="email"
                  className="form-control"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                />
              </div>
              <div className="col-sm-3 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setMessage("");
                    try {
                      await refreshOrder(lookupCode, lookupEmail);
                      setMessage(t.statusUpdated);
                    } catch (err) {
                      setMessage(err.message);
                      setOrder(null);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t.checkBtn}
                </button>
              </div>
            </div>

            {order ? (
              <div className="border rounded p-3 bg-light">
                <p className="mb-1">
                  <strong>{order.productTitle}</strong> — {t.orderCodePrefix}{" "}
                  <code>{order.orderCode}</code>
                </p>
                <p className="mb-2 small">
                  {t.statusLabel}:{" "}
                  <span className="badge text-bg-dark">{statusLabel(order.status)}</span>
                  {order.paid ? <span className="ms-2 text-success">{t.downloadable}</span> : null}
                </p>

                {order.paid ? (
                  <button type="button" className="btn btn-success" onClick={downloadFile}>
                    {t.downloadBtn} {order.product?.fileName || t.fileFallback}
                  </button>
                ) : (
                  <>
                    <p className="small text-muted mb-2">{t.payHint}</p>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            const res = await fetch("/api/software-downloads/orders/checkout", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ orderCode: lookupCode, email: lookupEmail }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || t.checkoutFailed);
                            window.location.href = data.checkoutUrl;
                          } catch (err) {
                            setMessage(err.message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {t.payStripe}
                      </button>
                    </div>
                    <form onSubmit={uploadSlip} className="small">
                      <label className="form-label">{t.uploadSlipLabel}</label>
                      <div className="d-flex flex-wrap gap-2">
                        <input type="file" name="slip" className="form-control form-control-sm" accept="image/*,.pdf" />
                        <button type="submit" className="btn btn-outline-secondary btn-sm" disabled={busy}>
                          {t.sendSlip}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
