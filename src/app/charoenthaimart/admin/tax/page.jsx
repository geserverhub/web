"use client";
import { useEffect, useState } from "react";

const EMPTY = { period: "", totalSales: "", vatRate: "0.10", note: "" };

export default function CtmTax() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/ctm/tax").then(r => r.json()).then(d => setRecords(d.records || []));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await fetch("/api/ctm/tax", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, totalSales: Number(form.totalSales), vatRate: Number(form.vatRate) }) });
    if (!res.ok) { const d = await res.json(); setError(d.error || "เกิดข้อผิดพลาด"); setSaving(false); return; }
    setForm(EMPTY); setSaving(false); load();
  };

  const fmt = (n) => Number(n).toLocaleString("ko-KR");

  const statusColors = { DRAFT: ["#fef9c3","#854d0e"], FILED: ["#dcfce7","#166534"], PAID: ["#dbeafe","#1d4ed8"] };

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 24px" }}>บัญชีภาษี VAT</h1>
      {/* Form */}
      <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>บันทึก / อัปเดตรายการภาษี</h2>
        {error && <div style={{ background: "#fef2f2", color: "#b91c1c", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>{error}</div>}
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>งวด (YYYY-MM)*</label>
            <input required type="month" value={form.period} onChange={set("period")} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ยอดขายรวม (₩)*</label>
            <input required type="number" min="0" value={form.totalSales} onChange={set("totalSales")} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>อัตรา VAT</label>
            <select value={form.vatRate} onChange={set("vatRate")} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }}>
              <option value="0.10">10%</option>
              <option value="0.07">7%</option>
              <option value="0.00">0%</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หมายเหตุ</label>
            <input value={form.note} onChange={set("note")} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <button type="submit" disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" }}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
          </div>
        </form>
        {form.totalSales && form.vatRate && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#92400e", background: "#fef3c7", borderRadius: 8, padding: "8px 12px" }}>
            VAT ที่ต้องชำระ: ₩{fmt(Number(form.totalSales) * Number(form.vatRate))}
          </div>
        )}
      </div>
      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["งวด","ยอดขายรวม","VAT (₩)","อัตรา","สถานะ","หมายเหตุ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ยังไม่มีรายการ</td></tr>}
            {records.map((r, i) => {
              const [bg, color] = statusColors[r.status] || ["#f3f4f6","#374151"];
              return (
                <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 700, color: "#374151" }}>{r.period}</td>
                  <td style={{ padding: "8px 12px", color: "#b45309", fontWeight: 600 }}>₩{fmt(r.totalSales)}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 800, color: "#b91c1c" }}>₩{fmt(r.vatAmount)}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{(Number(r.vatRate) * 100).toFixed(0)}%</td>
                  <td style={{ padding: "8px 12px" }}><span style={{ background: bg, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{r.status}</span></td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{r.note || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
