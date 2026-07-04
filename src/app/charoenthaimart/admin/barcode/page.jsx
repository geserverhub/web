"use client";
import { useEffect, useRef, useState } from "react";

export default function CtmBarcode() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const printRef = useRef();

  useEffect(() => { load(); }, []);

  const load = () => {
    fetch(`/api/ctm/products${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(r => r.json()).then(d => setProducts(d.products || []));
  };

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSelected(products.map(p => p.id));
  const clearAll = () => setSelected([]);

  const printItems = products.filter(p => selected.includes(p.id));

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>บาร์โค้ดสินค้า</title>
    <style>
      body { font-family: sans-serif; margin: 0; }
      .page { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; }
      .label { border: 1px solid #ccc; border-radius: 6px; padding: 8px 10px; width: 160px; text-align: center; page-break-inside: avoid; }
      .name { font-size: 11px; font-weight: 700; margin-bottom: 4px; color: #1f2937; word-break: break-word; }
      .code { font-family: monospace; font-size: 10px; color: #374151; background: #f9f9f9; padding: 2px 4px; border-radius: 3px; margin-bottom: 4px; }
      .price { font-size: 13px; font-weight: 800; color: #b45309; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style></head><body><div class="page">`);
    printItems.forEach(p => {
      w.document.write(`<div class="label">
        ${p.imageUrl ? `<img src="${p.imageUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;margin-bottom:4px;" />` : ""}
        <div class="name">${p.name}</div>
        ${p.barcode ? `<div class="code">${p.barcode}</div>` : ""}
        <div class="price">₩${Number(p.sellPrice).toLocaleString()}</div>
      </div>`);
    });
    w.document.write("</div></body></html>");
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>บาร์โค้ดสินค้า</h1>
        <button onClick={handlePrint} disabled={selected.length === 0} style={{ background: selected.length ? "#b45309" : "#e5e7eb", color: selected.length ? "#fff" : "#9ca3af", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: selected.length ? "pointer" : "default" }}>
          พิมพ์ {selected.length > 0 ? `(${selected.length})` : ""}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} placeholder="ค้นหาสินค้า..." style={{ flex: 1, border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
        <button onClick={load} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>ค้นหา</button>
        <button onClick={selectAll} style={{ background: "#fff", color: "#374151", border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>เลือกทั้งหมด</button>
        <button onClick={clearAll} style={{ background: "#fff", color: "#374151", border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>ล้าง</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
        {products.map(p => {
          const isSelected = selected.includes(p.id);
          return (
            <div key={p.id} onClick={() => toggle(p.id)} style={{ background: "#fff", border: `2px solid ${isSelected ? "#b45309" : "#e7e3d8"}`, borderRadius: 10, padding: "12px", cursor: "pointer", textAlign: "center", boxShadow: isSelected ? "0 0 0 3px #fde68a" : "none", transition: "all .1s" }}>
              {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, marginBottom: 6 }} /> : <div style={{ width: 56, height: 56, background: "#f3f4f6", borderRadius: 8, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>}
              <div style={{ fontWeight: 700, fontSize: 12, color: "#1f2937", marginBottom: 2 }}>{p.name}</div>
              {p.barcode && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", background: "#f9fafb", borderRadius: 4, padding: "1px 4px", display: "inline-block", marginBottom: 4 }}>{p.barcode}</div>}
              <div style={{ fontWeight: 800, fontSize: 13, color: "#b45309" }}>₩{Number(p.sellPrice).toLocaleString()}</div>
              {isSelected && <div style={{ fontSize: 10, color: "#b45309", fontWeight: 700, marginTop: 4 }}>✓ เลือกแล้ว</div>}
            </div>
          );
        })}
        {products.length === 0 && <div style={{ gridColumn: "1/-1", color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 32 }}>ไม่พบสินค้า</div>}
      </div>
    </div>
  );
}
