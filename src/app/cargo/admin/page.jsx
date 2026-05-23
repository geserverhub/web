"use client";
import { useState, useEffect } from "react";
import { Package, RefreshCw, BarChart2, Users, Printer, Settings, Plus, X, AlertCircle } from "lucide-react";

const MENU_ITEMS = [
  { id: "shipments", icon: Package, label: "📦 รายการส่งสินค้า", color: "from-yellow-400 to-amber-500" },
  { id: "update-status", icon: RefreshCw, label: "🔄 อัพเดตสถานะ", color: "from-blue-400 to-cyan-500" },
  { id: "weight-cost", icon: BarChart2, label: "⚖️ น้ำหนัก & ค่าใช้จ่าย", color: "from-green-400 to-emerald-500" },
  { id: "payment", icon: BarChart2, label: "💰 ยืนยันชำระเงิน", color: "from-pink-400 to-red-500" },
  { id: "print", icon: Printer, label: "🖨️ พิมพ์รายการส่งขนส่ง", color: "from-purple-400 to-indigo-500" },
  { id: "summary", icon: BarChart2, label: "📊 สรุปบัญชี", color: "from-orange-400 to-red-500" },
  { id: "customers", icon: Users, label: "👤 ลูกค้าลงทะเบียน", color: "from-teal-400 to-cyan-500" },
  { id: "rates", icon: Settings, label: "💲 อัพเดตค่าขนส่ง", color: "from-gray-400 to-slate-500" },
  { id: "customs", icon: Users, label: "🪪 ข้อมูลศุลกากร", color: "from-slate-400 to-gray-500" },
];

export default function CargoAdminPage() {
  const [activeMenu, setActiveMenu] = useState("shipments");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalShipments: 0,
    delivered: 0,
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    krwRevenue: 0,
    krwCost: 0,
    krwProfit: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    trackingNo: "",
    senderName: "",
    senderPhone: "",
    receiverName: "",
    receiverPhone: "",
    direction: "TH_TO_KR",
    cost: "",
    currency: "THB",
    notes: "",
    itemDesc: "",
  });
  const [costForm, setCostForm] = useState({});
  const [savingCosts, setSavingCosts] = useState({});

  // Load shipments
  const loadShipments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cargo/admin/shipments");
      const data = await res.json();
      if (res.ok) {
        setShipments(Array.isArray(data) ? data : data.shipments || []);
        // Calculate stats
        const total = Array.isArray(data) ? data.length : data.shipments?.length || 0;
        const delivered = (Array.isArray(data) ? data : data.shipments || []).filter(s => s.status === "delivered").length;
        const list = Array.isArray(data) ? data : data.shipments || [];
        const thbList = list.filter(s => (s.currency || "THB") === "THB");
        const krwList = list.filter(s => s.currency === "KRW");
        const totalRev = thbList.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
        const totalCst = thbList.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
        const krwRev = krwList.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
        const krwCst = krwList.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
        setStats({
          totalShipments: total,
          delivered: delivered,
          totalRevenue: totalRev,
          totalCost: totalCst,
          netProfit: totalRev - totalCst,
          krwRevenue: krwRev,
          krwCost: krwCst,
          krwProfit: krwRev - krwCst,
        });
      } else {
        setError(data.error || "Failed to load shipments");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/cargo/admin/shipments/${editingId}` : "/api/cargo/admin/shipments";
      const method = editingId ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (res.ok) {
        setForm({
          trackingNo: "",
          senderName: "",
          senderPhone: "",
          receiverName: "",
          receiverPhone: "",
          direction: "TH_TO_KR",
          cost: "",
          currency: "THB",
          notes: "",
          itemDesc: "",
        });
        setEditingId(null);
        setShowAddForm(false);
        loadShipments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (err) {
      alert("Error saving shipment");
    }
  };

  const handleEdit = (shipment) => {
    setForm({
      trackingNo: shipment.trackingNo || "",
      senderName: shipment.senderName || "",
      senderPhone: shipment.senderPhone || "",
      receiverName: shipment.receiverName || "",
      receiverPhone: shipment.receiverPhone || "",
      direction: shipment.direction || "TH_TO_KR",
      cost: shipment.cost || "",
      currency: shipment.currency || "THB",
      notes: shipment.notes || "",
      itemDesc: shipment.itemDesc || "",
    });
    setEditingId(shipment.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this shipment?")) return;
    try {
      const res = await fetch(`/api/cargo/admin/shipments/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadShipments();
      }
    } catch (err) {
      alert("Error deleting shipment");
    }
  };

  const handleSaveCost = async (id, shipmentNo) => {
    setSavingCosts(prev => ({ ...prev, [id]: true }));
    try {
      const data = costForm[id] || {};
      const res = await fetch(`/api/cargo/admin/shipments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost: data.cost || 0,
          currency: data.currency || "THB",
          notes: data.notes || "",
        }),
      });

      if (res.ok) {
        loadShipments();
        setCostForm(prev => {
          const newForm = { ...prev };
          delete newForm[id];
          return newForm;
        });
        alert("✅ บันทึกต้นทุนสำเร็จ!");
      } else {
        const err = await res.json();
        alert(`⚠️ ${err.error || "Failed to save"}`);
      }
    } catch (err) {
      alert("❌ Error saving cost");
    } finally {
      setSavingCosts(prev => ({ ...prev, [id]: false }));
    }
  };

  const getDirectionLabel = (dir) => {
    const labels = {
      "TH_TO_KR": "🇹🇭→🇰🇷",
      "KR_TO_TH": "🇰🇷→🇹🇭",
      "SEA_KR_TO_TH": "🚢🇰🇷→🇹🇭",
    };
    return labels[dir] || dir;
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#000", marginBottom: 4 }}>
            ✈️🚢 คาโก้ ส่งสินค้าไทย-เกาหลี
          </div>
          <div style={{ fontSize: 14, color: "#64748b" }}>항공 화물 서비스 · {stats.totalShipments} รายการ</div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 16 }}>
          {[
            { icon: "📦", label: "รายการทั้งหมด", value: stats.totalShipments, color: "#facc15" },
            { icon: "✅", label: "จัดส่งสำเร็จ", value: stats.delivered, color: "#4ade80" },
            { icon: "💰", label: "รายรับรวม", value: `฿${stats.totalRevenue.toLocaleString()}`, color: "#60a5fa" },
            { icon: "📤", label: "ต้นทุนรวม", value: `฿${stats.totalCost.toLocaleString()}`, color: "#f87171" },
            { icon: "📈", label: "กำไรสุทธิ", value: `${stats.netProfit >= 0 ? "+" : ""}฿${stats.netProfit.toLocaleString()}`, color: stats.netProfit >= 0 ? "#a78bfa" : "#f87171" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,.1)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
        {/* KRW Stats */}
        {(stats.krwRevenue > 0 || stats.krwCost > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { icon: "💰", label: "รายรับรวม (KRW)", value: `₩${stats.krwRevenue.toLocaleString()}`, color: "#60a5fa" },
              { icon: "📤", label: "ต้นทุนรวม (KRW)", value: `₩${stats.krwCost.toLocaleString()}`, color: "#f87171" },
              { icon: stats.krwProfit >= 0 ? "📈" : "📉", label: "กำไรสุทธิ (KRW)", value: `${stats.krwProfit >= 0 ? "+" : ""}₩${stats.krwProfit.toLocaleString()}`, color: stats.krwProfit >= 0 ? "#a78bfa" : "#f87171" },
            ].map((stat, i) => (
              <div key={i} style={{ background: "#fffbeb", borderRadius: 12, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,.1)", border: "1px solid #fde68a" }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: 12, color: "#92400e", marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}
        {!(stats.krwRevenue > 0 || stats.krwCost > 0) && <div style={{ marginBottom: 32 }} />}

        {/* Menu Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 32 }}>
          {MENU_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              style={{
                background: activeMenu === item.id ? `linear-gradient(135deg, #${item.color.split(' ')[1].replace('to-', '')})` : "#fff",
                border: `2px solid ${activeMenu === item.id ? "#000" : "#e2e8f0"}`,
                borderRadius: 10,
                padding: "16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.3s",
                color: activeMenu === item.id ? "#fff" : "#1e293b",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        {activeMenu === "shipments" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 4px 6px rgba(0,0,0,.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#000" }}>บันทึกต้นทุนค่าส่งจริงที่บริษัทจ่ายออกไป</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setForm({ trackingNo: "", senderName: "", senderPhone: "", receiverName: "", receiverPhone: "", direction: "TH_TO_KR", cost: "", currency: "THB", notes: "", itemDesc: "" }); }}
                  style={{ background: "#facc15", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                >
                  {showAddForm ? "❌ ปิด" : "➕ เพิ่มรายการ"}
                </button>
                <button
                  onClick={loadShipments}
                  style={{ background: "#e2e8f0", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                >
                  🔄 รีเฟรช
                </button>
              </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div style={{ background: "#f8fafc", border: "2px solid #facc15", borderRadius: 12, padding: "16px", marginBottom: 20 }}>
                <form onSubmit={handleAddSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>เลขที่พัสดุ</label>
                    <input
                      type="text"
                      value={form.trackingNo}
                      onChange={e => setForm({ ...form, trackingNo: e.target.value })}
                      placeholder="CGO260510-00001"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>ชื่อผู้ส่ง</label>
                    <input
                      type="text"
                      value={form.senderName}
                      onChange={e => setForm({ ...form, senderName: e.target.value })}
                      placeholder="สมใจ ใจดี"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>เบอร์ผู้ส่ง</label>
                    <input
                      type="tel"
                      value={form.senderPhone}
                      onChange={e => setForm({ ...form, senderPhone: e.target.value })}
                      placeholder="0812345678"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>ชื่อผู้รับ</label>
                    <input
                      type="text"
                      value={form.receiverName}
                      onChange={e => setForm({ ...form, receiverName: e.target.value })}
                      placeholder="สมชาย มีสุข"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>เบอร์ผู้รับ</label>
                    <input
                      type="tel"
                      value={form.receiverPhone}
                      onChange={e => setForm({ ...form, receiverPhone: e.target.value })}
                      placeholder="0823456789"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>เส้นทาง</label>
                    <select
                      value={form.direction}
                      onChange={e => setForm({ ...form, direction: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                    >
                      <option value="TH_TO_KR">🇹🇭→🇰🇷 ไทย→เกาหลี</option>
                      <option value="KR_TO_TH">🇰🇷→🇹🇭 เกาหลี→ไทย</option>
                      <option value="SEA_KR_TO_TH">🚢 เรือ เกาหลี→ไทย</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>ต้นทุน</label>
                    <input
                      type="number"
                      value={form.cost}
                      onChange={e => setForm({ ...form, cost: e.target.value })}
                      placeholder="390"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>สกุลเงิน</label>
                    <select
                      value={form.currency}
                      onChange={e => setForm({ ...form, currency: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                    >
                      <option value="THB">฿ THB</option>
                      <option value="KRW">₩ KRW</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>หมายเหตุ</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="ค่าเครื่องบิน, ค่าขนส่งต่อ, ค่าจัดการ..."
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, minHeight: 60, resize: "vertical" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>รายการสินค้า</label>
                    <textarea
                      value={form.itemDesc}
                      onChange={e => setForm({ ...form, itemDesc: e.target.value })}
                      placeholder="เสื้อผ้า, อาหารแห้ง, เครื่องสำอาง..."
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, minHeight: 60, resize: "vertical" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
                    <button type="submit" style={{ flex: 1, background: "#facc15", color: "#000", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, cursor: "pointer" }}>
                      💾 {editingId ? "อัพเดต" : "บันทึก"}
                    </button>
                    <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, background: "#e2e8f0", color: "#000", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, cursor: "pointer" }}>
                      ❌ ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Shipments List - Compact Cost Recording Format */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>⏳ กำลังโหลด...</div>
            ) : error ? (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px", color: "#991b1b", fontSize: 12 }}>
                ⚠️ {error}
              </div>
            ) : shipments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>📭 ไม่มีรายการ</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {shipments.map((shipment, idx) => {
                  const currentCost = costForm[shipment.id]?.cost ?? shipment.cost ?? 0;
                  const currentNotes = costForm[shipment.id]?.notes ?? shipment.notes ?? "";
                  const isSaving = savingCosts[shipment.id];

                  return (
                    <div key={shipment.id || idx} style={{
                      background: "#f9fafb",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "16px",
                      borderLeft: "4px solid #facc15",
                    }}>
                      {/* Tracking Number */}
                      <div style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#facc15",
                        fontFamily: "monospace",
                        marginBottom: 8,
                      }}>
                        {shipment.trackingNo || shipment.number || "-"}
                      </div>

                      {/* Route Info */}
                      <div style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 12,
                        fontWeight: 500,
                      }}>
                        {shipment.senderName || "-"} → {shipment.receiverName || "-"} · {getDirectionLabel(shipment.direction)}
                      </div>

                      {/* Original Cost Display */}
                      <div style={{
                        fontSize: 12,
                        color: "#16a34a",
                        marginBottom: 12,
                        fontWeight: 600,
                        padding: "8px 10px",
                        background: "#f0fdf4",
                        borderRadius: 6,
                        border: "1px solid #bbf7d0",
                      }}>
                        ต้นทุนเดิม: {shipment.currency} {Number(shipment.cost || 0).toLocaleString()}
                      </div>

                      {/* Input Row */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto",
                        gap: 12,
                        alignItems: "flex-end",
                      }}>
                        {/* Cost Input */}
                        <div>
                          <label style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#64748b",
                            display: "block",
                            marginBottom: 4,
                          }}>
                            📤 ต้นทุน ({shipment.currency})
                          </label>
                          <input
                            type="number"
                            value={currentCost}
                            onChange={e => setCostForm(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], cost: e.target.value }
                            }))}
                            placeholder="390"
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              border: "1.5px solid #facc15",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              background: "#fffbeb",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        {/* Notes Input */}
                        <div>
                          <label style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#64748b",
                            display: "block",
                            marginBottom: 4,
                          }}>
                            💬 หมายเหตุ
                          </label>
                          <input
                            type="text"
                            value={currentNotes}
                            onChange={e => setCostForm(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], notes: e.target.value }
                            }))}
                            placeholder="ค่าเครื่องบิน, ค่าขนส่งต่อ..."
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid #cbd5e1",
                              borderRadius: 6,
                              fontSize: 12,
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={() => handleSaveCost(shipment.id, shipment.number)}
                          disabled={isSaving}
                          style={{
                            background: "#facc15",
                            color: "#000",
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 16px",
                            fontWeight: 700,
                            cursor: isSaving ? "wait" : "pointer",
                            fontSize: 12,
                            opacity: isSaving ? 0.7 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isSaving ? "⏳" : "💾"} บันทึก
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Print Section */}
        {activeMenu === "print" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px", boxShadow: "0 4px 6px rgba(0,0,0,.1)", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🖨️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#000", marginBottom: 12 }}>พิมพ์รายการส่งขนส่ง</div>
            <p style={{ color: "#64748b", marginBottom: 24 }}>เปิดหน้าพิมพ์แสดงรายการส่งสินค้าทั้งหมด พร้อมสามารถพิมพ์หรือบันทึกเป็น PDF</p>
            <a href="/cargo/admin/print" target="_blank" rel="noopener noreferrer">
              <button style={{ background: "#facc15", color: "#000", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                🖨️ เปิดหน้าพิมพ์
              </button>
            </a>
          </div>
        )}

        {/* Other sections placeholders */}
        {["update-status", "weight-cost", "payment", "summary", "customers", "rates", "customs"].includes(activeMenu) && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px", boxShadow: "0 4px 6px rgba(0,0,0,.1)", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
              {MENU_ITEMS.find(m => m.id === activeMenu)?.label}
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>Coming Soon...</div>
          </div>
        )}
      </div>
    </div>
  );
}
