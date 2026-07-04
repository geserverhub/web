"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CartDrawer from "../CartDrawer";
import { LANGS, FlagSVG } from "../FlagSVG";

const NO_CAT = { th: "สินค้าทั่วไป", ko: "일반 상품", en: "General", zh: "一般商品", vi: "Sản phẩm chung" };

const T = {
  th: {
    back: "← กลับหน้าเจริญไทยมาร์ท", tag: "Thai Market Collection",
    heroTitle: "สินค้าของเราในเจริญไทยมาร์ท",
    heroDesc: "เลือกซื้ออาหารไทย เครื่องปรุงรส และของฝากคุณภาพจากไทยที่พร้อมส่งถึงเกาหลีอย่างสะดวกสบาย",
    totalLabel: "สินค้าทั้งหมด", items: "รายการ", loading: "กำลังโหลด...", noProducts: "ยังไม่มีสินค้าในระบบ",
    allCat: "🛍️ ทั้งหมด", outOfStock: "สินค้าหมด", addCart: "+ ใส่ตะกร้า", inCart: "ในตะกร้า", unit: "ชิ้น",
  },
  ko: {
    back: "← 차로엔 타이 마트로 돌아가기", tag: "Thai Market Collection",
    heroTitle: "차로엔 타이 마트의 상품",
    heroDesc: "태국 음식, 조미료, 고품질 태국 선물을 한국으로 편리하게 배송받으세요",
    totalLabel: "전체 상품", items: "개", loading: "로딩 중...", noProducts: "아직 등록된 상품이 없습니다",
    allCat: "🛍️ 전체", outOfStock: "품절", addCart: "+ 장바구니 담기", inCart: "담음", unit: "개",
  },
  en: {
    back: "← Back to Charoen Thai Mart", tag: "Thai Market Collection",
    heroTitle: "Our Products at Charoen Thai Mart",
    heroDesc: "Shop Thai food, seasonings, and quality Thai gifts delivered conveniently across Korea",
    totalLabel: "Total Products", items: "items", loading: "Loading...", noProducts: "No products yet",
    allCat: "🛍️ All", outOfStock: "Out of stock", addCart: "+ Add to cart", inCart: "in cart", unit: "pcs",
  },
  zh: {
    back: "← 返回Charoen Thai Mart", tag: "Thai Market Collection",
    heroTitle: "Charoen Thai Mart 的商品",
    heroDesc: "选购泰国食品、调味料和优质泰国礼品，便捷配送至韩国各地",
    totalLabel: "全部商品", items: "件", loading: "加载中...", noProducts: "暂无商品",
    allCat: "🛍️ 全部", outOfStock: "缺货", addCart: "+ 加入购物车", inCart: "已加入", unit: "件",
  },
  vi: {
    back: "← Quay lại Charoen Thai Mart", tag: "Thai Market Collection",
    heroTitle: "Sản phẩm của chúng tôi tại Charoen Thai Mart",
    heroDesc: "Chọn mua thực phẩm Thái, gia vị và quà tặng Thái chất lượng, giao hàng thuận tiện khắp Hàn Quốc",
    totalLabel: "Tổng sản phẩm", items: "sản phẩm", loading: "Đang tải...", noProducts: "Chưa có sản phẩm",
    allCat: "🛍️ Tất cả", outOfStock: "Hết hàng", addCart: "+ Thêm vào giỏ", inCart: "trong giỏ", unit: "cái",
  },
};

export default function CharoenthaimartShopPage() {
  const [lang, setLang] = useState("th");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [activeCat, setActiveCat] = useState("all");

  const t = T[lang];
  const noCat = NO_CAT[lang];

  useEffect(() => {
    fetch("/api/ctm/products/public").then(r => r.json()).then(d => {
      setProducts(d.products || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  const grouped = {};
  for (const p of products) {
    const cat = p.category || noCat;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }
  const cats = Object.keys(grouped).sort((a, b) => a === noCat ? 1 : b === noCat ? -1 : a.localeCompare(b, "th"));
  const visibleCats = activeCat === "all" ? cats : cats.filter(c => c === activeCat);

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #fff7ed 0%, #fff 100%)", color: "#1f2937", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 20px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          <Link href="/charoenthaimart" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#b45309", fontWeight: 800, textDecoration: "none" }}>
            {t.back}
          </Link>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LANGS.map(l => (
              <button key={l.key} onClick={() => setLang(l.key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20,
                  border: "1px solid", borderColor: lang === l.key ? "#b45309" : "#e2e8f0",
                  background: lang === l.key ? "#fef3c7" : "#fff", color: lang === l.key ? "#92400e" : "#64748b",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                <FlagSVG langKey={l.key} size={20} />
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <section style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 45%, #d97706 100%)", color: "#fff", borderRadius: 24, padding: "32px 28px", boxShadow: "0 16px 50px rgba(180,83,9,.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "#fde68a", marginBottom: 8 }}>{t.tag}</div>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 8px" }}>{t.heroTitle}</h1>
              <p style={{ margin: 0, fontSize: 15, color: "#fde8c8", maxWidth: 680, lineHeight: 1.6 }}>
                {t.heroDesc}
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 18, padding: "12px 16px", minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fde68a", marginBottom: 6 }}>{t.totalLabel}</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{products.length} {t.items}</div>
            </div>
          </div>
        </section>

        {loading && <div style={{ marginTop: 40, textAlign: "center", color: "#9ca3af", fontSize: 15 }}>{t.loading}</div>}
        {!loading && cats.length === 0 && (
          <div style={{ marginTop: 40, textAlign: "center", color: "#9ca3af", fontSize: 15 }}>{t.noProducts}</div>
        )}

        {cats.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 28 }}>
            <button onClick={() => setActiveCat("all")} style={{
              padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 13,
              background: activeCat === "all" ? "linear-gradient(135deg,#b45309,#d97706)" : "#fff",
              color: activeCat === "all" ? "#fff" : "#92400e",
              boxShadow: activeCat === "all" ? "0 3px 12px rgba(180,83,9,.3)" : "0 1px 4px rgba(0,0,0,.06)",
              border: activeCat === "all" ? "none" : "1.5px solid #fde8c8",
            }}>{t.allCat} ({products.length})</button>
            {cats.map(c => (
              <button key={c} onClick={() => setActiveCat(c)} style={{
                padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 13,
                background: activeCat === c ? "linear-gradient(135deg,#b45309,#d97706)" : "#fff",
                color: activeCat === c ? "#fff" : "#92400e",
                boxShadow: activeCat === c ? "0 3px 12px rgba(180,83,9,.3)" : "0 1px 4px rgba(0,0,0,.06)",
                border: activeCat === c ? "none" : "1.5px solid #fde8c8",
              }}>{c} ({grouped[c].length})</button>
            ))}
          </div>
        )}

        {visibleCats.map(cat => (
          <section key={cat} style={{ marginTop: 36 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16, borderBottom: "2px solid #fde8c8", paddingBottom: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#92400e", margin: 0 }}>{cat}</h2>
              <span style={{ fontSize: 12, color: "#b45309", fontWeight: 700 }}>{grouped[cat].length} {t.items}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 220px))", gap: 18 }}>
              {grouped[cat].map(product => {
                const inCart = cart.find(c => c.id === product.id);
                const outOfStock = Number(product.stock) <= 0 || product.isActive === false;
                return (
                  <article key={product.id} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #f3e8d8", boxShadow: "0 6px 18px rgba(0,0,0,.05)", display: "flex", flexDirection: "column" }}>
                    <div style={{ aspectRatio: "1 / 1", background: "linear-gradient(135deg, #fef3c7 0%, #fde8c8 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: 10, boxSizing: "border-box" }}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
                      ) : (
                        <span style={{ fontSize: 32 }}>📦</span>
                      )}
                      {outOfStock && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(31,41,55,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ background: "#fff", color: "#b91c1c", borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 900 }}>{t.outOfStock}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ background: "#fef3c7", color: "#b45309", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>{product.unit || t.unit}</span>
                        <span style={{ fontSize: 15, fontWeight: 900, color: "#b45309" }}>₩{Number(product.sellPrice).toLocaleString("ko-KR")}</span>
                      </div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.name}</h3>
                      {product.nameKo && <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{product.nameKo}</div>}
                      <button onClick={() => !outOfStock && addToCart(product)} disabled={outOfStock}
                        style={{
                          width: "100%", marginTop: 8, border: "none", borderRadius: 8, padding: "8px", fontWeight: 800, fontSize: 12,
                          cursor: outOfStock ? "not-allowed" : "pointer",
                          background: outOfStock ? "#e5e7eb" : inCart ? "linear-gradient(135deg,#166534,#16a34a)" : "linear-gradient(135deg,#b45309,#d97706)",
                          color: outOfStock ? "#9ca3af" : "#fff",
                          boxShadow: outOfStock ? "none" : "0 2px 6px rgba(180,83,9,.3)",
                        }}>
                        {outOfStock ? t.outOfStock : inCart ? `✓ ${inCart.qty} ${t.inCart}` : t.addCart}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button onClick={() => setShowCart(true)}
          style={{ position: "fixed", bottom: 28, right: 24, background: "linear-gradient(135deg,#b45309,#d97706)", color: "#fff", border: "none", borderRadius: 50, padding: "14px 24px", fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 28px rgba(180,83,9,.5)", zIndex: 100, display: "flex", alignItems: "center", gap: 10 }}>
          🛒 <span>{cartCount} {t.items}</span> <span style={{ background: "rgba(255,255,255,.25)", borderRadius: 20, padding: "3px 12px", fontWeight: 900 }}>₩{cartTotal.toLocaleString()}</span>
        </button>
      )}

      <CartDrawer cart={cart} setCartQty={setCartQty} showCart={showCart} setShowCart={setShowCart} theme="orange" lang={lang} />
    </main>
  );
}
