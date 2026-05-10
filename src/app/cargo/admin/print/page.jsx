"use client";
import { useState, useEffect } from "react";
import { Printer, Download, X } from "lucide-react";

export default function CargoPrintPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cargo/admin/shipments");
      const data = await res.json();
      setShipments(Array.isArray(data) ? data : data.shipments || []);
    } catch (err) {
      console.error("Error loading shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = shipments.filter(s => {
    if (filter !== "all" && !s.trackingNo?.includes(filter)) return true;
    if (searchTerm && !s.trackingNo?.includes(searchTerm) && !s.senderName?.includes(searchTerm) && !s.receiverName?.includes(searchTerm)) return false;
    return true;
  });

  const getDirectionLabel = (dir) => {
    const labels = {
      "TH_TO_KR": "🇹🇭→🇰🇷",
      "KR_TO_TH": "🇰🇷→🇹🇭",
      "SEA_KR_TO_TH": "🚢🇰🇷→🇹🇭",
    };
    return labels[dir] || dir;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Simple approach: open print dialog to save as PDF
    // For more advanced PDF generation, you can use a library like jsPDF
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write(`
      <html>
        <head>
          <title>รายการส่งขนส่ง - ${new Date().toLocaleDateString('th-TH')}</title>
          <style>
            body { font-family: 'Noto Sans Thai', Arial; margin: 20px; }
            h1 { text-align: center; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f59e0b; color: #fff; padding: 12px; text-align: left; border: 1px solid #ddd; }
            td { padding: 10px; border: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9fafb; }
            .total { background: #dbeafe; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>รายการส่งขนส่ง - ไทย-เกาหลี</h1>
          <p style="text-align: center; color: #666;">สร้างเมื่อ ${new Date().toLocaleString('th-TH')}</p>
          <table>
            <thead>
              <tr>
                <th>เลขที่พัสดุ</th>
                <th>เส้นทาง</th>
                <th>ผู้ส่ง</th>
                <th>ผู้รับ</th>
                <th>ต้นทุน</th>
                <th>สถานะ</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(s => `
                <tr>
                  <td>${s.trackingNo || s.number || '-'}</td>
                  <td>${getDirectionLabel(s.direction)}</td>
                  <td>${s.senderName || '-'}</td>
                  <td>${s.receiverName || '-'}</td>
                  <td>${s.currency} ${Number(s.cost || 0).toLocaleString()}</td>
                  <td>${s.warehouseReceived ? '✅ รับแล้ว' : '⏳ รอรับ'}</td>
                  <td>${s.notes || '-'}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="4" style="text-align: right;">รวมต้นทุนทั้งหมด:</td>
                <td colspan="3">
                  THB ${filtered.reduce((sum, s) => sum + (s.currency === 'THB' ? Number(s.cost || 0) : 0), 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Print Header - Hidden on screen, shown on print */}
      <style>{`
        @media print {
          .no-print { display: none; }
          body { margin: 0; padding: 10px; }
          .print-container { page-break-inside: avoid; }
        }
        @media screen {
          .print-header { display: none; }
        }
      `}</style>

      {/* Screen View */}
      <div className="no-print" style={{ background: "linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)", padding: "20px", borderBottom: "2px solid #facc15" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>🖨️ พิมพ์รายการส่งขนส่ง</h1>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>ไทย-เกาหลี · {new Date().toLocaleDateString('th-TH')}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handlePrint}
                style={{
                  background: "#facc15",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <Printer size={18} />
                พิมพ์
              </button>
              <button
                onClick={handleDownloadPDF}
                style={{
                  background: "#e2e8f0",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <Download size={18} />
                PDF
              </button>
              <a href="/cargo/admin" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: "10px 16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  <X size={18} />
                  ปิด
                </button>
              </a>
            </div>
          </div>

          {/* Search and Filter */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="ค้นหาเลขที่พัสดุ, ชื่อผู้ส่ง, ชื่อผู้รับ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: 250,
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 13,
                background: "#fff",
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="TH_TO_KR">🇹🇭→🇰🇷 ไทย→เกาหลี</option>
              <option value="KR_TO_TH">🇰🇷→🇹🇭 เกาหลี→ไทย</option>
              <option value="received">✅ รับแล้ว</option>
              <option value="pending">⏳ รอรับ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Print View */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <div className="print-header" style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 900 }}>🖨️ รายการส่งขนส่ง</h1>
          <p style={{ margin: "4px 0", color: "#64748b", fontSize: 14 }}>บริการคาโก้ไทย-เกาหลี | Goeun Server Hub</p>
          <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 12 }}>พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>⏳ กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>📭 ไม่มีรายการ</div>
        ) : (
          <>
            {/* Stats Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 32 }}>
              {[
                { label: "รายการทั้งหมด", value: filtered.length, color: "#facc15" },
                { label: "จัดส่งสำเร็จ", value: filtered.filter(s => s.warehouseReceived).length, color: "#4ade80" },
                { label: "ต้นทุนรวม (THB)", value: `฿${filtered.filter(s => s.currency === 'THB').reduce((sum, s) => sum + Number(s.cost || 0), 0).toLocaleString()}`, color: "#60a5fa" },
                { label: "ต้นทุนรวม (KRW)", value: `₩${filtered.filter(s => s.currency === 'KRW').reduce((sum, s) => sum + Number(s.cost || 0), 0).toLocaleString()}`, color: "#f87171" },
              ].map((stat, i) => (
                <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Main Table */}
            <div style={{ overflowX: "auto", background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}>
                <thead>
                  <tr style={{ background: "#f59e0b", color: "#fff" }}>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #d97706" }}>เลขที่พัสดุ</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #d97706" }}>เส้นทาง</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #d97706" }}>ผู้ส่ง</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #d97706" }}>เบอร์ผู้ส่ง</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #d97706" }}>ผู้รับ</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #d97706" }}>เบอร์ผู้รับ</th>
                    <th style={{ padding: "14px 12px", textAlign: "center", fontWeight: 700, borderBottom: "2px solid #d97706" }}>ต้นทุน</th>
                    <th style={{ padding: "14px 12px", textAlign: "center", fontWeight: 700, borderBottom: "2px solid #d97706" }}>สถานะ</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #d97706" }}>หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((shipment, idx) => (
                    <tr
                      key={shipment.id || idx}
                      style={{
                        background: idx % 2 === 0 ? "#f9fafb" : "#fff",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#facc15" }}>{shipment.trackingNo || shipment.number || "-"}</td>
                      <td style={{ padding: "10px 12px" }}>{getDirectionLabel(shipment.direction)}</td>
                      <td style={{ padding: "10px 12px" }}>{shipment.senderName || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12 }}>{shipment.senderPhone || "-"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{shipment.receiverName || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12 }}>{shipment.receiverPhone || "-"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#60a5fa" }}>
                        {shipment.currency} {Number(shipment.cost || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: shipment.warehouseReceived ? "#dbeafe" : "#fee2e2",
                          color: shipment.warehouseReceived ? "#0c4a6e" : "#7f1d1d",
                        }}>
                          {shipment.warehouseReceived ? "✅ รับแล้ว" : "⏳ รอรับ"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b", maxWidth: 200, wordBreak: "break-word" }}>
                        {shipment.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Left: Details */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#000" }}>📊 สรุปข้อมูล</h3>
                <div style={{ fontSize: 12, lineHeight: 1.8, color: "#64748b" }}>
                  <div><strong>รวมรายการทั้งหมด:</strong> {filtered.length} รายการ</div>
                  <div><strong>จัดส่งสำเร็จ:</strong> {filtered.filter(s => s.warehouseReceived).length} รายการ</div>
                  <div><strong>รอรับสินค้า:</strong> {filtered.filter(s => !s.warehouseReceived).length} รายการ</div>
                </div>
              </div>

              {/* Right: Costs Summary */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#000" }}>💰 สรุปต้นทุน</h3>
                <div style={{ fontSize: 12, lineHeight: 1.8, color: "#64748b" }}>
                  <div><strong>THB รวม:</strong> ฿{filtered.filter(s => s.currency === "THB").reduce((sum, s) => sum + Number(s.cost || 0), 0).toLocaleString()}</div>
                  <div><strong>KRW รวม:</strong> ₩{filtered.filter(s => s.currency === "KRW").reduce((sum, s) => sum + Number(s.cost || 0), 0).toLocaleString()}</div>
                  <div><strong>USD รวม:</strong> ${filtered.filter(s => s.currency === "USD").reduce((sum, s) => sum + Number(s.cost || 0), 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Print Footer */}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: "2px solid #e2e8f0", textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
              <p style={{ margin: 0 }}>© {new Date().getFullYear()} Goeun Server Hub · บริการคาโก้ไทย-เกาหลี</p>
              <p style={{ margin: "4px 0 0" }}>Document printed: {new Date().toLocaleString('th-TH')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
