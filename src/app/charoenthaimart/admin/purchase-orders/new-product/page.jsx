"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CtmNewPurchaseProduct() {
  const params = useSearchParams();
  const supplierId = params.get("supplierId") || "";
  const [supplier, setSupplier] = useState(null);
  const [nextCode, setNextCode] = useState("");
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("ชิ้น");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/ctm/products/nextcode").then(r => r.json()).then(d => setNextCode(d.code || "")).catch(() => {});
    if (supplierId) {
      fetch("/api/ctm/suppliers").then(r => r.json()).then(d => setSupplier((d.suppliers || []).find(s => s.id === supplierId) || null));
    }
  }, [supplierId]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("กรุณากรอกชื่อสินค้า"); return; }
    if (!buyPrice) { setError("กรุณากรอกราคาทุน (ราคาที่ซื้อจากคู่ค้า)"); return; }
    if (!sellPrice) { setError("กรุณากรอกราคาขายเบื้องต้น"); return; }
    setSaving(true);
    const res = await fetch("/api/ctm/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, barcode: barcode || null, category: category || null,
        buyPrice: Number(buyPrice), sellPrice: Number(sellPrice),
        stock: 0, unit, supplierId: supplierId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "เกิดข้อผิดพลาด"); return; }
    const product = await res.json();
    setDone(true);
    if (window.opener) window.opener.postMessage({ type: "ctm-po-product-created", product }, "*");
  };

  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  if (done) {
    return (
      <div style={{ padding: "40px 32px", maxWidth: 480, fontFamily: "sans-serif" }}>
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 12, padding: "20px 24px", color: "#15803d" }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>บันทึกสินค้าสำเร็จ ✓</div>
          <div style={{ fontSize: 13 }}>ผูกกับคู่ค้า{supplier ? ` "${supplier.name}"` : ""}เรียบร้อยแล้ว และเพิ่มลงในรายการสั่งซื้อของแท็บใบสั่งซื้อให้อัตโนมัติ กลับไปที่แท็บนั้นได้เลย</div>
        </div>
        <button onClick={() => window.close()} style={{ marginTop: 16, background: "#374151", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>ปิดแท็บนี้</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 560, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 4px" }}>เพิ่มสินค้าใหม่ (เพื่อซื้อเข้าสต๊อก)</h1>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>สำหรับลงทะเบียนสินค้าที่จะสั่งซื้อจากคู่ค้า — ราคาขายตั้งค่าเบื้องต้นได้ที่นี่ และไปปรับละเอียด (รูป/คำอธิบาย) ได้ภายหลังที่หน้า &quot;สินค้า&quot;</div>

      {nextCode && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 16px", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>รหัสสินค้า</span>
          <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: "#b45309", letterSpacing: 1 }}>{nextCode}</span>
          <span style={{ fontSize: 11, color: "#a16207" }}>(สร้างอัตโนมัติ)</span>
        </div>
      )}
      {supplier && (
        <div style={{ fontSize: 13, color: "#374151", marginBottom: 16 }}>
          คู่ค้า: <strong>{supplier.supplierCode ? `${supplier.supplierCode} - ` : ""}{supplier.name}</strong>
        </div>
      )}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ชื่อสินค้า*</label><input required value={name} onChange={(e) => setName(e.target.value)} style={inp} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>บาร์โค้ด</label><input value={barcode} onChange={(e) => setBarcode(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หมวดหมู่</label><input value={category} onChange={(e) => setCategory(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หน่วย</label><input value={unit} onChange={(e) => setUnit(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ราคาทุน (จากคู่ค้านี้)*</label><input required type="number" min="0" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ราคาขายเบื้องต้น*</label><input required type="number" min="0" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{saving ? "กำลังบันทึก..." : "บันทึกสินค้า"}</button>
        </div>
      </form>
    </div>
  );
}
