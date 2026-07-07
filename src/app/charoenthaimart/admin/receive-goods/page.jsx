"use client";
import { useEffect, useMemo, useState } from "react";

export default function CtmReceiveGoods() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [checked, setChecked] = useState({}); // itemId -> bool
  const [qty, setQty] = useState({}); // itemId -> number
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/ctm/purchase-orders?status=PENDING").then(r => r.json()).then(d => {
      setPos(d.purchaseOrders || []);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const filteredPos = pos.filter(po =>
    !search || po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    (po.supplierBillNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (po.supplier?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedPo = pos.find(p => p.id === selectedId);
  const pendingItems = useMemo(() => (selectedPo?.items || []).filter(i => i.quantity - i.receivedQty > 0), [selectedPo]);

  const pickPo = (po) => {
    setSelectedId(po.id); setError(""); setMsg("");
    const initChecked = {}, initQty = {};
    (po.items || []).forEach(i => {
      const remaining = i.quantity - i.receivedQty;
      if (remaining > 0) { initChecked[i.id] = true; initQty[i.id] = remaining; }
    });
    setChecked(initChecked); setQty(initQty);
  };

  const submit = async () => {
    if (!selectedPo) return;
    const items = pendingItems
      .filter(i => checked[i.id])
      .map(i => ({ itemId: i.id, receiveQty: Number(qty[i.id]) || 0 }))
      .filter(i => i.receiveQty > 0);
    if (!items.length) { setError("กรุณาเลือกรายการและระบุจำนวนที่จะรับเข้า"); return; }
    setError(""); setMsg(""); setSaving(true);
    const res = await fetch(`/api/ctm/purchase-orders/${selectedPo.id}/receive-items`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "เกิดข้อผิดพลาด"); return; }
    setMsg(`รับสินค้าเข้าสต๊อกเรียบร้อย (${items.length} รายการ)`);
    setSelectedId(""); setChecked({}); setQty({});
    load();
  };

  const inp = { border: "1px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 4px" }}>คีย์รับเข้าสินค้า</h1>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>ดึงบิลสั่งซื้อที่ยังไม่รับครบจากหน้า &quot;สั่งซื้อสินค้าเข้าสต๊อก&quot; มาคีย์รับเข้าสต๊อกทีละรายการ — รายการที่รับครบแล้วจะไม่แสดงอีกเมื่อดึงบิลเดิมซ้ำ</div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "flex-start" }}>
        {/* Bill list */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", overflow: "hidden" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}>
            <input placeholder="ค้นหาบิล/คู่ค้า" value={search} onChange={(e) => setSearch(e.target.value)} style={inp} />
          </div>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {loading && <div style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div>}
            {!loading && filteredPos.length === 0 && <div style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>ไม่มีบิลที่รอรับสินค้า</div>}
            {filteredPos.map(po => {
              const remainingCount = (po.items || []).filter(i => i.quantity - i.receivedQty > 0).length;
              return (
                <div key={po.id} onClick={() => pickPo(po)} style={{
                  padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6",
                  background: selectedId === po.id ? "#fef3c7" : "#fff",
                }}>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#b45309", fontSize: 13 }}>{po.poNumber}</div>
                  <div style={{ fontSize: 12, color: "#374151" }}>{po.supplier?.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>เลขที่บิล: {po.supplierBillNo || "—"} · เหลือ {remainingCount} รายการ</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Receiving form */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e3d8", padding: 20, minHeight: 200 }}>
          {!selectedPo && <div style={{ color: "#9ca3af", fontSize: 13 }}>เลือกบิลทางซ้ายเพื่อคีย์รับเข้าสต๊อก</div>}
          {selectedPo && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", margin: 0 }}>{selectedPo.poNumber}</h2>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{selectedPo.supplier?.name} · เลขที่บิล {selectedPo.supplierBillNo || "—"}</span>
              </div>
              {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 14px", color: "#b91c1c", margin: "12px 0", fontSize: 13 }}>{error}</div>}
              {pendingItems.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 12 }}>บิลนี้รับสินค้าครบทุกรายการแล้ว</div>
              ) : (
                <div style={{ border: "1px solid #e7e3d8", borderRadius: 10, overflow: "hidden", marginTop: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#fef3c7" }}>
                        {["", "สินค้า", "หน่วย", "สั่ง", "รับแล้ว", "เหลือ", "รับเข้าครั้งนี้"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#92400e", fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingItems.map(i => {
                        const remaining = i.quantity - i.receivedQty;
                        return (
                          <tr key={i.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "6px 10px" }}>
                              <input type="checkbox" checked={!!checked[i.id]} onChange={(e) => setChecked(c => ({ ...c, [i.id]: e.target.checked }))} />
                            </td>
                            <td style={{ padding: "6px 10px", fontWeight: 600 }}>{i.productName}</td>
                            <td style={{ padding: "6px 10px", color: "#6b7280" }}>{i.unit || "—"}</td>
                            <td style={{ padding: "6px 10px", color: "#6b7280" }}>{i.quantity}</td>
                            <td style={{ padding: "6px 10px", color: "#6b7280" }}>{i.receivedQty}</td>
                            <td style={{ padding: "6px 10px", color: "#b45309", fontWeight: 700 }}>{remaining}</td>
                            <td style={{ padding: "6px 10px" }}>
                              <input type="number" min="0" max={remaining} value={qty[i.id] ?? remaining}
                                onChange={(e) => setQty(q => ({ ...q, [i.id]: e.target.value }))}
                                disabled={!checked[i.id]}
                                style={{ ...inp, width: 80, opacity: checked[i.id] ? 1 : 0.5 }} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {pendingItems.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <button onClick={submit} disabled={saving} style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {saving ? "กำลังบันทึก..." : "บันทึกรับเข้าสต๊อก"}
                  </button>
                </div>
              )}
            </>
          )}
          {msg && <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "8px 14px", color: "#15803d", marginTop: 16, fontSize: 13 }}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}
