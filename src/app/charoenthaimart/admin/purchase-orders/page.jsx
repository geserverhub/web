"use client";
import { useEffect, useState, Fragment } from "react";

const PAYMENT_TERMS = [
  { value: "CASH", label: "เงินสด" },
  { value: "CREDIT_7", label: "เครดิต 7 วัน" },
  { value: "CREDIT_15", label: "เครดิต 15 วัน" },
  { value: "CREDIT_30", label: "เครดิต 30 วัน" },
  { value: "CREDIT_60", label: "เครดิต 60 วัน" },
  { value: "TRANSFER_ADVANCE", label: "โอนล่วงหน้า" },
];
const termLabel = (v) => PAYMENT_TERMS.find(t => t.value === v)?.label || v;

const STATUS_BADGE = {
  PENDING: { bg: "#fef3c7", color: "#92400e", label: "รอรับสินค้า" },
  RECEIVED: { bg: "#dcfce7", color: "#15803d", label: "รับสินค้าแล้ว" },
  CANCELLED: { bg: "#f3f4f6", color: "#6b7280", label: "ยกเลิก" },
};

const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function CtmPurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [nextPoNumber, setNextPoNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierBillNo, setSupplierBillNo] = useState("");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]); // { productId, productName, unit, quantity, unitCost }
  const [paymentTerms, setPaymentTerms] = useState("CASH");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  const loadPos = () => fetch("/api/ctm/purchase-orders").then(r => r.json()).then(d => { setPos(d.purchaseOrders || []); setLoading(false); });

  const deletePoItem = async (po, item) => {
    if (!confirm(`ลบรายการ "${item.productName}" ออกจากใบสั่งซื้อ ${po.poNumber}?`)) return;
    const res = await fetch(`/api/ctm/purchase-orders/${po.id}/items/${item.id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error || "ลบไม่สำเร็จ"); return; }
    loadPos();
  };
  useEffect(() => {
    loadPos();
    fetch("/api/ctm/suppliers").then(r => r.json()).then(d => setSuppliers(d.suppliers || []));
  }, []);

  // when creating a product from the "+ สร้างสินค้าใหม่" tab, it posts back here on save
  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.type === "ctm-po-product-created" && supplierId) {
        const p = e.data.product;
        if (p) {
          setProducts(list => list.some(x => x.id === p.id) ? list : [p, ...list]);
          addToCart(p);
        } else {
          fetch(`/api/ctm/products?q=`).then(r => r.json()).then(d => setProducts(d.products || []));
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [supplierId]);

  const openCreate = () => {
    setSupplierId(""); setSupplierBillNo(""); setProducts([]); setSearch(""); setCart([]);
    setPaymentTerms("CASH"); setNote(""); setError(""); setOpen(true);
    fetch("/api/ctm/purchase-orders/nextcode").then(r => r.json()).then(d => setNextPoNumber(d.code || "")).catch(() => {});
  };

  const pickSupplier = (id) => {
    setSupplierId(id); setCart([]); setSearch("");
    if (!id) { setProducts([]); return; }
    // load ALL products (not just ones already linked) so admin can assign new ones to this supplier
    fetch(`/api/ctm/products?q=`).then(r => r.json()).then(d => setProducts(d.products || []));
  };

  const addToCart = (p) => {
    setCart(c => {
      if (c.some(i => i.productId === p.id)) return c;
      return [...c, { productId: p.id, productName: p.name, unit: p.unit || "ชิ้น", quantity: 1, unitCost: Number(p.buyPrice) }];
    });
  };
  const removeFromCart = (id) => setCart(c => c.filter(i => i.productId !== id));
  const updateCartItem = (id, key, value) => setCart(c => c.map(i => i.productId === id ? { ...i, [key]: value } : i));

  const assignToSupplier = async (p) => {
    await fetch(`/api/ctm/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supplierId }) });
    setProducts(list => list.map(x => x.id === p.id ? { ...x, supplierId } : x));
    addToCart(p);
  };

  const linkedProducts = products.filter(p => p.supplierId === supplierId);
  const otherProducts = products.filter(p => p.supplierId !== supplierId);
  const matchesSearch = (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search) || (p.productCode || "").toLowerCase().includes(search.toLowerCase());
  const filteredProducts = linkedProducts.filter(matchesSearch);
  const filteredOtherProducts = search ? otherProducts.filter(matchesSearch) : [];

  const cartTotal = cart.reduce((s, i) => s + Number(i.unitCost || 0) * Number(i.quantity || 0), 0);

  const submit = async () => {
    setError("");
    if (!supplierId) { setError("กรุณาเลือกคู่ค้า"); return; }
    if (!supplierBillNo.trim()) { setError("กรุณากรอกเลขที่บิลจากคู่ค้า"); return; }
    if (!cart.length) { setError("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ"); return; }
    setSaving(true);
    const res = await fetch("/api/ctm/purchase-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId, supplierBillNo, paymentTerms, note, items: cart }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "เกิดข้อผิดพลาด"); return; }
    setOpen(false);
    loadPos();
  };

  const markReceived = async (po) => {
    if (!confirm(`ยืนยันรับสินค้าเข้าสต๊อกตามใบสั่งซื้อ ${po.poNumber}? สต๊อกสินค้าจะถูกเพิ่มอัตโนมัติ`)) return;
    await fetch(`/api/ctm/purchase-orders/${po.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "RECEIVED" }) });
    loadPos();
  };

  const cancelPo = async (po) => {
    if (!confirm(`ยกเลิกใบสั่งซื้อ ${po.poNumber}?`)) return;
    await fetch(`/api/ctm/purchase-orders/${po.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) });
    loadPos();
  };

  const deletePo = async (po) => {
    if (!confirm(`ลบใบสั่งซื้อ ${po.poNumber}?`)) return;
    const res = await fetch(`/api/ctm/purchase-orders/${po.id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error || "ลบไม่สำเร็จ"); return; }
    loadPos();
  };

  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>สั่งซื้อสินค้าเข้าสต๊อก</h1>
        <button onClick={openCreate} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ สร้างใบสั่งซื้อ</button>
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", width: 860, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", margin: 0 }}>สร้างใบสั่งซื้อใหม่</h2>
              {nextPoNumber && (
                <span style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "3px 12px", fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: "#b45309" }}>
                  {nextPoNumber}
                  <span style={{ fontSize: 10, color: "#a16207", marginLeft: 4 }}>(อัตโนมัติ)</span>
                </span>
              )}
            </div>
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 14px", color: "#b91c1c", marginBottom: 12, fontSize: 13 }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>คู่ค้า*</label>
                <select value={supplierId} onChange={(e) => pickSupplier(e.target.value)} style={inp}>
                  <option value="">— เลือกคู่ค้า —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierCode ? `${s.supplierCode} - ` : ""}{s.name}{s.company ? ` (${s.company})` : ""}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>เลขที่บิล (จากคู่ค้า)*</label>
                <input value={supplierBillNo} onChange={(e) => setSupplierBillNo(e.target.value)} placeholder="เลขที่บิล/ใบกำกับของคู่ค้า" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>เงื่อนไขการชำระเงิน</label>
                <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} style={inp}>
                  {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {supplierId && (
              <>
                <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
                  <input placeholder="ค้นหาสินค้าของคู่ค้านี้ (ชื่อ/บาร์โค้ด/รหัส)" value={search} onChange={(e) => setSearch(e.target.value)} style={inp} />
                  <a href={`/charoenthaimart/admin/purchase-orders/new-product?supplierId=${supplierId}`} target="_blank" rel="noreferrer" style={{ whiteSpace: "nowrap", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center" }}>+ สร้างสินค้าใหม่ (เพื่อซื้อ)</a>
                </div>
                <div style={{ border: "1px solid #e7e3d8", borderRadius: 10, maxHeight: 220, overflowY: "auto", marginBottom: 16 }}>
                  {filteredProducts.length === 0 && filteredOtherProducts.length === 0 && (
                    <div style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>
                      {linkedProducts.length === 0 ? "คู่ค้านี้ยังไม่มีสินค้าที่ผูกไว้ — พิมพ์ค้นหาเพื่อผูกสินค้าที่มีอยู่แล้ว หรือกด + สร้างสินค้าใหม่" : "ไม่พบสินค้า"}
                    </div>
                  )}
                  {filteredProducts.map(p => {
                    const inCart = cart.some(i => i.productId === p.id);
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: "1px solid #f3f4f6" }}>
                        <div style={{ fontSize: 13, color: "#1f2937" }}>
                          <span style={{ fontWeight: 600 }}>{p.name}</span>
                          <span style={{ color: "#9ca3af", marginLeft: 8, fontSize: 12 }}>ทุน ₩{fmt(p.buyPrice)} · คงเหลือ {p.stock} {p.unit}</span>
                        </div>
                        <button type="button" disabled={inCart} onClick={() => addToCart(p)} style={{ background: inCart ? "#f3f4f6" : "#eff6ff", color: inCart ? "#9ca3af" : "#1d4ed8", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: inCart ? "default" : "pointer" }}>
                          {inCart ? "เพิ่มแล้ว" : "+ เพิ่มสินค้า"}
                        </button>
                      </div>
                    );
                  })}
                  {filteredOtherProducts.length > 0 && (
                    <div style={{ padding: "6px 12px", background: "#fafaf7", borderTop: filteredProducts.length ? "1px solid #f3f4f6" : "none", fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>สินค้าอื่นในระบบ (ยังไม่ผูกกับคู่ค้านี้)</div>
                  )}
                  {filteredOtherProducts.map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: "1px solid #f3f4f6" }}>
                      <div style={{ fontSize: 13, color: "#1f2937" }}>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        <span style={{ color: "#9ca3af", marginLeft: 8, fontSize: 12 }}>ทุน ₩{fmt(p.buyPrice)} · คงเหลือ {p.stock} {p.unit}</span>
                      </div>
                      <button type="button" onClick={() => assignToSupplier(p)} style={{ background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        ผูกกับคู่ค้านี้ + เพิ่ม
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>รายการสั่งซื้อ ({cart.length})</div>
            <div style={{ border: "1px solid #e7e3d8", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#fef3c7" }}>
                    {["สินค้า", "จำนวน", "หน่วย", "ราคา/หน่วย", "รวม", ""].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#92400e", fontWeight: 700 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 && <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>ยังไม่มีรายการ — เลือกคู่ค้าแล้วกด + เพิ่มสินค้า</td></tr>}
                  {cart.map(i => (
                    <tr key={i.productId} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "6px 10px", fontWeight: 600 }}>{i.productName}</td>
                      <td style={{ padding: "6px 10px" }}>
                        <input type="number" min="1" value={i.quantity} onChange={(e) => updateCartItem(i.productId, "quantity", Number(e.target.value))} style={{ ...inp, width: 70 }} />
                      </td>
                      <td style={{ padding: "6px 10px", color: "#6b7280" }}>{i.unit || "—"}</td>
                      <td style={{ padding: "6px 10px" }}>
                        <input type="number" min="0" value={i.unitCost} onChange={(e) => updateCartItem(i.productId, "unitCost", Number(e.target.value))} style={{ ...inp, width: 90 }} />
                      </td>
                      <td style={{ padding: "6px 10px", fontWeight: 700, color: "#b45309" }}>₩{fmt(i.unitCost * i.quantity)}</td>
                      <td style={{ padding: "6px 10px" }}>
                        <button type="button" onClick={() => removeFromCart(i.productId)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "3px 9px", fontSize: 11, cursor: "pointer" }}>ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {cart.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #e7e3d8" }}>
                      <td colSpan={4} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#374151" }}>รวมทั้งหมด</td>
                      <td colSpan={2} style={{ padding: "8px 10px", fontWeight: 800, color: "#b45309", fontSize: 15 }}>₩{fmt(cartTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมายเหตุ</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>ยกเลิก</button>
              <button type="button" disabled={saving} onClick={submit} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{saving ? "กำลังบันทึก..." : "สร้างใบสั่งซื้อ"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["", "เลขที่ใบสั่งซื้อ", "เลขที่บิล (คู่ค้า)", "คู่ค้า", "เงื่อนไขชำระเงิน", "จำนวนรายการ", "ยอดรวม", "สถานะ", "วันที่สั่ง", "จัดการ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>กำลังโหลด...</td></tr>}
            {!loading && pos.length === 0 && <tr><td colSpan={10} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ยังไม่มีใบสั่งซื้อ</td></tr>}
            {pos.map((po, i) => {
              const badge = STATUS_BADGE[po.status] || STATUS_BADGE.PENDING;
              return (
                <Fragment key={po.id}>
                <tr style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                  <td style={{ padding: "8px 12px", cursor: "pointer", color: "#9ca3af" }} onClick={() => setExpanded(e => ({ ...e, [po.id]: !e[po.id] }))}>{expanded[po.id] ? "▼" : "▶"}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#b45309" }}>{po.poNumber}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>{po.supplierBillNo || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#1f2937" }}>{po.supplier?.name}{po.supplier?.supplierCode ? ` (${po.supplier.supplierCode})` : ""}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>{termLabel(po.paymentTerms)}</td>
                  <td style={{ padding: "8px 12px", color: "#374151" }}>{po.items?.length || 0}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 700, color: "#b45309" }}>₩{fmt(po.totalAmount)}</td>
                  <td style={{ padding: "8px 12px" }}><span style={{ background: badge.bg, color: badge.color, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{badge.label}</span></td>
                  <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12 }}>{new Date(po.createdAt).toLocaleDateString("th-TH")}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {po.status === "PENDING" && (
                        <>
                          <button onClick={() => markReceived(po)} style={{ background: "#dcfce7", color: "#15803d", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>รับสินค้าเข้าสต๊อก</button>
                          <button onClick={() => cancelPo(po)} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>ยกเลิก</button>
                        </>
                      )}
                      {po.status !== "RECEIVED" && (
                        <button onClick={() => deletePo(po)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>ลบ</button>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded[po.id] && (
                  <tr style={{ background: "#fafaf7" }}>
                    <td colSpan={10} style={{ padding: "0 12px 12px 40px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ color: "#9ca3af" }}>
                            {["สินค้า", "จำนวน", "หน่วย", "ราคา/หน่วย", "รวม", ""].map(h => (
                              <th key={h} style={{ textAlign: h === "สินค้า" ? "left" : "right", padding: "4px 8px", fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {po.items?.map(item => (
                            <tr key={item.id}>
                              <td style={{ padding: "3px 8px", color: "#374151" }}>{item.productName}</td>
                              <td style={{ padding: "3px 8px", textAlign: "right", color: "#374151" }}>{item.quantity}</td>
                              <td style={{ padding: "3px 8px", textAlign: "right", color: "#374151" }}>{item.unit || "—"}</td>
                              <td style={{ padding: "3px 8px", textAlign: "right", color: "#374151" }}>₩{fmt(item.unitCost)}</td>
                              <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 600, color: "#b45309" }}>₩{fmt(item.totalCost)}</td>
                              <td style={{ padding: "3px 8px", textAlign: "right" }}>
                                {item.receivedQty > 0 ? (
                                  <span style={{ fontSize: 11, color: "#9ca3af" }} title="รับเข้าสต๊อกไปแล้วบางส่วน ไม่สามารถลบได้">รับแล้ว</span>
                                ) : (
                                  <button onClick={() => deletePoItem(po, item)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>ลบ</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
