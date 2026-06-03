"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { publicHubBaseUrl } from "@/lib/data";

const STATUS_LABELS = {
  PENDING: "รอชำระเงิน",
  AWAITING_REVIEW: "รอตรวจสอบสลิป",
  PAID: "ชำระเงินแล้ว — ดาวน์โหลดได้",
  CANCELLED: "ยกเลิก",
};

function formatPrice(product) {
  if (product.free || product.price <= 0) return "ฟรี";
  return `${product.price.toLocaleString()} ${product.currency}`;
}

export default function DownloadsClient() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [hubUrl, setHubUrl] = useState(publicHubBaseUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSlug, setSelectedSlug] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [lookupCode, setLookupCode] = useState(searchParams.get("order") || "");
  const [lookupEmail, setLookupEmail] = useState(searchParams.get("email") || "");
  const [order, setOrder] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/software-downloads/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดรายการไม่สำเร็จ");
      setProducts(data.products || []);
      if (data.hubUrl) setHubUrl(data.hubUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrder = useCallback(async (code, mail) => {
    const orderCode = String(code || "").trim().toUpperCase();
    const em = String(mail || "").trim().toLowerCase();
    if (!orderCode || !em) return;
    const res = await fetch(
      `/api/software-downloads/orders/status?orderCode=${encodeURIComponent(orderCode)}&email=${encodeURIComponent(em)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "ไม่พบคำสั่งซื้อ");
    setOrder(data.order);
    setLookupCode(orderCode);
    setLookupEmail(em);
    return data.order;
  }, []);

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
      setMessage("ชำระเงินสำเร็จ — ตรวจสอบสถานะด้านล่างแล้วกดดาวน์โหลด");
    }
  }, [searchParams, refreshOrder]);

  async function startOrder(slug) {
    const productSlug = slug || selectedSlug;
    const em = email.trim().toLowerCase();
    if (!productSlug) {
      setMessage("กรุณาเลือกโปรแกรม");
      return;
    }
    if (!em.includes("@")) {
      setMessage("กรุณากรอกอีเมล");
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
      if (!res.ok) throw new Error(data.error || "สร้างคำสั่งซื้อไม่สำเร็จ");

      setLookupCode(data.order.orderCode);
      setLookupEmail(em);
      setOrder(data.order);

      if (data.free) {
        setMessage(`สร้างคำสั่งซื้อ ${data.order.orderCode} แล้ว — ดาวน์โหลดได้ทันที (ฟรี)`);
        return;
      }

      const payRes = await fetch("/api/software-downloads/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: data.order.orderCode, email: em }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "เปิดหน้าชำระเงินไม่สำเร็จ");
      if (payData.checkoutUrl) {
        window.location.href = payData.checkoutUrl;
        return;
      }
      setMessage(`สร้างคำสั่งซื้อ ${data.order.orderCode} แล้ว`);
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
      setMessage("เลือกไฟล์สลิปก่อน");
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
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      await refreshOrder(lookupCode, lookupEmail);
      setMessage("อัปโหลดสลิปแล้ว — รอเจ้าหน้าที่ยืนยันการชำระเงิน");
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

  return (
    <div className="downloads-page min-vh-100" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 45%, #0f172a 100%)" }}>
      <header className="border-bottom border-secondary border-opacity-25 py-3">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2">
          <Link href="/" className="text-white text-decoration-none d-flex align-items-center gap-2">
            <img src="/logo-mark.svg" width={36} height={36} alt="" />
            <span>
              <strong className="d-block">GE SERVER HUB</strong>
              <small className="text-white-50">ดาวน์โหลดซอฟต์แวร์</small>
            </span>
          </Link>
          <span className="badge text-bg-dark border border-secondary">
            Hub: {hubUrl.replace(/^https?:\/\//, "")}
          </span>
        </div>
      </header>

      <main className="container py-4 py-lg-5" style={{ maxWidth: 1100 }}>
        <div className="text-center text-white mb-4">
          <h1 className="h3 mb-2">ดาวน์โหลดโปรแกรมและไฟล์</h1>
          <p className="text-white-50 mb-0 small">
            เลือกรายการ → ชำระเงิน (Stripe) หรืออัปโหลดสลิป → ดาวน์โหลดได้เมื่อสถานะเป็น「ชำระเงินแล้ว」
          </p>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}
        {message ? <div className="alert alert-info">{message}</div> : null}

        <section className="mb-5">
          <h2 className="h6 text-white mb-3">รายการดาวน์โหลด</h2>
          {loading ? (
            <p className="text-white-50">กำลังโหลด...</p>
          ) : (
            <div className="row g-3">
              {products.map((p) => (
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
                          <h3 className="h6 mb-1">{p.titleTh}</h3>
                          <span className="badge text-bg-secondary me-1">{p.platform}</span>
                          {p.version ? <span className="badge text-bg-light text-dark">v{p.version}</span> : null}
                        </div>
                      </div>
                      <p className="small text-muted flex-grow-1">{p.description}</p>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <strong className="text-primary">{formatPrice(p)}</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={busy}
                          onClick={() => {
                            setSelectedSlug(p.slug);
                            if (email.includes("@")) void startOrder(p.slug);
                          }}
                        >
                          {p.free ? "รับฟรี" : "สั่งซื้อ"}
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card border-0 shadow mb-4" style={{ background: "rgba(255,255,255,0.96)" }}>
          <div className="card-body">
            <h2 className="h6">สั่งซื้อ / รับไฟล์</h2>
            <div className="row g-2 align-items-end">
              <div className="col-md-5">
                <label className="form-label small">อีเมล (ใช้ตรวจสอบคำสั่งซื้อ)</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="col-md-5">
                <label className="form-label small">เลือกจากรายการด้านบน</label>
                <select
                  className="form-select"
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                >
                  <option value="">— เลือกโปรแกรม —</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.titleTh} ({formatPrice(p)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  disabled={busy || !selectedSlug}
                  onClick={() => startOrder()}
                >
                  ดำเนินการ
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="card border-0 shadow" style={{ background: "rgba(255,255,255,0.96)" }}>
          <div className="card-body">
            <h2 className="h6">ตรวจสอบคำสั่งซื้อและดาวน์โหลด</h2>
            <div className="row g-2 mb-3">
              <div className="col-sm-4">
                <label className="form-label small">รหัสคำสั่งซื้อ</label>
                <input
                  className="form-control"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  placeholder="AB12CD34"
                />
              </div>
              <div className="col-sm-5">
                <label className="form-label small">อีเมล</label>
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
                      setMessage("อัปเดตสถานะแล้ว");
                    } catch (err) {
                      setMessage(err.message);
                      setOrder(null);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  ตรวจสอบ
                </button>
              </div>
            </div>

            {order ? (
              <div className="border rounded p-3 bg-light">
                <p className="mb-1">
                  <strong>{order.productTitle}</strong> — รหัส <code>{order.orderCode}</code>
                </p>
                <p className="mb-2 small">
                  สถานะ: <span className="badge text-bg-dark">{STATUS_LABELS[order.status] || order.status}</span>
                  {order.paid ? (
                    <span className="ms-2 text-success">ดาวน์โหลดได้</span>
                  ) : null}
                </p>

                {order.paid ? (
                  <button type="button" className="btn btn-success" onClick={downloadFile}>
                    ดาวน์โหลด {order.product?.fileName || "ไฟล์"}
                  </button>
                ) : (
                  <>
                    <p className="small text-muted mb-2">
                      ชำระด้วยบัตรผ่าน Stripe หรืออัปโหลดสลิปโอนเงิน (รอแอดมินยืนยัน)
                    </p>
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
                            if (!res.ok) throw new Error(data.error);
                            window.location.href = data.checkoutUrl;
                          } catch (err) {
                            setMessage(err.message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        ชำระด้วยบัตร (Stripe)
                      </button>
                    </div>
                    <form onSubmit={uploadSlip} className="small">
                      <label className="form-label">อัปโหลดสลิปโอนเงิน</label>
                      <div className="d-flex flex-wrap gap-2">
                        <input type="file" name="slip" className="form-control form-control-sm" accept="image/*,.pdf" />
                        <button type="submit" className="btn btn-outline-secondary btn-sm" disabled={busy}>
                          ส่งสลิป
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <div className="alert alert-dark border-secondary small text-white-50 mt-4">
          <strong className="text-white">ตั้งค่า ngrok / Stripe</strong>
          <ul className="mb-0 mt-2">
            <li>
              ตั้ง <code>NEXT_PUBLIC_PUBLIC_HUB_URL</code> เป็น URL ngrok (เช่น {publicHubBaseUrl})
            </li>
            <li>
              Webhook Stripe: <code>{hubUrl}/api/software-downloads/webhook/stripe</code>
            </li>
            <li>
              วางไฟล์จริงใน <code>storage/software-downloads/</code> และแก้ <code>filePath</code> ใน catalog
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
