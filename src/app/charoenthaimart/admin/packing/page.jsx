"use client";
import { useEffect, useRef, useState } from "react";

const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

function printPickingSlip(sale) {
  const w = window.open("", "_blank");
  const itemsHtml = (sale.items || []).map(it => `
    <tr>
      <td class="chk"><div class="box"></div></td>
      <td>${it.productName}</td>
      <td class="right">${it.quantity}</td>
    </tr>
  `).join("");
  w.document.write(`<!DOCTYPE html><html><head><title>ใบจัดเตรียมสินค้า ${sale.number}</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 24px; color: #1f2937; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #9ca3af; padding: 6px 10px; text-align: left; }
    th { background: #f3f4f6; }
    .right { text-align: right; }
    .chk { width: 30px; text-align: center; }
    .box { width: 16px; height: 16px; border: 2px solid #374151; margin: 0 auto; }
    .foot { margin-top: 30px; font-size: 12px; }
  </style></head><body>
    <h1>ใบจัดเตรียมสินค้า / PICKING LIST</h1>
    <div class="sub">เลขที่บิล: <b>${sale.number}</b> · วันที่: ${fmtDate(sale.saleDate)} · ลูกค้า: ${sale.customer?.name || sale.note || "—"}</div>
    <table>
      <thead><tr><th class="chk">✓</th><th>สินค้า</th><th class="right">จำนวน</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="foot">ผู้แพ็ค: ______________________ &nbsp;&nbsp;&nbsp; วันที่/เวลา: ______________________</div>
    <script>window.print(); setTimeout(() => window.close(), 300);</script>
  </body></html>`);
  w.document.close();
}

export default function CtmPackingPage() {
  const [sales, setSales] = useState(null);
  const [tab, setTab] = useState("ALL");
  const [uploadingId, setUploadingId] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const fileRefs = useRef({});

  const load = () => {
    fetch("/api/ctm/packing?days=30").then(r => r.json()).then(d => setSales(d.sales || []));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (saleId, status) => {
    await fetch("/api/ctm/packing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saleId, status }) });
    load();
  };

  const uploadPhoto = async (saleId, file) => {
    setUploadingId(saleId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ctm/packing/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        await fetch("/api/ctm/packing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saleId, photoUrl: data.url, status: "PACKED" }) });
        load();
      }
    } finally { setUploadingId(null); }
  };

  const filtered = (sales || []).filter(s => {
    const status = s.packing?.status || "PENDING";
    if (tab === "ALL") return true;
    return status === tab;
  });

  const counts = {
    ALL: (sales || []).length,
    PENDING: (sales || []).filter(s => (s.packing?.status || "PENDING") === "PENDING").length,
    PACKED: (sales || []).filter(s => s.packing?.status === "PACKED").length,
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 6px" }}>แพ็คสินค้า</h1>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>ดึงรายการบิล INV มาพิมพ์ใบจัดเตรียมสินค้า และติกสถานะการแพ็คแบบ inline (30 วันล่าสุด)</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["ALL", "ทั้งหมด"], ["PENDING", "รอแพ็ค"], ["PACKED", "แพ็คแล้ว"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: tab === k ? "#b45309" : "#f3f4f6", color: tab === k ? "#fff" : "#6b7280",
          }}>{l} ({counts[k]})</button>
        ))}
      </div>

      {!sales && <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div>}
      {sales && filtered.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>ไม่มีรายการ</div>}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["เลขที่บิล", "วันที่", "ลูกค้า", "รายการ", "ยอดรวม", "รูปตะกร้าจัดของ", "สถานะแพ็ค", "พิมพ์"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const packed = s.packing?.status === "PACKED";
              return (
                <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#b45309", fontSize: 12 }}>{s.number}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(s.saleDate)}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>{s.customer?.name || s.note || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{s.items?.length || 0} รายการ</td>
                  <td style={{ padding: "8px 12px", fontWeight: 700, color: "#b45309" }}>₩{fmt(s.totalAmount)}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <input ref={el => fileRefs.current[s.id] = el} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                      onChange={e => e.target.files?.[0] && uploadPhoto(s.id, e.target.files[0])} />
                    {s.packing?.photoUrl ? (
                      <img src={s.packing.photoUrl} alt="" onClick={() => setPreviewImg(s.packing.photoUrl)}
                        style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #e7e3d8" }} />
                    ) : (
                      <button onClick={() => fileRefs.current[s.id]?.click()} disabled={uploadingId === s.id}
                        style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        {uploadingId === s.id ? "..." : "📷 ถ่ายรูป"}
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={packed} onChange={e => setStatus(s.id, e.target.checked ? "PACKED" : "PENDING")} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: packed ? "#166534" : "#b45309" }}>{packed ? "แพ็คแล้ว" : "รอแพ็ค"}</span>
                    </label>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <button onClick={() => printPickingSlip(s)} style={{ background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🖨️ พิมพ์</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
