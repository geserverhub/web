"use client";
import { useEffect, useState } from "react";

const LANGS = [
  { key: "th", label: "ไทย 🇹🇭" },
  { key: "ko", label: "한국어 🇰🇷" },
  { key: "en", label: "English 🇬🇧" },
  { key: "zh", label: "中文 🇨🇳" },
  { key: "vi", label: "Tiếng Việt 🇻🇳" },
];

const DEFAULTS = {
  th: "🛒 เจริญไทยมาร์ท ซูวอน · ส่งทั่วเกาหลี 20กก. ₩6,000 · เปิดทุกวัน 10:00-22:00 · โทร 010-8766-4569 · LINE @486wfonl  |  ขายอาหารไทย เครื่องปรุงรส สินค้านำเข้าจากไทย  |  경기도 수원시 권선구 세권로 153(권선동)",
  ko: "🛒 차로엔 타이 마트 수원 · 전국 배송 20kg ₩6,000 · 매일 10:00-22:00 영업 · 전화 010-8766-4569 · LINE @486wfonl  |  태국 식품·양념·수입 제품 전문  |  경기도 수원시 권선구 세권로 153(권선동)",
  en: "🛒 Charoen Thai Mart Suwon · Nationwide delivery 20kg ₩6,000 · Open daily 10:00-22:00 · Call 010-8766-4569 · LINE @486wfonl  |  Thai food, seasonings, imported goods  |  153 Segwon-ro, Gwonseon-gu, Suwon",
  zh: "🛒 차로엔泰国超市水原 · 全国配送 20kg ₩6,000 · 每日10:00-22:00营业 · 电话 010-8766-4569 · LINE @486wfonl  |  泰国食品 调味料 进口商品  |  경기도 수원시 권선구 세권로 153",
  vi: "🛒 Charoen Thai Mart Suwon · Giao hàng toàn quốc 20kg ₩6,000 · Mở cửa 10:00-22:00 · Gọi 010-8766-4569 · LINE @486wfonl  |  Thực phẩm Thái, gia vị, hàng nhập khẩu  |  153 Segwon-ro, Gwonseon-gu, Suwon",
};

export default function CtmAnnouncementsPage() {
  const [texts, setTexts] = useState(DEFAULTS);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/ctm/announcements").then(r => r.json()).then(d => {
      if (d.announcements && Object.keys(d.announcements).length > 0) {
        setTexts(t => ({ ...t, ...d.announcements }));
      }
      setLoaded(true);
    });
  }, []);

  const save = async (lang) => {
    setSaving(s => ({ ...s, [lang]: true }));
    await fetch("/api/ctm/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, text: texts[lang] }),
    });
    setSaving(s => ({ ...s, [lang]: false }));
    setSaved(s => ({ ...s, [lang]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [lang]: false })), 2500);
  };

  if (!loaded) return <div style={{ padding: 32, color: "#9ca3af" }}>กำลังโหลด...</div>;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 780 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 6px" }}>แก้ไขข้อความป้ายประกาศ</h1>
      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px" }}>
        แก้ไขข้อความแถบเลื่อนประกาศสำหรับแต่ละภาษา — <a href="/charoenthaimart" target="_blank" style={{ color: "#2563eb" }}>ดูหน้าร้าน ↗</a>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {LANGS.map(({ key, label }) => (
          <div key={key} style={{ background: "#fff", border: "1px solid #e7e3d8", borderRadius: 12, padding: "16px 20px" }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 10 }}>{label}</label>
            <textarea
              value={texts[key] || ""}
              onChange={e => setTexts(t => ({ ...t, [key]: e.target.value }))}
              rows={3}
              style={{ width: "100%", border: "1px solid #e7e3d8", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6, fontFamily: "sans-serif" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => save(key)}
                disabled={saving[key]}
                style={{ background: saving[key] ? "#d97706" : "#b45309", color: "#fff", border: "none", borderRadius: 7, padding: "7px 20px", fontWeight: 700, fontSize: 13, cursor: saving[key] ? "default" : "pointer" }}>
                {saving[key] ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              {saved[key] && <span style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>✓ บันทึกแล้ว</span>}
              <button
                onClick={() => setTexts(t => ({ ...t, [key]: DEFAULTS[key] }))}
                style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                รีเซ็ต
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
