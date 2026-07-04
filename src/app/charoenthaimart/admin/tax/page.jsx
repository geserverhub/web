"use client";
import { useEffect, useState } from "react";

const VAT_STATUS_LABEL = { OVERDUE: "เกินกำหนดยื่นแบบ", DUE_NOW: "ถึงกำหนดยื่นแบบ", NOT_YET_DUE: "ยังไม่ถึงกำหนด" };
const VAT_STATUS_COLOR = { OVERDUE: ["#fee2e2", "#b91c1c"], DUE_NOW: ["#fef9c3", "#854d0e"], NOT_YET_DUE: ["#dcfce7", "#166534"] };

export default function CtmTax() {
  const [vatPeriods, setVatPeriods] = useState([]);

  useEffect(() => {
    fetch("/api/ctm/tax/vat-summary").then(r => r.json()).then(d => setVatPeriods(d.periods || []));
  }, []);

  const fmt = (n) => Number(n).toLocaleString("ko-KR");

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 20px" }}>บัญชีภาษี VAT</h1>

      {/* Auto-calculated VAT summary */}
      <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "20px 24px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>สรุป VAT อัตโนมัติ (คำนวณจากยอดขายจริง)</h2>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>รอบบิลเดือน 1-6 ยื่นภาษีเดือน 7 · รอบบิลเดือน 7-12 ยื่นภาษีเดือน 1 ปีถัดไป</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {vatPeriods.map(p => {
            const [bg, color] = VAT_STATUS_COLOR[p.status] || ["#f3f4f6", "#374151"];
            return (
              <div key={`${p.year}-${p.half}`} style={{ border: "1px solid #e7e3d8", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>ยอดขายก่อน VAT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>₩{fmt(p.subtotal)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>VAT ที่ต้องชำระ</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#b91c1c", marginBottom: 10 }}>₩{fmt(p.taxAmount)}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>กำหนดยื่น: {p.dueLabel}</span>
                  <span style={{ background: bg, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{VAT_STATUS_LABEL[p.status]}</span>
                </div>
              </div>
            );
          })}
          {vatPeriods.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div>}
        </div>
      </div>
    </div>
  );
}
