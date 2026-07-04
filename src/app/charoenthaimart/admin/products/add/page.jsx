"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const EMPTY = { name: "", nameKo: "", barcode: "", category: "", buyPrice: "", sellPrice: "", stock: "0", unit: "ชิ้น", imageUrl: "", description: "" };

export default function CtmProductAdd() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const fileRef = useRef();

  const [nextCode, setNextCode] = useState("");

  useEffect(() => {
    fetch("/api/ctm/categories").then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
    if (editId) {
      fetch(`/api/ctm/products?q=`)
        .then(r => r.json())
        .then(d => {
          const p = d.products?.find(x => x.id === editId);
          if (p) {
            setForm({ name: p.name || "", nameKo: p.nameKo || "", barcode: p.barcode || "", category: p.category || "", buyPrice: p.buyPrice || "", sellPrice: p.sellPrice || "", stock: p.stock ?? "0", unit: p.unit || "ชิ้น", imageUrl: p.imageUrl || "", description: p.description || "" });
            setNextCode(p.productCode || "");
          }
        });
    } else {
      fetch("/api/ctm/products/nextcode").then(r => r.json()).then(d => setNextCode(d.code || "")).catch(() => {});
    }
  }, [editId]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/ctm/upload", { method: "POST", body: fd });
    const data = await res.json();
    setForm(f => ({ ...f, imageUrl: data.url || "" }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const body = { ...form, buyPrice: Number(form.buyPrice), sellPrice: Number(form.sellPrice), stock: Number(form.stock) };
    const res = editId
      ? await fetch(`/api/ctm/products/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/ctm/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const d = await res.json(); setError(d.error || "เกิดข้อผิดพลาด"); setSaving(false); return; }
    router.push("/charoenthaimart/admin/products");
  };

  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 24px" }}>{editId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h1>
      {nextCode && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 16px", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>รหัสสินค้า</span>
          <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: "#b45309", letterSpacing: 1 }}>{nextCode}</span>
          {!editId && <span style={{ fontSize: 11, color: "#a16207" }}>(สร้างอัตโนมัติ)</span>}
        </div>
      )}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", marginBottom: 16, fontSize: 13 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Image */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>รูปสินค้า</label>
          {form.imageUrl && <img src={form.imageUrl} alt="" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 10, marginBottom: 8, border: "1px solid #e7e3d8" }} />}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          <button type="button" onClick={() => fileRef.current.click()} disabled={uploading} style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#374151" }}>
            {uploading ? "กำลังอัพโหลด..." : "เลือกรูปภาพ"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ชื่อสินค้า (ไทย)*</label><input required value={form.name} onChange={set("name")} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ชื่อสินค้า (เกาหลี)</label><input value={form.nameKo} onChange={set("nameKo")} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>บาร์โค้ด</label><input value={form.barcode} onChange={set("barcode")} style={inp} /></div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หมวดหมู่</label>
            <input list="ctm-categories" value={form.category} onChange={set("category")} style={inp} placeholder="พิมพ์หรือเลือกหมวดหมู่" />
            <datalist id="ctm-categories">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
            {categories.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {categories.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                    style={{ background: form.category === c ? "#fef3c7" : "#f3f4f6", border: `1px solid ${form.category === c ? "#b45309" : "#e5e7eb"}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, color: form.category === c ? "#b45309" : "#374151", cursor: "pointer", fontWeight: form.category === c ? 700 : 400 }}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ราคาทุน (₩)*</label><input required type="number" min="0" value={form.buyPrice} onChange={set("buyPrice")} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ราคาขาย (₩)*</label><input required type="number" min="0" value={form.sellPrice} onChange={set("sellPrice")} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>สต็อก</label><input type="number" min="0" value={form.stock} onChange={set("stock")} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หน่วย</label><input value={form.unit} onChange={set("unit")} style={inp} /></div>
        </div>
        <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>คำอธิบาย</label><textarea value={form.description} onChange={set("description")} rows={3} style={{ ...inp, resize: "vertical" }} /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
          <button type="button" onClick={() => router.back()} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
        </div>
      </form>
    </div>
  );
}
