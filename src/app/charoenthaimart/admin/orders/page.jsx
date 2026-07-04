"use client";
import { useEffect, useState } from "react";

const STATUS_LABEL = { PENDING: "รอตรวจสอบ", CONFIRMED: "ยืนยันแล้ว", CANCELLED: "ยกเลิก" };
const STATUS_COLOR = { PENDING: "#f59e0b", CONFIRMED: "#16a34a", CANCELLED: "#6b7280" };
const STATUS_BG   = { PENDING: "#fef3c7", CONFIRMED: "#dcfce7", CANCELLED: "#f3f4f6" };

function fmt(n) { return Number(n || 0).toLocaleString("ko-KR"); }
function fmtDate(d) { return d ? new Date(d).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"; }

export default function CtmOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const load = () => {
    fetch("/api/ctm/orders").then(r => r.json()).then(d => setOrders(d.orders || []));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await fetch("/api/ctm/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  };

  const statusCount = st => (orders || []).filter(o => o.status === st).length;

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0, marginBottom: 6 }}>คำสั่งซื้อออนไลน์</h1>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>คำสั่งซื้อที่ลูกค้าแนบสลิปโอนเงินจากหน้าร้านออนไลน์</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} style={{ background: STATUS_BG[k], border: `1px solid ${STATUS_COLOR[k]}40`, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: STATUS_COLOR[k] }}>
            {v}: {statusCount(k)}
          </div>
        ))}
      </div>

      {!orders && <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div>}
      {orders && orders.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>ยังไม่มีคำสั่งซื้อ</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(orders || []).map(o => (
          <div key={o.id} style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#b45309", fontSize: 14 }}>{o.orderNo}</span>
                <span style={{ marginLeft: 10, fontSize: 12, color: "#9ca3af" }}>{fmtDate(o.createdAt)}</span>
              </div>
              <select value={o.status} onChange={e => setStatus(o.id, e.target.value)}
                style={{ border: `1.5px solid ${STATUS_COLOR[o.status]}`, borderRadius: 7, padding: "4px 10px", background: STATUS_BG[o.status], color: STATUS_COLOR[o.status], fontWeight: 700, fontSize: 12, cursor: "pointer", outline: "none" }}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 4 }}>รายการสินค้า</div>
                {(o.items || []).map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151", padding: "2px 0" }}>
                    <span>{it.name} ×{it.qty}</span>
                    <span>₩{fmt(it.price * it.qty)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #e2e8f0", marginTop: 6, paddingTop: 6, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>ยอดรวม</span><span>₩{fmt(o.subtotal)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>VAT</span><span>₩{fmt(o.taxAmount)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>ค่าส่ง</span><span>₩{fmt(o.shippingFee)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#b45309" }}><span>สุทธิ</span><span>₩{fmt(o.totalAmount)}</span></div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 4 }}>ที่อยู่จัดส่ง (แทคเป)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{o.recipientName}</div>
                <div style={{ fontSize: 12, color: "#374151" }}>{o.recipientPhone}</div>
                <div style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-wrap" }}>{o.recipientAddress}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 4 }}>สลิปโอนเงิน</div>
                {o.slipUrl ? (
                  <img src={o.slipUrl} alt="slip" onClick={() => setPreviewImg(o.slipUrl)}
                    style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: "1px solid #e7e3d8" }} />
                ) : <div style={{ fontSize: 12, color: "#9ca3af" }}>ไม่มีสลิป</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewImg && (
        <div onClick={() => setPreviewImg(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "zoom-out" }}>
          <img src={previewImg} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 10, boxShadow: "0 10px 40px rgba(0,0,0,.4)" }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
