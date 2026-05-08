"use client";
import { useState } from "react";
import Link from "next/link";

const LANGS = {
  th: {
    title: "เข้าสู่ระบบ",
    sub: "กรุณาเลือกประเภทผู้ใช้งาน",
    client: { label: "พอร์ทัลลูกค้า", desc: "สำหรับลูกค้าที่ใช้บริการ อัพโหลดและจัดการข้อมูลสินค้า" },
    admin: { label: "ระบบผู้ดูแล", desc: "สำหรับผู้ดูแลระบบ จัดการลูกค้า, Users และการตั้งค่าระบบ" },
    partner: { label: "พอร์ทัลพาร์ทเนอร์", desc: "สำหรับพาร์ทเนอร์ ดูรายงานยอดขายและบัญชีของบริษัท" },
    back: "← กลับหน้าหลัก",
  },
  en: {
    title: "Sign In",
    sub: "Please select your user type",
    client: { label: "Client Portal", desc: "For clients to upload and manage product data" },
    admin: { label: "Admin System", desc: "For system admins to manage clients, users and settings" },
    partner: { label: "Partner Portal", desc: "For partners to view sales reports and company accounts" },
    back: "← Back to Home",
  },
  ko: {
    title: "로그인",
    sub: "사용자 유형을 선택해 주세요",
    client: { label: "고객 포털", desc: "서비스를 이용하는 고객을 위해 상품 데이터를 업로드하고 관리합니다" },
    admin: { label: "관리자 시스템", desc: "시스템 관리자를 위해 고객, 사용자 및 시스템 설정을 관리합니다" },
    partner: { label: "파트너 포털", desc: "파트너를 위해 판매 보고서 및 회사 계정을 조회합니다" },
    back: "← 홈으로 돌아가기",
  },
};

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
  cards: { display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 960 },
  card: (borderColor) => ({
    flex: "1 1 260px",
    background: "#16181f",
    border: `1.5px solid ${borderColor}`,
    borderRadius: 16,
    padding: "36px 28px",
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    transition: "transform .15s, box-shadow .15s",
    boxShadow: "0 4px 24px rgba(0,0,0,.3)",
    cursor: "pointer",
  }),
  icon: { fontSize: 44, lineHeight: 1 },
  cardTitle: (color) => ({ color, fontWeight: 800, fontSize: 18, margin: 0 }),
  cardDesc: { color: "#8b8fa8", fontSize: 13, textAlign: "center", margin: 0, lineHeight: 1.6 },
  badge: (bg, color) => ({
    background: bg, color, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700,
  }),
  langBar: { display: "flex", gap: 8 },
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
          <button key={code} style={S.langBtn(lang === code)} onClick={() => setLang(code)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={S.logo}>⚡ GOEUN SERVER HUB</p>
        <h1 style={S.title}>{t.title}</h1>
        <p style={S.sub}>{t.sub}</p>
      </div>

      <div style={S.cards}>
        <Link href="/login" style={S.card("#2a4a7f")}>
          <span style={S.icon}>🛒</span>
          <p style={S.cardTitle("#7eb8f7")}>{t.client.label}</p>
          <span style={S.badge("#1e3a5f", "#7eb8f7")}>CLIENT</span>
          <p style={S.cardDesc}>{t.client.desc}</p>
        </Link>

        <Link href="/admin/login" style={S.card("#4a2a7f")}>
          <span style={S.icon}>⚙️</span>
          <p style={S.cardTitle("#a78bfa")}>{t.admin.label}</p>
          <span style={S.badge("#2d1b69", "#a78bfa")}>ADMIN / SUPER ADMIN</span>
          <p style={S.cardDesc}>{t.admin.desc}</p>
        </Link>

        <Link href="/partner/login" style={S.card("#1a4a2a")}>
          <span style={S.icon}>🤝</span>
          <p style={S.cardTitle("#4ade80")}>{t.partner.label}</p>
          <span style={S.badge("#14532d", "#4ade80")}>PARTNER</span>
          <p style={S.cardDesc}>{t.partner.desc}</p>
        </Link>
      </div>

      <Link href="/" style={{ color: "#4a5070", fontSize: 13, textDecoration: "none" }}>
        {t.back}
      </Link>
    </div>
  );
}
