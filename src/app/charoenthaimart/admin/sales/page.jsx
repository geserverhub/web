"use client";
import { useEffect, useState, useRef, useCallback, Fragment } from "react";

const VAT = 0.10;
const nowD = new Date();
const TODAY = nowD.toISOString().slice(0, 10);
const NOW_MONTH = nowD.toISOString().slice(0, 7);
const NOW_YEAR = String(nowD.getFullYear());

const fInp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" };
const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");
const fmtDate = (s) => new Date(s).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function CtmSales() {
  const [tab, setTab] = useState("month");
  const [day, setDay] = useState(TODAY);
  const [month, setMonth] = useState(NOW_MONTH);
  const [year, setYear] = useState(NOW_YEAR);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const [showAdd, setShowAdd] = useState(false);
  const [nextInv, setNextInv] = useState("");
  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState({});
  const [cart, setCart] = useState([]);
  const [pSearch, setPSearch] = useState("");
  const [barcodeVal, setBarcodeVal] = useState("");
  const [payType, setPayType] = useState("CASH");
  const [saleNote, setSaleNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [usedOrderId, setUsedOrderId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [custSearch, setCustSearch] = useState("");
  const [showCustPicker, setShowCustPicker] = useState(false);
  const barcodeRef = useRef(null);

  const queryParam = tab === "day" ? `date=${day}` : tab === "month" ? `month=${month}` : `year=${year}`;

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/ctm/sales?${queryParam}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [queryParam]);

  useEffect(() => { load(); }, [load]);

  const deleteSaleItem = async (sale, item) => {
    if (!confirm(`ลบรายการ "${item.productName}" ออกจากบิล ${sale.number}?`)) return;
    const res = await fetch(`/api/ctm/sales/${sale.id}/items/${item.id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error || "ลบไม่สำเร็จ"); return; }
    load();
  };

  const openAdd = async () => {
    setCart([]); setPSearch(""); setBarcodeVal(""); setPayType("CASH"); setSaleNote(""); setNextInv("");
    setOrderSearch(""); setUsedOrderId(null); setCustomerId(""); setCustSearch(""); setShowCustPicker(false);
    const [pr, pm, nc, ord, cust] = await Promise.all([
      fetch("/api/ctm/products").then(r => r.json()),
      fetch("/api/ctm/promotions/public").then(r => r.json()),
      fetch("/api/ctm/sales/nextcode").then(r => r.json()).catch(() => ({})),
      fetch("/api/ctm/orders").then(r => r.json()).catch(() => ({})),
      fetch("/api/ctm/customers").then(r => r.json()).catch(() => ({})),
    ]);
    setNextInv(nc.code || "");
    setProducts((pr.products || []).filter(p => p.isActive));
    const promoMap = {};
    (pm.promotions || []).forEach(p => { promoMap[p.productId] = p; });
    setPromos(promoMap);
    setOnlineOrders((ord.orders || []).filter(o => o.status === "PENDING"));
    setCustomers(cust.customers || []);
    setShowAdd(true);
    setTimeout(() => barcodeRef.current?.focus(), 150);
  };

  const useOnlineOrder = (order) => {
    const items = (order.items || []).map(oi => {
      const product = products.find(p => p.id === oi.id);
      if (!product) return null;
      return { productId: product.id, productName: product.name, quantity: oi.qty, unitPrice: Number(oi.price), buyPrice: Number(product.buyPrice), isPromo: false, origPrice: Number(product.sellPrice) };
    }).filter(Boolean);
    setCart(items);
    setUsedOrderId(order.id);
    setSaleNote(`ออนไลน์ ${order.orderNo} · ${order.recipientName} · ${order.recipientPhone}`);
    setOrderSearch("");
    const matchedCustomer = customers.find(c => c.phone && c.phone === order.recipientPhone);
    if (matchedCustomer) setCustomerId(matchedCustomer.id);
  };

  const selectCustomer = (c) => {
    setCustomerId(c.id);
    setShowCustPicker(false);
    setCustSearch("");
  };

  const filteredCustomers = custSearch
    ? customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || (c.phone || "").includes(custSearch))
    : customers;

  const filteredOrders = orderSearch
    ? onlineOrders.filter(o =>
        o.orderNo.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.recipientName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.recipientPhone.includes(orderSearch))
    : onlineOrders;

  const addToCart = (product) => {
    const promo = promos[product.id];
    const unitPrice = promo ? Number(promo.promoPrice) : Number(product.sellPrice);
    setCart(prev => {
      const idx = prev.findIndex(x => x.productId === product.id);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice, buyPrice: Number(product.buyPrice), isPromo: !!promo, origPrice: Number(product.sellPrice) }];
    });
  };

  const setQty = (productId, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(x => x.productId !== productId));
    else setCart(prev => prev.map(x => x.productId === productId ? { ...x, quantity: qty } : x));
  };

  const handleBarcodeKey = (e) => {
    if (e.key !== "Enter") return;
    const code = barcodeVal.trim();
    if (!code) return;
    const found = products.find(p => p.barcode === code);
    if (found) { addToCart(found); setBarcodeVal(""); }
    else { alert(`ไม่พบสินค้าบาร์โค้ด: ${code}`); setBarcodeVal(""); }
  };

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const vatAmt = subtotal * VAT;
  const total = subtotal + vatAmt;

  const submitSale = async () => {
    if (!cart.length) return;
    setSaving(true);
    const res = await fetch("/api/ctm/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart, paymentType: payType, note: saleNote || null, customerId: customerId || null }),
    });
    if (res.ok) {
      if (usedOrderId) {
        await fetch("/api/ctm/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: usedOrderId, status: "CONFIRMED" }) }).catch(() => {});
      }
      setShowAdd(false); load();
    } else { alert("บันทึกไม่สำเร็จ"); }
    setSaving(false);
  };

  const filteredProducts = pSearch
    ? products.filter(p =>
        p.name.toLowerCase().includes(pSearch.toLowerCase()) ||
        (p.barcode || "").includes(pSearch) ||
        (p.nameKo || "").includes(pSearch) ||
        (p.category || "").toLowerCase().includes(pSearch.toLowerCase()))
    : products;

  return (
    <div style={{ padding: "28px 32px" }}>
      <style>{`
        @media (max-width: 760px) {
          .ctm-addsale-modal { max-width: 100% !important; height: 100vh !important; border-radius: 0 !important; }
          .ctm-addsale-split { flex-direction: column !important; }
          .ctm-addsale-left { border-right: none !important; border-bottom: 1px solid #e7e3d8; flex: 1 1 55% !important; }
          .ctm-addsale-cart { width: 100% !important; flex: 1 1 45% !important; }
          .ctm-addsale-overlay { padding: 0 !important; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>ยอดขาย</h1>
        <button onClick={openAdd} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ เพิ่มรายการขาย</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {[["day","รายวัน"],["month","รายเดือน"],["year","รายปี"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 14px", fontWeight: tab === k ? 700 : 400, background: tab === k ? "#fef3c7" : "#fff", color: tab === k ? "#92400e" : "#6b7280", cursor: "pointer", fontSize: 13 }}>{l}</button>
        ))}
        {tab === "day" && <input type="date" value={day} onChange={e => setDay(e.target.value)} style={fInp} />}
        {tab === "month" && <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={fInp} />}
        {tab === "year" && (
          <select value={year} onChange={e => setYear(e.target.value)} style={fInp}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* Stats */}
      {!loading && data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "ยอดขายรวม (inc VAT)", value: `₩${fmt(data.totalRevenue)}`, color: "#b45309", bg: "#fef3c7" },
            { label: "VAT 10% (นำส่ง)", value: `₩${fmt(data.totalTax)}`, color: "#7c3aed", bg: "#ede9fe" },
            { label: "ต้นทุน", value: `₩${fmt(data.totalCost)}`, color: "#b91c1c", bg: "#fee2e2" },
            { label: "กำไรสุทธิ", value: `₩${fmt(data.profit)}`, color: "#15803d", bg: "#dcfce7" },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sales table */}
      {loading ? <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div> : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fef3c7" }}>
                {["","เลขที่บิล","วันที่","ลูกค้า","รายการ","ชำระเงิน","VAT","ยอดรวม"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!data?.sales || data.sales.length === 0) && (
                <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการขาย</td></tr>
              )}
              {data?.sales?.map((s, i) => (
                <Fragment key={s.id}>
                  <tr style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff", cursor: "pointer" }}
                    onClick={() => setExpanded(ex => ({ ...ex, [s.id]: !ex[s.id] }))}>
                    <td style={{ padding: "8px 12px", color: "#9ca3af", fontSize: 11 }}>{expanded[s.id] ? "▼" : "▶"}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{s.number}</td>
                    <td style={{ padding: "8px 12px", color: "#374151" }}>{fmtDate(s.saleDate)}</td>
                    <td style={{ padding: "8px 12px", color: "#374151" }}>
                      {s.customer ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{s.customer.name}</div>
                          {s.customer.phone && <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.customer.phone}</div>}
                        </>
                      ) : <span style={{ color: "#d1d5db" }}>—</span>}
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280" }}>{s.items?.length || 0} รายการ</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: s.paymentType === "CASH" ? "#dcfce7" : s.paymentType === "TRANSFER" ? "#dbeafe" : "#fef3c7", color: s.paymentType === "CASH" ? "#166534" : s.paymentType === "TRANSFER" ? "#1d4ed8" : "#b45309", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{s.paymentType}</span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#7c3aed", fontSize: 12 }}>₩{fmt(s.taxAmount)}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#b45309" }}>₩{fmt(s.totalAmount)}</td>
                  </tr>
                  {expanded[s.id] && (
                    <tr style={{ background: "#fafaf7" }}>
                      <td colSpan={8} style={{ padding: "0 12px 12px 40px" }}>
                        {s.customer?.address && (
                          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>📍 ที่อยู่: {s.customer.address}</div>
                        )}
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ color: "#9ca3af" }}>
                              {["สินค้า","จำนวน","ราคา/หน่วย","รวม",""].map(h => (
                                <th key={h} style={{ textAlign: h === "สินค้า" ? "left" : "right", padding: "4px 8px", fontWeight: 600 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {s.items?.map(item => (
                              <tr key={item.id}>
                                <td style={{ padding: "3px 8px", color: "#374151" }}>{item.productName}</td>
                                <td style={{ padding: "3px 8px", textAlign: "right", color: "#374151" }}>{item.quantity}</td>
                                <td style={{ padding: "3px 8px", textAlign: "right", color: "#374151" }}>₩{fmt(item.unitPrice)}</td>
                                <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 600, color: "#b45309" }}>₩{fmt(item.totalPrice)}</td>
                                <td style={{ padding: "3px 8px", textAlign: "right" }}>
                                  <button onClick={() => deleteSaleItem(s, item)} style={{ background: "#fef2f2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>ลบ</button>
                                </td>
                              </tr>
                            ))}
                            {s.note && <tr><td colSpan={5} style={{ padding: "4px 8px", color: "#9ca3af", fontStyle: "italic" }}>หมายเหตุ: {s.note}</td></tr>}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Sale Overlay */}
      {showAdd && (
        <div className="ctm-addsale-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="ctm-addsale-modal" style={{ background: "#fff", width: "100%", maxWidth: 1100, borderRadius: 16, display: "flex", height: "92vh", overflow: "hidden", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #e7e3d8", background: "#fef3c7", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#92400e" }}>เพิ่มรายการขาย</h2>
                {nextInv && (
                  <span style={{ background: "#fff", border: "1px solid #fcd34d", borderRadius: 8, padding: "3px 12px", fontFamily: "monospace", fontWeight: 800, fontSize: 13, color: "#b45309" }}>
                    {nextInv}
                    <span style={{ fontSize: 9, color: "#a16207", marginLeft: 4 }}>(อัตโนมัติ)</span>
                  </span>
                )}
              </div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9ca3af", lineHeight: 1 }}>✕</button>
            </div>

            <div className="ctm-addsale-split" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* Left: product picker */}
              <div className="ctm-addsale-left" style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #e7e3d8", overflow: "hidden" }}>
                {/* Online orders picker */}
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", background: "#fef2f2", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>🛍️ ดึงจากคำสั่งซื้อออนไลน์ที่รอดำเนินการ ({onlineOrders.length})</div>
                  <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                    placeholder="ค้นหาเลขที่คำสั่งซื้อ / ชื่อ / เบอร์โทร..."
                    style={{ width: "100%", border: "1px solid #fca5a5", borderRadius: 8, padding: "7px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  {orderSearch && (
                    <div style={{ marginTop: 6, maxHeight: 180, overflowY: "auto", border: "1px solid #fca5a5", borderRadius: 8, background: "#fff" }}>
                      {filteredOrders.length === 0 && <div style={{ padding: 10, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>ไม่พบคำสั่งซื้อ</div>}
                      {filteredOrders.map(o => (
                        <div key={o.id} onClick={() => useOnlineOrder(o)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                          onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                          <div>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#b91c1c", fontSize: 12 }}>{o.orderNo}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{o.recipientName} · {o.recipientPhone} · {o.items?.length || 0} รายการ</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>₩{fmt(o.totalAmount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {usedOrderId && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "#166534", fontWeight: 700 }}>✓ ใช้ข้อมูลจากคำสั่งซื้อออนไลน์แล้ว</div>
                  )}
                </div>
                {/* Barcode input */}
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>🔍 สแกนบาร์โค้ด (กด Enter เพื่อเพิ่ม)</div>
                  <input ref={barcodeRef} value={barcodeVal} onChange={e => setBarcodeVal(e.target.value)} onKeyDown={handleBarcodeKey}
                    placeholder="สแกนหรือพิมพ์บาร์โค้ด..."
                    style={{ width: "100%", border: "2px solid #b45309", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                {/* Product search */}
                <div style={{ padding: "8px 16px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
                  <input value={pSearch} onChange={e => setPSearch(e.target.value)}
                    placeholder="ค้นหาสินค้า: ชื่อ / หมวดหมู่ / บาร์โค้ด..."
                    style={{ width: "100%", border: "1px solid #e7e3d8", borderRadius: 8, padding: "7px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                {/* Product grid */}
                <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
                  {filteredProducts.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 20 }}>ไม่พบสินค้า</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8 }}>
                    {filteredProducts.map(p => {
                      const promo = promos[p.id];
                      const inCart = cart.find(c => c.productId === p.id);
                      return (
                        <button key={p.id} onClick={() => addToCart(p)}
                          style={{ background: inCart ? "#fef9ec" : "#fff", border: `1.5px solid ${inCart ? "#fcd34d" : "#e7e3d8"}`, borderRadius: 10, padding: "8px 10px", cursor: "pointer", textAlign: "left", position: "relative", transition: "border-color .1s" }}>
                          {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 6, marginBottom: 5 }} />}
                          {promo && <span style={{ position: "absolute", top: 6, right: 6, background: "#dc2626", color: "#fff", borderRadius: 4, fontSize: 9, padding: "1px 5px", fontWeight: 700 }}>โปร</span>}
                          {inCart && <span style={{ position: "absolute", top: promo ? 22 : 6, right: 6, background: "#b45309", color: "#fff", borderRadius: 4, fontSize: 9, padding: "1px 5px", fontWeight: 700 }}>×{inCart.quantity}</span>}
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#1f2937", lineHeight: 1.3, marginBottom: 2 }}>{p.name}</div>
                          {p.category && <div style={{ fontSize: 10, color: "#9ca3af" }}>{p.category}</div>}
                          <div style={{ fontSize: 12, fontWeight: 800, color: promo ? "#dc2626" : "#b45309", marginTop: 3 }}>
                            ₩{fmt(promo ? promo.promoPrice : p.sellPrice)}
                            {promo && <span style={{ color: "#9ca3af", textDecoration: "line-through", fontSize: 10, marginLeft: 4 }}>₩{fmt(p.sellPrice)}</span>}
                          </div>
                          {p.stock <= 5 && <div style={{ fontSize: 10, color: p.stock === 0 ? "#b91c1c" : "#d97706", marginTop: 2 }}>{p.stock === 0 ? "หมดสต็อก" : `เหลือ ${p.stock}`}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: cart + checkout */}
              <div className="ctm-addsale-cart" style={{ width: 300, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Cart items */}
                <div style={{ flex: 1, overflow: "auto", padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>รายการในบิล ({cart.length} รายการ)</div>
                  {cart.length === 0 && <div style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", marginTop: 30 }}>เพิ่มสินค้าจากทางซ้าย<br />หรือสแกนบาร์โค้ด</div>}
                  {cart.map(item => (
                    <div key={item.productId} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: 9, marginBottom: 9 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1f2937", marginBottom: 4, lineHeight: 1.3 }}>
                        {item.isPromo && <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 9, padding: "1px 4px", borderRadius: 3, marginRight: 4, fontWeight: 700 }}>โปร</span>}
                        {item.productName}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <button onClick={() => setQty(item.productId, item.quantity - 1)} style={{ width: 22, height: 22, background: "#f3f4f6", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <input type="number" value={item.quantity} min="1"
                            onChange={e => setQty(item.productId, Number(e.target.value))}
                            style={{ width: 38, textAlign: "center", border: "1px solid #e7e3d8", borderRadius: 4, padding: "2px", fontSize: 12, outline: "none" }} />
                          <button onClick={() => setQty(item.productId, item.quantity + 1)} style={{ width: 22, height: 22, background: "#fef3c7", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#b45309" }}>₩{fmt(item.unitPrice * item.quantity)}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>₩{fmt(item.unitPrice)}/ชิ้น</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Checkout */}
                <div style={{ borderTop: "1px solid #e7e3d8", padding: "12px 14px", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: "#374151" }}>
                    <span>ยอดก่อน VAT</span><span>₩{fmt(subtotal.toFixed(0))}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, color: "#7c3aed" }}>
                    <span>VAT 10%</span><span>₩{fmt(vatAmt.toFixed(0))}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#b45309", borderTop: "1px solid #fcd34d", paddingTop: 8, marginBottom: 12 }}>
                    <span>ยอดรวม</span><span>₩{fmt(total.toFixed(0))}</span>
                  </div>

                  <div style={{ marginBottom: 8, position: "relative" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>ลูกค้า (ถ้ามี)</div>
                    {customerId ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fef9c3", border: "1px solid #fcd34d", borderRadius: 6, padding: "6px 10px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>{customers.find(c => c.id === customerId)?.name}</span>
                        <button type="button" onClick={() => setCustomerId("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>×</button>
                      </div>
                    ) : (
                      <input value={custSearch}
                        onChange={e => { setCustSearch(e.target.value); setShowCustPicker(true); }}
                        onFocus={() => setShowCustPicker(true)}
                        placeholder="ค้นหาชื่อลูกค้าหรือเบอร์โทร..."
                        style={{ width: "100%", border: "1px solid #e7e3d8", borderRadius: 6, padding: "6px 10px", fontSize: 12, boxSizing: "border-box", outline: "none" }} />
                    )}
                    {showCustPicker && !customerId && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "#fff", border: "1px solid #e7e3d8", borderRadius: 8, marginTop: 4, maxHeight: 180, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}>
                        {filteredCustomers.length === 0 && <div style={{ padding: 10, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>ไม่พบลูกค้า</div>}
                        {filteredCustomers.map(c => (
                          <div key={c.id} onClick={() => selectCustomer(c)}
                            style={{ padding: "7px 10px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", fontSize: 12 }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fef3c7"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                            <span style={{ fontWeight: 700, color: "#1f2937" }}>{c.name}</span>
                            <span style={{ color: "#9ca3af", marginLeft: 6 }}>{c.phone || "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>ชำระเงินด้วย</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {["CASH","TRANSFER","CARD"].map(pt => (
                        <button key={pt} onClick={() => setPayType(pt)}
                          style={{ flex: 1, border: "1px solid", borderColor: payType === pt ? "#b45309" : "#e7e3d8", borderRadius: 6, padding: "5px 0", fontSize: 11, fontWeight: 700, background: payType === pt ? "#fef3c7" : "#fff", color: payType === pt ? "#b45309" : "#6b7280", cursor: "pointer" }}>{pt}</button>
                      ))}
                    </div>
                  </div>

                  <input value={saleNote} onChange={e => setSaleNote(e.target.value)}
                    placeholder="หมายเหตุ / ชื่อลูกค้า"
                    style={{ width: "100%", border: "1px solid #e7e3d8", borderRadius: 6, padding: "6px 10px", fontSize: 12, marginBottom: 10, boxSizing: "border-box", outline: "none" }} />

                  <button onClick={submitSale} disabled={saving || !cart.length}
                    style={{ width: "100%", background: cart.length && !saving ? "#b45309" : "#e7e3d8", color: cart.length && !saving ? "#fff" : "#9ca3af", border: "none", borderRadius: 8, padding: "12px", fontWeight: 800, fontSize: 14, cursor: cart.length && !saving ? "pointer" : "default" }}>
                    {saving ? "กำลังบันทึก..." : cart.length ? `บันทึกบิล ₩${fmt(total.toFixed(0))}` : "เพิ่มสินค้าก่อน"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
