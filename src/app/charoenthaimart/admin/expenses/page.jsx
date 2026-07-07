"use client";
import { useEffect, useState, useRef } from "react";

const CATEGORIES = ["ภาษี","ค่าเช่า","ค่าสาธารณูปโภค","ค่าวัตถุดิบ","ค่าขนส่ง","ค่าบรรจุภัณฑ์","ค่าโฆษณา","ค่าซ่อมบำรุง","ค่าใช้จ่ายทั่วไป","อื่นๆ"];
const EMPTY = { date: new Date().toISOString().slice(0,10), category: "", description: "", amount: "", paymentType: "CASH", note: "" };

export default function CtmExpenses() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptPreview, setReceiptPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [pendingTax, setPendingTax] = useState([]);
  const [pendingPo, setPendingPo] = useState([]);
  const [sourcePoId, setSourcePoId] = useState(null);
  const fileRef = useRef(null);

  const load = () => fetch(`/api/ctm/expenses?month=${month}`).then(r => r.json()).then(setData);
  useEffect(() => { load(); }, [month]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ctm/tax/vat-summary").then(r => r.json()),
      fetch("/api/ctm/income-tax/auto-summary").then(r => r.json()),
    ]).then(([vat, income]) => {
      const pending = [
        ...(vat.periods || []).filter(p => p.status !== "NOT_YET_DUE").map(p => ({
          key: `vat-${p.year}-${p.half}`, label: `VAT ${p.label}`, amount: p.taxAmount, status: p.status,
        })),
        ...(income.years || []).filter(y => y.status !== "NOT_YET_DUE").map(y => ({
          key: `income-${y.year}`, label: `ภาษีรายได้ ปีภาษี ${y.year + 543}`, amount: y.taxAmount, status: y.status,
        })),
      ];
      setPendingTax(pending);
    }).catch(() => {});
  }, []);

  const loadPendingPo = () => {
    fetch("/api/ctm/purchase-orders?status=RECEIVED&unexpensed=1").then(r => r.json()).then(d => setPendingPo(d.purchaseOrders || [])).catch(() => {});
  };
  useEffect(() => { loadPendingPo(); }, []);

  const useTaxBill = (item) => {
    setSourcePoId(null);
    setForm(f => ({ ...f, category: "ภาษี", description: item.label, amount: String(Math.round(item.amount)) }));
    setShowForm(true);
  };

  const usePoBill = (po) => {
    setSourcePoId(po.id);
    setForm(f => ({ ...f, category: "ค่าวัตถุดิบ", description: `ใบสั่งซื้อ ${po.poNumber} (${po.supplier?.name || ""}) เลขที่บิล ${po.supplierBillNo || "—"}`, amount: String(Math.round(po.totalAmount)) }));
    setShowForm(true);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ctm/upload", { method: "POST", body: fd });
    if (res.ok) {
      const d = await res.json();
      setReceiptUrl(d.url || "");
    }
    setUploading(false);
  };

  const clearReceipt = () => { setReceiptUrl(""); setReceiptPreview(""); if (fileRef.current) fileRef.current.value = ""; };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    await fetch("/api/ctm/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount), receiptUrl: receiptUrl || null }),
    });
    if (sourcePoId) {
      await fetch(`/api/ctm/purchase-orders/${sourcePoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markExpensed: true }) });
      setSourcePoId(null);
      loadPendingPo();
    }
    setSaving(false); setShowForm(false); setForm(EMPTY); clearReceipt(); load();
  };

  const del = async (id) => {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/ctm/expenses?id=${id}`, { method: "DELETE" });
    load();
  };

  const fmt = (n) => Number(n).toLocaleString("ko-KR");
  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const CAT_COLORS = { "ค่าเช่า":"#fee2e2","ค่าสาธารณูปโภค":"#fef9c3","ค่าวัตถุดิบ":"#dcfce7","ค่าขนส่ง":"#dbeafe","ค่าบรรจุภัณฑ์":"#ede9fe","ค่าโฆษณา":"#fce7f3","ค่าซ่อมบำรุง":"#ffedd5","ค่าใช้จ่ายทั่วไป":"#f1f5f9","อื่นๆ":"#f3f4f6" };
  const isImg = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: 0 }}>บันทึกรายจ่ายประจำวัน</h1>
        <button onClick={() => { setShowForm(v => !v); setSourcePoId(null); setForm(EMPTY); }} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {showForm ? "ซ่อนฟอร์ม" : "+ เพิ่มรายจ่าย"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ border: "1px solid #e7e3d8", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }} />
        {data && <span style={{ fontWeight: 700, fontSize: 14, color: "#b91c1c" }}>รวม: ₩{fmt(data.total || 0)}</span>}
      </div>

      {/* Category summary chips */}
      {data?.byCategory && Object.keys(data.byCategory).length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {Object.entries(data.byCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ background: CAT_COLORS[cat] || "#f3f4f6", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#374151", fontWeight: 600 }}>
              {cat}: ₩{fmt(amt)}
            </div>
          ))}
        </div>
      )}

      {/* Pending tax bills */}
      {pendingTax.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c", marginBottom: 10 }}>🧾 บิลภาษีที่รอชำระ — คลิกเพื่อสร้างบันทึกรายจ่าย</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pendingTax.map(item => (
              <button key={item.key} onClick={() => useTaxBill(item)}
                style={{ background: "#fff", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "8px 14px", cursor: "pointer", textAlign: "left", fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: "#374151" }}>{item.label}</div>
                <div style={{ fontWeight: 800, color: "#b91c1c", fontSize: 14 }}>₩{fmt(item.amount)}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>ยอดคำนวณอัตโนมัติจากระบบ — แก้ไขจำนวนเงินให้ตรงกับยอดที่จ่ายจริงตามใบเสร็จก่อนบันทึก</div>
        </div>
      )}

      {/* Pending received PO bills */}
      {pendingPo.length > 0 && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>📥 ใบสั่งซื้อที่รับสินค้าแล้ว — คลิกเพื่อสร้างบันทึกรายจ่าย</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pendingPo.map(po => (
              <button key={po.id} onClick={() => usePoBill(po)}
                style={{ background: "#fff", border: "1.5px solid #93c5fd", borderRadius: 8, padding: "8px 14px", cursor: "pointer", textAlign: "left", fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: "#374151" }}>{po.poNumber} — {po.supplier?.name}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>เลขที่บิล {po.supplierBillNo || "—"}</div>
                <div style={{ fontWeight: 800, color: "#1d4ed8", fontSize: 14 }}>₩{fmt(po.totalAmount)}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>แก้ไขจำนวนเงินให้ตรงกับยอดที่จ่ายจริงก่อนบันทึก — บันทึกแล้วบิลนี้จะไม่แสดงซ้ำอีก</div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 10, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>วันที่*</label><input required type="date" value={form.date} onChange={set("date")} style={inp} /></div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมวดหมู่*</label>
                <select required value={form.category} onChange={set("category")} style={inp}>
                  <option value="">-- เลือก --</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>รายละเอียด</label><input value={form.description} onChange={set("description")} style={inp} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>ยอดเงิน (₩)*</label><input required type="number" min="0" value={form.amount} onChange={set("amount")} style={inp} /></div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>วิธีชำระ</label>
                <select value={form.paymentType} onChange={set("paymentType")} style={inp}>
                  <option value="CASH">เงินสด</option>
                  <option value="CARD">บัตร</option>
                  <option value="TRANSFER">โอน</option>
                </select>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>หมายเหตุ</label><input value={form.note} onChange={set("note")} style={inp} /></div>
            </div>

            {/* Receipt upload */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>📎 อัพโหลดบิล / ใบเสร็จ</label>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fef3c7", border: "1.5px dashed #d97706", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                  📷 เลือกไฟล์
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} style={{ display: "none" }} />
                </label>
                {uploading && <span style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>กำลังอัพโหลด...</span>}
                {receiptPreview && !uploading && (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    {isImg(receiptUrl) || receiptPreview ? (
                      <img src={receiptPreview} alt="receipt" style={{ height: 80, width: "auto", borderRadius: 8, border: "1px solid #e7e3d8", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: 80, width: 80, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📄</div>
                    )}
                    <button type="button" onClick={clearReceipt} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>
                  </div>
                )}
                {receiptUrl && !uploading && <span style={{ fontSize: 11, color: "#15803d", alignSelf: "center" }}>✓ อัพโหลดสำเร็จ</span>}
              </div>
            </div>

            <button type="submit" disabled={saving || uploading} style={{ background: saving || uploading ? "#e7e3d8" : "#b45309", color: saving || uploading ? "#9ca3af" : "#fff", border: "none", borderRadius: 8, padding: "8px 22px", fontWeight: 700, fontSize: 13, cursor: saving || uploading ? "default" : "pointer" }}>
              {saving ? "กำลังบันทึก..." : uploading ? "รอการอัพโหลด..." : "บันทึก"}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["วันที่","หมวดหมู่","รายละเอียด","ยอดเงิน","วิธีชำระ","หมายเหตุ","ใบเสร็จ","ลบ"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#92400e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!data?.expenses || data.expenses.length === 0) && <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>ไม่มีรายการ</td></tr>}
            {data?.expenses?.map((e, i) => (
              <tr key={e.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 ? "#fafaf7" : "#fff" }}>
                <td style={{ padding: "8px 12px", color: "#374151", whiteSpace: "nowrap" }}>{new Date(e.date).toLocaleDateString("th-TH",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                <td style={{ padding: "8px 12px" }}><span style={{ background: CAT_COLORS[e.category] || "#f3f4f6", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#374151" }}>{e.category}</span></td>
                <td style={{ padding: "8px 12px", color: "#374151" }}>{e.description || "—"}</td>
                <td style={{ padding: "8px 12px", fontWeight: 700, color: "#b91c1c" }}>₩{fmt(e.amount)}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: 12 }}>{e.paymentType}</td>
                <td style={{ padding: "8px 12px", color: "#9ca3af", fontSize: 12 }}>{e.note || "—"}</td>
                <td style={{ padding: "8px 12px" }}>
                  {e.receiptUrl ? (
                    isImg(e.receiptUrl)
                      ? <img src={e.receiptUrl} alt="receipt" onClick={() => setViewReceipt(e.receiptUrl)} style={{ height: 36, width: 36, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #e7e3d8" }} title="คลิกเพื่อดูขยาย" />
                      : <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1d4ed8", fontSize: 11, textDecoration: "underline" }}>📄 ดูไฟล์</a>
                  ) : <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <button onClick={() => del(e.id)} disabled={!!e.receiptUrl}
                    title={e.receiptUrl ? "มีใบเสร็จแนบอยู่ ไม่สามารถลบได้" : ""}
                    style={{ background: e.receiptUrl ? "#f3f4f6" : "#fef2f2", color: e.receiptUrl ? "#9ca3af" : "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: e.receiptUrl ? "not-allowed" : "pointer", fontSize: 12 }}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipt lightbox */}
      {viewReceipt && (
        <div onClick={() => setViewReceipt(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={viewReceipt} alt="receipt" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 12px 48px rgba(0,0,0,.6)" }} />
          <button onClick={() => setViewReceipt(null)} style={{ position: "fixed", top: 20, right: 20, background: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      )}
    </div>
  );
}
