"use client";
import { useEffect, useState } from "react";

const now = new Date();
const EMPTY = { period: now.toISOString().slice(0,7), employeeName: "", baseSalary: "", overtimeHours: "0", overtimePay: "0", bonus: "0", note: "" };

export default function CtmWages() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(now.toISOString().slice(0,7));
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => fetch(`/api/ctm/wages?period=${period}`).then(r => r.json()).then(setData);
  useEffect(() => { load(); }, [period]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const totalPay = (Number(form.baseSalary) + Number(form.overtimePay) + Number(form.bonus)).toLocaleString("ko-KR");

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await fetch("/api/ctm/wages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setShowForm(false); setForm({ ...EMPTY, period }); load();
  };

  const del = async (id) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/ctm/wages?id=${id}`, { method: "DELETE" });
    load();
  };

  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>บันทึกค่าแรงพนักงาน</h1>
        <button onClick={() => setShowForm(v => !v)} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {showForm ? "ซ่อนฟอร์ม" : "+ บันทึกค่าแรง"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }} />
        {data && <span style={{ fontWeight: 700, fontSize: 14, color: "#b45309" }}>รวมค่าแรงทั้งหมด: ₩{fmt(data.total || 0)}</span>}
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>งวดเดือน*</label><input required type="month" value={form.period} onChange={set("period")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ชื่อพนักงาน*</label><input required value={form.employeeName} onChange={set("employeeName")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>เงินเดือนพื้นฐาน (₩)*</label><input required type="number" min="0" value={form.baseSalary} onChange={set("baseSalary")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ชั่วโมง OT</label><input type="number" min="0" step="0.5" value={form.overtimeHours} onChange={set("overtimeHours")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ค่า OT (₩)</label><input type="number" min="0" value={form.overtimePay} onChange={set("overtimePay")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>โบนัส (₩)</label><input type="number" min="0" value={form.bonus} onChange={set("bonus")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมายเหตุ</label><input value={form.note} onChange={set("note")} style={inp} /></div>
            </div>
            {form.baseSalary && (
              <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 14px", marginBottom: 10, fontSize: 13 }}>
                รวมจ่าย: <strong style={{ color: "#b45309", fontSize: 15 }}>₩{totalPay}</strong>
              </div>
            )}
            <button type="submit" disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["งวด","ชื่อพนักงาน","เงินเดือน","OT (ชม.)","ค่า OT","โบนัส","รวม","ลบ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!data?.wages || data.wages.length === 0) && <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการ</td></tr>}
            {data?.wages?.map((w, i) => (
              <tr key={w.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: "#374151" }}>{w.period}</td>
                <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1f2937" }}>{w.employeeName}</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>₩{fmt(w.baseSalary)}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280" }}>{Number(w.overtimeHours)}</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>₩{fmt(w.overtimePay)}</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>₩{fmt(w.bonus)}</td>
                <td style={{ padding: "8px 12px", fontWeight: 800, color: "#b45309", fontSize: 14 }}>₩{fmt(w.totalPay)}</td>
                <td style={{ padding: "8px 12px" }}><button onClick={() => del(w.id)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>ลบ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
