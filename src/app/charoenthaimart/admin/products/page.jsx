"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CtmProducts() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/ctm/products${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm("ลบสินค้านี้?")) return;
    await fetch(`/api/ctm/products/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>รายการสินค้า</h1>
        <Link href="/charoenthaimart/admin/products/add" style={{ background: "#b45309", color: "#fff", borderRadius: 8, padding: "8px 18px", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>+ เพิ่มสินค้า</Link>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} placeholder="ค้นหาสินค้า..." style={{ flex: 1, border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
        <button onClick={load} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>ค้นหา</button>
      </div>
      {loading ? <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div> : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fef3c7" }}>
                {["รูป","บาร์โค้ด","ชื่อสินค้า","หมวด","ราคาทุน","ราคาขาย","สต็อก","จัดการ"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่พบสินค้า</td></tr>
              )}
              {products.map((p, i) => (
                <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                  <td style={{ padding: "8px 12px" }}>
                    {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 18 }}>📦</div>}
                  </td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#6b7280" }}>{p.barcode || "—"}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1f2937" }}>
                    {p.name}
                    {p.nameKo && <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.nameKo}</div>}
                  </td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{p.category || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>₩{Number(p.buyPrice).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px", color: "#b45309", fontWeight: 700 }}>₩{Number(p.sellPrice).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ background: p.stock > 5 ? "#dcfce7" : p.stock > 0 ? "#fef9c3" : "#fee2e2", color: p.stock > 5 ? "#166534" : p.stock > 0 ? "#854d0e" : "#b91c1c", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}>{p.stock} {p.unit || ""}</span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href={`/charoenthaimart/admin/products/add?id=${p.id}`} style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, padding: "4px 10px", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>แก้ไข</Link>
                      <button onClick={() => del(p.id)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
