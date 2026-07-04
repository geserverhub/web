"use client";
import { useEffect, useState } from "react";

const nowMonth = new Date().toISOString().slice(0,7);
const EMPTY = { period: nowMonth, partnerName: "", sharePercent: "", netProfit: "", note: "" };

export default function CtmPartnerShares() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(nowMonth);
  const [allShares, setAllShares] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [autoProfit, setAutoProfit] = useState(null);

  const load = () => {
    fetch(`/api/ctm/partner-shares?period=${period}`).then(r => r.json()).then(setData);
    fetch("/api/ctm/partner-shares").then(r => r.json()).then(d => setAllShares(d.shares || []));
  };

  const loadSalesProfit = (m) => {
    fetch(`/api/ctm/sales?month=${m}`).then(r => r.json()).then(d => {
      if (d.profit !== undefined) { setAutoProfit(d.profit); setForm(f => ({ ...f, netProfit: String(d.profit) })); }
    });
  };

  useEffect(() => { load(); }, [period]);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (k === "period") loadSalesProfit(e.target.value);
  };

  const shareAmount = form.netProfit && form.sharePercent
    ? (Number(form.netProfit) * Number(form.sharePercent) / 100).toFixed(0)
    : "0";

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await fetch("/api/ctm/partner-shares", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setShowForm(false); setForm({ ...EMPTY, period }); load();
  };

  const del = async (id) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/ctm/partner-shares?id=${id}`, { method: "DELETE" });
    load();
  };

  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  // Get unique partners from all history
  const knownPartners = [...new Set(allShares.map(s => s.partnerName))];

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>บันทึกส่วนแบ่งหุ้นส่วนรายเดือน</h1>
        <button onClick={() => { setShowForm(v => !v); if (!showForm) loadSalesProfit(period); }} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {showForm ? "ซ่อนฟอร์ม" : "+ บันทึกส่วนแบ่ง"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }} />
        {data?.shares?.length > 0 && (
          <span style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>
            รวมจ่ายส่วนแบ่ง: <span style={{ color: "#b45309" }}>₩{fmt(data.shares.reduce((s, x) => s + Number(x.shareAmount), 0))}</span>
          </span>
        )}
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
          {autoProfit !== null && (
            <div style={{ background: "#dcfce7", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#166534" }}>
              กำไรสุทธิเดือนนี้จากระบบขาย: <strong>₩{fmt(autoProfit)}</strong>
              <button type="button" onClick={() => setForm(f => ({ ...f, netProfit: String(autoProfit) }))} style={{ marginLeft: 10, background: "#15803d", color: "#fff", border: "none", borderRadius: 6, padding: "2px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>ใช้ค่านี้</button>
            </div>
          )}
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>งวดเดือน*</label><input required type="month" value={form.period} onChange={set("period")} style={inp} /></div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ชื่อหุ้นส่วน*</label>
                <input required list="partner-names" value={form.partnerName} onChange={set("partnerName")} style={inp} placeholder="ชื่อหุ้นส่วน" />
                <datalist id="partner-names">{knownPartners.map(p => <option key={p} value={p} />)}</datalist>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>% หุ้น*</label><input required type="number" min="0" max="100" step="0.01" value={form.sharePercent} onChange={set("sharePercent")} style={inp} placeholder="เช่น 50" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>กำไรสุทธิ (₩)*</label><input required type="number" value={form.netProfit} onChange={set("netProfit")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมายเหตุ</label><input value={form.note} onChange={set("note")} style={inp} /></div>
            </div>
            {form.sharePercent && form.netProfit && (
              <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 14px", marginBottom: 10, fontSize: 13 }}>
                ส่วนแบ่งที่ได้รับ: <strong style={{ color: "#b45309", fontSize: 15 }}>₩{fmt(shareAmount)}</strong>
                <span style={{ color: "#9ca3af", marginLeft: 8 }}>({form.sharePercent}% × ₩{fmt(form.netProfit)})</span>
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
              {["งวด","ชื่อหุ้นส่วน","% หุ้น","กำไรสุทธิ","ส่วนแบ่งที่ได้","หมายเหตุ","ลบ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!data?.shares || data.shares.length === 0) && <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการ</td></tr>}
            {data?.shares?.map((s, i) => (
              <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: "#374151" }}>{s.period}</td>
                <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1f2937" }}>{s.partnerName}</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>{Number(s.sharePercent).toFixed(1)}%</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>₩{fmt(s.netProfit)}</td>
                <td style={{ padding: "8px 12px", fontWeight: 800, color: "#b45309", fontSize: 14 }}>₩{fmt(s.shareAmount)}</td>
                <td style={{ padding: "8px 12px", color: "#9ca3af", fontSize: 12 }}>{s.note || "—"}</td>
                <td style={{ padding: "8px 12px" }}><button onClick={() => del(s.id)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>ลบ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
