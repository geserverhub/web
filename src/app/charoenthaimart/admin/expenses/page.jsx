"use client";
import { useEffect, useState } from "react";

const CATEGORIES = ["ค่าเช่า","ค่าสาธารณูปโภค","ค่าวัตถุดิบ","ค่าขนส่ง","ค่าบรรจุภัณฑ์","ค่าโฆษณา","ค่าซ่อมบำรุง","ค่าใช้จ่ายทั่วไป","อื่นๆ"];
const EMPTY = { date: new Date().toISOString().slice(0,10), category: "", description: "", amount: "", paymentType: "CASH", note: "" };

export default function CtmExpenses() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => fetch(`/api/ctm/expenses?month=${month}`).then(r => r.json()).then(setData);
  useEffect(() => { load(); }, [month]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await fetch("/api/ctm/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    setSaving(false); setShowForm(false); setForm(EMPTY); load();
  };

  const del = async (id) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/ctm/expenses?id=${id}`, { method: "DELETE" });
    load();
  };

  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const CAT_COLORS = { "ค่าเช่า":"#fee2e2","ค่าสาธารณูปโภค":"#fef9c3","ค่าวัตถุดิบ":"#dcfce7","ค่าขนส่ง":"#dbeafe","ค่าบรรจุภัณฑ์":"#ede9fe","ค่าโฆษณา":"#fce7f3","ค่าซ่อมบำรุง":"#ffedd5","ค่าใช้จ่ายทั่วไป":"#f1f5f9","อื่นๆ":"#f3f4f6" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>บันทึกรายจ่ายประจำวัน</h1>
        <button onClick={() => setShowForm(v => !v)} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {showForm ? "ซ่อนฟอร์ม" : "+ เพิ่มรายจ่าย"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }} />
        {data && <span style={{ fontWeight: 700, fontSize: 14, color: "#b91c1c" }}>รวม: ₩{fmt(data.total || 0)}</span>}
      </div>

      {/* Category summary chips */}
      {data?.byCategory && Object.keys(data.byCategory).length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {Object.entries(data.byCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ background: CAT_COLORS[cat] || "#f3f4f6", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#374151", fontWeight: 600 }}>
              {cat}: ₩{fmt(amt)}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>วันที่*</label><input required type="date" value={form.date} onChange={set("date")} style={inp} /></div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมวดหมู่*</label>
                <select required value={form.category} onChange={set("category")} style={inp}>
                  <option value="">-- เลือก --</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>รายละเอียด</label><input value={form.description} onChange={set("description")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ยอดเงิน (₩)*</label><input required type="number" min="0" value={form.amount} onChange={set("amount")} style={inp} /></div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>วิธีชำระ</label>
                <select value={form.paymentType} onChange={set("paymentType")} style={inp}>
                  <option value="CASH">เงินสด</option>
                  <option value="CARD">บัตร</option>
                  <option value="TRANSFER">โอน</option>
                </select>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมายเหตุ</label><input value={form.note} onChange={set("note")} style={inp} /></div>
            </div>
            <button type="submit" disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["วันที่","หมวดหมู่","รายละเอียด","ยอดเงิน","วิธีชำระ","หมายเหตุ","ลบ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!data?.expenses || data.expenses.length === 0) && <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการ</td></tr>}
            {data?.expenses?.map((e, i) => (
              <tr key={e.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                <td style={{ padding: "8px 12px", color: "#374151", whiteSpace: "nowrap" }}>{new Date(e.date).toLocaleDateString("th-TH",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                <td style={{ padding: "8px 12px" }}><span style={{ background: CAT_COLORS[e.category] || "#f3f4f6", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#374151" }}>{e.category}</span></td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>{e.description || "—"}</td>
                <td style={{ padding: "8px 12px", fontWeight: 700, color: "#b91c1c" }}>₩{fmt(e.amount)}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12 }}>{e.paymentType}</td>
                <td style={{ padding: "8px 12px", color: "#9ca3af", fontSize: 12 }}>{e.note || "—"}</td>
                <td style={{ padding: "8px 12px" }}><button onClick={() => del(e.id)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>ลบ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
