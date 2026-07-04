"use client";
import { useEffect, useState } from "react";

const VAT_STATUS_LABEL = { OVERDUE: "เกินกำหนดยื่นแบบ", DUE_NOW: "ถึงกำหนดยื่นแบบ", NOT_YET_DUE: "ยังไม่ถึงกำหนด" };
const VAT_STATUS_COLOR = { OVERDUE: ["#fee2e2", "#b91c1c"], DUE_NOW: ["#fef9c3", "#854d0e"], NOT_YET_DUE: ["#dcfce7", "#166534"] };

export default function CtmIncomeTax() {
  const [autoYears, setAutoYears] = useState([]);

  useEffect(() => {
    fetch("/api/ctm/income-tax/auto-summary").then(r => r.json()).then(d => setAutoYears(d.years || []));
  }, []);

  const fmt = (n) => Number(n).toLocaleString("ko-KR");

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 6px" }}>ภาษีรายได้กิจการ</h1>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 24px" }}>ภาษีเงินได้นิติบุคคล / กิจการรายปี คำนวณจากรายได้จริงในระบบ</p>

      {/* Auto-calculated income tax summary */}
      <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "20px 24px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>สรุปภาษีรายได้อัตโนมัติ (คำนวณจากรายได้จริงในระบบ)</h2>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>คำนวณตามอัตราภาษีนิติบุคคลแบบขั้นบันได (9% / 19% / 21% / 24%) · กำหนดยื่นภาษีเดือน 5 ของปีถัดไป</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {autoYears.map(y => {
            const [bg, color] = VAT_STATUS_COLOR[y.status] || ["#f3f4f6", "#374151"];
            return (
              <div key={y.year} style={{ border: "1px solid #e7e3d8", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#92400e", marginBottom: 8 }}>ปีภาษี {y.year + 543}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>รายได้ที่ต้องเสียภาษี</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>₩{fmt(y.taxableIncome)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>ภาษีที่ต้องชำระ</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#b91c1c", marginBottom: 10 }}>₩{fmt(y.taxAmount)}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>กำหนดยื่น: {y.dueLabel}</span>
                  <span style={{ background: bg, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{VAT_STATUS_LABEL[y.status]}</span>
                </div>
              </div>
            );
          })}
          {autoYears.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div>}
        </div>
      </div>
    </div>
  );
}
