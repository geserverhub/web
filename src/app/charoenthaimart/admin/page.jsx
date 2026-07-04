"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

function fmtK(v) {
  v = Number(v) || 0;
  if (v >= 1000000) return `₩${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `₩${(v / 1000).toFixed(0)}K`;
  return `₩${v}`;
}

function BarChart({ data, height = 170 }) {
  if (!data || data.length === 0) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีข้อมูล</div>;
  const W = 600, H = height;
  const pad = { l: 52, r: 12, t: 18, b: 28 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const maxVal = Math.max(...data.flatMap(d => [d.revenue, Math.max(0, d.profit)]), 1);
  const groupW = cw / data.length;
  const barW = Math.min(groupW * 0.28, 26);
  const barY = (v) => pad.t + ch - (Math.max(0, v) / maxVal) * ch;
  const barH = (v) => (Math.max(0, v) / maxVal) * ch;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible", display: "block" }}>
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = pad.t + p * ch;
        return (
          <g key={p}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y} stroke="#f3f4f6" strokeWidth="1"/>
            <text x={pad.l - 4} y={y + 4} fontSize="9" fill="#9ca3af" textAnchor="end">{fmtK(maxVal * (1 - p))}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = pad.l + i * groupW + groupW / 2;
        return (
          <g key={d.month}>
            <rect x={cx - barW - 2} y={barY(d.revenue)} width={barW} height={barH(d.revenue)} rx="2" fill="#fbbf24" opacity="0.9"/>
            <rect x={cx + 2} y={barY(d.profit)} width={barW} height={barH(d.profit)} rx="2" fill="#4ade80" opacity="0.9"/>
            <text x={cx} y={H - pad.b + 14} fontSize="9.5" fill="#6b7280" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
      <rect x={pad.l} y={4} width={10} height={8} fill="#fbbf24" rx="1"/>
      <text x={pad.l + 13} y={11} fontSize="10" fill="#6b7280">ยอดขาย</text>
      <rect x={pad.l + 65} y={4} width={10} height={8} fill="#4ade80" rx="1"/>
      <text x={pad.l + 78} y={11} fontSize="10" fill="#6b7280">กำไรสุทธิ</text>
    </svg>
  );
}

function LineChart({ points, height = 80, color = "#3b82f6" }) {
  if (!points || points.length < 2) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>ยังไม่มีข้อมูล</div>;
  const W = 600, H = height;
  const pad = { l: 8, r: 8, t: 8, b: 8 };
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
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.03"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)"/>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {points.map((p, i) => p.v > 0 && (
        <circle key={i} cx={px(i)} cy={py(p.v)} r="3" fill={color} stroke="#fff" strokeWidth="1.5"/>
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
  const [apiStatus, setApiStatus] = useState({ checked: false, ok: false, ms: null });

  const nowMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const months = getLast6Months();
    const monthLabels = { "01":"ม.ค","02":"ก.พ","03":"มี.ค","04":"เม.ย","05":"พ.ค","06":"มิ.ย","07":"ก.ค","08":"ส.ค","09":"ก.ย","10":"ต.ค","11":"พ.ย","12":"ธ.ค" };

    // Fetch all months in parallel
    const t0 = Date.now();
    Promise.all([
      ...months.map(m => fetch(`/api/ctm/sales?month=${m}`).then(r => r.json())),
      fetch("/api/ctm/products").then(r => r.json()),
      fetch("/api/ctm/customers").then(r => r.json()),
    ]).then(results => {
      const ms = Date.now() - t0;
      setApiStatus({ checked: true, ok: true, ms });

      const monthResults = results.slice(0, 6);
      const products = results[6];
      const customers = results[7];
      const current = monthResults[5];

      setStats({
        revenue: current.totalRevenue || 0,
        tax: current.totalTax || 0,
        profit: current.profit || 0,
        products: products.products?.length || 0,
        customers: customers.customers?.length || 0,
        salesCount: current.sales?.length || 0,
      });

      setMonthlyData(months.map((m, i) => ({
        month: m,
        label: monthLabels[m.slice(5)] || m.slice(5),
        revenue: monthResults[i].totalRevenue || 0,
        profit: monthResults[i].profit || 0,
      })));

      // Build daily chart for current month
      const salesThisMonth = current.sales || [];
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const byDay = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, v: 0 }));
      salesThisMonth.forEach(s => {
        const day = new Date(s.saleDate).getDate() - 1;
        if (byDay[day]) byDay[day].v += Number(s.totalAmount);
      });
      setDailyPoints(byDay);
    }).catch(() => setApiStatus({ checked: true, ok: false, ms: null }));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#92400e", margin: 0 }}>แดชบอร์ด · เจริญไทยมาร์ท ซูวอน</h1>
          <p style={{ fontSize: 13, color: "#a16207", margin: "4px 0 0" }}>ภาพรวมเดือนนี้ — {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</p>
        </div>
        {apiStatus.checked && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: apiStatus.ok ? "#dcfce7" : "#fee2e2", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: apiStatus.ok ? "#166534" : "#b91c1c" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: apiStatus.ok ? "#16a34a" : "#dc2626", display: "inline-block" }}/>
            API {apiStatus.ok ? `ออนไลน์ · ${apiStatus.ms}ms` : "ออฟไลน์"}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "ยอดขาย (inc VAT)", value: `₩${fmt(stats?.revenue)}`, color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
          { label: "VAT 10%", value: `₩${fmt(stats?.tax)}`, color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
          { label: "กำไรสุทธิ", value: `₩${fmt(stats?.profit)}`, color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
          { label: "ออเดอร์เดือนนี้", value: `${stats?.salesCount ?? "—"} ใบ`, color: "#be185d", bg: "#fce7f3", border: "#fbcfe8" },
          { label: "สินค้าทั้งหมด", value: `${stats?.products ?? "—"} รายการ`, color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
          { label: "ลูกค้าในระบบ", value: `${stats?.customers ?? "—"} คน`, color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{stats ? c.value : "—"}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Monthly bar chart */}
        <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>ผลประกอบการ 6 เดือนล่าสุด</div>
          <BarChart data={monthlyData} />
        </div>
        {/* Daily line chart */}
        <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 4 }}>ยอดขายรายวันเดือนนี้</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>แต่ละจุด = 1 วัน</div>
          <div style={{ flex: 1 }}>
            <LineChart points={dailyPoints} height={140} color="#b45309" />
          </div>
          {dailyPoints.some(p => p.v > 0) && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}>
              สูงสุด: <strong style={{ color: "#b45309" }}>{fmtK(Math.max(...dailyPoints.map(p => p.v)))}</strong>
              {" · "}เฉลี่ย/วัน: <strong>{fmtK(dailyPoints.filter(p => p.v > 0).reduce((s, p) => s + p.v, 0) / Math.max(1, dailyPoints.filter(p => p.v > 0).length))}</strong>
            </div>
          )}
        </div>
      </div>

      {/* API Monitor */}
      <div style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>มอนิเตอร์ API</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
          {[
            { name: "Sales API", endpoint: "/api/ctm/sales" },
            { name: "Products API", endpoint: "/api/ctm/products" },
            { name: "Promotions API", endpoint: "/api/ctm/promotions/public" },
            { name: "Announcements API", endpoint: "/api/ctm/announcements" },
          ].map(api => (
            <ApiPing key={api.endpoint} name={api.name} endpoint={api.endpoint} />
          ))}
        </div>
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

function ApiPing({ name, endpoint }) {
  const [status, setStatus] = useState("checking"); // checking | ok | error
  const [ms, setMs] = useState(null);

  useEffect(() => {
    const t0 = Date.now();
    fetch(endpoint).then(r => {
      setMs(Date.now() - t0);
      setStatus(r.ok || r.status === 403 ? "ok" : "error");
    }).catch(() => setStatus("error"));
  }, [endpoint]);

  const colors = { checking: ["#f3f4f6", "#9ca3af"], ok: ["#dcfce7", "#15803d"], error: ["#fee2e2", "#b91c1c"] };
  const [bg, fg] = colors[status];
  return (
    <div style={{ background: bg, borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: fg }}>{status === "checking" ? "⏳" : status === "ok" ? "✅" : "❌"} {name}</div>
      <div style={{ fontSize: 10, color: fg, opacity: 0.8 }}>{status === "checking" ? "กำลังตรวจสอบ..." : status === "ok" ? `${ms}ms · ออนไลน์` : "ไม่สามารถเชื่อมต่อ"}</div>
    </div>
  );
}
