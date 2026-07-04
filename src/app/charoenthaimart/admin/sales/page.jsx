"use client";
import { useEffect, useState } from "react";

export default function CtmSales() {
  const now = new Date();
  const [month, setMonth] = useState(now.toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [month]);

  const load = () => {
    setLoading(true);
    fetch(`/api/ctm/sales?month=${month}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const fmtDate = (s) => new Date(s).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>ยอดขาย</h1>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }} />
      </div>
      {!loading && data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "รายรับทั้งหมด", value: `₩${fmt(data.totalRevenue)}`, color: "#b45309", bg: "#fef3c7" },
            { label: "ต้นทุนทั้งหมด", value: `₩${fmt(data.totalCost)}`, color: "#b91c1c", bg: "#fee2e2" },
            { label: "กำไร", value: `₩${fmt(data.profit)}`, color: "#15803d", bg: "#dcfce7" },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}
      {loading ? <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div> : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fef3c7" }}>
                {["เลขที่บิล","วันที่","ลูกค้า","ชำระเงิน","รายการ","ยอดรวม"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!data?.sales || data.sales.length === 0) && (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการขาย</td></tr>
              )}
              {data?.sales?.map((s, i) => (
                <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{s.number}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>{fmtDate(s.saleDate)}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>{s.customer?.name || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ background: s.paymentType === "CASH" ? "#dcfce7" : "#dbeafe", color: s.paymentType === "CASH" ? "#166534" : "#1d4ed8", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{s.paymentType}</span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{s.items?.length || 0} รายการ</td>
                  <td style={{ padding: "8px 12px", fontWeight: 800, color: "#b45309" }}>₩{fmt(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
