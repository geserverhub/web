"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CartDrawer from "./CartDrawer";
import { LANGS, FlagSVG } from "./FlagSVG";

const T = {
  th: {
    subtitle: "ร้านขายของไทยในเกาหลี · อาหาร เครื่องปรุง สินค้านำเข้า",
    flashSale: "🔥 สินค้าแนะนำ 🔥", items: "รายการ",
    allProducts: "FLASH SALE โปรโมชั่นและกิจกรรมวันนี้", allCat: "🛍️ ทั้งหมด", noProducts: "ไม่มีสินค้าในหมวดนี้ในตอนนี้", outOfStock: "สินค้าหมด",
    addCart: "+ ใส่ตะกร้า", inCart: "ในตะกร้า",
    viewProductsCta: "เยี่ยมชมสินค้าทั้งหมดของเรา",
    catalogSubtitle: "โปรโมชั่นและกิจกรรมวันนี้ · สินค้าไทยคุณภาพจากเจริญไทยมาร์ท",
    comingSoonDesc: "สินค้าในหมวดนี้กำลังจะมาเร็วๆ นี้",
    cartTitle: "ตะกร้าสินค้า", emptyCart: "ไม่มีสินค้าในตะกร้า",
    total: "รวมทั้งหมด", orderLine: "💬 สั่งซื้อผ่าน LINE",
    deliveryNote: "LINE @486wfonl · ส่งทั่วเกาหลี 20กก. ₩6,000",
    contactLabel: "ช่องทางติดต่อ", deliveryLabel: "บริการจัดส่ง",
    deliveryDetail: "ส่งทั่วเกาหลี (전국 배달)\nน้ำหนัก 20 กก. ราคา ₩6,000",
    hours: "10:00 AM – 10:00 PM (ทุกวัน)",
  },
  ko: {
    subtitle: "한국 내 태국 식품 전문점 · 식재료 양념 수입 제품",
    flashSale: "🔥 추천 상품 🔥", items: "개",
    allProducts: "전체 상품", allCat: "🛍️ 전체", noProducts: "이 카테고리에 상품이 없습니다", outOfStock: "품절",
    addCart: "+ 장바구니 담기", inCart: "담음",
    viewProductsCta: "우리 상품 전체 구경하기",
    catalogSubtitle: "오늘의 프로모션 및 이벤트 · 차로엔 타이 마트의 태국 고품질 상품",
    comingSoonDesc: "이 카테고리의 상품이 곧 준비됩니다",
    cartTitle: "장바구니", emptyCart: "장바구니가 비어 있습니다",
    total: "합계", orderLine: "💬 LINE으로 주문",
    deliveryNote: "LINE @486wfonl · 전국 배송 20kg ₩6,000",
    contactLabel: "연락처", deliveryLabel: "배달 서비스",
    deliveryDetail: "전국 배송 가능\n20kg ₩6,000",
    hours: "오전 10시 ~ 오후 10시 (매일)",
  },
  en: {
    subtitle: "Thai grocery store in Korea · Food, seasoning & imported goods",
    flashSale: "🔥 Recommended Products 🔥", items: "items",
    allProducts: "All Products", allCat: "🛍️ All", noProducts: "No products in this category", outOfStock: "Out of stock",
    addCart: "+ Add to cart", inCart: "in cart",
    viewProductsCta: "Explore all our products",
    catalogSubtitle: "Today's promotions and events · Quality Thai products from Charoen Thai Mart",
    comingSoonDesc: "Products in this category are coming soon",
    cartTitle: "Shopping Cart", emptyCart: "Your cart is empty",
    total: "Total", orderLine: "💬 Order via LINE",
    deliveryNote: "LINE @486wfonl · Nationwide 20kg ₩6,000",
    contactLabel: "Contact", deliveryLabel: "Delivery",
    deliveryDetail: "Nationwide delivery\n20 kg for ₩6,000",
    hours: "10:00 AM – 10:00 PM (Daily)",
  },
  zh: {
    subtitle: "韩国泰国食品专卖店 · 食材 调味料 进口商品",
    flashSale: "🔥 推荐商品 🔥", items: "件",
    allProducts: "全部商品", allCat: "🛍️ 全部", noProducts: "此分类暂无商品", outOfStock: "缺货",
    addCart: "+ 加入购物车", inCart: "已加入",
    viewProductsCta: "浏览我们的全部商品",
    catalogSubtitle: "今日促销与活动 · 来自Charoen Thai Mart的优质泰国商品",
    comingSoonDesc: "此分类的商品即将上架",
    cartTitle: "购物车", emptyCart: "购物车为空",
    total: "总计", orderLine: "💬 通过LINE订购",
    deliveryNote: "LINE @486wfonl · 全国配送 20kg ₩6,000",
    contactLabel: "联系方式", deliveryLabel: "配送服务",
    deliveryDetail: "全国快递配送\n20公斤 ₩6,000",
    hours: "上午10时 ~ 晚上10时（每日）",
  },
  vi: {
    subtitle: "Cửa hàng thực phẩm Thái tại Hàn Quốc · Thực phẩm, gia vị, hàng nhập khẩu",
    flashSale: "🔥 Sản phẩm nổi bật 🔥", items: "sản phẩm",
    allProducts: "Tất cả sản phẩm", allCat: "🛍️ Tất cả", noProducts: "Không có sản phẩm trong danh mục này", outOfStock: "Hết hàng",
    addCart: "+ Thêm vào giỏ", inCart: "trong giỏ",
    viewProductsCta: "Khám phá tất cả sản phẩm của chúng tôi",
    catalogSubtitle: "Khuyến mãi và sự kiện hôm nay · Sản phẩm Thái chất lượng từ Charoen Thai Mart",
    comingSoonDesc: "Sản phẩm trong danh mục này sắp ra mắt",
    cartTitle: "Giỏ hàng", emptyCart: "Giỏ hàng trống",
    total: "Tổng cộng", orderLine: "💬 Đặt hàng qua LINE",
    deliveryNote: "LINE @486wfonl · Toàn quốc 20kg ₩6,000",
    contactLabel: "Liên hệ", deliveryLabel: "Giao hàng",
    deliveryDetail: "Giao hàng toàn quốc\n20kg ₩6,000",
    hours: "10:00 SA – 10:00 CH (Hàng ngày)",
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

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6ee", color: "#1e293b", fontFamily: "sans-serif" }}>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ctm-ticker { animation: marquee 30s linear infinite; display: inline-flex; gap: 0; white-space: nowrap; }
        .ctm-ticker:hover { animation-play-state: paused; }
        .ctm-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,.15) !important; }
        .ctm-card { transition: transform .18s, box-shadow .18s; }
        .ctm-cat-btn:hover { background: #ecfdf5 !important; border-color: #34d399 !important; color: #065f46 !important; }
      `}</style>

      {/* Top nav */}
      <nav style={{ background: "#fff", padding: "12px 24px", borderBottom: "2px solid #f0fdf4", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, boxShadow: "0 2px 12px rgba(6,95,70,.08)" }}>
        <Link href="/charoenthaimart" style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#111827", textDecoration: "none", fontSize: 14, fontWeight: 800 }}>
          <img src="/charoenthaimart/charoenthaimart-logo.jpg" alt="Charoen Thai Mart Suwon" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", boxShadow: "0 2px 8px rgba(6,95,70,.22)", border: "2px solid #6ee7b7" }} />
          <span style={{ background: "linear-gradient(90deg,#065f46,#d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>เจริญไทยมาร์ท ซูวอน</span>
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
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #059669 75%, #b45309 100%)", padding: "44px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 50%, rgba(255,255,255,.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        {/* Left: logo + text */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, flex: "1 1 320px", minWidth: 0 }}>
          <img
            src="/charoenthaimart/charoenthaimart-logo.jpg"
            alt="เจริญไทยมาร์ท ซูวอน"
            style={{ width: 130, height: 130, borderRadius: "50%", objectFit: "cover", border: "4px solid #fde68a", flexShrink: 0, boxShadow: "0 8px 32px rgba(0,0,0,.35)" }}
          />
          <div>
            <h1 style={{ fontSize: 38, fontWeight: 900, margin: 0, color: "#fff", lineHeight: 1.15, textShadow: "0 3px 12px rgba(0,0,0,.4)" }}>
              เจริญไทยมาร์ท ซูวอน
            </h1>
            <p style={{ fontSize: 14, color: "#fde68a", margin: "6px 0 0", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              차로엔 타이 마트 수원 · CHAROEN THAI MART SUWON
            </p>
            <p style={{ fontSize: 14, color: "#a7f3d0", margin: "10px 0 0", lineHeight: 1.6 }}>
              {t.subtitle}
            </p>
          </div>
        </div>
        {/* Right: shop photo */}
        <div style={{ flex: "0 0 auto", borderRadius: 18, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,.5)", border: "3px solid rgba(253,230,138,.4)" }}>
          <img
            src="/charoenthaimart/charoenthaimart-shop.jpg"
            alt="Charoen Thai Mart Suwon shop"
            style={{ width: 360, height: 240, objectFit: "cover", display: "block" }}
          />
        </div>
      </div>

      {/* Scrolling announcement ticker */}
      <div style={{ background: "#064e3b", overflow: "hidden", padding: "10px 0", borderBottom: "3px solid #065f46" }}>
        <div style={{ overflow: "hidden", width: "100%" }}>
          <span className="ctm-ticker" style={{ fontSize: 15, color: "#e0f2fe", fontWeight: 700, letterSpacing: "0.03em" }}>
            <span style={{ paddingRight: 100 }}>{announce[lang]}</span>
            <span style={{ paddingRight: 100 }}>{announce[lang]}</span>
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 120px" }}>

        {/* Prominent shop CTA */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <a href="/charoenthaimart/shop"
            style={{
              display: "inline-flex", alignItems: "center", gap: 14,
              background: "linear-gradient(135deg,#b45309,#d97706)",
              color: "#fff", textDecoration: "none",
              borderRadius: 999, padding: "18px 44px",
              fontWeight: 900, fontSize: 20,
              boxShadow: "0 8px 32px rgba(180,83,9,.45)",
              letterSpacing: 0.5,
            }}>
            <span style={{ fontSize: 26 }}>🛍️</span>
            {t.viewProductsCta}
          </a>
        </div>

        {/* FLASH SALE section */}
        {promos.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ background: "linear-gradient(135deg,#065f46,#059669)", borderRadius: 10, padding: "6px 16px", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔥</span>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>{t.flashSale}</h2>
              </div>
              <span style={{ background: "#064e3b", color: "#fde68a", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 800, border: "1px solid #065f46" }}>{promos.length} {t.items}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 16 }}>
              {promos.map(promo => {
                const discount = promo.product?.sellPrice
                  ? Math.round((1 - Number(promo.promoPrice) / Number(promo.product.sellPrice)) * 100) : 0;
                return (
                  <div key={promo.id} onClick={() => promo.product && addToCart({ ...promo.product, sellPrice: promo.promoPrice })}
                    className="ctm-card"
                    style={{ background: "#fff", border: "2px solid #6ee7b7", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(6,95,70,.13)", position: "relative", cursor: "pointer" }}>
                    {discount > 0 && <div style={{ position: "absolute", top: 8, left: 8, background: "linear-gradient(135deg,#065f46,#059669)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 900, zIndex: 1, boxShadow: "0 2px 6px rgba(6,95,70,.4)" }}>-{discount}%</div>}
                    {promo.product?.imageUrl
                      ? <img src={promo.product.imageUrl} alt={promo.product.name} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: 90, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📦</div>}
                    <div style={{ padding: "10px 12px 12px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1f2937", lineHeight: 1.3, marginBottom: 5 }}>{promo.product?.name}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 17, fontWeight: 900, color: "#065f46" }}>₩{Number(promo.promoPrice).toLocaleString()}</span>
                        {promo.product?.sellPrice && Number(promo.promoPrice) < Number(promo.product.sellPrice) &&
                          <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>₩{Number(promo.product.sellPrice).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Product Catalog */}
        <section>
          {/* Section title */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ background: "linear-gradient(135deg,#92400e,#b45309)", borderRadius: 10, padding: "6px 16px", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🛒</span>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0 }}>{t.allProducts}</h2>
              </div>
              {products.length > 0 && <span style={{ background: "#92400e", color: "#fde68a", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 800, border: "1px solid #b45309" }}>{products.length} {t.items}</span>}
            </div>
          </div>
          <div style={{ color: "#065f46", fontSize: 13, fontWeight: 700, marginBottom: 18 }}>{t.catalogSubtitle}</div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 22, scrollbarWidth: "none" }}>
            {[["all", t.allCat], ...categories.map(c => [c, c])].map(([key, label]) => (
              <button key={key} onClick={() => setActiveCat(key)} className="ctm-cat-btn"
                style={{ flexShrink: 0, padding: "8px 20px", borderRadius: 24, border: "2px solid", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s",
                  borderColor: activeCat === key ? "#065f46" : "#e7d8c9",
                  background: activeCat === key ? "linear-gradient(135deg,#065f46,#059669)" : "#fff",
                  color: activeCat === key ? "#fff" : "#1e3a2f",
                  boxShadow: activeCat === key ? "0 3px 12px rgba(6,95,70,.3)" : "0 1px 4px rgba(0,0,0,.06)" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {products.map(p => {
              const outOfStock = Number(p.stock) <= 0 || p.isActive === false;
              return (
              <div key={p.id} className="ctm-card" style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 3px 14px rgba(0,0,0,.09)", position: "relative", display: "flex", flexDirection: "column", border: "1px solid #f5e8d8" }}>
                {/* Like button */}
                <button onClick={() => toggleLike(p.id)} style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%", border: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, zIndex: 2 }}>
                  {likes.has(p.id) ? "❤️" : "🤍"}
                </button>
                {/* Image */}
                <div style={{ position: "relative" }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: 160, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: "100%", height: 160, background: "linear-gradient(135deg,#fef3c7,#fde8c8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, flexShrink: 0 }}>📦</div>}
                  {outOfStock && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(31,41,55,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ background: "#fff", color: "#b91c1c", borderRadius: 999, padding: "4px 14px", fontSize: 12, fontWeight: 900 }}>{t.outOfStock}</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "10px 12px 13px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {p.category && <span style={{ fontSize: 10, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "2px 8px", display: "inline-block", marginBottom: 5, alignSelf: "flex-start", fontWeight: 700, border: "1px solid #fde68a" }}>{p.category}</span>}
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1f2937", lineHeight: 1.4, marginBottom: 2, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</div>
                  {p.nameKo && <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 5, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.nameKo}</div>}
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#065f46", marginBottom: 10, letterSpacing: "-0.01em" }}>₩{Number(p.sellPrice).toLocaleString()}</div>
                  <button onClick={() => !outOfStock && addToCart(p)} disabled={outOfStock}
                    style={{ width: "100%", background: outOfStock ? "#e5e7eb" : cart.some(c => c.id === p.id) ? "linear-gradient(135deg,#166534,#16a34a)" : "linear-gradient(135deg,#065f46,#059669)", color: outOfStock ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, padding: "9px", fontWeight: 800, fontSize: 12, cursor: outOfStock ? "not-allowed" : "pointer", boxShadow: outOfStock ? "none" : cart.some(c => c.id === p.id) ? "0 2px 8px rgba(22,101,52,.3)" : "0 2px 8px rgba(6,95,70,.3)" }}>
                    {outOfStock ? t.outOfStock : cart.some(c => c.id === p.id) ? `✓ ${cart.find(c=>c.id===p.id).qty} ${t.inCart}` : t.addCart}
                  </button>
                </div>
              </div>
              );
            })}
            {products.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "56px 24px" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🛍️</div>
                <div style={{ fontWeight: 900, fontSize: 22, color: "#b45309", letterSpacing: 3, marginBottom: 6 }}>COMING SOON</div>
                <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 28 }}>{t.comingSoonDesc}</div>
                <a
                  href="/charoenthaimart/shop"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 12,
                    background: "linear-gradient(135deg,#b45309,#d97706)",
                    color: "#fff", textDecoration: "none",
                    borderRadius: 999, padding: "16px 36px",
                    fontWeight: 900, fontSize: 18,
                    boxShadow: "0 6px 28px rgba(180,83,9,.45)",
                    letterSpacing: 0.5,
                    transition: "transform .15s",
                  }}
                >
                  <span style={{ fontSize: 22 }}>🛍️</span>
                  {t.viewProductsCta}
                </a>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button onClick={() => setShowCart(true)}
          style={{ position: "fixed", bottom: 28, right: 24, background: "linear-gradient(135deg,#065f46,#059669)", color: "#fff", border: "none", borderRadius: 50, padding: "14px 24px", fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 28px rgba(6,95,70,.55)", zIndex: 100, display: "flex", alignItems: "center", gap: 10 }}>
          🛒 <span>{cartCount} {t.items}</span> <span style={{ background: "rgba(255,255,255,.25)", borderRadius: 20, padding: "3px 12px", fontWeight: 900 }}>₩{cartTotal.toLocaleString()}</span>
        </button>
      )}

      <CartDrawer cart={cart} setCartQty={setCartQty} showCart={showCart} setShowCart={setShowCart} theme="green" />

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
                🕐 {t.hours}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9", marginBottom: 8 }}>{t.contactLabel}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="https://www.facebook.com/thaimartsuwon" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 13 }}>📘 Facebook: เจริญไทยมาร์ท ซูวอน</a>
                <a href="https://line.me/R/ti/p/@486wfonl" target="_blank" rel="noopener noreferrer" style={{ color: "#06c755", textDecoration: "none", fontSize: 13 }}>💬 Line: @486wfonl</a>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9", marginBottom: 8 }}>{t.deliveryLabel}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                🚚 {t.deliveryDetail}
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
