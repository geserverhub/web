"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const STATUS_BADGE = {
  PENDING: { bg: "#3b2800", color: "#fbbf24", label: "รอชำระเงิน" },
  AWAITING_REVIEW: { bg: "#1e2a4a", color: "#7eb8f7", label: "รอตรวจสอบสลิป" },
  PAID: { bg: "#14532d", color: "#4ade80", label: "ชำระแล้ว" },
  CANCELLED: { bg: "#1e2130", color: "#8b8fa8", label: "ยกเลิก" },
};

async function readJsonResponse(response) {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (${response.status})`);
    }
  }
  if (!response.ok) throw new Error(data.error || `เกิดข้อผิดพลาด (${response.status})`);
  return data;
}

function formatMoney(amount, currency) {
  const n = Number(amount) || 0;
  if (n <= 0) return "ฟรี";
  if (currency === "KRW") return `₩${n.toLocaleString("ko-KR")}`;
  return `${n.toLocaleString()} ${currency || "THB"}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function SoftwareDownloadsAdminClient({ session }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ PENDING: 0, AWAITING_REVIEW: 0, PAID: 0, CANCELLED: 0, total: 0 });
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyCode, setBusyCode] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterStatus) q.set("status", filterStatus);
      if (search.trim()) q.set("q", search.trim());
      const d = await readJsonResponse(await fetch(`/api/admin/software-downloads?${q}`));
      setOrders(d.orders || []);
      setStats(d.stats || { PENDING: 0, AWAITING_REVIEW: 0, PAID: 0, CANCELLED: 0, total: 0 });
      setProducts(d.products || []);
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchOrder(orderCode, action) {
    setBusyCode(orderCode);
    try {
      await readJsonResponse(
        await fetch("/api/admin/software-downloads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderCode, action }),
        })
      );
      showToast(`อัปเดต ${orderCode} แล้ว`);
      await load();
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setBusyCode("");
    }
  }

  const S = {
    bg: { background: "#0f1117", minHeight: "100dvh", color: "#e8eaf0" },
    nav: {
      background: "#16181f",
      borderBottom: "1px solid #2a2d3a",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    },
    card: { background: "#16181f", border: "1px solid #2a2d3a", borderRadius: 10, padding: 20 },
    input: {
      background: "#1e2130",
      border: "1px solid #2a2d3a",
      color: "#e8eaf0",
      borderRadius: 6,
      padding: "8px 12px",
      width: "100%",
      fontSize: 14,
      outline: "none",
    },
    label: { fontSize: 12, color: "#8b8fa8", marginBottom: 4, display: "block" },
    btn: (bg, color = "#fff") => ({
      background: bg,
      color,
      border: "none",
      borderRadius: 6,
      padding: "6px 12px",
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
    }),
    th: {
      padding: "10px 14px",
      fontSize: 12,
      color: "#8b8fa8",
      fontWeight: 600,
      textAlign: "left",
      borderBottom: "1px solid #2a2d3a",
      whiteSpace: "nowrap",
    },
    td: { padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #1e2130", verticalAlign: "middle" },
  };

  return (
    <div style={S.bg}>
      <nav style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#7eb8f7" }}>⚙️ Admin Panel</span>
          <Link href="/admin/clients" style={{ color: "#8b8fa8", fontSize: 13, textDecoration: "none" }}>
            ลูกค้า &amp; Users
          </Link>
          <span style={{ color: "#7eb8f7", fontSize: 13, fontWeight: 600 }}>ดาวน์โหลดซอฟต์แวร์</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Link
            href="/downloads"
            target="_blank"
            rel="noreferrer"
            style={{ ...S.btn("#1e2336", "#7eb8f7"), textDecoration: "none" }}
          >
            เปิดหน้า /downloads
          </Link>
          <span style={{ color: "#8b8fa8", fontSize: 12 }}>{session.user.name || session.user.email}</span>
          <button style={S.btn("#2a1f1f", "#f87171")} onClick={() => signOut({ callbackUrl: "/login" })}>
            ออกจากระบบ
          </button>
        </div>
      </nav>

      {toast ? (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.ok ? "#14532d" : "#7f1d1d",
            color: "#fff",
            borderRadius: 8,
            padding: "12px 20px",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      ) : null}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>ดาวน์โหลดซอฟต์แวร์ — หลังบ้าน</h2>
          <p style={{ margin: "6px 0 0", color: "#8b8fa8", fontSize: 14 }}>
            ตรวจสอบการชำระเงิน (Stripe / สลิป) และคำสั่งซื้อจากหน้า{" "}
            <Link href="/downloads" target="_blank" rel="noreferrer" style={{ color: "#7eb8f7" }}>
              /downloads
            </Link>
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            { key: "AWAITING_REVIEW", label: "รอตรวจสลิป", color: "#7eb8f7" },
            { key: "PENDING", label: "รอชำระ", color: "#fbbf24" },
            { key: "PAID", label: "ชำระแล้ว", color: "#4ade80" },
            { key: "CANCELLED", label: "ยกเลิก", color: "#8b8fa8" },
            { key: "total", label: "ทั้งหมด", color: "#e8eaf0" },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              style={{
                ...S.card,
                textAlign: "center",
                cursor: s.key === "total" ? "default" : "pointer",
                border:
                  filterStatus === s.key ? "2px solid #7eb8f7" : "1px solid #2a2d3a",
              }}
              onClick={() => {
                if (s.key === "total") {
                  setFilterStatus("");
                } else {
                  setFilterStatus((prev) => (prev === s.key ? "" : s.key));
                }
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{stats[s.key] ?? 0}</div>
              <div style={{ fontSize: 12, color: "#8b8fa8" }}>{s.label}</div>
            </button>
          ))}
        </div>

        <div style={{ ...S.card, marginBottom: 20 }}>
          <h5 style={{ margin: "0 0 12px", color: "#7eb8f7", fontSize: 15 }}>รายการใน catalog</h5>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {products.map((p) => (
              <span
                key={p.slug}
                style={{
                  background: "#1e2130",
                  border: "1px solid #2a2d3a",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                }}
              >
                <strong>{p.titleTh}</strong> · {formatMoney(p.price, p.currency)}
              </span>
            ))}
          </div>
        </div>

        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={S.label}>ค้นหา (รหัส / อีเมล / สินค้า)</label>
              <input
                style={S.input}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="AB12CD34 หรือ email@..."
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
            </div>
            <div style={{ flex: "0 0 160px" }}>
              <label style={S.label}>สถานะ</label>
              <select
                style={S.input}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                <option value="AWAITING_REVIEW">รอตรวจสอบสลิป</option>
                <option value="PENDING">รอชำระเงิน</option>
                <option value="PAID">ชำระแล้ว</option>
                <option value="CANCELLED">ยกเลิก</option>
              </select>
            </div>
            <button type="button" style={S.btn("#1e3a5f", "#7eb8f7")} onClick={() => load()} disabled={loading}>
              {loading ? "กำลังโหลด..." : "รีเฟรช"}
            </button>
          </div>
        </div>

        <div style={{ ...S.card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead>
              <tr>
                <th style={S.th}>รหัส</th>
                <th style={S.th}>วันที่</th>
                <th style={S.th}>อีเมล</th>
                <th style={S.th}>สินค้า</th>
                <th style={S.th}>ยอด</th>
                <th style={S.th}>สถานะ</th>
                <th style={S.th}>สลิป / Stripe</th>
                <th style={S.th}>DL</th>
                <th style={S.th}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...S.td, color: "#8b8fa8" }}>
                    กำลังโหลด...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...S.td, color: "#8b8fa8" }}>
                    ไม่พบคำสั่งซื้อ
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const badge = STATUS_BADGE[o.status] || STATUS_BADGE.PENDING;
                  const isBusy = busyCode === o.orderCode;
                  const notes = o.notesObj || {};
                  return (
                    <tr
                      key={o.id}
                      style={
                        o.status === "AWAITING_REVIEW"
                          ? { background: "rgba(126, 184, 247, 0.06)" }
                          : undefined
                      }
                    >
                      <td style={S.td}>
                        <code>{o.orderCode}</code>
                      </td>
                      <td style={{ ...S.td, fontSize: 12, color: "#8b8fa8" }}>{formatDate(o.createdAt)}</td>
                      <td style={S.td}>{o.email}</td>
                      <td style={S.td}>
                        <div>{o.productTitle}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{o.productSlug}</div>
                      </td>
                      <td style={S.td}>{formatMoney(o.amount, o.currency)}</td>
                      <td style={S.td}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: 12 }}>
                        {o.receiptFile ? (
                          <a
                            href={o.receiptFile}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#7eb8f7" }}
                          >
                            ดูสลิป
                          </a>
                        ) : (
                          <span style={{ color: "#6b7280" }}>—</span>
                        )}
                        {notes.paymentGateway ? (
                          <div style={{ color: "#8b8fa8", marginTop: 4 }}>{notes.paymentGateway}</div>
                        ) : null}
                        {o.stripeCheckoutSessionId ? (
                          <div style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }}>
                            {String(o.stripeCheckoutSessionId).slice(0, 20)}…
                          </div>
                        ) : null}
                      </td>
                      <td style={S.td}>{o.downloadCount ?? 0}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {o.status !== "PAID" ? (
                            <button
                              type="button"
                              style={S.btn("#14532d", "#4ade80")}
                              disabled={isBusy}
                              onClick={() => patchOrder(o.orderCode, "CONFIRM")}
                            >
                              ยืนยันชำระ
                            </button>
                          ) : null}
                          {o.status !== "CANCELLED" ? (
                            <button
                              type="button"
                              style={S.btn("#2a1f1f", "#f87171")}
                              disabled={isBusy}
                              onClick={() => {
                                if (!confirm(`ยกเลิกคำสั่งซื้อ ${o.orderCode}?`)) return;
                                void patchOrder(o.orderCode, "CANCEL");
                              }}
                            >
                              ยกเลิก
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
