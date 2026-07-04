"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const S = {
  wrap: { padding: "28px 32px" },
  header: { marginBottom: 28 },
  h1: { fontSize: 22, fontWeight: 800, color: "#92400e", margin: 0 },
  sub: { fontSize: 13, color: "#a16207", margin: "4px 0 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 32 },
  card: (c) => ({ background: "#fff", border: `1.5px solid ${c}`, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }),
  label: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  value: (c) => ({ fontSize: 28, fontWeight: 800, color: c }),
  shortcuts: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 },
  btn: (c) => ({ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: `1.5px solid ${c}`, borderRadius: 10, padding: "16px 18px", textDecoration: "none", color: c, fontWeight: 700, fontSize: 13 }),
};

const QUICK = [
  { href: "/charoenthaimart/admin/products/add", icon: "➕", label: "เพิ่มสินค้า", color: "#15803d" },
  { href: "/charoenthaimart/admin/barcode", icon: "🔖", label: "พิมพ์บาร์โค้ด", color: "#7c3aed" },
  { href: "/charoenthaimart/admin/sales", icon: "💰", label: "ดูยอดขาย", color: "#b45309" },
  { href: "/charoenthaimart/admin/customers", icon: "👥", label: "จัดการลูกค้า", color: "#0369a1" },
  { href: "/charoenthaimart/admin/suppliers", icon: "🤝", label: "จัดการคู่ค้า", color: "#be185d" },
  { href: "/charoenthaimart/admin/tax", icon: "🧾", label: "บัญชีภาษี", color: "#166534" },
];

export default function CtmAdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    Promise.all([
      fetch("/api/ctm/sales?month=" + month).then(r => r.json()),
      fetch("/api/ctm/products").then(r => r.json()),
      fetch("/api/ctm/customers").then(r => r.json()),
    ]).then(([sales, products, customers]) => {
      setStats({
        revenue: sales.totalRevenue || 0,
        profit: sales.profit || 0,
        products: products.products?.length || 0,
        customers: customers.customers?.length || 0,
        salesCount: sales.sales?.length || 0,
      });
    }).catch(() => {});
  }, []);

  const fmt = (n) => Number(n).toLocaleString("th-TH", { minimumFractionDigits: 0 });

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h1 style={S.h1}>แดชบอร์ด · เจริญไทยมาร์ท ซูวอน</h1>
        <p style={S.sub}>ภาพรวมเดือนนี้ — {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</p>
      </div>
      <div style={S.grid}>
        <div style={S.card("#fde68a")}>
          <div style={S.label}>ยอดขายเดือนนี้</div>
          <div style={S.value("#b45309")}>₩{stats ? fmt(stats.revenue) : "—"}</div>
        </div>
        <div style={S.card("#bbf7d0")}>
          <div style={S.label}>กำไรสุทธิ</div>
          <div style={S.value("#15803d")}>₩{stats ? fmt(stats.profit) : "—"}</div>
        </div>
        <div style={S.card("#ddd6fe")}>
          <div style={S.label}>จำนวนสินค้า</div>
          <div style={S.value("#7c3aed")}>{stats ? stats.products : "—"} รายการ</div>
        </div>
        <div style={S.card("#bae6fd")}>
          <div style={S.label}>ลูกค้าในระบบ</div>
          <div style={S.value("#0369a1")}>{stats ? stats.customers : "—"} คน</div>
        </div>
        <div style={S.card("#fecdd3")}>
          <div style={S.label}>ออเดอร์เดือนนี้</div>
          <div style={S.value("#be185d")}>{stats ? stats.salesCount : "—"} ออเดอร์</div>
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 12 }}>ทางลัด</h2>
      <div style={S.shortcuts}>
        {QUICK.map(q => (
          <Link key={q.href} href={q.href} style={S.btn(q.color)}>
            <span style={{ fontSize: 22 }}>{q.icon}</span>
            {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
