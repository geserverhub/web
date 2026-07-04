"use client";
import { useEffect, useRef, useState } from "react";

const FORMATS = ["CODE128", "EAN13", "EAN8", "CODE39", "UPC"];

function loadJsBarcode(cb) {
  if (window.JsBarcode) { cb(); return; }
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
  s.onload = cb;
  document.head.appendChild(s);
}

function loadHtml5Qrcode(cb) {
  if (window.Html5Qrcode) { cb(); return; }
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js";
  s.onload = cb;
  document.head.appendChild(s);
}

function BarcodeScannerModal({ onDetected, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    loadHtml5Qrcode(() => {
      if (stopped) return;
      const html5Qrcode = new window.Html5Qrcode("barcode-scanner-region");
      scannerRef.current = html5Qrcode;
      html5Qrcode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          html5Qrcode.stop().catch(() => {}).finally(() => onDetected(decodedText));
        },
        () => {}
      ).catch(err => {
        const name = err?.name || "";
        if (name === "NotFoundError" || name === "OverconstrainedError") {
          setError("ไม่พบกล้องบนอุปกรณ์นี้ — โปรดใช้มือถือหรือแท็บเล็ตที่มีกล้อง");
        } else if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError("ไม่ได้รับอนุญาตให้ใช้กล้อง — โปรดอนุญาตการเข้าถึงกล้องในเบราว์เซอร์");
        } else if (name === "NotReadableError") {
          setError("ไม่สามารถเปิดกล้องได้ — กล้องอาจถูกใช้งานโดยแอปอื่นอยู่");
        } else {
          setError("ไม่สามารถเปิดกล้องได้: " + (err?.message || err));
        }
      });
    });
    return () => {
      stopped = true;
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, []);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 16, width: "min(420px, 92vw)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>📷 สแกนบาร์โค้ด</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>
        {error && <div style={{ color: "#b91c1c", fontSize: 12, marginBottom: 8 }}>{error}</div>}
        <div id="barcode-scanner-region" style={{ width: "100%" }} />
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8, textAlign: "center" }}>เล็งกล้องไปที่บาร์โค้ดสินค้า</div>
      </div>
    </div>
  );
}

function BarcodePreview({ value, format, showValue }) {
  const svgRef = useRef();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!value) return;
    loadJsBarcode(() => {
      try {
        window.JsBarcode(svgRef.current, value, { format, displayValue: showValue, fontSize: 12, height: 60, margin: 6 });
        setError("");
      } catch (e) {
        setError(e.message || "รูปแบบไม่ถูกต้อง");
      }
    });
  }, [value, format, showValue]);

  if (!value) return <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>พิมพ์ตัวเลขหรือข้อความด้านบน</div>;
  if (error) return <div style={{ color: "#b91c1c", fontSize: 12, padding: 12 }}>⚠️ {error}</div>;
  return <svg ref={svgRef} style={{ width: "100%", maxWidth: 300 }} />;
}

export default function CtmBarcode() {
  const [tab, setTab] = useState("create"); // create | products

  // Create barcode tab
  const [barcodeValue, setBarcodeValue] = useState("");
  const [barcodeLabel, setBarcodeLabel] = useState("");
  const [format, setFormat] = useState("CODE128");
  const [showText, setShowText] = useState(true);
  const [copies, setCopies] = useState(1);
  const [queue, setQueue] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  // Products tab
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = (searchQ) => {
    const sq = searchQ !== undefined ? searchQ : q;
    fetch(`/api/ctm/products${sq ? `?q=${encodeURIComponent(sq)}` : ""}`)
      .then(r => r.json()).then(d => setProducts(d.products || []));
  };

  const filteredForCreate = products.filter(p => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(s) || (p.barcode || "").includes(s) || (p.productCode || "").toLowerCase().includes(s);
  });

  const selectProduct = (p) => {
    setSelectedProduct(p);
    setBarcodeValue(p.barcode || p.productCode || "");
    setBarcodeLabel(p.name);
  };

  const handleScanDetected = (text) => {
    setShowScanner(false);
    setProductSearch(text);
    const match = products.find(p => p.barcode === text || p.productCode === text);
    if (match) selectProduct(match);
  };

  const addToQueue = () => {
    if (!barcodeValue.trim()) return;
    setQueue(q => [...q, { value: barcodeValue.trim(), label: barcodeLabel || barcodeValue.trim(), format, copies: Number(copies) || 1 }]);
  };

  const removeFromQueue = (i) => setQueue(q => q.filter((_, idx) => idx !== i));

  const printQueue = (items) => {
    const w = window.open("", "_blank");
    const itemsHtml = items.map(item =>
      Array.from({ length: item.copies }).map(() =>
        `<div class="label"><div class="lname">${item.label}</div><svg class="bc" data-value="${item.value}" data-format="${item.format}"></svg></div>`
      ).join("")
    ).join("");
    w.document.write(`<!DOCTYPE html><html><head><title>พิมพ์บาร์โค้ด</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
    <style>
      body { font-family: sans-serif; margin: 0; background: #fff; }
      .page { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; }
      .label { border: 1px solid #ccc; border-radius: 4px; padding: 1mm 2mm; text-align: center; page-break-inside: avoid; display: inline-block; width: 20mm; box-sizing: border-box; }
      .lname { font-size: 2.2mm; font-weight: 700; margin-bottom: 2px; max-width: 20mm; word-break: break-all; }
      .bc { width: 20mm; height: auto; display: block; margin: 0 auto; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style></head><body><div class="page">${itemsHtml}</div>
    <script>
      document.querySelectorAll('.bc').forEach(function(el) {
        try { JsBarcode(el, el.dataset.value, { format: el.dataset.format, displayValue: true, fontSize: 10, height: 50, margin: 4 }); } catch(e) {}
      });
      setTimeout(function() { window.print(); window.close(); }, 600);
    <\/script></body></html>`);
    w.document.close();
  };

  // Products tab print
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const addSelectedProductsToQueue = () => {
    const items = products.filter(p => selected.includes(p.id) && p.barcode).map(p => ({
      value: p.barcode,
      label: p.name,
      format: "CODE128",
      copies: 1,
    }));
    if (!items.length) return alert("โปรดเลือกสินค้าที่มีบาร์โค้ดเพื่อเพิ่มเข้าคิว");
    setQueue(q => [...q, ...items]);
  };

  const printProducts = () => {
    const items = products.filter(p => selected.includes(p.id) && p.barcode);
    if (!items.length) return alert("สินค้าที่เลือกต้องมีบาร์โค้ด");
    printQueue(items.map(p => ({ value: p.barcode, label: `${p.name} ₩${Number(p.sellPrice).toLocaleString()}`, format: "CODE128", copies: 1 })));
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>บาร์โค้ด</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {[["create","สร้างบาร์โค้ด"],["products","สินค้า"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "7px 16px", fontWeight: tab === k ? 700 : 400, background: tab === k ? "#fef3c7" : "#fff", color: tab === k ? "#92400e" : "#6b7280", cursor: "pointer", fontSize: 13 }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ─── สร้างบาร์โค้ด ─── */}
      {tab === "create" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left: form */}
          <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 12 }}>เลือกสินค้า</div>

            {/* Product search */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="🔍 ค้นหาชื่อสินค้า, บาร์โค้ด, รหัส..."
                style={{ flex: 1, minWidth: 0, border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowScanner(true)}
                style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "0 14px", fontWeight: 700, fontSize: 12, color: "#92400e", cursor: "pointer", flexShrink: 0 }}>
                📷 สแกน
              </button>
            </div>

            {/* Product list */}
            <div style={{ maxHeight: 210, overflowY: "auto", border: "1px solid #e7e3d8", borderRadius: 8, marginBottom: 12 }}>
              {filteredForCreate.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>ไม่พบสินค้า</div>
              )}
              {filteredForCreate.map(p => {
                const isSel = selectedProduct?.id === p.id;
                const codeVal = p.barcode || p.productCode || "";
                return (
                  <div key={p.id} onClick={() => selectProduct(p)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", background: isSel ? "#fef3c7" : "#fff", borderLeft: isSel ? "3px solid #b45309" : "3px solid transparent", transition: "background .1s" }}>
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 32, height: 32, borderRadius: 5, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📦</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: isSel ? 700 : 600, fontSize: 12, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                        {codeVal || <span style={{ color: "#f87171" }}>ไม่มีบาร์โค้ด</span>}
                        {p.productCode && <span style={{ marginLeft: 4, color: "#b45309" }}> · {p.productCode}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", flexShrink: 0 }}>₩{Number(p.sellPrice).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>

            {/* Selected summary */}
            {selectedProduct && (
              <div style={{ background: "#fef9c3", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "#92400e" }}>เลือก: </span>
                <span style={{ color: "#374151" }}>{selectedProduct.name}</span>
                {barcodeValue && <span style={{ fontFamily: "monospace", color: "#6b7280", marginLeft: 6 }}>({barcodeValue})</span>}
                {!barcodeValue && <span style={{ color: "#f87171", marginLeft: 6 }}>⚠️ สินค้านี้ไม่มีบาร์โค้ด</span>}
              </div>
            )}

            {/* Editable label */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ชื่อป้ายกำกับ</label>
              <input value={barcodeLabel} onChange={e => setBarcodeLabel(e.target.value)} placeholder="ชื่อสินค้า หรือ คำอธิบาย"
                style={{ width: "100%", border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>รูปแบบบาร์โค้ด</label>
                <select value={format} onChange={e => setFormat(e.target.value)} style={{ width: "100%", border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none" }}>
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>จำนวนพิมพ์</label>
                <input type="number" min="1" max="100" value={copies} onChange={e => setCopies(e.target.value)}
                  style={{ width: "100%", border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", marginBottom: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={showText} onChange={e => setShowText(e.target.checked)} />
              แสดงตัวเลขใต้บาร์โค้ด
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => printQueue([{ value: barcodeValue.trim(), label: barcodeLabel || barcodeValue.trim(), format, copies: Number(copies) || 1 }])}
                disabled={!barcodeValue.trim()}
                style={{ flex: 1, background: barcodeValue.trim() ? "#b45309" : "#e5e7eb", color: barcodeValue.trim() ? "#fff" : "#9ca3af", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: barcodeValue.trim() ? "pointer" : "default" }}>
                🖨️ พิมพ์เลย
              </button>
              <button onClick={addToQueue} disabled={!barcodeValue.trim()}
                style={{ background: barcodeValue.trim() ? "#fff" : "#f9fafb", color: barcodeValue.trim() ? "#374151" : "#9ca3af", border: "1px solid #e7e3d8", borderRadius: 8, padding: "10px 14px", fontWeight: 600, fontSize: 13, cursor: barcodeValue.trim() ? "pointer" : "default" }}>
                + เพิ่มคิว
              </button>
            </div>
          </div>

          {/* Right: preview + queue */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Preview */}
            <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 10 }}>ตัวอย่าง</div>
              <div style={{ display: "flex", justifyContent: "center", minHeight: 80 }}>
                <BarcodePreview value={barcodeValue} format={format} showValue={showText} />
              </div>
              {barcodeLabel && <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280", marginTop: 6 }}>{barcodeLabel}</div>}
            </div>

            {/* Queue */}
            {queue.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>คิวพิมพ์ ({queue.length})</div>
                  <button onClick={() => printQueue(queue)} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 7, padding: "5px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    🖨️ พิมพ์ทั้งหมด
                  </button>
                </div>
                {queue.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: "#1f2937" }}>{item.label}</div>
                      <div style={{ fontFamily: "monospace", color: "#6b7280", fontSize: 11 }}>{item.value} · {item.format} · ×{item.copies}</div>
                    </div>
                    <button onClick={() => removeFromQueue(i)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>ลบ</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── สินค้า ─── */}
      {tab === "products" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && loadProducts()} placeholder="ค้นหาสินค้า..." style={{ flex: 1, border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
            <button onClick={loadProducts} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>ค้นหา</button>
            <button onClick={() => setSelected(products.filter(p => p.barcode).map(p => p.id))} style={{ background: "#fff", color: "#374151", border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>เลือกทั้งหมด</button>
            <button onClick={() => setSelected([])} style={{ background: "#fff", color: "#374151", border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>ล้าง</button>
            <button onClick={addSelectedProductsToQueue} disabled={selected.length === 0} style={{ background: selected.length ? "#10b981" : "#e5e7eb", color: selected.length ? "#fff" : "#9ca3af", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: selected.length ? "pointer" : "default" }}>
              + เพิ่มคิวจากสินค้า {selected.length > 0 ? `(${selected.length})` : ""}
            </button>
            <button onClick={printProducts} disabled={selected.length === 0} style={{ background: selected.length ? "#b45309" : "#e5e7eb", color: selected.length ? "#fff" : "#9ca3af", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: selected.length ? "pointer" : "default" }}>
              🖨️ พิมพ์ {selected.length > 0 ? `(${selected.length})` : ""}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {products.map(p => {
              const isSel = selected.includes(p.id);
              return (
                <div key={p.id} onClick={() => p.barcode && toggle(p.id)} style={{ background: "#fff", border: `2px solid ${isSel ? "#b45309" : "#e7e3d8"}`, borderRadius: 10, padding: "12px", cursor: p.barcode ? "pointer" : "not-allowed", textAlign: "center", boxShadow: isSel ? "0 0 0 3px #fde68a" : "none", opacity: p.barcode ? 1 : 0.6, transition: "all .1s" }}>
                  {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, marginBottom: 6 }} /> : <div style={{ width: 56, height: 56, background: "#f3f4f6", borderRadius: 8, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>}
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#1f2937", marginBottom: 2 }}>{p.name}</div>
                  {p.barcode
                    ? <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", background: "#f9fafb", borderRadius: 4, padding: "1px 4px", display: "inline-block", marginBottom: 4 }}>{p.barcode}</div>
                    : <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>ไม่มีบาร์โค้ด</div>
                  }
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#b45309" }}>₩{Number(p.sellPrice).toLocaleString()}</div>
                  {isSel && <div style={{ fontSize: 10, color: "#b45309", fontWeight: 700, marginTop: 4 }}>✓ เลือกแล้ว</div>}
                </div>
              );
            })}
            {products.length === 0 && <div style={{ gridColumn: "1/-1", color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 32 }}>ไม่พบสินค้า</div>}
          </div>
        </>
      )}

      {showScanner && <BarcodeScannerModal onDetected={handleScanDetected} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
