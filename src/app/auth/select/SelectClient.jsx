"use client";
import { useState } from "react";
import Link from "next/link";

const LANGS = {
  th: {
    title: "เข้าสู่ระบบ",
    sub: "กรุณาเลือกประเภทผู้ใช้งาน",
    client: { label: "พอร์ทัลลูกค้า (MCT)", desc: "ล็อกอิน NextAuth — จัดการสินค้า / MCT Product" },
    energy: { label: "Energy Dashboard", desc: "ระบบมอนิเตอริ่งพลังงาน MOMOGE / GE Energy" },
    customer: { label: "แดชบอร์ดลูกค้า", desc: "พอร์ทัลลูกค้าพลังงาน — ดูข้อมูลมิเตอร์และรายงาน" },
    admin: { label: "ระบบผู้ดูแล", desc: "จัดการลูกค้า, Users และการตั้งค่าระบบ" },
    partner: { label: "พอร์ทัลพาร์ทเนอร์", desc: "ดูรายงานยอดขายและบัญชีของบริษัท" },
    back: "← กลับหน้าหลัก",
  },
  en: {
    title: "Sign In",
    sub: "Please select your user type",
    client: { label: "Client Portal (MCT)", desc: "NextAuth sign-in — product / MCT portal" },
    energy: { label: "Energy Dashboard", desc: "MOMOGE / GE Energy electricity monitoring" },
    customer: { label: "Customer Dashboard", desc: "Energy customer portal — meters and reports" },
    admin: { label: "Admin System", desc: "Manage clients, users and settings" },
    partner: { label: "Partner Portal", desc: "Sales reports and company accounts" },
    back: "← Back to Home",
  },
  ko: {
    title: "로그인",
    sub: "사용자 유형을 선택해 주세요",
    client: { label: "고객 포털 (MCT)", desc: "NextAuth 로그인 — MCT 제품 관리" },
    energy: { label: "Energy Dashboard", desc: "MOMOGE / GE Energy 전력 모니터링" },
    customer: { label: "고객 대시보드", desc: "에너지 고객 포털 — 미터 및 리포트" },
    admin: { label: "관리자 시스템", desc: "고객, 사용자 및 설정 관리" },
    partner: { label: "파트너 포털", desc: "판매 보고서 및 회사 계정" },
    back: "← 홈으로 돌아가기",
  },
};

const PORTALS = [
  { key: "client", href: "/login", border: "#2a4a7f", titleColor: "#7eb8f7", badgeBg: "#1e3a5f", badgeColor: "#7eb8f7", badge: "CLIENT / MCT", icon: "🛒" },
  { key: "energy", href: "/energy-dashboard-login", border: "#1a5c4a", titleColor: "#34d399", badgeBg: "#064e3b", badgeColor: "#34d399", badge: "ENERGY", icon: "⚡" },
  { key: "customer", href: "/customer-dashboard-login", border: "#3d4a1a", titleColor: "#a3e635", badgeBg: "#365314", badgeColor: "#a3e635", badge: "CUSTOMER", icon: "📊" },
  { key: "admin", href: "/admin/login", border: "#4a2a7f", titleColor: "#a78bfa", badgeBg: "#2d1b69", badgeColor: "#a78bfa", badge: "ADMIN", icon: "⚙️" },
  { key: "partner", href: "/partner/login", border: "#1a4a2a", titleColor: "#4ade80", badgeBg: "#14532d", badgeColor: "#4ade80", badge: "PARTNER", icon: "🤝" },
];

const S = {
  page: {
    minHeight: "100vh",
    background: "#0a0c12",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 32,
  },
  logo: { fontSize: 14, fontWeight: 700, color: "#8b8fa8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  title: { color: "#e8eaf0", fontWeight: 800, fontSize: 26, margin: "0 0 8px", textAlign: "center" },
  sub: { color: "#8b8fa8", fontSize: 14, margin: 0, textAlign: "center" },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
    width: "100%",
    maxWidth: 1100,
  },
  card: (borderColor) => ({
    background: "#16181f",
    border: `1.5px solid ${borderColor}`,
    borderRadius: 16,
    padding: "28px 22px",
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    transition: "transform .15s, box-shadow .15s",
    boxShadow: "0 4px 24px rgba(0,0,0,.3)",
    cursor: "pointer",
    minHeight: 200,
  }),
  icon: { fontSize: 40, lineHeight: 1 },
  cardTitle: (color) => ({ color, fontWeight: 800, fontSize: 16, margin: 0, textAlign: "center" }),
  cardDesc: { color: "#8b8fa8", fontSize: 12, textAlign: "center", margin: 0, lineHeight: 1.55 },
  badge: (bg, color) => ({
    background: bg,
    color,
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.04em,
  }),
  langBar: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  langBtn: (active) => ({
    background: active ? "#23263a" : "transparent",
    border: `1px solid ${active ? "#4a5070" : "#2a2d40"}`,
    borderRadius: 8,
    color: active ? "#e8eaf0" : "#4a5070",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 14px",
    cursor: "pointer",
    transition: "all .15s",
    letterSpacing: 1,
  }),
};

export default function SelectClient() {
  const [lang, setLang] = useState("th");
  const t = LANGS[lang];

  return (
    <div style={S.page}>
      <div style={S.langBar}>
        {[["th", "ไทย"], ["en", "EN"], ["ko", "한국어"]].map(([code, label]) => (
          <button key={code} type="button" style={S.langBtn(lang === code)} onClick={() => setLang(code)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={S.logo}>⚡ GE SERVER HUB</p>
        <h1 style={S.title}>{t.title}</h1>
        <p style={S.sub}>{t.sub}</p>
      </div>

      <div style={S.cards}>
        {PORTALS.map((p) => {
          const copy = t[p.key];
          return (
            <Link key={p.key} href={p.href} style={S.card(p.border)}>
              <span style={S.icon}>{p.icon}</span>
              <p style={S.cardTitle(p.titleColor)}>{copy.label}</p>
              <span style={S.badge(p.badgeBg, p.badgeColor)}>{p.badge}</span>
              <p style={S.cardDesc}>{copy.desc}</p>
            </Link>
          );
        })}
      </div>

      <Link href="/" style={{ color: "#4a5070", fontSize: 13, textDecoration: "none" }}>
        {t.back}
      </Link>
    </div>
  );
}
