"use client";

import { useState } from "react";
import Link from "next/link";

const LANGS = [
  { key: "th",  label: "ไทย" },
  { key: "ko",  label: "한국어" },
  { key: "en",  label: "English" },
  { key: "zh",  label: "中文" },
  { key: "vi",  label: "Tiếng Việt" },
];

function FlagSVG({ langKey, size = 22 }) {
  const h = Math.round(size * 0.67);
  if (langKey === "th") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#A51931"/>
      <rect y="3.33" width="30" height="13.34" fill="#F4F5F8"/>
      <rect y="6.67" width="30" height="6.66" fill="#2D2A4A"/>
    </svg>
  );
  if (langKey === "ko") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#fff"/>
      {/* top-left trigram */}
      <line x1="3" y1="3.5" x2="9" y2="3.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="3" y1="5.5" x2="5.5" y2="5.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="6.5" y1="5.5" x2="9" y2="5.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="3" y1="7.5" x2="9" y2="7.5" stroke="#000" strokeWidth="1.2"/>
      {/* bottom-right trigram */}
      <line x1="21" y1="12.5" x2="27" y2="12.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="21" y1="14.5" x2="27" y2="14.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="21" y1="16.5" x2="27" y2="16.5" stroke="#000" strokeWidth="1.2"/>
      {/* top-right trigram */}
      <line x1="21" y1="3.5" x2="27" y2="3.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="21" y1="5.5" x2="27" y2="5.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="21" y1="7.5" x2="23.5" y2="7.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="24.5" y1="7.5" x2="27" y2="7.5" stroke="#000" strokeWidth="1.2"/>
      {/* bottom-left trigram */}
      <line x1="3" y1="12.5" x2="5.5" y2="12.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="6.5" y1="12.5" x2="9" y2="12.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="3" y1="14.5" x2="5.5" y2="14.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="6.5" y1="14.5" x2="9" y2="14.5" stroke="#000" strokeWidth="1.2"/>
      <line x1="3" y1="16.5" x2="9" y2="16.5" stroke="#000" strokeWidth="1.2"/>
      {/* Taeguk circle */}
      <circle cx="15" cy="10" r="5" fill="#CD2E3A"/>
      <path d="M15 5 A2.5 2.5 0 0 1 15 10 A2.5 2.5 0 0 0 15 15 A5 5 0 0 1 15 5Z" fill="#0047A0"/>
      <circle cx="15" cy="7.5" r="1.25" fill="#CD2E3A"/>
      <circle cx="15" cy="12.5" r="1.25" fill="#0047A0"/>
    </svg>
  );
  if (langKey === "en") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#012169"/>
      <line x1="0" y1="0" x2="30" y2="20" stroke="#fff" strokeWidth="4"/>
      <line x1="30" y1="0" x2="0" y2="20" stroke="#fff" strokeWidth="4"/>
      <line x1="0" y1="0" x2="30" y2="20" stroke="#C8102E" strokeWidth="2.5"/>
      <line x1="30" y1="0" x2="0" y2="20" stroke="#C8102E" strokeWidth="2.5"/>
      <rect x="12" y="0" width="6" height="20" fill="#fff"/>
      <rect x="0" y="7" width="30" height="6" fill="#fff"/>
      <rect x="13" y="0" width="4" height="20" fill="#C8102E"/>
      <rect x="0" y="8" width="30" height="4" fill="#C8102E"/>
    </svg>
  );
  if (langKey === "zh") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#DE2910"/>
      <polygon points="6,2 7.2,5.8 11,5.8 8,8 9.2,11.8 6,9.5 2.8,11.8 4,8 1,5.8 4.8,5.8" fill="#FFDE00"/>
      <polygon points="12,2 12.8,4.4 15.3,4.4 13.3,5.8 14,8.2 12,6.8 10,8.2 10.7,5.8 8.7,4.4 11.2,4.4" fill="#FFDE00" transform="scale(0.55) translate(10,0)"/>
      <polygon points="14,4 14.6,5.9 16.6,5.9 15,7 15.6,9 14,7.8 12.4,9 13,7 11.4,5.9 13.4,5.9" fill="#FFDE00" transform="scale(0.45) translate(16,2)"/>
      <polygon points="14,7 14.6,8.9 16.6,8.9 15,10 15.6,12 14,10.8 12.4,12 13,10 11.4,8.9 13.4,8.9" fill="#FFDE00" transform="scale(0.45) translate(14,8)"/>
    </svg>
  );
  if (langKey === "vi") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#DA251D"/>
      <polygon points="15,3 16.8,8.5 22.5,8.5 17.8,12 19.6,17.5 15,14 10.4,17.5 12.2,12 7.5,8.5 13.2,8.5" fill="#FFFF00"/>
    </svg>
  );
  return null;
}

const T = {
  th: {
    subtitle: "ร้านขายของไทยในเกาหลี · อาหาร เครื่องปรุง สินค้านำเข้า",
    phoneLabel: "โทรศัพท์",
    hoursLabel: "เวลาเปิด-ปิด",
    addressLabel: "ที่อยู่",
    deliveryLabel: "บริการส่ง",
    deliveryText: "ส่งทั่วเกาหลี (전국 배달)",
    deliverySub: "20 กก. ราคา ₩6,000",
    aboutTitle: "เกี่ยวกับร้าน",
    about: "เจริญไทยมาร์ท ซูวอน คือ ร้านขายของไทยในเกาหลีใต้ ตั้งอยู่ที่เมืองซูวอน จำหน่ายอาหารไทย เครื่องปรุงรส สินค้านำเข้าจากไทย และสินค้าเอเชียนหลากหลาย บริการจัดส่งทั่วเกาหลี น้ำหนัก 20 กก. ราคา ₩6,000 เปิดบริการทุกวัน 10:00 AM – 10:00 PM",
    callBtn: "📞 โทรติดต่อร้าน",
  },
  ko: {
    subtitle: "한국 내 태국 식품 전문점 · 식재료 양념 수입 제품",
    phoneLabel: "전화번호",
    hoursLabel: "영업 시간",
    addressLabel: "주소",
    deliveryLabel: "배달 서비스",
    deliveryText: "전국 배송 가능",
    deliverySub: "20kg ₩6,000",
    aboutTitle: "소개",
    about: "차로엔 타이 마트 수원은 한국 수원에 위치한 태국 식품·생활용품 전문 판매점입니다. 태국 소스, 향신료, 즉석식품, 아시안 식재료 등 다양한 태국 제품을 구비하고 있으며 전국 택배 배송도 가능합니다. (20kg ₩6,000 기준) 매일 오전 10시~오후 10시 영업합니다.",
    callBtn: "📞 전화 문의",
  },
  en: {
    subtitle: "Thai grocery store in Korea · Food, seasoning & imported goods",
    phoneLabel: "Phone",
    hoursLabel: "Hours",
    addressLabel: "Address",
    deliveryLabel: "Delivery",
    deliveryText: "Nationwide delivery",
    deliverySub: "20 kg for ₩6,000",
    aboutTitle: "About Us",
    about: "Charoen Thai Mart Suwon is a Thai grocery store located in Suwon, South Korea. We offer a wide range of Thai food, seasonings, imported goods, and Asian products. Nationwide delivery available at ₩6,000 for 20 kg. Open daily 10:00 AM – 10:00 PM.",
    callBtn: "📞 Call Us",
  },
  zh: {
    subtitle: "韩国泰国食品专卖店 · 食材 调味料 进口商品",
    phoneLabel: "电话",
    hoursLabel: "营业时间",
    addressLabel: "地址",
    deliveryLabel: "配送服务",
    deliveryText: "全国快递配送",
    deliverySub: "20kg ₩6,000",
    aboutTitle: "关于我们",
    about: "차로엔泰国超市水原店位于韩国水原市，专门销售泰国食品、调味料、进口商品及亚洲各类产品。提供全国快递配送服务（20公斤₩6,000）。每日营业时间：上午10时至晚上10时。",
    callBtn: "📞 拨打电话",
  },
  vi: {
    subtitle: "Cửa hàng thực phẩm Thái tại Hàn Quốc · Thực phẩm, gia vị, hàng nhập khẩu",
    phoneLabel: "Điện thoại",
    hoursLabel: "Giờ mở cửa",
    addressLabel: "Địa chỉ",
    deliveryLabel: "Giao hàng",
    deliveryText: "Giao hàng toàn quốc",
    deliverySub: "20kg ₩6,000",
    aboutTitle: "Giới thiệu",
    about: "Charoen Thai Mart Suwon là cửa hàng thực phẩm Thái Lan tại Suwon, Hàn Quốc. Chúng tôi cung cấp đa dạng thực phẩm Thái, gia vị, hàng nhập khẩu và sản phẩm châu Á. Giao hàng toàn quốc với giá ₩6,000 cho 20kg. Mở cửa hàng ngày 10:00 SA – 10:00 CH.",
    callBtn: "📞 Gọi điện",
  },
};

export default function CharoenthaimartPage() {
  const [lang, setLang] = useState("th");
  const t = T[lang];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "sans-serif" }}>

      {/* Top nav */}
      <nav style={{ background: "#fff", padding: "12px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, boxShadow: "0 1px 4px #0001" }}>
        <Link href="/" style={{ color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
          ← GEserverhub
        </Link>
        {/* Language switcher */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {LANGS.map((l) => (
            <button
              key={l.key}
              onClick={() => setLang(l.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: lang === l.key ? "#2563eb" : "#e2e8f0",
                background: lang === l.key ? "#eff6ff" : "#fff",
                color: lang === l.key ? "#1d4ed8" : "#64748b",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <FlagSVG langKey={l.key} size={22} />
              {l.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)", padding: "36px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", overflow: "hidden", position: "relative" }}>
        {/* Left: logo + text */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, flex: "1 1 280px", minWidth: 0 }}>
          <img
            src="/charoenthaimart/charoenthaimart-logo.jpg"
            alt="เจริญไทยมาร์ท ซูวอน"
            style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "4px solid #fff", flexShrink: 0, boxShadow: "0 4px 20px #0004" }}
          />
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#fff", lineHeight: 1.2 }}>
              เจริญไทยมาร์ท ซูวอน
            </h1>
            <p style={{ fontSize: 12, color: "#bfdbfe", margin: "4px 0 0", fontWeight: 600, letterSpacing: "0.03em" }}>
              차로엔 타이 마트 수원 · CHAROEN THAI MART SUWON
            </p>
            <p style={{ fontSize: 13, color: "#dbeafe", margin: "8px 0 0" }}>
              {t.subtitle}
            </p>
          </div>
        </div>
        {/* Right: shop photo */}
        <div style={{ flex: "0 0 auto", borderRadius: 14, overflow: "hidden", boxShadow: "0 6px 24px #0005", border: "3px solid #ffffff30" }}>
          <img
            src="/charoenthaimart/charoenthaimart-shop.jpg"
            alt="Charoen Thai Mart Suwon shop"
            style={{ width: 260, height: 160, objectFit: "cover", display: "block" }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px 60px" }}>
        {/* Info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <InfoCard icon="📞" label={t.phoneLabel}>
            <a href="tel:01087664569" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
              010-8766-4569
            </a>
          </InfoCard>
          <InfoCard icon="🕐" label={t.hoursLabel}>
            10:00 AM – 10:00 PM
          </InfoCard>
          <InfoCard icon="📍" label={t.addressLabel}>
            경기도 수원시 권선구<br />세권로 153(권선동)
          </InfoCard>
          <InfoCard icon="🚚" label={t.deliveryLabel}>
            {t.deliveryText}<br />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{t.deliverySub}</span>
          </InfoCard>
        </div>

        {/* About */}
        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 28px", marginBottom: 24, boxShadow: "0 1px 4px #0001" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>{t.aboutTitle}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8, margin: 0 }}>{t.about}</p>
        </section>

        {/* Contact button */}
        <div style={{ textAlign: "center" }}>
          <a
            href="tel:01087664569"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              color: "#fff",
              padding: "14px 40px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 16px #2563eb40",
            }}
          >
            {t.callBtn}
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 4px #0001" }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {icon} {label}
      </div>
      <div style={{ color: "#1e293b", fontSize: 14, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}
