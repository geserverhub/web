"use client";
import { useEffect, useRef, useState } from "react";

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = () => new Date().toISOString().slice(0, 7);

const EMPTY = { date: todayStr(), amount: "", note: "" };

export default function CtmCardSettlements() {
  const [mode, setMode] = useState("day"); // day | month
  const [date, setDate] = useState(todayStr());
  const [month, setMonth] = useState(monthStr());
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewImage, setViewImage] = useState(null);
  const fileRef = useRef(null);

  const load = () => {
    const qs = mode === "day" ? `date=${date}` : `month=${month}`;
    fetch(`/api/ctm/card-settlements?${qs}`).then(r => r.json()).then(setData);
  };
  useEffect(() => { load(); }, [mode, date, month]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ctm/upload", { method: "POST", body: fd });
    if (res.ok) { const d = await res.json(); setImageUrl(d.url || ""); }
    setUploading(false);
  };

  const clearImage = () => { setImageUrl(""); setPreview(""); if (fileRef.current) fileRef.current.value = ""; };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await fetch("/api/ctm/card-settlements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount), imageUrl: imageUrl || null }),
    });
    setSaving(false); setShowForm(false); setForm(EMPTY); clearImage(); load();
  };

  const del = async (id) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/ctm/card-settlements?id=${id}`, { method: "DELETE" });
    load();
  };

  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>บันทึกสรุปบิลเครื่องรูดบัตร</h1>
        <button onClick={() => { setShowForm(v => !v); setForm({ ...EMPTY, date: mode === "day" ? date : todayStr() }); clearImage(); }} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {showForm ? "ซ่อนฟอร์ม" : "+ เพิ่มบันทึก"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setMode("day")} style={{ background: mode === "day" ? "#b45309" : "#f3f4f6", color: mode === "day" ? "#fff" : "#374151", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>รายวัน</button>
          <button onClick={() => setMode("month")} style={{ background: mode === "month" ? "#b45309" : "#f3f4f6", color: mode === "month" ? "#fff" : "#374151", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>รายเดือน</button>
        </div>
        {mode === "day"
          ? <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }} />
          : <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }} />}
        {data && <span style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>รวม: ₩{fmt(data.total || 0)}</span>}
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 10, marginBottom: 14 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>วันที่*</label><input required type="date" value={form.date} onChange={set("date")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ยอดเงินตามบิล (₩)*</label><input required type="number" min="0" value={form.amount} onChange={set("amount")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมายเหตุ</label><input value={form.note} onChange={set("note")} style={inp} /></div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>📷 อัพโหลดรูปบิลรูดบัตร</label>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fef3c7", border: "1.5px dashed #d97706", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                  📷 เลือกไฟล์
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
                </label>
                {uploading && <span style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>กำลังอัพโหลด...</span>}
                {preview && !uploading && (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img src={preview} alt="" style={{ height: 80, width: "auto", borderRadius: 8, border: "1px solid #e7e3d8", objectFit: "cover" }} />
                    <button type="button" onClick={clearImage} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>
                  </div>
                )}
                {imageUrl && !uploading && <span style={{ fontSize: 11, color: "#15803d", alignSelf: "center" }}>✓ อัพโหลดสำเร็จ</span>}
              </div>
            </div>

            <button type="submit" disabled={saving || uploading} style={{ background: saving || uploading ? "#e7e3d8" : "#b45309", color: saving || uploading ? "#9ca3af" : "#fff", border: "none", borderRadius: 8, padding: "8px 22px", fontWeight: 700, fontSize: 13, cursor: saving || uploading ? "default" : "pointer" }}>
              {saving ? "กำลังบันทึก..." : uploading ? "รอการอัพโหลด..." : "บันทึก"}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["วันที่", "ยอดเงิน", "หมายเหตุ", "รูปบิล", "ลบ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!data?.settlements || data.settlements.length === 0) && <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการ</td></tr>}
            {data?.settlements?.map((r, i) => (
              <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                <td style={{ padding: "8px 12px", color: "#374151", whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}</td>
                <td style={{ padding: "8px 12px", fontWeight: 700, color: "#15803d" }}>₩{fmt(r.amount)}</td>
                <td style={{ padding: "8px 12px", color: "#9ca3af", fontSize: 12 }}>{r.note || "—"}</td>
                <td style={{ padding: "8px 12px" }}>
                  {r.imageUrl
                    ? <img src={r.imageUrl} alt="บิล" onClick={() => setViewImage(r.imageUrl)} style={{ height: 36, width: 36, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #e7e3d8" }} title="คลิกเพื่อดูขยาย" />
                    : <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <button onClick={() => del(r.id)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewImage && (
        <div onClick={() => setViewImage(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={viewImage} alt="บิล" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 12px 48px rgba(0,0,0,.6)" }} />
          <button onClick={() => setViewImage(null)} style={{ position: "fixed", top: 20, right: 20, background: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      )}
    </div>
  );
}
