"use client";
import { useEffect, useMemo, useState } from "react";

const NO_CAT = "ไม่มีหมวดหมู่";

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CtmStockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("ALL");
  const [previewImg, setPreviewImg] = useState(null);
  const [addStockTarget, setAddStockTarget] = useState(null);
  const [addQty, setAddQty] = useState("");
  const [addNote, setAddNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/ctm/products").then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return products;
    const s = q.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(s) || p.nameKo?.toLowerCase().includes(s) || p.barcode?.includes(s) || p.productCode?.toLowerCase().includes(s));
  }, [products, q]);

  const grouped = useMemo(() => {
    const map = {};
    for (const p of filtered) {
      const cat = p.category || NO_CAT;
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    const cats = Object.keys(map).sort((a, b) => a === NO_CAT ? 1 : b === NO_CAT ? -1 : a.localeCompare(b, "th"));
    for (const c of cats) map[c].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return { cats, map };
  }, [filtered]);

  const allCats = useMemo(() => {
    const set = new Set(products.map(p => p.category || NO_CAT));
    return Array.from(set).sort((a, b) => a === NO_CAT ? 1 : b === NO_CAT ? -1 : a.localeCompare(b, "th"));
  }, [products]);

  const totalStock = filtered.reduce((s, p) => s + Number(p.stock || 0), 0);
  const visibleCats = activeCat === "ALL" ? grouped.cats : grouped.cats.filter(c => c === activeCat);

  const openAddStock = (p) => {
    setAddStockTarget(p);
    setAddQty("");
    setAddNote("");
  };

  const submitAddStock = async () => {
    const n = Number(addQty);
    if (!n) return;
    setSaving(true);
    try {
      await fetch(`/api/ctm/products/${addStockTarget.id}/stock`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: n, note: addNote || null }),
      });
      setAddStockTarget(null);
      load();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <style>{`.ctm-stock-thumb:hover .ctm-stock-view-btn { display: flex !important; }`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>สต๊อกสินค้า</h1>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>แสดงรายการตามหมวดหมู่ · เรียงตามวันที่อัปเดตล่าสุด</div>
        </div>
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "#92400e" }}>
          รวมสต็อกทั้งหมด: {totalStock.toLocaleString()} ชิ้น · {filtered.length} รายการ
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาสินค้า..." style={{ flex: 1, border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setActiveCat("ALL")} style={{
          padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
          background: activeCat === "ALL" ? "#b45309" : "#f3f4f6", color: activeCat === "ALL" ? "#fff" : "#6b7280",
        }}>ทั้งหมด ({products.length})</button>
        {allCats.map(c => (
          <button key={c} onClick={() => setActiveCat(c)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
            background: activeCat === c ? "#b45309" : "#f3f4f6", color: activeCat === c ? "#fff" : "#6b7280",
          }}>{c} ({products.filter(p => (p.category || NO_CAT) === c).length})</button>
        ))}
      </div>

      {loading ? <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div> : (
        visibleCats.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>ไม่พบสินค้า</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {visibleCats.map(cat => (
              <div key={cat} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#92400e" }}>🗂️ {cat}</div>
                  <div style={{ fontSize: 12, color: "#92400e" }}>
                    {grouped.map[cat].length} รายการ · รวม {grouped.map[cat].reduce((s, p) => s + Number(p.stock || 0), 0).toLocaleString()} ชิ้น
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fafaf7" }}>
                      {["รูป", "รหัส", "ชื่อสินค้า", "สต็อก", "ราคาขาย", "แก้ไขล่าสุด", "จัดการ"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#92400e", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map[cat].map((p, i) => (
                      <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                        <td style={{ padding: "8px 12px" }}>
                          {p.imageUrl ? (
                            <div style={{ position: "relative", width: 32, height: 32 }} className="ctm-stock-thumb">
                              <img src={p.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", cursor: "pointer" }} onClick={() => setPreviewImg(p.imageUrl)} />
                              <button onClick={() => setPreviewImg(p.imageUrl)} className="ctm-stock-view-btn"
                                style={{ position: "absolute", inset: 0, display: "none", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.5)", border: "none", borderRadius: 6, color: "#fff", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                                view
                              </button>
                            </div>
                          ) : <div style={{ width: 32, height: 32, borderRadius: 6, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 16 }}>📦</div>}
                        </td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#b45309", fontSize: 12 }}>{p.productCode || "—"}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1f2937" }}>
                          {p.name}
                          {p.nameKo && <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.nameKo}</div>}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ background: p.stock > 5 ? "#dcfce7" : p.stock > 0 ? "#fef9c3" : "#fee2e2", color: p.stock > 5 ? "#166534" : p.stock > 0 ? "#854d0e" : "#b91c1c", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}>{p.stock} {p.unit || ""}</span>
                        </td>
                        <td style={{ padding: "8px 12px", color: "#b45309", fontWeight: 700 }}>₩{Number(p.sellPrice).toLocaleString()}</td>
                        <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>
                          <div>{fmtDateTime(p.updatedAt)}</div>
                          {p.stockLogs?.[0] && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: p.stockLogs[0].delta > 0 ? "#166534" : "#b91c1c", marginTop: 2 }}>
                              {p.stockLogs[0].delta > 0 ? "+" : ""}{p.stockLogs[0].delta} {p.unit || "ชิ้น"}
                              {p.stockLogs[0].note && <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {p.stockLogs[0].note}</span>}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <button onClick={() => openAddStock(p)} style={{ background: "#dcfce7", color: "#166534", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ เพิ่มสต๊อก</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      )}

      {previewImg && (
        <div onClick={() => setPreviewImg(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "zoom-out" }}>
          <img src={previewImg} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 10, boxShadow: "0 10px 40px rgba(0,0,0,.4)" }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setPreviewImg(null)}
            style={{ position: "absolute", top: 24, right: 32, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", fontSize: 20, width: 36, height: 36, cursor: "pointer" }}>
            ×
          </button>
        </div>
      )}

      {addStockTarget && (
        <div onClick={() => setAddStockTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", width: "min(320px, 92vw)" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#92400e", marginBottom: 4 }}>+ เพิ่มสต๊อก</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>{addStockTarget.name} · ปัจจุบัน {addStockTarget.stock} {addStockTarget.unit || "ชิ้น"}</div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>จำนวนที่เพิ่มเข้า</label>
            <input type="number" autoFocus value={addQty} onChange={e => setAddQty(e.target.value)} placeholder="เช่น 10"
              style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>หมายเหตุ (ถ้ามี)</label>
            <input value={addNote} onChange={e => setAddNote(e.target.value)} placeholder="เช่น รับสินค้าจากซัพพลายเออร์"
              style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={submitAddStock} disabled={saving || !Number(addQty)}
                style={{ flex: 1, background: (saving || !Number(addQty)) ? "#e5e7eb" : "#166534", color: (saving || !Number(addQty)) ? "#9ca3af" : "#fff", border: "none", borderRadius: 8, padding: "9px", fontWeight: 700, fontSize: 13, cursor: (saving || !Number(addQty)) ? "default" : "pointer" }}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button onClick={() => setAddStockTarget(null)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
