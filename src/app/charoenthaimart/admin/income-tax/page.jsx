"use client";
import { useEffect, useState } from "react";

const EMPTY = { year: new Date().getFullYear().toString(), totalRevenue: "", taxableIncome: "", taxRate: "0.20", note: "", status: "DRAFT" };
const STATUS_COLORS = { DRAFT: ["#fef9c3","#854d0e"], FILED: ["#dcfce7","#166534"], PAID: ["#dbeafe","#1d4ed8"] };
const STATUS_TH = { DRAFT: "ร่าง", FILED: "ยื่นแล้ว", PAID: "ชำระแล้ว" };

export default function CtmIncomeTax() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/ctm/income-tax").then(r => r.json()).then(d => setRecords(d.records || []));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const taxAmount = form.taxableIncome && form.taxRate ? (Number(form.taxableIncome) * Number(form.taxRate)).toFixed(2) : "0";

  const submit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await fetch("/api/ctm/income-tax", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const d = await res.json(); setError(d.error || "เกิดข้อผิดพลาด"); setSaving(false); return; }
    setForm(EMPTY); setSaving(false); load();
  };

  const updateStatus = async (id, status) => {
    await fetch("/api/ctm/income-tax", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  };

  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 6px" }}>ภาษีรายได้กิจการ</h1>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 24px" }}>บันทึกและติดตามภาษีเงินได้นิติบุคคล / กิจการรายปี</p>

      {/* Form */}
      <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>บันทึก / อัปเดตรายการภาษี</h2>
        {error && <div style={{ background: "#fef2f2", color: "#b91c1c", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ปีภาษี*</label>
              <input required value={form.year} onChange={set("year")} style={inp} placeholder="2025" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>รายได้รวม (₩)*</label>
              <input required type="number" min="0" value={form.totalRevenue} onChange={set("totalRevenue")} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>รายได้ที่ต้องเสียภาษี (₩)*</label>
              <input required type="number" min="0" value={form.taxableIncome} onChange={set("taxableIncome")} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>อัตราภาษี</label>
              <select value={form.taxRate} onChange={set("taxRate")} style={inp}>
                <option value="0.09">9% (ต่ำกว่า 200ล้าน₩)</option>
                <option value="0.19">19% (200ล้าน–20,000ล้าน₩)</option>
                <option value="0.20">20%</option>
                <option value="0.21">21% (เกิน 20,000ล้าน₩)</option>
                <option value="0.24">24%</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>สถานะ</label>
              <select value={form.status} onChange={set("status")} style={inp}>
                <option value="DRAFT">ร่าง</option>
                <option value="FILED">ยื่นแล้ว</option>
                <option value="PAID">ชำระแล้ว</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หมายเหตุ</label>
              <input value={form.note} onChange={set("note")} style={inp} />
            </div>
          </div>
          {form.taxableIncome && (
            <div style={{ background: "#fef3c7", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13 }}>
              ภาษีที่ต้องชำระ: <strong style={{ color: "#b45309", fontSize: 16 }}>₩{fmt(taxAmount)}</strong>
              <span style={{ color: "#9ca3af", marginLeft: 8 }}>({(Number(form.taxRate)*100).toFixed(0)}% × ₩{fmt(form.taxableIncome)})</span>
            </div>
          )}
          <button type="submit" disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "9px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </form>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["ปีภาษี","รายได้รวม","รายได้ต้องเสียภาษี","อัตรา","ภาษีที่ต้องชำระ","สถานะ","อัปเดตสถานะ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ยังไม่มีรายการ</td></tr>}
            {records.map((r, i) => {
              const [bg, color] = STATUS_COLORS[r.status] || ["#f3f4f6","#374151"];
              return (
                <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 800, fontSize: 15, color: "#92400e" }}>{r.year}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>₩{fmt(r.totalRevenue)}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>₩{fmt(r.taxableIncome)}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{(Number(r.taxRate)*100).toFixed(0)}%</td>
                  <td style={{ padding: "8px 12px", fontWeight: 800, color: "#b91c1c", fontSize: 15 }}>₩{fmt(r.taxAmount)}</td>
                  <td style={{ padding: "8px 12px" }}><span style={{ background: bg, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{STATUS_TH[r.status] || r.status}</span></td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["DRAFT","FILED","PAID"].map(s => (
                        <button key={s} onClick={() => updateStatus(r.id, s)} disabled={r.status === s}
                          style={{ background: r.status === s ? "#e5e7eb" : "#fff", color: r.status === s ? "#9ca3af" : "#374151", border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 8px", cursor: r.status === s ? "default" : "pointer", fontSize: 11, fontWeight: 600 }}>
                          {STATUS_TH[s]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
