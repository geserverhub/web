"use client";
import { useEffect, useState } from "react";

const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function CtmSupplierProducts() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ctm/suppliers").then(r => r.json()).then(d => setSuppliers(d.suppliers || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ onlyWithSupplier: "1" });
    if (supplierId) qs.set("supplierId", supplierId);
    if (search) qs.set("q", search);
    fetch(`/api/ctm/products?${qs}`).then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); });
  }, [supplierId, search]);

  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>สินค้าที่ซื้อจากคู่ค้า</h1>
        <a href="/charoenthaimart/admin/purchase-orders" style={{ fontSize: 13, color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}>→ ไปหน้าสั่งซื้อสินค้าเข้าสต๊อก</a>
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>รายการนี้แสดงเฉพาะสินค้าที่ผูกกับคู่ค้า (สำหรับสั่งซื้อ/เข้าสต๊อก) แยกจากหน้า &quot;สินค้า&quot; ที่ใช้จัดการสินค้าสำหรับขายหน้าร้าน</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, maxWidth: 640 }}>
        <div>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={inp}>
            <option value="">— ทุกคู่ค้า —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierCode ? `${s.supplierCode} - ` : ""}{s.name}</option>)}
          </select>
        </div>
        <div>
          <input placeholder="ค้นหาสินค้า (ชื่อ/บาร์โค้ด/หมวดหมู่)" value={search} onChange={(e) => setSearch(e.target.value)} style={inp} />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["รหัสสินค้า", "ชื่อสินค้า", "คู่ค้า", "หมวดหมู่", "ราคาทุน", "ราคาขาย", "คงเหลือ", "จัดการ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>กำลังโหลด...</td></tr>}
            {!loading && products.length === 0 && <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ยังไม่มีสินค้าที่ผูกกับคู่ค้า</td></tr>}
            {products.map((p, i) => (
              <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#b45309", fontSize: 12 }}>{p.productCode || "—"}</td>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1f2937" }}>{p.name}</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>{p.supplier?.name}{p.supplier?.supplierCode ? ` (${p.supplier.supplierCode})` : ""}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280" }}>{p.category || "—"}</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>₩{fmt(p.buyPrice)}</td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>₩{fmt(p.sellPrice)}</td>
                <td style={{ padding: "8px 12px", fontWeight: 700, color: p.stock <= 0 ? "#b91c1c" : "#374151" }}>{p.stock} {p.unit}</td>
                <td style={{ padding: "8px 12px" }}>
                  <a href={`/charoenthaimart/admin/products/add?id=${p.id}`} style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>แก้ไข</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
