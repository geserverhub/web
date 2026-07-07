"use client";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MENU = [
  { href: "/charoenthaimart/admin", label: "แดชบอร์ด", icon: "📊", exact: true },
  { href: "/charoenthaimart/admin/products", label: "สินค้า", icon: "📦" },
  { href: "/charoenthaimart/admin/stock", label: "สต๊อกสินค้า", icon: "🗃️" },
  { href: "/charoenthaimart/admin/product-conversion", label: "แปลงสินค้าเข้าสต๊อก", icon: "🔄" },
  { href: "/charoenthaimart/admin/promotions", label: "สินค้าจัดโปร", icon: "🏷️" },
  { href: "/charoenthaimart/admin/barcode", label: "บาร์โค้ด", icon: "🔖" },
  { href: "/charoenthaimart/admin/orders", label: "คำสั่งซื้อออนไลน์", icon: "🛍️" },
  { href: "/charoenthaimart/admin/sales", label: "ยอดขาย", icon: "💰" },
  { href: "/charoenthaimart/admin/finance", label: "กำไร/ขาดทุน", icon: "📈" },
  { href: "/charoenthaimart/admin/expenses", label: "รายจ่ายประจำวัน", icon: "📋" },
  { href: "/charoenthaimart/admin/card-settlements", label: "บันทึกสรุปบิลเครื่องรูดบัตร", icon: "💳" },
  { href: "/charoenthaimart/admin/wages", label: "ค่าแรงพนักงาน", icon: "👷" },
  { href: "/charoenthaimart/admin/partner-shares", label: "ส่วนแบ่งหุ้นส่วน", icon: "🤝" },
  { href: "/charoenthaimart/admin/tax", label: "บัญชีภาษี VAT", icon: "🧾" },
  { href: "/charoenthaimart/admin/income-tax", label: "ภาษีรายได้กิจการ", icon: "🏦" },
  { href: "/charoenthaimart/admin/customers", label: "ลูกค้า", icon: "👥" },
  { href: "/charoenthaimart/admin/suppliers", label: "รายชื่อซัพพลายเออร์", icon: "📦" },
  { href: "/charoenthaimart/admin/purchase-orders", label: "สั่งซื้อสินค้าเข้าสต๊อก", icon: "📥" },
  { href: "/charoenthaimart/admin/receive-goods", label: "คีย์รับเข้าสินค้า", icon: "✅" },
  { href: "/charoenthaimart/admin/supplier-products", label: "สินค้าที่ซื้อจากคู่ค้า", icon: "🧾" },
  { href: "/charoenthaimart/admin/announcements", label: "ป้ายประกาศ", icon: "📣" },
  { href: "/charoenthaimart/admin/packing", label: "แพ็คสินค้า", icon: "📦" },
  { href: "/charoenthaimart/admin/shipping", label: "การจัดส่ง", icon: "🚚" },
  { href: "/charoenthaimart/admin/reports", label: "ปริ้นรายงาน", icon: "🖨️" },
];

function CtmAdminInner({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/charoenthaimart/login");
    else if (status === "authenticated") {
      const role = session?.user?.role;
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") router.replace("/");
    }
  }, [status, session, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (status === "loading") return <div style={{ minHeight: "100vh", background: "#fafaf7", display: "flex", alignItems: "center", justifyContent: "center", color: "#92400e", fontSize: 16 }}>กำลังโหลด...</div>;
  if (status !== "authenticated") return null;

  const isActive = (item) => item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const currentLabel = MENU.find(isActive)?.label || "";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fafaf7", fontFamily: "sans-serif" }}>
      <style>{`
        .ctm-mobile-topbar { display: none; }
        .ctm-sidebar-backdrop { display: none; }
        @media (max-width: 860px) {
          .ctm-mobile-topbar { display: flex; }
          .ctm-sidebar {
            position: fixed; top: 0; left: 0; bottom: 0; z-index: 210;
            transform: translateX(-100%); transition: transform .2s ease;
            box-shadow: 4px 0 24px rgba(0,0,0,.15);
          }
          .ctm-sidebar.open { transform: translateX(0); }
          .ctm-sidebar-backdrop.open { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 205; }
          .ctm-main { padding-top: 52px; }
        }
      `}</style>

      {/* Mobile top bar */}
      <div className="ctm-mobile-topbar" style={{ position: "fixed", top: 0, left: 0, right: 0, height: 52, background: "#fff", borderBottom: "1px solid #e7e3d8", alignItems: "center", gap: 10, padding: "0 14px", zIndex: 220 }}>
        <button onClick={() => setMobileOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#92400e", padding: 4, lineHeight: 1 }} aria-label="เมนู">☰</button>
        <span style={{ fontWeight: 800, fontSize: 14, color: "#92400e" }}>{currentLabel || "เจริญไทยมาร์ท"}</span>
      </div>

      {/* Backdrop */}
      <div className={`ctm-sidebar-backdrop${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <aside className={`ctm-sidebar${mobileOpen ? " open" : ""}`} style={{ width: 220, background: "#fff", borderRight: "1px solid #e7e3d8", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #e7e3d8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/charoenthaimart/charoenthaimart-logo.jpg" alt="logo" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 12, color: "#92400e", lineHeight: 1.2 }}>เจริญไทยมาร์ท</div>
              <div style={{ fontSize: 10, color: "#b45309" }}>ซูวอน · Admin</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, textDecoration: "none",
              background: isActive(item) ? "#fef3c7" : "transparent",
              color: isActive(item) ? "#92400e" : "#6b7280",
              fontWeight: isActive(item) ? 700 : 400, fontSize: 13,
              transition: "all .1s",
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e7e3d8", display: "flex", flexDirection: "column", gap: 4 }}>
          <Link href="/charoenthaimart" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none" }}>← หน้าร้าน</Link>
          <Link href="/auth/select" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none" }}>← เมนูหลัก</Link>
        </div>
      </aside>
      {/* Main */}
      <main className="ctm-main" style={{ flex: 1, overflow: "auto", minWidth: 0 }}>{children}</main>
    </div>
  );
}

export default function CtmAdminLayout({ children }) {
  return <SessionProvider basePath="/api/auth"><CtmAdminInner>{children}</CtmAdminInner></SessionProvider>;
}
