import Link from "next/link";

const products = [
  {
    name: "ข้าวเหนียวหน้าเป็ด",
    desc: "ของฝากและอาหารทานเล่นจากไทยที่เหมาะกับลูกค้าคนไทยในเกาหลี",
    price: "₩16,500",
    tag: "ขายดี",
    image: "/charoenthaimart/charoenthaimart-logo.jpg",
  },
  {
    name: "เครื่องปรุงรสไทย",
    desc: "พริกแกง น้ำปลา ซอสและเครื่องปรุงที่ใช้ได้จริงในทุกครัว",
    price: "₩9,900",
    tag: "โปรโมชั่น",
    image: "/charoenthaimart/charoenthaimart-shop.jpg",
  },
  {
    name: "ขนมและของฝากไทย",
    desc: "เลือกซื้อของฝากบ้านและขนมไทยเพื่อมอบให้คนพิเศษ",
    price: "₩12,000",
    tag: "ใหม่",
    image: "/charoenthaimart/charoenthaimart-logo.jpg",
  },
];

export const metadata = {
  title: "สินค้าของเจริญไทยมาร์ท · Charoen Thai Mart",
  description: "สินค้าของไทยจากเจริญไทยมาร์ท ซูวอน",
};

export default function CharoenthaimartShopPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #fff7ed 0%, #fff 100%)", color: "#1f2937", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 20px 80px" }}>
        <Link href="/charoenthaimart" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#b45309", fontWeight: 800, textDecoration: "none", marginBottom: 20 }}>
          ← กลับหน้าเจริญไทยมาร์ท
        </Link>
        <section style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 45%, #dc2626 100%)", color: "#fff", borderRadius: 24, padding: "32px 28px", boxShadow: "0 16px 50px rgba(185,28,28,.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "#fde68a", marginBottom: 8 }}>Thai Market Collection</div>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 8px" }}>สินค้าของเราในเจริญไทยมาร์ท</h1>
              <p style={{ margin: 0, fontSize: 15, color: "#fecaca", maxWidth: 680, lineHeight: 1.6 }}>
                เลือกซื้ออาหารไทย เครื่องปรุงรส และของฝากคุณภาพจากไทยที่พร้อมส่งถึงเกาหลีอย่างสะดวกสบาย
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 18, padding: "12px 16px", minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fde68a", marginBottom: 6 }}>โปรโมชั่นวันนี้</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>FLASH SALE · 10% Off</div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {products.map((product) => (
            <article key={product.name} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", border: "1px solid #f3e8d8", boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
              <div style={{ height: 180, background: "linear-gradient(135deg, #fef3c7 0%, #fde8c8 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ background: "#fef3c7", color: "#b45309", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 800 }}>{product.tag}</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#b91c1c" }}>{product.price}</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>{product.name}</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{product.desc}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
