"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function fmtK(v) {
  v = Number(v) || 0;
  if (v >= 1000000) return `₩${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `₩${(v / 1000).toFixed(0)}K`;
  return `₩${v}`;
}

function BarChart({ data, height = 240 }) {
  if (!data || data.length === 0) {
    const W = 720, H = height;
    const pad = { l: 64, r: 24, t: 28, b: 36 };
    const cw = W - pad.l - pad.r; const ch = H - pad.t - pad.b;
    const skH = [0.7, 0.4, 0.85, 0.55, 0.3, 0.65];
    const groupW = cw / 6; const barW = Math.min(groupW * 0.32, 32);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible", display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map(p => <line key={p} x1={pad.l} y1={pad.t + p * ch} x2={pad.l + cw} y2={pad.t + p * ch} stroke="#e2e8f0" strokeWidth="1"/>)}
        {skH.map((h, i) => {
          const cx = pad.l + i * groupW + groupW / 2;
          return (<g key={i}>
            <rect x={cx - barW - 4} y={pad.t + ch - h * ch} width={barW} height={h * ch} rx="4" fill="#e5e7eb"/>
            <rect x={cx + 4} y={pad.t + ch - h * 0.55 * ch} width={barW} height={h * 0.55 * ch} rx="4" fill="#f3f4f6"/>
            <text x={cx} y={H - pad.b + 16} fontSize="11" fill="#d1d5db" textAnchor="middle">—</text>
          </g>);
        })}
      </svg>
    );
  }
  const W = 720, H = height;
  const pad = { l: 64, r: 24, t: 28, b: 36 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const maxVal = Math.max(...data.flatMap(d => [d.revenue, Math.max(0, d.profit)]), 1);
  const groupW = cw / data.length;
  const barW = Math.min(groupW * 0.32, 32);
  const barY = (v) => pad.t + ch - (Math.max(0, v) / maxVal) * ch;
  const barH = (v) => (Math.max(0, v) / maxVal) * ch;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible", display: "block" }}>
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = pad.t + p * ch;
        return (
          <g key={p}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke="#e2e8f0" strokeWidth="1"/>
            <text x={pad.l - 8} y={y + 4} fontSize="10" fill="#4b5563" textAnchor="end">{fmtK(maxVal * (1 - p))}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = pad.l + i * groupW + groupW / 2;
        return (
          <g key={d.month}>
            <rect x={cx - barW - 4} y={barY(d.revenue)} width={barW} height={barH(d.revenue)} rx="4" fill="#f59e0b" opacity="0.95"/>
            <rect x={cx + 4} y={barY(d.profit)} width={barW} height={barH(d.profit)} rx="4" fill="#16a34a" opacity="0.95"/>
            <text x={cx} y={H - pad.b + 16} fontSize="11" fill="#475569" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
      <rect x={pad.l} y={8} width={12} height={8} fill="#f59e0b" rx="2"/>
      <text x={pad.l + 16} y={15} fontSize="11" fill="#475569">ยอดขาย</text>
      <rect x={pad.l + 84} y={8} width={12} height={8} fill="#16a34a" rx="2"/>
      <text x={pad.l + 100} y={15} fontSize="11" fill="#475569">กำไรสุทธิ</text>
    </svg>
  );
}

function LineChart({ points, height = 180, color = "#b45309" }) {
  if (!points || points.length < 2) {
    const W = 720, H = height;
    const pad = { l: 56, r: 16, t: 20, b: 28 };
    const cw = W - pad.l - pad.r; const ch = H - pad.t - pad.b;
    const n = 30;
    const midY = pad.t + ch / 2;
    const skPath = Array.from({ length: n }, (_, i) => {
      const x = pad.l + (i / (n - 1)) * cw;
      const wave = Math.sin(i * 0.6) * ch * 0.12;
      return `${i === 0 ? "M" : "L"}${x},${midY + wave}`;
    }).join(" ");
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {[0, 0.33, 0.66, 1].map(p => <line key={p} x1={pad.l} y1={pad.t + p * ch} x2={pad.l + cw} y2={pad.t + p * ch} stroke="#e5e7eb" strokeWidth="1"/>)}
        <path d={skPath} fill="none" stroke="#e5e7eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="8 4"/>
      </svg>
    );
  }
  const W = 720, H = height;
  const pad = { l: 56, r: 16, t: 20, b: 28 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const maxV = Math.max(...points.map(p => p.v), 1);
  const px = (i) => pad.l + (i / (points.length - 1)) * cw;
  const py = (v) => pad.t + ch - (v / maxV) * ch;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(p.v)}`).join(" ");
  const area = `${d} L${px(points.length - 1)},${H - pad.b} L${px(0)},${H - pad.b} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.04"/>
        </linearGradient>
      </defs>
      {[0, 0.33, 0.66, 1].map((p) => {
        const y = pad.t + p * ch;
        return (
          <g key={p}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke="#e5e7eb" strokeWidth="1"/>
            <text x={pad.l - 8} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{fmtK(maxV * (1 - p))}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#lg)"/>
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      {points.map((p, i) => p.v > 0 && (
        <circle key={i} cx={px(i)} cy={py(p.v)} r="4" fill={color} stroke="#fff" strokeWidth="2"/>
      ))}
      {(() => {
        const tickEvery = points.length > 20 ? 5 : points.length > 10 ? 2 : 1;
        return points.map((p, i) => (i % tickEvery === 0 || i === points.length - 1) && (
          <text key={`t${i}`} x={px(i)} y={H - pad.b + 16} fontSize="10" fill="#9ca3af" textAnchor="middle">{p.day}</text>
        ));
      })()}
    </svg>
  );
}

function FlexBarChart({ data, series, height = 220 }) {
  if (!data || data.length === 0) {
    const W = 680, H = height;
    const pad = { l: 56, r: 16, t: 24, b: 32 };
    const cw = W - pad.l - pad.r; const ch = H - pad.t - pad.b;
    const n = 6; const gW = cw / n; const bW = Math.min(gW * 0.22, 22);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map(p => <line key={p} x1={pad.l} y1={pad.t + p * ch} x2={pad.l + cw} y2={pad.t + p * ch} stroke="#e2e8f0" strokeWidth="1"/>)}
        {Array.from({length: n}, (_, i) => {
          const cx = pad.l + i * gW + gW / 2;
          const h = [0.6,0.35,0.8,0.5,0.25,0.7][i];
          return <rect key={i} x={cx - bW} y={pad.t + ch - h * ch} width={bW * 1.8} height={h * ch} rx="4" fill="#e5e7eb"/>;
        })}
      </svg>
    );
  }
  const W = 680, H = height;
  const pad = { l: 56, r: 16, t: 24, b: 32 };
  const cw = W - pad.l - pad.r; const ch = H - pad.t - pad.b;
  const maxVal = Math.max(...data.flatMap(d => series.map(s => Number(d[s.key] || 0))), 1);
  const groupW = cw / data.length;
  const barsN = series.length;
  const totalBarW = Math.min(groupW * 0.72, 26 * barsN);
  const bW = totalBarW / barsN;
  const barY = (v) => pad.t + ch - (Math.max(0, v) / maxVal) * ch;
  const barH = (v) => (Math.max(0, v) / maxVal) * ch;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = pad.t + p * ch;
        return <g key={p}><line x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke="#e2e8f0" strokeWidth="1"/>
          <text x={pad.l - 6} y={y + 4} fontSize="9" fill="#9ca3af" textAnchor="end">{fmtK(maxVal * (1 - p))}</text></g>;
      })}
      {data.map((d, i) => {
        const cx = pad.l + i * groupW + groupW / 2;
        const startX = cx - totalBarW / 2;
        return (
          <g key={i}>
            {series.map((s, si) => (
              <rect key={s.key} x={startX + si * bW} y={barY(d[s.key] || 0)} width={bW - 2} height={barH(d[s.key] || 0)} rx="3" fill={s.color} opacity="0.9"/>
            ))}
            <text x={cx} y={H - pad.b + 14} fontSize="10" fill="#6b7280" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
      {/* Legend */}
      {series.map((s, i) => (
        <g key={s.key} transform={`translate(${pad.l + i * 90}, 8)`}>
          <rect width="10" height="8" fill={s.color} rx="2"/>
          <text x="14" y="7" fontSize="10" fill="#6b7280">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

const QUICK = [
  { href: "/charoenthaimart/admin/products/add", icon: "➕", label: "เพิ่มสินค้า", color: "#15803d" },
  { href: "/charoenthaimart/admin/sales", icon: "💰", label: "บันทึกยอดขาย", color: "#b45309" },
  { href: "/charoenthaimart/admin/promotions", icon: "🏷️", label: "จัดโปรโมชั่น", color: "#dc2626" },
  { href: "/charoenthaimart/admin/expenses", icon: "📋", label: "บันทึกรายจ่าย", color: "#7c3aed" },
  { href: "/charoenthaimart/admin/partner-shares", icon: "🤝", label: "ส่วนแบ่งหุ้นส่วน", color: "#0369a1" },
  { href: "/charoenthaimart/admin/tax", icon: "🧾", label: "บัญชีภาษี VAT", color: "#166534" },
  { href: "/charoenthaimart/admin/announcements", icon: "📣", label: "แก้ไขประกาศ", color: "#be185d" },
  { href: "/charoenthaimart", icon: "🛒", label: "หน้าร้าน", color: "#64748b" },
];

export default function CtmAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyPoints, setDailyPoints] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsTab, setAnalyticsTab] = useState("sales");

  useEffect(() => {
    const monthLabels = { "01":"ม.ค","02":"ก.พ","03":"มี.ค","04":"เม.ย","05":"พ.ค","06":"มิ.ย","07":"ก.ค","08":"ส.ค","09":"ก.ย","10":"ต.ค","11":"พ.ย","12":"ธ.ค" };

    Promise.all([
      fetch("/api/ctm/sales?months=6").then(r => r.json()),
      fetch("/api/ctm/products").then(r => r.json()),
      fetch("/api/ctm/customers").then(r => r.json()),
      fetch("/api/ctm/expenses?months=6").then(r => r.json()),
      fetch("/api/ctm/analytics?months=6").then(r => r.json()),
    ]).then(([salesBuckets, products, customers, expBuckets, analyticsData]) => {
      const monthResults = salesBuckets.months || [];
      const expResults = expBuckets.months || [];
      const currentSales = salesBuckets.currentSales || [];
      const current = monthResults[monthResults.length - 1] || {};

      setStats({
        revenue: current.totalRevenue || 0,
        tax: current.totalTax || 0,
        profit: current.profit || 0,
        expense: expResults[expResults.length - 1]?.total || 0,
        products: products.products?.length || 0,
        customers: customers.customers?.length || 0,
        salesCount: current.salesCount || 0,
      });

      const md = monthResults.map((m, i) => ({
        month: m.month,
        label: monthLabels[m.month.slice(5)] || m.month.slice(5),
        revenue: m.totalRevenue || 0,
        profit: m.profit || 0,
        expense: expResults[i]?.total || 0,
      }));
      setMonthlyData(md);
      setMonthlyExpenses(expResults.map(e => ({ label: monthLabels[e.month.slice(5)], total: e.total || 0, byCategory: e.byCategory || {} })));

      // Daily chart
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const byDay = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, v: 0 }));
      currentSales.forEach(s => {
        const day = new Date(s.saleDate).getDate() - 1;
        if (byDay[day]) byDay[day].v += Number(s.totalAmount);
      });
      setDailyPoints(byDay);
      setAnalytics(analyticsData);
    }).catch(() => {});
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");

  return (
    <div style={{ padding: "32px 34px", background: "#f8fafc" }}>
      <style>{`@keyframes ctm-ping { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.18);opacity:.15} }`}</style>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>แดชบอร์ด · เจริญไทยมาร์ท ซูวอน</h1>
          <p style={{ fontSize: 14, color: "#475569", margin: "6px 0 0" }}>ภาพรวมเดือนนี้ — {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</p>
        </div>
        {stats && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#def7ec", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#166534" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", display: "inline-block" }}/>
            ออนไลน์
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginBottom: 30 }}>
        {[
          { label: "ยอดขาย (inc VAT)", value: `₩${fmt(stats?.revenue)}`, color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
          { label: "VAT 10%", value: `₩${fmt(stats?.tax)}`, color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
          { label: "กำไรสุทธิ", value: `₩${fmt(stats?.profit)}`, color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
          { label: "รายจ่ายเดือนนี้", value: `₩${fmt(stats?.expense)}`, color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
          { label: "ออเดอร์เดือนนี้", value: `${stats?.salesCount ?? "—"} ใบ`, color: "#be185d", bg: "#fce7f3", border: "#fbcfe8" },
          { label: "สินค้าทั้งหมด", value: `${stats?.products ?? "—"} รายการ`, color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
          { label: "ลูกค้าในระบบ", value: `${stats?.customers ?? "—"} คน`, color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)" }}>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 6, fontWeight: 700 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: c.color, lineHeight: 1.05 }}>{stats ? c.value : "—"}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>
        {/* Monthly bar chart */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "22px 24px", boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 14 }}>ผลประกอบการ 6 เดือนล่าสุด</div>
          <BarChart data={monthlyData} />
        </div>
        {/* Daily line chart */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 6 }}>ยอดขายรายวันเดือนนี้</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>แต่ละจุด = 1 วัน</div>
          <div style={{ flex: 1 }}>
            <LineChart points={dailyPoints} height={180} color="#b45309" />
          </div>
          {dailyPoints.some(p => p.v > 0) && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#475569" }}>
              สูงสุด: <strong style={{ color: "#b45309" }}>{fmtK(Math.max(...dailyPoints.map(p => p.v)))}</strong>
              {" "}(วันที่ {dailyPoints.reduce((best, p) => p.v > best.v ? p : best, dailyPoints[0]).day})
              {" · "}เฉลี่ย/วัน: <strong>{fmtK(dailyPoints.filter(p => p.v > 0).reduce((s, p) => s + p.v, 0) / Math.max(1, dailyPoints.filter(p => p.v > 0).length))}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 14 }}>วิเคราะห์ข้อมูล</div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "2px solid #f3f4f6", paddingBottom: 0 }}>
          {[["sales","ยอดขาย"],["expenses","รายจ่าย"],["pnl","กำไร-ขาดทุน"],["products","สินค้า"],["customers","ลูกค้า"]].map(([k, l]) => (
            <button key={k} onClick={() => setAnalyticsTab(k)}
              style={{ padding: "8px 16px", border: "none", borderBottom: analyticsTab === k ? "2px solid #b45309" : "2px solid transparent", background: "none", fontWeight: analyticsTab === k ? 700 : 400, color: analyticsTab === k ? "#b45309" : "#6b7280", cursor: "pointer", fontSize: 13, marginBottom: -2 }}>
              {l}
            </button>
          ))}
        </div>

        {/* ยอดขาย */}
        {analyticsTab === "sales" && (
          <div>
            <FlexBarChart data={monthlyData} height={220}
              series={[{key:"revenue",color:"#f59e0b",label:"ยอดขาย"},{key:"profit",color:"#16a34a",label:"กำไรขั้นต้น"}]} />
          </div>
        )}

        {/* รายจ่าย */}
        {analyticsTab === "expenses" && (
          <div>
            <FlexBarChart data={monthlyExpenses} height={220}
              series={[{key:"total",color:"#ef4444",label:"รายจ่าย"}]} />
            {/* Top category breakdown for latest month */}
            {monthlyExpenses.length > 0 && Object.keys(monthlyExpenses[monthlyExpenses.length - 1]?.byCategory || {}).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>หมวดหมู่เดือนล่าสุด</div>
                {(() => {
                  const cat = monthlyExpenses[monthlyExpenses.length - 1].byCategory;
                  const maxAmt = Math.max(...Object.values(cat));
                  return Object.entries(cat).sort((a,b) => b[1]-a[1]).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 80, fontSize: 11, color: "#374151", flexShrink: 0 }}>{k}</div>
                      <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 4, height: 10 }}>
                        <div style={{ width: `${(v / maxAmt) * 100}%`, background: "#ef4444", height: 10, borderRadius: 4, transition: "width .6s" }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", flexShrink: 0, minWidth: 70, textAlign: "right" }}>₩{fmt(v)}</div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* กำไร-ขาดทุน */}
        {analyticsTab === "pnl" && (
          <div>
            <FlexBarChart data={monthlyData.map(d => ({ ...d, net: d.profit - (d.expense || 0) }))} height={220}
              series={[{key:"revenue",color:"#f59e0b",label:"ยอดขาย"},{key:"expense",color:"#ef4444",label:"รายจ่าย"},{key:"net",color:"#16a34a",label:"กำไรสุทธิ"}]} />
          </div>
        )}

        {/* สินค้า */}
        {analyticsTab === "products" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d", marginBottom: 12 }}>🏆 สินค้าขายดี TOP 10 (6 เดือน)</div>
              {!analytics ? <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div> : analytics.topProducts.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>ยังไม่มีข้อมูล</div> : (() => {
                const maxQ = Math.max(...analytics.topProducts.map(p => p.qty), 1);
                return analytics.topProducts.map((p, i) => (
                  <div key={p.productId} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 8 }}>
                        <span style={{ color: i < 3 ? "#b45309" : "#9ca3af", fontWeight: 800, marginRight: 5 }}>#{i+1}</span>{p.name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", flexShrink: 0 }}>{p.qty} ชิ้น</span>
                    </div>
                    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 8 }}>
                      <div style={{ width: `${(p.qty / maxQ) * 100}%`, background: i < 3 ? "#f59e0b" : "#16a34a", height: 8, borderRadius: 4, transition: "width .6s" }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c", marginBottom: 12 }}>📦 สินค้ายังไม่มียอดขาย</div>
              {!analytics ? <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div> : analytics.deadProducts.length === 0 ? <div style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>🎉 ทุกสินค้ามียอดขายแล้ว</div> : (
                <div>
                  {analytics.deadProducts.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fca5a5", flexShrink: 0 }} />
                      <div style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{p.name}</div>
                      <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>สต็อก {p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ลูกค้า */}
        {analyticsTab === "customers" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 12 }}>👑 จัดอันดับลูกค้า (6 เดือน)</div>
            {!analytics ? <div style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</div> : analytics.topCustomers.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>ยังไม่มีข้อมูล</div> : (() => {
              const maxT = Math.max(...analytics.topCustomers.map(c => c.total), 1);
              return analytics.topCustomers.map((c, i) => (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                      <span style={{ color: i < 3 ? "#0369a1" : "#9ca3af", fontWeight: 800, marginRight: 5 }}>#{i+1}</span>{c.name}
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0, marginRight: 10 }}>{c.count}ครั้ง</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", flexShrink: 0 }}>₩{fmt(c.total)}</span>
                  </div>
                  <div style={{ background: "#f3f4f6", borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${(c.total / maxT) * 100}%`, background: i < 3 ? "#0ea5e9" : "#7dd3fc", height: 8, borderRadius: 4, transition: "width .6s" }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Quick shortcuts */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 10 }}>ทางลัด</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
        {QUICK.map(q => (
          <Link key={q.href} href={q.href} style={{ display: "flex", flexDirection: "column", gap: 5, background: "#fff", border: `1.5px solid ${q.color}20`, borderRadius: 10, padding: "14px 16px", textDecoration: "none", color: q.color, fontWeight: 700, fontSize: 12, transition: "background .1s" }}>
            <span style={{ fontSize: 20 }}>{q.icon}</span>
            {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

