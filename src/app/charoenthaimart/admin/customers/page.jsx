"use client";
import { useEffect, useState } from "react";

const EMPTY = { name: "", phone: "", email: "", address: "", nationality: "", note: "" };

export default function CtmCustomers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [editCode, setEditCode] = useState("");
  const [nextCode, setNextCode] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/ctm/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => {
    setForm(EMPTY); setEditId(null); setEditCode(""); setOpen(true);
    fetch("/api/ctm/customers/nextcode").then(r => r.json()).then(d => setNextCode(d.code || "")).catch(() => {});
  };
  const openEdit = (c) => {
    setForm({ name: c.name || "", phone: c.phone || "", email: c.email || "", address: c.address || "", nationality: c.nationality || "", note: c.note || "" });
    setEditId(c.id); setEditCode(c.customerCode || ""); setNextCode(""); setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: editId, ...form } : form;
    await fetch("/api/ctm/customers", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false); setOpen(false); load();
  };

  const del = async (id) => {
    if (!confirm("ลบลูกค้านี้?")) return;
    await fetch(`/api/ctm/customers?id=${id}`, { method: "DELETE" });
    load();
  };

  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const nationColors = { TH: "#fef3c7", KR: "#dbeafe", CN: "#fee2e2", VN: "#dcfce7" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>ข้อมูลลูกค้า</h1>
        <button onClick={openAdd} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ เพิ่มลูกค้า</button>
      </div>
      {/* Modal */}
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", width: 500, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", margin: 0 }}>{editId ? "แก้ไขลูกค้า" : "เพิ่มลูกค้าใหม่"}</h2>
              {(editCode || nextCode) && (
                <span style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "3px 12px", fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: "#b45309" }}>
                  {editCode || nextCode}
                  {!editId && <span style={{ fontSize: 10, color: "#a16207", marginLeft: 4 }}>(อัตโนมัติ)</span>}
                </span>
              )}
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ชื่อ*</label><input required value={form.name} onChange={set("name")} style={inp} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>เบอร์โทร</label><input value={form.phone} onChange={set("phone")} style={inp} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>อีเมล</label><input value={form.email} onChange={set("email")} style={inp} /></div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>สัญชาติ</label>
                  <select value={form.nationality} onChange={set("nationality")} style={inp}>
                    <option value="">—</option>
                    <option value="TH">ไทย (TH)</option>
                    <option value="KR">เกาหลี (KR)</option>
                    <option value="CN">จีน (CN)</option>
                    <option value="VN">เวียดนาม (VN)</option>
                    <option value="OTHER">อื่นๆ</option>
                  </select>
                </div>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ที่อยู่</label><input value={form.address} onChange={set("address")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมายเหตุ</label><textarea value={form.note} onChange={set("note")} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setOpen(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>ยกเลิก</button>
                <button type="submit" disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["รหัส","ชื่อ","เบอร์โทร","อีเมล","สัญชาติ","ที่อยู่","หมายเหตุ","จัดการ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ยังไม่มีลูกค้า</td></tr>}
            {customers.map((c, i) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#b45309", fontSize: 12 }}>{c.customerCode || "—"}</td>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1f2937" }}>{c.name}</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>{c.phone || "—"}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12 }}>{c.email || "—"}</td>
                <td style={{ padding: "8px 12px" }}>
                  {c.nationality ? <span style={{ background: nationColors[c.nationality] || "#f3f4f6", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#374151" }}>{c.nationality}</span> : "—"}
                </td>
                <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address || "—"}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12 }}>{c.note || "—"}</td>
                <td style={{ padding: "8px 12px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>แก้ไข</button>
                    <button onClick={() => del(c.id)} disabled={c._count?.sales > 0}
                      title={c._count?.sales > 0 ? "ลูกค้ารายนี้มีรายการสั่งซื้อแล้ว ไม่สามารถลบได้" : ""}
                      style={{ background: c._count?.sales > 0 ? "#f3f4f6" : "#fef2f2", color: c._count?.sales > 0 ? "#9ca3af" : "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: c._count?.sales > 0 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}>
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
