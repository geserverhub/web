"use client";
import { useEffect, useState } from "react";

const EMPTY_FORM = { promoPrice: "", label: "", note: "", endDate: "" };

export default function CtmPromotions() {
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [q, setQ] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null); // product to add promo for
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("active"); // "active" | "add"
  const [nextCode, setNextCode] = useState("");

  const loadAll = () => {
    fetch("/api/ctm/products").then(r => r.json()).then(d => {
      setProducts(d.products || []);
      setFiltered(d.products || []);
    });
    fetch("/api/ctm/promotions").then(r => r.json()).then(d => setPromotions(d.promotions || []));
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const lower = q.toLowerCase();
    setFiltered(products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      (p.nameKo || "").toLowerCase().includes(lower) ||
      (p.category || "").toLowerCase().includes(lower) ||
      (p.barcode || "").includes(q)
    ));
  }, [q, products]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSelect = (product) => {
    setSelected(product);
    setForm({ ...EMPTY_FORM, promoPrice: String(product.sellPrice) });
    if (tab !== "add") {
      fetch("/api/ctm/promotions/nextcode").then(r => r.json()).then(d => setNextCode(d.code || "")).catch(() => {});
    }
    setTab("add");
  };

  const handleTabAdd = () => {
    fetch("/api/ctm/promotions/nextcode").then(r => r.json()).then(d => setNextCode(d.code || "")).catch(() => {});
    setTab("add");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/ctm/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selected.id, promoPrice: Number(form.promoPrice), label: form.label, note: form.note, endDate: form.endDate || null }),
    });
    setSaving(false);
    setSelected(null);
    setForm(EMPTY_FORM);
    setTab("active");
    loadAll();
  };

  const toggleActive = async (promo) => {
    await fetch("/api/ctm/promotions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promo.id, isActive: !promo.isActive }),
    });
    loadAll();
  };

  const deletePromo = async (id) => {
    if (!confirm("ลบโปรโมชั่นนี้?")) return;
    await fetch(`/api/ctm/promotions?id=${id}`, { method: "DELETE" });
    loadAll();
  };

  const activePromos = promotions.filter(p => p.isActive);
  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>สินค้าจัดโปรวันนี้ 🏷️</h1>
        <span style={{ background: "#fef3c7", color: "#b45309", borderRadius: 8, padding: "4px 12px", fontWeight: 700, fontSize: 13 }}>
          โปรแอคทีฟ {activePromos.length} รายการ
        </span>
      </div>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 20px" }}>เลือกสินค้าจากรายการแล้วตั้งราคาโปรโมชั่น</p>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e7e3d8" }}>
        {[["active","โปรแอคทีฟ"],["all","โปรทั้งหมด"],["add","+ เพิ่มโปรใหม่"]].map(([key, label]) => (
          <button key={key} onClick={() => key === "add" ? handleTabAdd() : setTab(key)} style={{ padding: "8px 20px", border: "none", borderBottom: tab === key ? "2px solid #b45309" : "2px solid transparent", background: "none", fontWeight: tab === key ? 700 : 400, color: tab === key ? "#b45309" : "#6b7280", cursor: "pointer", fontSize: 13, marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Active promotions tab */}
      {tab === "active" && (
        <div>
          {activePromos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏷️</div>
              <div>ยังไม่มีโปรโมชั่นที่เปิดอยู่</div>
              <button onClick={() => setTab("add")} style={{ marginTop: 12, background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+ เพิ่มโปรใหม่</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
              {activePromos.map(promo => (
                <PromoCard key={promo.id} promo={promo} onToggle={toggleActive} onDelete={deletePromo} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All promotions tab */}
      {tab === "all" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fef3c7" }}>
                {["รหัส","สินค้า","ราคาปกติ","ราคาโปร","ป้าย","หมดอายุ","สถานะ","จัดการ"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>ยังไม่มีโปรโมชั่น</td></tr>}
              {promotions.map((promo, i) => (
                <tr key={promo.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#b45309", fontSize: 12 }}>{promo.promoCode || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {promo.product?.imageUrl ? <img src={promo.product.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 32, height: 32, background: "#f3f4f6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>📦</div>}
                      <div>
                        <div style={{ fontWeight: 600, color: "#1f2937" }}>{promo.product?.name}</div>
                        {promo.product?.category && <div style={{ fontSize: 11, color: "#9ca3af" }}>{promo.product.category}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "8px 12px", color: "#6b7280", textDecoration: "line-through" }}>₩{Number(promo.product?.sellPrice).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 800, color: "#dc2626", fontSize: 15 }}>₩{Number(promo.promoPrice).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px" }}>{promo.label ? <span style={{ background: "#fef3c7", color: "#b45309", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{promo.label}</span> : "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12 }}>{promo.endDate ? new Date(promo.endDate).toLocaleDateString("th-TH") : "ไม่กำหนด"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ background: promo.isActive ? "#dcfce7" : "#f3f4f6", color: promo.isActive ? "#166534" : "#6b7280", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{promo.isActive ? "เปิด" : "ปิด"}</span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => toggleActive(promo)} style={{ background: promo.isActive ? "#fef9c3" : "#dcfce7", color: promo.isActive ? "#854d0e" : "#166534", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{promo.isActive ? "ปิด" : "เปิด"}</button>
                      <button onClick={() => deletePromo(promo.id)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add new promo tab */}
      {tab === "add" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          {/* Product picker */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาสินค้าที่ต้องการจัดโปร..." style={{ ...inp, fontSize: 14 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10, maxHeight: 500, overflowY: "auto" }}>
              {filtered.map(p => (
                <button key={p.id} type="button" onClick={() => handleSelect(p)}
                  style={{ background: selected?.id === p.id ? "#fef3c7" : "#fff", border: `2px solid ${selected?.id === p.id ? "#b45309" : "#e7e3d8"}`, borderRadius: 10, padding: "10px", cursor: "pointer", textAlign: "left", transition: "all .1s" }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 6 }} />
                    : <div style={{ width: "100%", height: 80, background: "#f3f4f6", borderRadius: 6, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
                  }
                  <div style={{ fontWeight: 600, fontSize: 12, color: "#1f2937", marginBottom: 2 }}>{p.name}</div>
                  {p.category && <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>{p.category}</div>}
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#374151" }}>₩{Number(p.sellPrice).toLocaleString()}</div>
                  {selected?.id === p.id && <div style={{ fontSize: 10, color: "#b45309", fontWeight: 700, marginTop: 4 }}>✓ เลือกแล้ว</div>}
                </button>
              ))}
              {filtered.length === 0 && <div style={{ gridColumn: "1/-1", color: "#9ca3af", fontSize: 13, padding: 24, textAlign: "center" }}>ไม่พบสินค้า</div>}
            </div>
          </div>

          {/* Promo form */}
          <div style={{ background: "#fff", border: "1.5px solid #e7e3d8", borderRadius: 14, padding: "20px 22px", position: "sticky", top: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: 0 }}>ตั้งค่าโปรโมชั่น</h2>
              {nextCode && (
                <span style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "3px 12px", fontFamily: "monospace", fontWeight: 800, fontSize: 13, color: "#b45309" }}>
                  {nextCode}<span style={{ fontSize: 9, color: "#a16207", marginLeft: 4 }}>(อัตโนมัติ)</span>
                </span>
              )}
            </div>
            {!selected ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👈</div>
                <div style={{ fontSize: 13 }}>เลือกสินค้าจากรายการ</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Selected product preview */}
                <div style={{ background: "#fef3c7", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                  {selected.imageUrl ? <img src={selected.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 44, height: 44, background: "#fde68a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>{selected.name}</div>
                    {selected.nameKo && <div style={{ fontSize: 11, color: "#a16207" }}>{selected.nameKo}</div>}
                    <div style={{ fontSize: 12, color: "#b45309" }}>ราคาปกติ ₩{Number(selected.sellPrice).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ราคาโปร (₩)*</label>
                  <input required type="number" min="0" value={form.promoPrice} onChange={set("promoPrice")} style={inp} />
                  {form.promoPrice && selected?.sellPrice && Number(form.promoPrice) < Number(selected.sellPrice) && (
                    <div style={{ fontSize: 11, color: "#15803d", marginTop: 4 }}>
                      ลด ₩{(Number(selected.sellPrice) - Number(form.promoPrice)).toLocaleString()} ({((1 - Number(form.promoPrice)/Number(selected.sellPrice))*100).toFixed(0)}%)
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ป้ายโปร</label>
                  <input value={form.label} onChange={set("label")} style={inp} placeholder="เช่น ลด 20%, โปรวันนี้, ราคาพิเศษ" />
                  <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                    {["โปรวันนี้","ลดพิเศษ","สินค้าแนะนำ","ราคาเริ่มต้น","สินค้าใหม่"].map(l => (
                      <button key={l} type="button" onClick={() => setForm(f => ({ ...f, label: l }))}
                        style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 20, padding: "2px 8px", fontSize: 10, cursor: "pointer", color: "#374151" }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หมดอายุ</label>
                  <input type="date" value={form.endDate} onChange={set("endDate")} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หมายเหตุ</label>
                  <input value={form.note} onChange={set("note")} style={inp} placeholder="รายละเอียดเพิ่มเติม" />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={saving} style={{ flex: 1, background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    {saving ? "กำลังบันทึก..." : "บันทึกโปรโมชั่น"}
                  </button>
                  <button type="button" onClick={() => { setSelected(null); setForm(EMPTY_FORM); }} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>ล้าง</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PromoCard({ promo, onToggle, onDelete }) {
  const discount = promo.product?.sellPrice
    ? Math.round((1 - Number(promo.promoPrice) / Number(promo.product.sellPrice)) * 100)
    : 0;
  return (
    <div style={{ background: "#fff", border: "2px solid #fde68a", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      {promo.product?.imageUrl
        ? <img src={promo.product.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />
        : <div style={{ width: "100%", height: 80, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📦</div>
      }
      <div style={{ padding: "12px 14px" }}>
        {promo.label && <span style={{ background: "#b45309", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{promo.label}</span>}
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1f2937", margin: "6px 0 2px" }}>{promo.product?.name}</div>
        {promo.product?.category && <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{promo.product.category}</div>}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>₩{Number(promo.promoPrice).toLocaleString()}</span>
          <span style={{ fontSize: 12, color: "#9ca3af", textDecoration: "line-through" }}>₩{Number(promo.product?.sellPrice).toLocaleString()}</span>
          {discount > 0 && <span style={{ background: "#fee2e2", color: "#b91c1c", borderRadius: 6, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>-{discount}%</span>}
        </div>
        {promo.endDate && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>หมดอายุ {new Date(promo.endDate).toLocaleDateString("th-TH")}</div>}
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <button onClick={() => onToggle(promo)} style={{ flex: 1, background: "#fef9c3", color: "#854d0e", border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>ปิดโปร</button>
          <button onClick={() => onDelete(promo.id)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>ลบ</button>
        </div>
      </div>
    </div>
  );
}
