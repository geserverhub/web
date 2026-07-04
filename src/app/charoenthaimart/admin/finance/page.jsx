"use client";
import { useEffect, useState } from "react";

export default function CtmFinance() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch last 12 months
    const promises = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.toISOString().slice(0, 7);
      promises.push(fetch(`/api/ctm/sales?month=${m}`).then(r => r.json()).then(data => ({ month: m, ...data })));
    }
    Promise.all(promises).then(results => { setMonths(results); setLoading(false); });
  }, []);

  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const pct = (p, r) => r ? ((p / r) * 100).toFixed(1) : "0.0";

  const totalRevenue = months.reduce((s, m) => s + (m.totalRevenue || 0), 0);
  const totalCost = months.reduce((s, m) => s + (m.totalCost || 0), 0);
  const totalProfit = months.reduce((s, m) => s + (m.profit || 0), 0);

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 24px" }}>กำไร / ขาดทุน</h1>
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "รายรับรวม 12 เดือน", value: `₩${fmt(totalRevenue)}`, color: "#b45309", bg: "#fef3c7" },
            { label: "ต้นทุนรวม 12 เดือน", value: `₩${fmt(totalCost)}`, color: "#b91c1c", bg: "#fee2e2" },
            { label: "กำไรสุทธิรวม", value: `₩${fmt(totalProfit)}`, color: totalProfit >= 0 ? "#15803d" : "#b91c1c", bg: totalProfit >= 0 ? "#dcfce7" : "#fee2e2" },
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
                {["เดือน","รายรับ","ต้นทุน","กำไร","อัตรากำไร %","จำนวนออเดอร์"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => {
                const profit = m.profit || 0;
                const isProfit = profit >= 0;
                return (
                  <tr key={m.month} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#374151" }}>{m.month}</td>
                    <td style={{ padding: "8px 12px", color: "#b45309", fontWeight: 600 }}>₩{fmt(m.totalRevenue || 0)}</td>
                    <td style={{ padding: "8px 12px", color: "#6b7280" }}>₩{fmt(m.totalCost || 0)}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: isProfit ? "#15803d" : "#b91c1c" }}>
                      {isProfit ? "+" : ""}₩{fmt(profit)}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: isProfit ? "#dcfce7" : "#fee2e2", color: isProfit ? "#166534" : "#b91c1c", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}>
                        {pct(profit, m.totalRevenue || 0)}%
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280" }}>{m.sales?.length || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
