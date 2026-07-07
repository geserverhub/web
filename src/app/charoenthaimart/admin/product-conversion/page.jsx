"use client";
import { useEffect, useState } from "react";

const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function CtmProductConversion() {
  const [products, setProducts] = useState([]);
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [consumeQty, setConsumeQty] = useState("");

  const [targetMode, setTargetMode] = useState("NEW"); // NEW | EXISTING
  const [targetSearch, setTargetSearch] = useState("");
  const [targetId, setTargetId] = useState("");
  const [newName, setNewName] = useState("");
  const [newSellPrice, setNewSellPrice] = useState("");
  const [newUnit, setNewUnit] = useState("ชิ้น");
  const [addQty, setAddQty] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/ctm/products?q=").then(r => r.json()).then(d => setProducts(d.products || []));
  useEffect(() => { load(); }, []);

  const source = products.find(p => p.id === sourceId);
  const target = products.find(p => p.id === targetId);

  const sourceOptions = products.filter(p =>
    !sourceSearch || p.name.toLowerCase().includes(sourceSearch.toLowerCase()) || (p.barcode || "").includes(sourceSearch)
  ).slice(0, 30);
  const targetOptions = products.filter(p =>
    p.id !== sourceId && (!targetSearch || p.name.toLowerCase().includes(targetSearch.toLowerCase()) || (p.barcode || "").includes(targetSearch))
  ).slice(0, 30);

  const estUnitCost = source && addQty && Number(addQty) > 0 && consumeQty
    ? Math.round((Number(source.buyPrice) * Number(consumeQty) / Number(addQty)) * 100) / 100
    : null;

  const reset = () => {
    setSourceId(""); setSourceSearch(""); setConsumeQty("");
    setTargetMode("NEW"); setTargetId(""); setTargetSearch("");
    setNewName(""); setNewSellPrice(""); setNewUnit("ชิ้น"); setAddQty("");
  };

  const submit = async () => {
    setError(""); setMsg("");
    if (!sourceId) { setError("กรุณาเลือกสินค้าต้นทาง"); return; }
    if (!consumeQty || Number(consumeQty) <= 0) { setError("กรุณาระบุจำนวนที่ใช้แปลง"); return; }
    if (!addQty || Number(addQty) <= 0) { setError("กรุณาระบุจำนวนที่เพิ่มเข้าสต๊อก"); return; }
    if (targetMode === "EXISTING" && !targetId) { setError("กรุณาเลือกสินค้าปลายทาง"); return; }
    if (targetMode === "NEW" && (!newName.trim() || !newSellPrice || !newUnit.trim())) { setError("กรุณากรอกข้อมูลสินค้าใหม่ให้ครบ"); return; }

    setSaving(true);
    const res = await fetch("/api/ctm/product-conversion", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceProductId: sourceId, consumeQty: Number(consumeQty),
        targetMode, targetProductId: targetId || null,
        newName, newSellPrice: Number(newSellPrice) || null, newUnit, addQty: Number(addQty),
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "เกิดข้อผิดพลาด"); return; }
    setMsg("แปลงสินค้าเข้าสต๊อกสำเร็จ");
    reset();
    load();
  };

  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const card = { background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", padding: 20 };

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 4px" }}>แปลงสินค้าเข้าสต๊อก</h1>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>เลือกสินค้าต้นทางในสต๊อกเพื่อแปลงเป็นสินค้าใหม่ หรือเพิ่มจำนวนเข้าสินค้าที่มีอยู่แล้ว (เช่น แบ่งบรรจุจากถุงใหญ่เป็นถุงเล็ก)</div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", marginBottom: 16, fontSize: 13, maxWidth: 900 }}>{error}</div>}
      {msg && <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", color: "#15803d", marginBottom: 16, fontSize: 13, maxWidth: 900 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 900 }}>
        {/* Source */}
        <div style={card}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 12px" }}>1. สินค้าต้นทาง (ที่จะถูกใช้แปลง)</h2>
          <input placeholder="ค้นหาสินค้า (ชื่อ/บาร์โค้ด)" value={sourceSearch} onChange={(e) => { setSourceSearch(e.target.value); setSourceId(""); }} style={{ ...inp, marginBottom: 8 }} />
          {sourceSearch && !sourceId && (
            <div style={{ border: "1px solid #e7e3d8", borderRadius: 8, maxHeight: 160, overflowY: "auto", marginBottom: 8 }}>
              {sourceOptions.length === 0 && <div style={{ padding: 10, color: "#9ca3af", fontSize: 12 }}>ไม่พบสินค้า</div>}
              {sourceOptions.map(p => (
                <div key={p.id} onClick={() => { setSourceId(p.id); setSourceSearch(p.name); }} style={{ padding: "7px 10px", cursor: "pointer", borderTop: "1px solid #f3f4f6", fontSize: 13 }}>
                  {p.name} <span style={{ color: "#9ca3af", fontSize: 11 }}>คงเหลือ {p.stock} {p.unit}</span>
                </div>
              ))}
            </div>
          )}
          {source && (
            <div style={{ background: "#fef3c7", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#92400e" }}>
              <strong>{source.name}</strong> — คงเหลือ {source.stock} {source.unit} · ทุน ₩{fmt(source.buyPrice)}/{source.unit}
            </div>
          )}
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>จำนวนที่ใช้แปลง*</label>
          <input type="number" min="0" max={source?.stock} value={consumeQty} onChange={(e) => setConsumeQty(e.target.value)} style={inp} />
        </div>

        {/* Target */}
        <div style={card}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 12px" }}>2. ปลายทาง</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => setTargetMode("NEW")} style={{ flex: 1, background: targetMode === "NEW" ? "#b45309" : "#f3f4f6", color: targetMode === "NEW" ? "#fff" : "#374151", border: "none", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>สร้างสินค้าใหม่</button>
            <button type="button" onClick={() => setTargetMode("EXISTING")} style={{ flex: 1, background: targetMode === "EXISTING" ? "#b45309" : "#f3f4f6", color: targetMode === "EXISTING" ? "#fff" : "#374151", border: "none", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>เพิ่มเข้าสินค้าที่มีอยู่</button>
          </div>

          {targetMode === "NEW" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ชื่อสินค้าใหม่*</label><input value={newName} onChange={(e) => setNewName(e.target.value)} style={inp} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ราคาขายใหม่*</label><input type="number" min="0" value={newSellPrice} onChange={(e) => setNewSellPrice(e.target.value)} style={inp} /></div>
                <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>หน่วยนับใหม่*</label><input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} style={inp} /></div>
              </div>
            </div>
          ) : (
            <>
              <input placeholder="ค้นหาสินค้าปลายทาง (ชื่อ/บาร์โค้ด)" value={targetSearch} onChange={(e) => { setTargetSearch(e.target.value); setTargetId(""); }} style={{ ...inp, marginBottom: 8 }} />
              {targetSearch && !targetId && (
                <div style={{ border: "1px solid #e7e3d8", borderRadius: 8, maxHeight: 160, overflowY: "auto", marginBottom: 8 }}>
                  {targetOptions.length === 0 && <div style={{ padding: 10, color: "#9ca3af", fontSize: 12 }}>ไม่พบสินค้า</div>}
                  {targetOptions.map(p => (
                    <div key={p.id} onClick={() => { setTargetId(p.id); setTargetSearch(p.name); }} style={{ padding: "7px 10px", cursor: "pointer", borderTop: "1px solid #f3f4f6", fontSize: 13 }}>
                      {p.name} <span style={{ color: "#9ca3af", fontSize: 11 }}>คงเหลือ {p.stock} {p.unit}</span>
                    </div>
                  ))}
                </div>
              )}
              {target && (
                <div style={{ background: "#fef3c7", borderRadius: 8, padding: "10px 12px", marginBottom: 8, fontSize: 12, color: "#92400e" }}>
                  <strong>{target.name}</strong> — คงเหลือ {target.stock} {target.unit}
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>จำนวนเพิ่มเข้าสต๊อก*</label>
            <input type="number" min="0" value={addQty} onChange={(e) => setAddQty(e.target.value)} style={inp} />
          </div>

          {targetMode === "NEW" && estUnitCost !== null && (
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>ราคาทุนโดยประมาณต่อหน่วยใหม่: ₩{fmt(estUnitCost)}</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, maxWidth: 900 }}>
        <button onClick={submit} disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {saving ? "กำลังบันทึก..." : "แปลงสินค้า"}
        </button>
      </div>
    </div>
  );
}
