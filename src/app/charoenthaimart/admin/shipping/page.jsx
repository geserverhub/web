"use client";
import { useEffect, useState } from "react";

const STATUS_LABEL = { PENDING: "รอจัดส่ง", SHIPPED: "กำลังจัดส่ง", DELIVERED: "ส่งแล้ว", FAILED: "ส่งไม่สำเร็จ", CANCELLED: "ยกเลิก" };
const STATUS_COLOR = { PENDING: "#f59e0b", SHIPPED: "#3b82f6", DELIVERED: "#16a34a", FAILED: "#b91c1c", CANCELLED: "#6b7280" };
const STATUS_BG   = { PENDING: "#fef3c7", SHIPPED: "#dbeafe", DELIVERED: "#dcfce7", FAILED: "#fee2e2", CANCELLED: "#f3f4f6" };
const TYPE_LABEL  = { DELIVERY: "🛵 เดลิเวอร์รี่", TAEKBAE: "📦 แทคเป (택배)" };
const EMPTY_FORM  = { invoiceNo: "", saleId: "", type: "DELIVERY", recipientName: "", recipientPhone: "", recipientAddress: "", trackingNo: "", carrier: "", status: "PENDING", note: "" };

export default function ShippingPage() {
  const [shippings, setShippings] = useState(null);
  const [sales, setSales]         = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tab, setTab]             = useState("ALL"); // ALL | DELIVERY | TAEKBAE
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [invSearch, setInvSearch] = useState("");
  const [showInvPicker, setShowInvPicker] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [showCustPicker, setShowCustPicker] = useState(false);
  const [printTarget, setPrintTarget] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [savingTracking, setSavingTracking] = useState(null);

  useEffect(() => {
    if (!printTarget) return;
    const id = setTimeout(() => window.print(), 80);
    const onAfterPrint = () => setPrintTarget(null);
    window.addEventListener("afterprint", onAfterPrint);
    return () => { clearTimeout(id); window.removeEventListener("afterprint", onAfterPrint); };
  }, [printTarget]);

  const load = async () => {
    const [sr, sr2, sr3] = await Promise.all([
      fetch("/api/ctm/shipping").then(r => r.json()),
      fetch("/api/ctm/sales").then(r => r.json()),
      fetch("/api/ctm/customers").then(r => r.json()),
    ]);
    setShippings(sr.shippings || []);
    setSales(sr2.sales || []);
    setCustomers(sr3.customers || []);
  };
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      invoiceNo: s.invoiceNo || "",
      saleId: s.saleId || "",
      type: s.type || "DELIVERY",
      recipientName: s.recipientName || "",
      recipientPhone: s.recipientPhone || "",
      recipientAddress: s.recipientAddress || "",
      trackingNo: s.trackingNo || "",
      carrier: s.carrier || "",
      status: s.status || "PENDING",
      note: s.note || "",
    });
    setShowForm(true);
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await fetch("/api/ctm/shipping", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
      } else {
        await fetch("/api/ctm/shipping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      load();
    } finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/ctm/shipping?id=${id}`, { method: "DELETE" });
    load();
  };

  const quickStatus = async (id, status) => {
    await fetch("/api/ctm/shipping", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  };

  const saveTracking = async (id) => {
    const trackingNo = trackingInputs[id] ?? "";
    setSavingTracking(id);
    try {
      await fetch("/api/ctm/shipping", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, trackingNo }) });
      await load();
    } finally { setSavingTracking(null); }
  };

  const selectInv = (sale) => {
    setForm(f => ({ ...f, invoiceNo: sale.number, saleId: sale.id, recipientName: sale.customer?.name || f.recipientName }));
    setShowInvPicker(false);
  };

  const selectCust = (c) => {
    setForm(f => ({ ...f, recipientName: c.name, recipientPhone: c.phone || f.recipientPhone, recipientAddress: c.address || f.recipientAddress }));
    setShowCustPicker(false);
  };

  const filtered = shippings ? shippings.filter(s => tab === "ALL" || s.type === tab) : [];
  const inv = (s) => {
    if (!s) return [];
    if (!invSearch) return s.slice(0, 30);
    return s.filter(x => x.number?.includes(invSearch) || x.customer?.name?.includes(invSearch)).slice(0, 20);
  };
  const cust = (s) => {
    if (!s) return [];
    if (!custSearch) return s.slice(0, 30);
    return s.filter(x => x.name?.includes(custSearch) || x.phone?.includes(custSearch)).slice(0, 20);
  };

  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const fmtDate = d => d ? new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

  const counts = { ALL: (shippings||[]).length, DELIVERY: (shippings||[]).filter(s=>s.type==="DELIVERY").length, TAEKBAE: (shippings||[]).filter(s=>s.type==="TAEKBAE").length };
  const statusCount = st => (shippings||[]).filter(s=>s.status===st).length;

  return (
    <div style={{ padding: "28px 32px", fontFamily: "sans-serif" }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #shipping-label-print, #shipping-label-print * { visibility: visible !important; }
          #shipping-label-print { display: block !important; position: fixed; inset: 0; padding: 24px; }
        }
      `}</style>
      {printTarget && (
        <div id="shipping-label-print" style={{ display: "none" }}>
          <div style={{ border: "3px solid #111827", borderRadius: 8, padding: "20px 24px", maxWidth: 480, fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #111827", paddingBottom: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#7f1d1d" }}>ร้านเจริญไทยมาร์ท ซูวอน</div>
              <div style={{ fontSize: 13, fontWeight: 800, padding: "3px 10px", borderRadius: 6, background: printTarget.type === "TAEKBAE" ? "#ede9fe" : "#dbeafe", color: printTarget.type === "TAEKBAE" ? "#7c3aed" : "#1d4ed8" }}>
                {TYPE_LABEL[printTarget.type]}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>เลขที่บิล / INV</div>
            <div style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 800, color: "#b45309", marginBottom: 14 }}>{printTarget.invoiceNo}</div>

            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>ผู้รับ / TO</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 6 }}>{printTarget.recipientName || "—"}</div>
            <div style={{ fontSize: 15, color: "#374151", marginBottom: 6 }}>{printTarget.recipientPhone || "—"}</div>
            <div style={{ fontSize: 15, color: "#374151", whiteSpace: "pre-wrap", marginBottom: 14 }}>{printTarget.recipientAddress || "—"}</div>

            {printTarget.type === "TAEKBAE" && (
              <div style={{ borderTop: "1px dashed #9ca3af", paddingTop: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>ขนส่ง / เลขที่พัสดุ</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1f2937" }}>{printTarget.carrier || "—"}</div>
                <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 800, color: "#111827" }}>{printTarget.trackingNo || "—"}</div>
              </div>
            )}
            {printTarget.note && (
              <div style={{ fontSize: 12, color: "#6b7280", borderTop: "1px dashed #9ca3af", paddingTop: 10 }}>หมายเหตุ: {printTarget.note}</div>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>การจัดส่งสินค้า</h1>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>เชื่อมต่อกับใบเสร็จ INV · เดลิเวอร์รี่ · แทคเป</div>
        </div>
        <button onClick={openAdd} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + เพิ่มรายการจัดส่ง
        </button>
      </div>

      {/* Status summary chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} style={{ background: STATUS_BG[k], border: `1px solid ${STATUS_COLOR[k]}40`, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: STATUS_COLOR[k] }}>
            {v}: {statusCount(k)}
          </div>
        ))}
      </div>

      {/* Type tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["ALL", `ทั้งหมด (${counts.ALL})`], ["DELIVERY", `🛵 เดลิเวอร์รี่ (${counts.DELIVERY})`], ["TAEKBAE", `📦 แทคเป (${counts.TAEKBAE})`]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: tab === t ? "#b45309" : "#f3f4f6", color: tab === t ? "#fff" : "#6b7280",
          }}>{label}</button>
        ))}
      </div>

      {/* Add/edit form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#92400e" }}>{editId ? "แก้ไขรายการจัดส่ง" : "เพิ่มรายการจัดส่งใหม่"}</div>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af" }}>×</button>
          </div>
          <form onSubmit={save}>
            {/* Type toggle */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>ประเภทการจัดส่ง*</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["DELIVERY", "🛵 เดลิเวอร์รี่"], ["TAEKBAE", "📦 แทคเป (택배)"]].map(([v, label]) => (
                  <button type="button" key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: form.type === v ? "2px solid #b45309" : "1px solid #e7e3d8", background: form.type === v ? "#fef3c7" : "#f9fafb", fontWeight: 700, fontSize: 13, cursor: "pointer", color: form.type === v ? "#92400e" : "#6b7280" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* INV picker */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>เลขที่บิล INV*</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={form.invoiceNo} onChange={set("invoiceNo")} placeholder="INV20260704-0001" style={{ ...inp, flex: 1 }} required />
                <button type="button" onClick={() => setShowInvPicker(v => !v)}
                  style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12, color: "#92400e", cursor: "pointer", flexShrink: 0 }}>
                  🔍 เลือก
                </button>
              </div>
              {showInvPicker && (
                <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 10, padding: 14, marginTop: 8, boxShadow: "0 4px 16px rgba(0,0,0,.08)", maxHeight: 260, overflowY: "auto" }}>
                  <input placeholder="ค้นหา INV หรือชื่อลูกค้า..." value={invSearch} onChange={e => setInvSearch(e.target.value)}
                    style={{ ...inp, marginBottom: 10 }} autoFocus />
                  {inv(sales).length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center" }}>ไม่พบ</div> : inv(sales).map(s => (
                    <div key={s.id} onClick={() => selectInv(s)}
                      style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 2, background: "#fafaf7", border: "1px solid #f3f4f6" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fef3c7"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fafaf7"}>
                      <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{s.number}</span>
                      <span style={{ color: "#6b7280" }}>{s.customer?.name || "ไม่มีชื่อลูกค้า"} · ₩{Number(s.totalAmount).toLocaleString("ko-KR")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 14 }}>
              <div style={{ position: "relative" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 3 }}>ชื่อผู้รับ</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={form.recipientName} onChange={set("recipientName")} style={{ ...inp, flex: 1 }} />
                  <button type="button" onClick={() => setShowCustPicker(v => !v)}
                    style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "0 12px", fontWeight: 700, fontSize: 12, color: "#92400e", cursor: "pointer", flexShrink: 0 }}>
                    🔍
                  </button>
                </div>
                {showCustPicker && (
                  <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 10, padding: 14, marginTop: 6, boxShadow: "0 4px 16px rgba(0,0,0,.08)", maxHeight: 260, overflowY: "auto", position: "absolute", zIndex: 10, width: 320 }}>
                    <input placeholder="ค้นหาชื่อลูกค้าหรือเบอร์โทร..." value={custSearch} onChange={e => setCustSearch(e.target.value)}
                      style={{ ...inp, marginBottom: 10 }} autoFocus />
                    {cust(customers).length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center" }}>ไม่พบ</div> : cust(customers).map(c => (
                      <div key={c.id} onClick={() => selectCust(c)}
                        style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 2, background: "#fafaf7", border: "1px solid #f3f4f6" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fef3c7"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fafaf7"}>
                        <span style={{ fontWeight: 700 }}>{c.name}</span>
                        <span style={{ color: "#6b7280" }}>{c.phone || "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 3 }}>เบอร์โทร</label><input value={form.recipientPhone} onChange={set("recipientPhone")} style={inp} /></div>
              {form.type === "TAEKBAE" && (
                <>
                  <div><label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 3 }}>บริษัทขนส่ง</label>
                    <select value={form.carrier} onChange={set("carrier")} style={inp}>
                      <option value="">— เลือก —</option>
                      <option value="CJ대한통운">CJ대한통운</option>
                      <option value="한진택배">한진택배</option>
                      <option value="롯데택배">롯데택배</option>
                      <option value="우체국택배">우체국택배</option>
                      <option value="쿠팡">쿠팡</option>
                      <option value="기타">기타 (อื่นๆ)</option>
                    </select>
                  </div>
                  <div><label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 3 }}>เลขที่จัดส่ง (운송장)</label><input value={form.trackingNo} onChange={set("trackingNo")} placeholder="เลขพัสดุ" style={inp} /></div>
                </>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 3 }}>สถานะ</label>
                <select value={form.status} onChange={set("status")} style={inp}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 3 }}>ที่อยู่จัดส่ง</label>
              <textarea value={form.recipientAddress} onChange={set("recipientAddress")} rows={2} style={{ ...inp, resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 3 }}>หมายเหตุ</label>
              <input value={form.note} onChange={set("note")} style={inp} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={saving} style={{ background: saving ? "#e7e3d8" : "#b45309", color: saving ? "#9ca3af" : "#fff", border: "none", borderRadius: 8, padding: "9px 24px", fontWeight: 700, fontSize: 13, cursor: saving ? "default" : "pointer" }}>
                {saving ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["ประเภท","เลขที่บิล","ผู้รับ","เบอร์โทร","ขนส่ง / เลขพัสดุ","สถานะ","วันที่","จัดการ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!shippings) && <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>กำลังโหลด...</td></tr>}
            {shippings && filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการ</td></tr>}
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: s.type === "TAEKBAE" ? "#ede9fe" : "#dbeafe", color: s.type === "TAEKBAE" ? "#7c3aed" : "#1d4ed8" }}>
                    {TYPE_LABEL[s.type]}
                  </span>
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#b45309", fontSize: 12 }}>{s.invoiceNo}</span>
                </td>
                <td style={{ padding: "9px 12px", fontWeight: 600, color: "#374151" }}>{s.recipientName || "—"}</td>
                <td style={{ padding: "9px 12px", color: "#6b7280" }}>{s.recipientPhone || "—"}</td>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{s.carrier || "—"}</div>
                  {s.trackingNo && <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#1f2937", marginTop: 2 }}>{s.trackingNo}</div>}
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <select value={s.status} onChange={e => quickStatus(s.id, e.target.value)}
                    style={{ border: `1.5px solid ${STATUS_COLOR[s.status]}`, borderRadius: 7, padding: "3px 8px", background: STATUS_BG[s.status], color: STATUS_COLOR[s.status], fontWeight: 700, fontSize: 11, cursor: "pointer", outline: "none" }}>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td style={{ padding: "9px 12px", color: "#9ca3af", fontSize: 11, whiteSpace: "nowrap" }}>
                  <div>{fmtDate(s.createdAt)}</div>
                  {s.shippedAt && <div style={{ color: "#3b82f6" }}>จัดส่ง: {fmtDate(s.shippedAt)}</div>}
                  {s.deliveredAt && <div style={{ color: "#16a34a" }}>ถึง: {fmtDate(s.deliveredAt)}</div>}
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => openEdit(s)} style={{ background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>แก้ไข</button>
                    {s.type === "TAEKBAE" ? (
                      <>
                        <input value={trackingInputs[s.id] ?? s.trackingNo ?? ""} onChange={e => setTrackingInputs(t => ({ ...t, [s.id]: e.target.value }))}
                          placeholder="เลขที่จัดส่ง (운송장)"
                          style={{ border: "1px solid #e7e3d8", borderRadius: 6, padding: "4px 8px", fontSize: 12, outline: "none", width: 130 }} />
                        <button onClick={() => saveTracking(s.id)} disabled={savingTracking === s.id}
                          style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "4px 10px", cursor: savingTracking === s.id ? "default" : "pointer", fontSize: 12, fontWeight: 600 }}>
                          {savingTracking === s.id ? "..." : "บันทึก"}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setPrintTarget(s)} style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🖨️ พิมพ์</button>
                    )}
                    <button onClick={() => del(s.id)} disabled={s.status === "DELIVERED"}
                      title={s.status === "DELIVERED" ? "ส่งแล้ว ไม่สามารถลบได้" : ""}
                      style={{ background: s.status === "DELIVERED" ? "#f3f4f6" : "#fef2f2", color: s.status === "DELIVERED" ? "#9ca3af" : "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: s.status === "DELIVERED" ? "not-allowed" : "pointer", fontSize: 12 }}>ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
