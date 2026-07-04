"use client";

import { useState, useEffect } from "react";
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
      {/* 건 (Geon/Heaven) top-left: 3 solid lines */}
      <line x1="2.5" y1="3" x2="8.5" y2="3" stroke="#000" strokeWidth="1.1"/>
      <line x1="2.5" y1="5" x2="8.5" y2="5" stroke="#000" strokeWidth="1.1"/>
      <line x1="2.5" y1="7" x2="8.5" y2="7" stroke="#000" strokeWidth="1.1"/>
      {/* 이 (Ri/Fire) top-right: solid, broken, solid */}
      <line x1="21.5" y1="3" x2="27.5" y2="3" stroke="#000" strokeWidth="1.1"/>
      <line x1="21.5" y1="5" x2="23.8" y2="5" stroke="#000" strokeWidth="1.1"/>
      <line x1="25.2" y1="5" x2="27.5" y2="5" stroke="#000" strokeWidth="1.1"/>
      <line x1="21.5" y1="7" x2="27.5" y2="7" stroke="#000" strokeWidth="1.1"/>
      {/* 감 (Gam/Water) bottom-left: broken, solid, broken */}
      <line x1="2.5" y1="13" x2="4.8" y2="13" stroke="#000" strokeWidth="1.1"/>
      <line x1="6.2" y1="13" x2="8.5" y2="13" stroke="#000" strokeWidth="1.1"/>
      <line x1="2.5" y1="15" x2="8.5" y2="15" stroke="#000" strokeWidth="1.1"/>
      <line x1="2.5" y1="17" x2="4.8" y2="17" stroke="#000" strokeWidth="1.1"/>
      <line x1="6.2" y1="17" x2="8.5" y2="17" stroke="#000" strokeWidth="1.1"/>
      {/* 곤 (Gon/Earth) bottom-right: 3 broken lines */}
      <line x1="21.5" y1="13" x2="23.8" y2="13" stroke="#000" strokeWidth="1.1"/>
      <line x1="25.2" y1="13" x2="27.5" y2="13" stroke="#000" strokeWidth="1.1"/>
      <line x1="21.5" y1="15" x2="23.8" y2="15" stroke="#000" strokeWidth="1.1"/>
      <line x1="25.2" y1="15" x2="27.5" y2="15" stroke="#000" strokeWidth="1.1"/>
      <line x1="21.5" y1="17" x2="23.8" y2="17" stroke="#000" strokeWidth="1.1"/>
      <line x1="25.2" y1="17" x2="27.5" y2="17" stroke="#000" strokeWidth="1.1"/>
      {/* Taeguk */}
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
    about: "แพลตฟอร์มแสดงสินค้า เพื่อกดสั่งซื้อ",
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

const ANNOUNCE = {
  th: "🛒 เจริญไทยมาร์ท ซูวอน · ส่งทั่วเกาหลี 20กก. ₩6,000 · เปิดทุกวัน 10:00-22:00 · โทร 010-8766-4569  |  ขายอาหารไทย เครื่องปรุงรส สินค้านำเข้าจากไทย  |  경기도 수원시 권선구 세권로 153(권선동)",
  ko: "🛒 차로엔 타이 마트 수원 · 전국 배송 20kg ₩6,000 · 매일 10:00-22:00 영업 · 전화 010-8766-4569  |  태국 식품·양념·수입 제품 전문  |  경기도 수원시 권선구 세권로 153(권선동)",
  en: "🛒 Charoen Thai Mart Suwon · Nationwide delivery 20kg ₩6,000 · Open daily 10:00-22:00 · Call 010-8766-4569  |  Thai food, seasonings, imported goods  |  153 Segwon-ro, Gwonseon-gu, Suwon",
  zh: "🛒 차로엔泰国超市水原 · 全国配送 20kg ₩6,000 · 每日10:00-22:00营业 · 电话 010-8766-4569  |  泰国食品 调味料 进口商品  |  경기도 수원시 권선구 세권로 153",
  vi: "🛒 Charoen Thai Mart Suwon · Giao hàng toàn quốc 20kg ₩6,000 · Mở cửa 10:00-22:00 · Gọi 010-8766-4569  |  Thực phẩm Thái, gia vị, hàng nhập khẩu  |  153 Segwon-ro, Gwonseon-gu, Suwon",
};

export default function CharoenthaimartPage() {
  const [lang, setLang] = useState("th");
  const t = T[lang];
  const [promos, setPromos] = useState([]);
  const [announce, setAnnounce] = useState(ANNOUNCE);

  // Product catalog state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState("all");
  const [likes, setLikes] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ctm_likes") || "[]")); } catch { return new Set(); }
  });
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetch("/api/ctm/promotions/public").then(r => r.json()).then(d => setPromos(d.promotions || [])).catch(() => {});
    fetch("/api/ctm/announcements").then(r => r.json()).then(d => {
      if (d.announcements && Object.keys(d.announcements).length > 0) {
        setAnnounce(a => ({ ...a, ...d.announcements }));
      }
    }).catch(() => {});
    fetch("/api/ctm/products/public").then(r => r.json()).then(d => {
      setProducts(d.products || []);
      setCategories(d.categories || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/ctm/products/public${activeCat !== "all" ? `?category=${encodeURIComponent(activeCat)}` : ""}`)
      .then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {});
  }, [activeCat]);

  const toggleLike = (id) => {
    setLikes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("ctm_likes", JSON.stringify([...next]));
      return next;
    });
  };

  const addToCart = (product) => {
    setCart(prev => {
      const idx = prev.findIndex(x => x.id === product.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], qty: n[idx].qty + 1 }; return n; }
      return [...prev, { id: product.id, name: product.name, price: Number(product.sellPrice), qty: 1, image: product.imageUrl, unit: product.unit }];
    });
    setShowCart(true);
  };

  const setCartQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(x => x.id !== id));
    else setCart(prev => prev.map(x => x.id === id ? { ...x, qty } : x));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const orderViaLine = () => {
    const items = cart.map(i => `• ${i.name} x${i.qty} = ₩${(i.price * i.qty).toLocaleString()}`).join("\n");
    const msg = encodeURIComponent(`สั่งซื้อสินค้าเจริญไทยมาร์ท ซูวอน\n\n${items}\n\nรวม ₩${cartTotal.toLocaleString()}`);
    window.open(`https://line.me/ti/p/@486wfonl`, "_blank");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "sans-serif" }}>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ctm-ticker { animation: marquee 30s linear infinite; display: inline-flex; gap: 0; white-space: nowrap; }
        .ctm-ticker:hover { animation-play-state: paused; }
      `}</style>

      {/* Top nav */}
      <nav style={{ background: "#fff", padding: "12px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, boxShadow: "0 1px 4px #0001" }}>
        <Link href="/" style={{ color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
          ← GEserverhub
        </Link>
        {/* Language switcher + admin button */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
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
          <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 2px" }} />
          <Link href="/charoenthaimart/login" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            ⚙️ Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)", padding: "44px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap", overflow: "hidden", position: "relative" }}>
        {/* Left: logo + text */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, flex: "1 1 320px", minWidth: 0 }}>
          <img
            src="/charoenthaimart/charoenthaimart-logo.jpg"
            alt="เจริญไทยมาร์ท ซูวอน"
            style={{ width: 130, height: 130, borderRadius: "50%", objectFit: "cover", border: "4px solid #fff", flexShrink: 0, boxShadow: "0 6px 24px #0005" }}
          />
          <div>
            <h1 style={{ fontSize: 38, fontWeight: 900, margin: 0, color: "#fff", lineHeight: 1.15, textShadow: "0 2px 8px #0003" }}>
              เจริญไทยมาร์ท ซูวอน
            </h1>
            <p style={{ fontSize: 15, color: "#bfdbfe", margin: "6px 0 0", fontWeight: 700, letterSpacing: "0.04em" }}>
              차로엔 타이 마트 수원 · CHAROEN THAI MART SUWON
            </p>
            <p style={{ fontSize: 15, color: "#dbeafe", margin: "10px 0 0", lineHeight: 1.5 }}>
              {t.subtitle}
            </p>
          </div>
        </div>
        {/* Right: shop photo */}
        <div style={{ flex: "0 0 auto", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px #0006", border: "3px solid #ffffff40" }}>
          <img
            src="/charoenthaimart/charoenthaimart-shop.jpg"
            alt="Charoen Thai Mart Suwon shop"
            style={{ width: 360, height: 240, objectFit: "cover", display: "block" }}
          />
        </div>
      </div>

      {/* Scrolling announcement ticker */}
      <div style={{ background: "#1e3a8a", overflow: "hidden", padding: "11px 0", borderBottom: "2px solid #1d4ed8" }}>
        <div style={{ overflow: "hidden", width: "100%" }}>
          <span className="ctm-ticker" style={{ fontSize: 15, color: "#e0f2fe", fontWeight: 700, letterSpacing: "0.03em" }}>
            <span style={{ paddingRight: 100 }}>{announce[lang]}</span>
            <span style={{ paddingRight: 100 }}>{announce[lang]}</span>
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 60px" }}>
        {/* FLASH SALE section — always visible */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#dc2626", margin: 0, letterSpacing: "-0.01em" }}>FLASH SALE วันนี้</h2>
            {promos.length > 0 && <span style={{ background: "#dc2626", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 800 }}>{promos.length} รายการ</span>}
          </div>
          {promos.length === 0 ? (
            <div style={{ background: "#fff5f5", border: "2px dashed #fca5a5", borderRadius: 14, padding: "32px 20px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏷️</div>
              <div style={{ fontWeight: 600, color: "#6b7280" }}>ติดตามสินค้าโปรโมชั่นเร็วๆ นี้</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Coming soon · 준비 중 · 即将推出</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
              {promos.map(promo => {
                const discount = promo.product?.sellPrice
                  ? Math.round((1 - Number(promo.promoPrice) / Number(promo.product.sellPrice)) * 100)
                  : 0;
                return (
                  <div key={promo.id} style={{ background: "#fff", border: "2px solid #fca5a5", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(220,38,38,.1)", position: "relative" }}>
                    {discount > 0 && (
                      <div style={{ position: "absolute", top: 8, right: 8, background: "#dc2626", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 800, zIndex: 1 }}>-{discount}%</div>
                    )}
                    {promo.product?.imageUrl
                      ? <img src={promo.product.imageUrl} alt={promo.product.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: 80, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📦</div>
                    }
                    <div style={{ padding: "10px 12px" }}>
                      {promo.label && (
                        <span style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 800, display: "inline-block", marginBottom: 4 }}>{promo.label}</span>
                      )}
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1f2937", marginBottom: 2, lineHeight: 1.3 }}>{promo.product?.name}</div>
                      {promo.product?.nameKo && <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>{promo.product.nameKo}</div>}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 17, fontWeight: 900, color: "#dc2626" }}>₩{Number(promo.promoPrice).toLocaleString()}</span>
                        {promo.product?.sellPrice && Number(promo.promoPrice) < Number(promo.product.sellPrice) && (
                          <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>₩{Number(promo.product.sellPrice).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* About */}
        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 28px", marginBottom: 24, boxShadow: "0 1px 4px #0001" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>{t.aboutTitle}</h2>
          <p style={{ color: "#475569", lineHeight: 1.8, margin: 0 }}>{t.about}</p>
        </section>

        {/* Contact buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 0 }}>
          <a href="tel:01087664569"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#fff", padding: "13px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 16px #2563eb40" }}>
            {t.callBtn}
          </a>
        </div>
      </div>

      {/* Footer: Map + Address + Copyright */}
      <footer style={{ background: "#1e293b", color: "#cbd5e1" }}>
        {/* Map */}
        <div style={{ width: "100%", height: 320, overflow: "hidden" }}>
          <iframe
            src="https://maps.google.com/maps?q=경기도+수원시+권선구+세권로+153&output=embed&hl=th&z=16"
            width="100%" height="320" style={{ border: 0, display: "block" }}
            allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            title="Charoen Thai Mart Suwon map"
          />
        </div>
        {/* Address + info */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20, marginBottom: 24 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#f1f5f9", marginBottom: 8 }}>เจริญไทยมาร์ท ซูวอน</div>
              <div style={{ fontSize: 13, lineHeight: 2, color: "#94a3b8" }}>
                📍 경기도 수원시 권선구 세권로 153(권선동)<br/>
                📞 010-8766-4569<br/>
                🕐 10:00 AM – 10:00 PM (ทุกวัน)
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9", marginBottom: 8 }}>ช่องทางติดต่อ</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="https://www.facebook.com/thaimartsuwon" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 13 }}>📘 Facebook: เจริญไทยมาร์ท ซูวอน</a>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9", marginBottom: 8 }}>บริการจัดส่ง</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>
                🚚 ส่งทั่วเกาหลี (전국 배달)<br/>
                น้ำหนัก 20 กก. ราคา ₩6,000
              </div>
            </div>
          </div>
        </div>
        {/* Copyright */}
        <div style={{ borderTop: "1px solid #334155", padding: "16px 24px", textAlign: "center", fontSize: 12, color: "#64748b" }}>
          © {new Date().getFullYear()} เจริญไทยมาร์ท ซูวอน · Charoen Thai Mart Suwon · 차로엔 타이 마트 수원. All rights reserved.
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="/charoenthaimart/login" style={{ color: "#475569", textDecoration: "none" }}>Admin</a>
        </div>
      </footer>
    </div>
  );
}
