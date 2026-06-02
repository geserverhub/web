"use client";
import { useState, useEffect } from "react";
import { CARGO_APP_NAME } from "@/lib/cargo-mobile";

const STATUS_STEPS = [
  { key: "รอดำเนินการ", label: "รอดำเนินการ", sub: "처리 대기", icon: "⏳" },
  { key: "รับพัสดุเข้าคลังแล้ว", label: "รับพัสดุเข้าคลัง", sub: "소포 입고 완료", icon: "📦" },
  { key: "กำลังรีแพ็คพัสดุ", label: "รีแพ็คพัสดุ", sub: "재포장 중", icon: "🔄" },
  { key: "พัสดุกำลังเตรียมขึ้นเครื่อง", label: "เตรียมขึ้นเครื่อง", sub: "탑재 준비 중", icon: "🛫" },
  { key: "พัสดุกำลังดำเนินการศุลกากร", label: "ดำเนินการศุลกากร", sub: "통관 진행 중", icon: "🏛️" },
  { key: "พัสดุกำลังจัดส่งไปยังปลายทาง", label: "จัดส่งไปปลายทาง", sub: "배송 중", icon: "✈️" },
  { key: "พัสดุจัดส่งหน้าบ้านผู้รับเรียบร้อยแล้ว", label: "จัดส่งสำเร็จ", sub: "배송 완료", icon: "✅" },
];

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const inputStyle = {
  width: "100%",
  background: "#1e2130",
  border: "1px solid #2a2d3a",
  borderRadius: 8,
  padding: "11px 14px",
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, color: "#8b8fa8", marginBottom: 6, display: "block" };
const cardStyle = {
  width: "100%",
  maxWidth: 520,
  background: "#16181f",
  borderRadius: 14,
  border: "1px solid #2a2d3a",
  padding: "28px 24px",
  boxShadow: "0 8px 40px rgba(0,0,0,.5)",
};

export default function CargoTrackPage() {
  const [tab, setTab] = useState("track");
  const brandName = CARGO_APP_NAME;

  const [trackPhone, setTrackPhone] = useState("");
  const [trackType, setTrackType] = useState("");
  const [showPriceFor, setShowPriceFor] = useState("");
  const [ratesData, setRatesData] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResults, setTrackResults] = useState([]);
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState("");

  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsList, setShipmentsList] = useState([]);
  const [shipmentsError, setShipmentsError] = useState("");
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState("all");

  const [reqForm, setReqForm] = useState({
    senderName: "", senderPhone: "", receiverName: "", receiverPhone: "",
    receiverAddress: "", direction: "TH_TO_KR", itemDesc: "", passportNo: "",
  });
  const [reqLoading, setReqLoading] = useState(false);
  const [reqDone, setReqDone] = useState(null);
  const [reqError, setReqError] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  // parcel image (photo of package / tracking label)
  const [parcelFile, setParcelFile] = useState(null);
  const [parcelPreview, setParcelPreview] = useState(null);
  const [parcelUploading, setParcelUploading] = useState(false);
  const [parcelUploadedUrl, setParcelUploadedUrl] = useState("");

  const [showReg, setShowReg] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [regDone, setRegDone] = useState(false);
  const [regError, setRegError] = useState("");

  // Phone login
  const [cargoUser, setCargoUser] = useState(() => { try { return JSON.parse(localStorage.getItem("cargo_user") || "null"); } catch { return null; } });
  const [showLogin, setShowLogin] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = async (userId) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/cargo/profile?customerId=${userId}`);
      const d = await res.json();
      if (res.ok) setProfileData(d);
    } catch { /* silent */ }
    finally { setProfileLoading(false); }
  };

  const loadShipments = async () => {
    if (!cargoUser?.phone) { setShipmentsError("กรุณาเข้าระบบก่อน"); return; }
    setShipmentsLoading(true);
    setShipmentsError("");
    try {
      const res = await fetch(`/api/cargo/track?phone=${encodeURIComponent(cargoUser.phone)}`);
      const d = await res.json();
      if (res.ok) {
        setShipmentsList(d.orders || (d.order ? [d.order] : []));
      } else {
        setShipmentsError(d.error || "ไม่พบรายการ");
      }
    } catch {
      setShipmentsError("เชื่อมต่อไม่ได้");
    } finally {
      setShipmentsLoading(false);
    }
  };

  // Load profile once on mount if already logged in
  useEffect(() => {
    if (cargoUser?.id) loadProfile(cargoUser.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = async () => {
    if (!loginPhone.trim()) return;
    setLoginLoading(true); setLoginError("");
    try {
      const res = await fetch("/api/cargo/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: loginPhone.trim() }) });
      const d = await res.json();
      if (!res.ok) { setLoginError(d.error || "เข้าระบบไม่สำเร็จ"); return; }
      localStorage.setItem("cargo_user", JSON.stringify(d.user));
      setCargoUser(d.user);
      setShowLogin(false);
      setLoginPhone("");
      loadProfile(d.user.id);
      // Pre-fill receiver info in request form if available
      if (d.user.name) setReqForm(p => ({ ...p, receiverName: d.user.name, receiverPhone: d.user.phone || p.receiverPhone, receiverAddress: d.user.address || p.receiverAddress }));
    } catch { setLoginError("เชื่อมต่อไม่ได้ กรุณาลองใหม่"); }
    finally { setLoginLoading(false); }
  };

  // Auto-load shipments when tab switches
  if (tab === "shipments-list" && cargoUser && shipmentsList.length === 0 && !shipmentsLoading && !shipmentsError) loadShipments();

  // Load shipping rates once
  if (ratesData === null) {
    fetch("/api/cargo/rates").then(r => r.json()).then(d => setRatesData(d)).catch(() => setRatesData({}));
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    const ph = trackPhone.trim();
    if (!ph) { setTrackError("กรุณากรอกเบอร์โทรผู้รับ"); return; }
    setTrackLoading(true); setTrackError(""); setTrackResult(null); setTrackResults([]);
    try {
      const res = await fetch(`/api/cargo/track?phone=${encodeURIComponent(ph)}`);
      const d = await res.json();
      if (!res.ok) { setTrackError(d.error || "ไม่พบข้อมูล"); return; }
      const list = d.orders || (d.order ? [d.order] : []);
      setTrackResults(list);
      setTrackResult(list[0] || null);
    } catch { setTrackError("เชื่อมต่อไม่ได้ กรุณาลองใหม่"); }
    finally { setTrackLoading(false); }
  };

  const handleReqChange = (k, v) => setReqForm(f => ({ ...f, [k]: v }));

  const handleReqSubmit = async (e) => {
    e.preventDefault();
    if (!reqForm.senderName.trim() || !reqForm.receiverName.trim()) {
      setReqError("กรุณากรอกชื่อผู้ส่งและผู้รับ");
      return;
    }
    setReqLoading(true); setReqError(""); setReqDone(null);
    try {
      // Upload image first if selected
      let imageUrl = uploadedUrl;
      if (uploadFile && !uploadedUrl) {
        setUploadLoading(true);
        const fd = new FormData();
        fd.append("file", uploadFile);
        const upRes = await fetch("/api/cargo/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        setUploadLoading(false);
        if (!upRes.ok) { setReqError(upData.error || "อัปโหลดรูปไม่สำเร็จ"); setReqLoading(false); return; }
        imageUrl = upData.url;
        setUploadedUrl(imageUrl);
      }
      // Upload parcel image if selected
      let parcelImageUrl = parcelUploadedUrl;
      if (parcelFile && !parcelUploadedUrl) {
        setParcelUploading(true);
        const fd2 = new FormData();
        fd2.append("file", parcelFile);
        const upRes2 = await fetch("/api/cargo/upload", { method: "POST", body: fd2 });
        const upData2 = await upRes2.json();
        setParcelUploading(false);
        if (!upRes2.ok) { setReqError(upData2.error || "อัปโหลดรูปพัสดุไม่สำเร็จ"); setReqLoading(false); return; }
        parcelImageUrl = upData2.url;
        setParcelUploadedUrl(parcelImageUrl);
      }
      const res = await fetch("/api/cargo/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reqForm, imageUrl, parcelImageUrl }),
      });
      const d = await res.json();
      if (!res.ok) { setReqError(d.error || "เกิดข้อผิดพลาด"); return; }
      setReqDone(d);
      setReqForm({ senderName: "", senderPhone: "", receiverName: "", receiverPhone: "", receiverAddress: "", direction: "TH_TO_KR", itemDesc: "", passportNo: "" });
      setUploadFile(null); setUploadPreview(null); setUploadedUrl("");
      setParcelFile(null); setParcelPreview(null); setParcelUploadedUrl("");
    } catch { setReqError("เชื่อมต่อไม่ได้ กรุณาลองใหม่"); }
    finally { setReqLoading(false); }
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name.trim()) { setRegError("กรุณากรอกชื่อ"); return; }
    setRegLoading(true); setRegError(""); setRegDone(false);
    try {
      const res = await fetch("/api/cargo/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const d = await res.json();
      if (!res.ok) { setRegError(d.error || "เกิดข้อผิดพลาด"); return; }
      setRegDone(true);
      setRegForm({ name: "", email: "", phone: "" });
    } catch { setRegError("เชื่อมต่อไม่ได้ กรุณาลองใหม่"); }
    finally { setRegLoading(false); }
  };

  const stepIndex = trackResult ? STATUS_STEPS.findIndex(s => s.key === trackResult.status) : -1;
  const isProblem = trackResult?.status === "มีปัญหา";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0f1a 0%,#141720 60%,#0a1020 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "40px 16px 60px", fontFamily: "'Noto Sans Thai',sans-serif" }}>

      {showReg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowReg(false)}>
          <div style={{ background: "#16181f", borderRadius: 16, border: "1px solid #2a2d3a", padding: "28px 24px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,.8)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>👤 ลงทะเบียนผู้ใช้</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>회원 등록 · สมัครรับบริการคาโก้</div>
              </div>
              <button onClick={() => { setShowReg(false); setRegDone(false); setRegError(""); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
            </div>
            {regDone ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#4ade80", marginBottom: 6 }}>ลงทะเบียนสำเร็จ!</div>
                <div style={{ fontSize: 13, color: "#8b8fa8" }}>ทีมงานจะติดต่อกลับหาคุณเร็วๆ นี้</div>
                <button onClick={() => { setShowReg(false); setRegDone(false); }} style={{ marginTop: 20, padding: "10px 28px", background: "#facc15", color: "#000", fontWeight: 800, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>ปิด</button>
              </div>
            ) : (
              <form onSubmit={handleRegSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>ชื่อ-นามสกุล *</label>
                  <input style={inputStyle} placeholder="เช่น สมชาย ใจดี" value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>อีเมล</label>
                  <input style={inputStyle} type="email" placeholder="example@email.com" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>เบอร์โทรศัพท์</label>
                  <input style={inputStyle} placeholder="0812345678" value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                {regError && <div style={{ padding: "9px 12px", background: "#2a1f1f", border: "1px solid #f8717144", borderRadius: 8, color: "#f87171", fontSize: 13 }}>⚠️ {regError}</div>}
                <button type="submit" disabled={regLoading} style={{ padding: "12px", background: "#facc15", color: "#000", fontWeight: 800, fontSize: 15, border: "none", borderRadius: 8, cursor: "pointer" }}>
                  {regLoading ? "⏳ กำลังบันทึก..." : "✅ ลงทะเบียน"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <img
          src="/cargo/cargo-logo.png"
          alt={brandName}
          style={{ width: 120, height: 72, objectFit: "contain", marginBottom: 10 }}
        />
        <div style={{ fontSize: 22, fontWeight: 900, color: "#facc15", letterSpacing: 1 }}>{brandName}</div>
        <div style={{ fontSize: 13, color: "#8b8fa8", marginTop: 2 }}>บริการคาโก้ ไทย-เกาหลี · 항공 화물 서비스</div>
      </div>

      {/* Login modal */}
      {showLogin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#16181f", borderRadius: 14, padding: "32px 28px", width: "100%", maxWidth: 400, border: "1px solid #2a2d3a" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#facc15", marginBottom: 6 }}>🔐 เข้าระบบ</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>กรอกเบอร์มือถือที่ลงทะเบียนไว้</div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>เบอร์โทรที่ลงทะเบียน</label>
              <input style={inputStyle} type="tel" placeholder="0812345678"
                value={loginPhone} onChange={e => setLoginPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doLogin()} autoFocus />
            </div>
            {loginError && <div style={{ padding: "9px 12px", background: "#2a1f1f", border: "1px solid #f8717144", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 12 }}>⚠️ {loginError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ flex: 1, padding: "12px", background: "#1e2130", border: "1px solid #2a2d3a", color: "#8b8fa8", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }} onClick={() => { setShowLogin(false); setLoginError(""); }}>ยกเลิก</button>
              <button disabled={loginLoading} style={{ flex: 2, padding: "12px", background: "#facc15", color: "#000", fontWeight: 800, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }} onClick={doLogin}>
                {loginLoading ? "⏳ กำลังตรวจสอบ..." : "🔐 เข้าระบบ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 520, display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
        {cargoUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>👤 {cargoUser.name}</span>
            <button onClick={() => { localStorage.removeItem("cargo_user"); setCargoUser(null); }} style={{ padding: "7px 14px", background: "#1e2130", border: "1px solid #2a2d3a", borderRadius: 8, color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <button onClick={() => { setShowLogin(true); setLoginPhone(""); setLoginError(""); }} style={{ padding: "9px 20px", background: "#facc1515", border: "1px solid #facc1540", borderRadius: 8, color: "#facc15", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans Thai',sans-serif" }}>
            🔐 เข้าระบบ
          </button>
        )}
        {!cargoUser && (
          <button onClick={() => { setShowReg(true); setRegDone(false); setRegError(""); }} style={{ padding: "9px 20px", background: "#1e2130", border: "1px solid #2a2d3a", borderRadius: 8, color: "#8b8fa8", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans Thai',sans-serif" }}>
            👤 ลงทะเบียน
          </button>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 520, display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["track","🔍 ตรวจสอบสถานะ"],["request","📬 แจ้งส่งสินค้า"], ...(cargoUser ? [["shipments-list","📦 สถานะการจัดส่ง"],["profile","👤 ข้อมูลของฉัน"]] : [])].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: "11px 8px", borderRadius: 10, border: `1px solid ${tab === key ? "#facc15" : "#2a2d3a"}`, background: tab === key ? "#facc1515" : "#16181f", color: tab === key ? "#facc15" : "#64748b", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Noto Sans Thai',sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "track" && (
        <>
          <div style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>🔍 ตรวจสอบสถานะพัสดุ</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>입력하신 화물 번호로 상태를 확인하세요</div>

            {/* Transport type selector */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#8b8fa8", marginBottom: 8, fontWeight: 700 }}>ประเภทการขนส่ง</div>
              {/* Pricing data — from API */}
              {(() => {
                const mkEmpty = () => Array.from({ length: 20 }, (_, i) => ({ kg: i + 1, price: null }));
                const symMap = { KRW: "₩", THB: "฿" };
                const getDisplay = (routeKey) => {
                  const route = ratesData?.[routeKey];
                  if (!route) return { rates: mkEmpty(), sym: "₩", cur: "KRW" };
                  const cur = route.displayCurrency || "KRW";
                  const rates = route.rates?.[cur] || mkEmpty();
                  return { rates, sym: symMap[cur] || "₩", cur };
                };
                const PRICE_TH_KR = getDisplay("air_th_kr").rates;
                const airThKrSym = getDisplay("air_th_kr").sym;
                const types = [
                  { key: "air_th_kr", icon: "✈️", label: "ส่งทางเครื่องบิน", sub: "🇹🇭 ไทย → เกาหลี 🇰🇷", hasPriceTable: true },
                  { key: "air_kr_th", icon: "✈️", label: "ส่งทางเครื่องบิน", sub: "🇰🇷 เกาหลี → ไทย 🇹🇭", hasPriceTable: false },
                  { key: "sea_kr_th", icon: "🚢", label: "ส่งทางเรือ",        sub: "🇰🇷 เกาหลี → ไทย 🇹🇭", hasPriceTable: false },
                ];
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {types.map(({ key, icon, label, sub, hasPriceTable }) => (
                      <div key={key}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" onClick={() => setTrackType(key)}
                            style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${trackType === key ? "#facc15" : "#2a2d3a"}`, background: trackType === key ? "#facc1515" : "#1e2130", cursor: "pointer", textAlign: "left" }}>
                            <span style={{ fontSize: 18 }}>{icon}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: trackType === key ? "#facc15" : "#e2e8f0" }}>{label}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{sub}</div>
                            </div>
                            {trackType === key && <span style={{ marginLeft: "auto", color: "#facc15", fontWeight: 800 }}>✓</span>}
                          </button>
                          <button type="button"
                            onClick={() => setShowPriceFor(showPriceFor === key ? "" : key)}
                            style={{ padding: "0 12px", borderRadius: 8, border: `1.5px solid ${showPriceFor === key ? "#4ade80" : "#2a2d3a"}`, background: showPriceFor === key ? "#0f2318" : "#1e2130", color: showPriceFor === key ? "#4ade80" : "#8b8fa8", fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
                            💰 ราคา
                          </button>
                        </div>
                        {showPriceFor === key && (
                          <div style={{ marginTop: 6, background: "#0f1a10", border: "1px solid #166534", borderRadius: 8, padding: "12px 14px" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>💰 ราคาค่าขนส่ง · {sub}</div>
                            {(() => {
                              const routeMap = { air_th_kr: "air_th_kr", air_kr_th: "air_kr_th", sea_kr_th: "sea_kr_th" };
                              const { rates: displayRates, sym: displaySym } = getDisplay(routeMap[key] || key);
                              const hasAnyPrice = displayRates.some(r => r.price);
                              if (!hasAnyPrice) return (
                                <div style={{ textAlign: "center", padding: "12px 0" }}>
                                  <div style={{ fontSize: 22, marginBottom: 6 }}>📞</div>
                                  <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>ติดต่อสอบถามราคา</div>
                                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{brandName} · 010-8811-5565</div>
                                </div>
                              );
                              return (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                  {displayRates.map(({ kg, price }) => (
                                    <div key={kg} style={{ display: "flex", justifyContent: "space-between", background: "#1a2e1a", borderRadius: 5, padding: "5px 10px", fontSize: 12 }}>
                                      <span style={{ color: "#8b8fa8" }}>{kg} กก.</span>
                                      <span style={{ color: price ? "#4ade80" : "#4a5070", fontWeight: 700 }}>
                                        {price ? `${displaySym}${price.toLocaleString()}` : "—"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>เบอร์โทรผู้รับ · 수령인 전화번호</label>
                <input style={inputStyle} placeholder="0812345678" type="tel" value={trackPhone} onChange={e => setTrackPhone(e.target.value)} autoComplete="off" />
              </div>
              <button type="submit" disabled={trackLoading} style={{ padding: "12px 22px", background: "#facc15", color: "#000", fontWeight: 800, fontSize: 14, border: "none", borderRadius: 8, cursor: "pointer" }}>
                {trackLoading ? "⏳ กำลังค้นหา..." : "🔍 ค้นหา"}
              </button>
            </form>
            {trackError && <div style={{ marginTop: 12, padding: "10px 14px", background: "#2a1f1f", border: "1px solid #f8717144", borderRadius: 8, color: "#f87171", fontSize: 13 }}>⚠️ {trackError}</div>}

          {trackResults.length > 1 && (
            <div style={{ marginTop: 16, borderTop: "1px solid #2a2d3a", paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: "#8b8fa8", marginBottom: 8 }}>พบ {trackResults.length} รายการ — เลือกรายการที่ต้องการ:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {trackResults.map(o => (
                  <button key={o.number} type="button" onClick={() => setTrackResult(o)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${trackResult?.number === o.number ? "#facc15" : "#2a2d3a"}`, background: trackResult?.number === o.number ? "#facc1515" : "#1e2130", cursor: "pointer", textAlign: "left" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#facc15", fontFamily: "monospace" }}>{o.number}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{o.direction === "TH_TO_KR" ? "🇹🇭→🇰🇷" : "🇰🇷→🇹🇭"} · {o.status}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#4a5070" }}>{new Date(o.createdAt).toLocaleDateString("th-TH")}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {trackResult && (
            <div style={{ marginTop: 20, borderTop: "1px solid #2a2d3a", paddingTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>หมายเลขพัสดุ / 화물 번호</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 15, color: "#facc15" }}>{trackResult.number}</div>
                </div>
                <span style={{ padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: isProblem ? "#f8717122" : "#4ade8022", color: isProblem ? "#f87171" : "#4ade80", border: `1px solid ${isProblem ? "#f87171" : "#4ade80"}44` }}>
                  {trackResult.status}
                </span>
              </div>

              {!isProblem && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    {STATUS_STEPS.map((step, idx) => {
                      const done = idx <= stepIndex;
                      const active = idx === stepIndex;
                      return (
                        <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div style={{ position: "absolute", top: 18, left: "50%", width: "100%", height: 3, background: idx < stepIndex ? "#facc15" : "#2a2d3a", zIndex: 0 }} />
                          )}
                          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${done ? "#facc15" : "#2a2d3a"}`, background: active ? "#facc15" : done ? "#facc1544" : "#1a1d27", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, zIndex: 1, position: "relative" }}>
                            {done ? step.icon : "○"}
                          </div>
                          <div style={{ fontSize: 10, color: done ? "#facc15" : "#64748b", fontWeight: done ? 700 : 400, textAlign: "center", marginTop: 6, lineHeight: 1.3 }}>{step.label}</div>
                          <div style={{ fontSize: 9, color: "#64748b", textAlign: "center", marginTop: 2 }}>{step.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isProblem && (
                <div style={{ padding: "12px 16px", background: "#2a1f1f", border: "1px solid #f8717144", borderRadius: 8, color: "#f87171", fontSize: 13, marginBottom: 18 }}>
                  ⚠️ พบปัญหาในการจัดส่ง กรุณาติดต่อเจ้าหน้าที่
                </div>
              )}

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>📤 ผู้ส่ง</div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{trackResult.senderName}</div>
                  </div>
                  <div style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>📬 ผู้รับ</div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{trackResult.receiverName}</div>
                  </div>
                </div>
                <div style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>🛫 เส้นทาง</div>
                  <div style={{ fontSize: 13, color: trackResult.direction === "TH_TO_KR" ? "#facc15" : "#60a5fa", fontWeight: 700 }}>
                    {trackResult.direction === "TH_TO_KR" ? "🇹🇭 ไทย → เกาหลี 🇰🇷" : "🇰🇷 เกาหลี → ไทย 🇹🇭"}
                  </div>
                </div>
                {trackResult.trackingCode && (
                  <div style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>🏷️ Tracking Code</div>
                    <div style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, fontFamily: "monospace" }}>{trackResult.trackingCode}</div>
                  </div>
                )}
                {trackResult.itemDesc && (
                  <div style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>📋 รายการสินค้า</div>
                    <div style={{ fontSize: 13, color: "#e2e8f0" }}>{trackResult.itemDesc}</div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>📅 รับพัสดุ</div>
                    <div style={{ fontSize: 12, color: "#e2e8f0" }}>{fmtDate(trackResult.createdAt)}</div>
                  </div>
                  {trackResult.deliveredAt && (
                    <div style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, color: "#4ade80", marginBottom: 4 }}>✅ จัดส่งสำเร็จ</div>
                      <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>{fmtDate(trackResult.deliveredAt)}</div>
                    </div>
                  )}
                </div>
                {trackResult.notes && (
                  <div style={{ padding: "10px 14px", background: "#141720", border: "1px solid #2a2d3a", borderRadius: 8, fontSize: 12, color: "#8b8fa8" }}>
                    💬 {trackResult.notes}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 20, padding: "12px 14px", background: "#facc1510", border: "1px solid #facc1530", borderRadius: 8, textAlign: "center", fontSize: 12, color: "#facc15" }}>
                📞 มีคำถาม? ติดต่อ {brandName}
              </div>
            </div>
          )}
          </div>

          {/* CJ Logistics link — shown when air TH→KR selected */}
          {trackType === "air_th_kr" && (
            <div style={{ ...cardStyle, marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#facc15", marginBottom: 4 }}>📦 ตรวจสอบสถานะในเกาหลี · 한국 배송 조회</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>ใช้ Tracking Code จากผลค้นหาด้านบน ตรวจสอบสถานะจัดส่งในเกาหลีได้ที่ CJ Logistics</div>
              {trackResult?.trackingCode && (
                <div style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>🏷️ Tracking Code (CJ Logistics)</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#a78bfa", fontFamily: "monospace" }}>{trackResult.trackingCode}</div>
                  </div>
                  <button type="button"
                    onClick={() => navigator.clipboard.writeText(trackResult.trackingCode)}
                    style={{ background: "#2d1f4a", border: "1px solid #7c3aed", color: "#c084fc", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 700 }}>
                    📋 คัดลอก
                  </button>
                </div>
              )}
              <a href="https://www.cjlogistics.com/ko/tool/parcel/tracking" target="_blank" rel="noopener noreferrer"
                style={{ display: "block", textAlign: "center", padding: "13px 20px", background: "#facc15", color: "#000", fontWeight: 800, fontSize: 14, borderRadius: 8, textDecoration: "none" }}>
                🔗 เปิดหน้า CJ Logistics ตรวจสอบสถานะ →
              </a>
              <div style={{ marginTop: 8, fontSize: 11, color: "#4a5070", textAlign: "center" }}>
                คัดลอก Tracking Code แล้ววางในช่องค้นหาของ CJ Logistics
              </div>
            </div>
          )}
        </>
      )}

      {tab === "request" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>📬 แจ้งส่งสินค้า</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>화물 발송 신청 · กรอกข้อมูลเพื่อแจ้งจัดส่ง</div>
          <div style={{ fontSize: 12, color: "#facc15", marginBottom: 16 }}>กรุณาคลิกเลือกเส้นทางการจัดส่งที่ต้องการ · ที่อยู่ในการส่งสินค้ามาโกดัง จะแสดงเมื่อคลิก</div>

          {reqDone ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              {/* Success header */}
              <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80", marginBottom: 4 }}>แจ้งส่งสินค้าสำเร็จ!</div>
              <div style={{ fontSize: 13, color: "#8b8fa8", marginBottom: 20 }}>ทีมงานได้รับข้อมูลของคุณแล้ว</div>

              {/* Reference number — big & prominent */}
              <div style={{ background: "linear-gradient(135deg,#1a1d2a,#1e2340)", border: "2px solid #facc15", borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>📋 หมายเลขแจ้งส่งสินค้า</div>
                <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 900, color: "#facc15", letterSpacing: 2 }}>{reqDone.number}</div>
                <div style={{ fontSize: 11, color: "#facc1588", marginTop: 6 }}>화물 접수 번호 · Shipment Reference</div>
              </div>

              {/* Screenshot instruction */}
              <div style={{ background: "#1e2130", border: "1.5px solid #f59e0b44", borderRadius: 10, padding: "14px 16px", marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b", marginBottom: 8 }}>📸 กรุณาแคปหน้าจอ / 화면을 캡처해 주세요</div>
                <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.7 }}>
                  แคปหน้าจอเลขนี้ไว้ก่อนปิด แล้ว<br />
                  <span style={{ color: "#facc15", fontWeight: 700 }}>แอดไลน์เพื่อส่งเลขแจ้งส่งให้ทีมงาน</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>이 번호를 캡처하고 라인을 추가해 주세요</div>
              </div>

              {/* LINE QR code */}
              <div style={{ background: "#fff", borderRadius: 14, padding: 16, display: "inline-block", marginBottom: 16, boxShadow: "0 4px 24px rgba(0,0,0,.4)" }}>
                <div style={{ fontSize: 12, color: "#06c755", fontWeight: 800, marginBottom: 10, textAlign: "center" }}>💬 แอดไลน์ GE CARGO</div>
                <img
                  src="/uploads/logos/line-qr.png"
                  alt="LINE QR Code"
                  style={{ width: 180, height: 180, objectFit: "contain", display: "block", margin: "0 auto" }}
                  onError={e => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div style={{ display: "none", width: 180, height: 180, background: "#f0fdf4", borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#16a34a" }}>
                  <div style={{ fontSize: 32 }}>💬</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>LINE QR Code</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>GE CARGO</div>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 10 }}>สแกน QR เพื่อแอดไลน์ / QR 스캔으로 라인 추가</div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { setTab("track"); setTrackInput(reqDone.number); setReqDone(null); }}
                  style={{ padding: "10px 18px", background: "#facc15", color: "#000", fontWeight: 800, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                  🔍 ตรวจสอบสถานะ
                </button>
                <button onClick={() => setReqDone(null)}
                  style={{ padding: "10px 18px", background: "#1e2130", border: "1px solid #2a2d3a", color: "#e2e8f0", fontWeight: 700, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                  + แจ้งส่งใหม่
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReqSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>🛫✈️🚢 เส้นทางการจัดส่ง *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[["TH_TO_KR","✈️ 🇹🇭 ไทย → เกาหลี 🇰🇷"],["KR_TO_TH","✈️ 🇰🇷 เกาหลี → ไทย 🇹🇭"]].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => handleReqChange("direction", val)}
                        style={{ padding: "11px 8px", borderRadius: 8, border: `1.5px solid ${reqForm.direction === val ? "#facc15" : "#2a2d3a"}`, background: reqForm.direction === val ? "#facc1515" : "#1e2130", color: reqForm.direction === val ? "#facc15" : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => handleReqChange("direction", "SEA_KR_TO_TH")}
                    style={{ padding: "11px 8px", borderRadius: 8, border: `1.5px solid ${reqForm.direction === "SEA_KR_TO_TH" ? "#60a5fa" : "#2a2d3a"}`, background: reqForm.direction === "SEA_KR_TO_TH" ? "#0f1830" : "#1e2130", color: reqForm.direction === "SEA_KR_TO_TH" ? "#60a5fa" : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    🚢 เส้นทางเรือ · 🇰🇷 เกาหลี → ไทย 🇹🇭
                  </button>
                </div>
                {reqForm.direction === "TH_TO_KR" && (
                  <div style={{ marginTop: 10, background: "#1a2010", border: "1px solid #4ade80", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>📦 ส่งสินค้ามาที่ (ที่อยู่โกดังในไทย)</div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.7 }}>
                      <strong>Sbai (GE-SERVERHUB)</strong><br />
                      เลขที่ 270 ถนนเลียบคลองสอง 22<br />
                      แขวงบางชัน เขตคลองสามวา<br />
                      จังหวัด กรุงเทพมหานคร 10510
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: "#facc15", fontWeight: 700 }}>
                      📞 โทร. 010-8811-5565
                    </div>
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid #2a2d3a", paddingTop: 14 }}>
                <div style={{ fontSize: 12, color: "#facc15", fontWeight: 700, marginBottom: 10 }}>📤 ข้อมูลผู้ส่ง</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>ชื่อผู้ส่ง *</label>
                    <input style={inputStyle} placeholder="ชื่อ-นามสกุล" value={reqForm.senderName} onChange={e => handleReqChange("senderName", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>เบอร์โทรผู้ส่ง</label>
                    <input style={inputStyle} placeholder="0812345678" value={reqForm.senderPhone} onChange={e => handleReqChange("senderPhone", e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #2a2d3a", paddingTop: 14 }}>
                <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, marginBottom: 10 }}>📬 ข้อมูลผู้รับ</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>ชื่อผู้รับปลายทาง *</label>
                    <input style={inputStyle} placeholder="ชื่อ-นามสกุล" value={reqForm.receiverName} onChange={e => handleReqChange("receiverName", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>เบอร์โทรผู้รับ</label>
                    <input style={inputStyle} placeholder="0812345678" value={reqForm.receiverPhone} onChange={e => handleReqChange("receiverPhone", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>ที่อยู่ผู้รับปลายทาง</label>
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" value={reqForm.receiverAddress} onChange={e => handleReqChange("receiverAddress", e.target.value)} />
                </div>
                {/* Image upload */}
                <div style={{ marginTop: 10 }}>
                  <label style={labelStyle}>📷 อัปโหลดรูปที่อยู่ / หลักฐาน (ไม่บังคับ)</label>
                  <label htmlFor="cargo-img-upload" style={{ display: "block", cursor: "pointer" }}>
                    {uploadPreview ? (
                      <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                        <img src={uploadPreview} alt="preview" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, border: "1.5px solid #facc1560" }} />
                        <button type="button" onClick={e => { e.preventDefault(); setUploadFile(null); setUploadPreview(null); setUploadedUrl(""); }} style={{ position: "absolute", top: 6, right: 6, background: "#0f0f1acc", border: "1px solid #f8717166", borderRadius: "50%", width: 28, height: 28, color: "#f87171", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ border: "1.5px dashed #2a2d3a", borderRadius: 8, padding: "20px 16px", textAlign: "center", background: "#1e2130", color: "#64748b", fontSize: 13 }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                        <div style={{ fontWeight: 600, color: "#8b8fa8" }}>คลิกเพื่อเลือกรูปภาพ</div>
                        <div style={{ fontSize: 11, marginTop: 4, color: "#4a5568" }}>JPG, PNG, WEBP · ไม่เกิน 10MB</div>
                      </div>
                    )}
                  </label>
                  <input id="cargo-img-upload" type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadFile(f);
                      setUploadedUrl("");
                      const reader = new FileReader();
                      reader.onload = ev => setUploadPreview(ev.target.result);
                      reader.readAsDataURL(f);
                    }}
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #2a2d3a", paddingTop: 14 }}>
                <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700, marginBottom: 10 }}>📋 รายละเอียดสินค้า</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>รายการสินค้า / 물품 내역</label>
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 64 }} placeholder="เช่น เสื้อผ้า 3 ตัว, อาหารแห้ง, เครื่องสำอาง..." value={reqForm.itemDesc} onChange={e => handleReqChange("itemDesc", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>เลขพาสปอร์ต / เลขศุลกากร (ถ้ามี)</label>
                  <input style={inputStyle} placeholder="AA0000000" value={reqForm.passportNo} onChange={e => handleReqChange("passportNo", e.target.value)} />
                </div>
                {/* Parcel / tracking label photo */}
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>📦 รูปพัสดุ / รูปเลขไปรษณีย์ (ไม่บังคับ)</label>
                  <label htmlFor="cargo-parcel-upload" style={{ display: "block", cursor: "pointer" }}>
                    {parcelPreview ? (
                      <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                        <img src={parcelPreview} alt="parcel preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, border: "1.5px solid #a78bfa60" }} />
                        <button type="button"
                          onClick={e => { e.preventDefault(); setParcelFile(null); setParcelPreview(null); setParcelUploadedUrl(""); }}
                          style={{ position: "absolute", top: 6, right: 6, background: "#0f0f1acc", border: "1px solid #f8717166", borderRadius: "50%", width: 28, height: 28, color: "#f87171", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ border: "1.5px dashed #3a3060", borderRadius: 8, padding: "20px 16px", textAlign: "center", background: "#1a1830", color: "#64748b", fontSize: 13 }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📦</div>
                        <div style={{ fontWeight: 600, color: "#a78bfa" }}>คลิกเพื่อถ่ายรูปหรือเลือกไฟล์</div>
                        <div style={{ fontSize: 11, marginTop: 4, color: "#4a5568" }}>รูปพัสดุ, สติกเกอร์ไปรษณีย์, เลข Tracking · ไม่เกิน 10MB</div>
                      </div>
                    )}
                  </label>
                  <input id="cargo-parcel-upload" type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setParcelFile(f);
                      setParcelUploadedUrl("");
                      const reader = new FileReader();
                      reader.onload = ev => setParcelPreview(ev.target.result);
                      reader.readAsDataURL(f);
                    }}
                  />
                </div>
              </div>

              {reqError && <div style={{ padding: "9px 12px", background: "#2a1f1f", border: "1px solid #f8717144", borderRadius: 8, color: "#f87171", fontSize: 13 }}>⚠️ {reqError}</div>}

              <button type="submit" disabled={reqLoading || uploadLoading || parcelUploading} style={{ padding: "13px", background: "#facc15", color: "#000", fontWeight: 800, fontSize: 15, border: "none", borderRadius: 8, cursor: "pointer", marginTop: 4, fontFamily: "inherit" }}>
                {uploadLoading || parcelUploading ? "⏳ กำลังอัปโหลดรูป..." : reqLoading ? "⏳ กำลังส่งข้อมูล..." : "📬 ยืนยันแจ้งส่งสินค้า"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === "profile" && cargoUser && (
        <div style={{ ...cardStyle, width: "100%", maxWidth: 520 }}>
          {profileLoading ? (
            <div style={{ textAlign: "center", padding: 32, color: "#8b8fa8" }}>⏳ กำลังโหลดข้อมูล...</div>
          ) : profileData ? (
            <>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#facc1522", border: "2px solid #facc15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>{profileData.customer.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📞 {profileData.customer.phone}</div>
                </div>
                <button onClick={() => loadProfile(cargoUser.id)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#facc15", cursor: "pointer", fontSize: 18 }}>🔄</button>
              </div>

              {/* Info grid */}
              <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                {[
                  ["📧 อีเมล", profileData.customer.email],
                  ["📍 ที่อยู่", profileData.cusDetail?.address || profileData.customer.address],
                  ["🛂 เลขพาสปอร์ต", profileData.cusDetail?.passportNo],
                  ["📋 วันหมดอายุ", profileData.cusDetail?.passportExp ? new Date(profileData.cusDetail.passportExp).toLocaleDateString("th-TH") : null],
                  ["🪪 เลขบัตร/ทะเบียน", profileData.cusDetail?.idCard],
                  ["🏛️ เลขศุลกากร", profileData.cusDetail?.customsNo],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ background: "#1e2130", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b", minWidth: 130 }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Orders */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#facc15", marginBottom: 10 }}>📦 ประวัติการส่งสินค้า ({profileData.orders.length} รายการ)</div>
              {profileData.orders.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#4a5070", fontSize: 12 }}>ยังไม่มีรายการ</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {profileData.orders.map(o => {
                    const SC = { "รอดำเนินการ": "#a3e635", "รับพัสดุเข้าคลังแล้ว": "#facc15", "พัสดุกำลังจัดส่งไปยังปลายทาง": "#60a5fa", "พัสดุจัดส่งหน้าบ้านผู้รับเรียบร้อยแล้ว": "#4ade80", "มีปัญหา": "#f87171" };
                    const sc = SC[o.status] || "#8b8fa8";
                    const dirLabel = o.direction === "TH_TO_KR" ? "✈️🇹🇭→🇰🇷" : o.direction === "SEA_KR_TO_TH" ? "🚢🇰🇷→🇹🇭" : "✈️🇰🇷→🇹🇭";
                    return (
                      <div key={o.number} style={{ background: "#1e2130", borderRadius: 8, padding: "12px 14px", border: `1px solid ${sc}33` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <code style={{ fontSize: 12, color: "#facc15" }}>{o.number}</code>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: sc + "22", color: sc, border: `1px solid ${sc}44` }}>{o.status}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{dirLabel} · {new Date(o.createdAt).toLocaleDateString("th-TH")}</div>
                        {o.itemDesc && <div style={{ fontSize: 11, color: "#8b8fa8", marginTop: 4 }}>📋 {o.itemDesc}</div>}
                        {o.trackingCode && <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 4 }}>🏷️ {o.trackingCode}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 32, color: "#64748b" }}>ไม่พบข้อมูล</div>
          )}
        </div>
      )}

      {/* SHIPMENTS LIST TAB — user's own orders only */}
      {tab === "shipments-list" && cargoUser && (
        <div style={{ ...cardStyle, width: "100%", maxWidth: 720 }}>
          <style>{`
            @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
            @keyframes shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-10deg)} 75%{transform:rotate(10deg)} }
            @keyframes flyLR { 0%,100%{transform:translateX(0)} 50%{transform:translateX(8px)} }
            @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
            @keyframes pop { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1)} }
            .anim-spin { animation: spin 1.4s linear infinite; display:inline-block; }
            .anim-bounce { animation: bounce 0.9s ease-in-out infinite; display:inline-block; }
            .anim-shake { animation: shake 0.7s ease-in-out infinite; display:inline-block; }
            .anim-flyLR { animation: flyLR 1s ease-in-out infinite; display:inline-block; }
            .anim-pulse { animation: pulse 1.2s ease-in-out infinite; display:inline-block; }
            .anim-pop { animation: pop 1.5s ease-in-out infinite; display:inline-block; }
          `}</style>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>📦 สถานะการจัดส่งของฉัน</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>👤 {cargoUser?.name} · 📞 {cargoUser?.phone}</div>
            </div>
            <button onClick={() => loadShipments()} style={{ background: "#facc1515", border: "1px solid #facc1540", color: "#facc15", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🔄 รีเฟรช</button>
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[["all", "ทั้งหมด"], ["received", "✅ โกดังรับแล้ว"], ["pending", "⏳ รอรับสินค้า"]].map(([val, label]) => (
              <button key={val} onClick={() => setWarehouseStatusFilter(val)}
                style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${warehouseStatusFilter === val ? "#facc15" : "#2a2d3a"}`, background: warehouseStatusFilter === val ? "#facc1515" : "#1e2130", color: warehouseStatusFilter === val ? "#facc15" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {label}
              </button>
            ))}
          </div>

          {shipmentsLoading ? (
            <div style={{ textAlign: "center", padding: 32, color: "#8b8fa8" }}>⏳ กำลังโหลด...</div>
          ) : shipmentsError ? (
            <div style={{ textAlign: "center", padding: 16, color: "#f87171", fontSize: 12 }}>⚠️ {shipmentsError}</div>
          ) : shipmentsList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "#4a5070", fontSize: 12 }}>ยังไม่มีรายการส่งสินค้า</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {shipmentsList.map((shipment, idx) => {
                const STEPS = [
                  { key: "รอดำเนินการ",                              icon: "⏳", label: "รอดำเนินการ",       cls: "anim-bounce", color: "#a3e635" },
                  { key: "รับพัสดุเข้าคลังแล้ว",                    icon: "📦", label: "รับพัสดุ",           cls: "anim-shake",  color: "#facc15" },
                  { key: "กำลังรีแพ็คพัสดุ",                         icon: "🔄", label: "รีแพ็ค",             cls: "anim-spin",   color: "#fb923c" },
                  { key: "พัสดุกำลังเตรียมขึ้นเครื่อง",              icon: "🛫", label: "เตรียมขึ้นเครื่อง", cls: "anim-flyLR",  color: "#a78bfa" },
                  { key: "พัสดุกำลังดำเนินการศุลกากร",               icon: "🏛️", label: "ศุลกากร",            cls: "anim-pulse",  color: "#38bdf8" },
                  { key: "พัสดุกำลังจัดส่งไปยังปลายทาง",            icon: "✈️", label: "กำลังจัดส่ง",        cls: "anim-flyLR",  color: "#60a5fa" },
                  { key: "พัสดุจัดส่งหน้าบ้านผู้รับเรียบร้อยแล้ว", icon: "✅", label: "ถึงแล้ว!",            cls: "anim-pop",    color: "#4ade80" },
                ];
                const curIdx = shipment.status === "มีปัญหา" ? -1 : STEPS.findIndex(s => s.key === shipment.status);
                const curStep = curIdx >= 0 ? STEPS[curIdx] : { icon: "⚠️", cls: "anim-shake", color: "#f87171", label: "มีปัญหา" };
                const pct = curIdx < 0 ? 0 : Math.round((curIdx / (STEPS.length - 1)) * 100);

                return (
                  <div key={shipment.id || idx} style={{ background: "#16181f", borderRadius: 14, border: `1px solid ${curStep.color}44`, overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ padding: "14px 16px", borderBottom: `1px solid ${curStep.color}33`, display: "flex", alignItems: "center", gap: 12 }}>
                      <span className={curStep.cls} style={{ fontSize: 28 }}>{curStep.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: curStep.color, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{curStep.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#facc15", fontFamily: "monospace" }}>{shipment.number}</div>
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>
                        {shipment.direction === "TH_TO_KR" ? "✈️🇹🇭→🇰🇷" : shipment.direction === "SEA_KR_TO_TH" ? "🚢🇰🇷→🇹🇭" : "✈️🇰🇷→🇹🇭"}
                        <div style={{ textAlign: "right", marginTop: 2 }}>📅 {new Date(shipment.createdAt).toLocaleDateString("th-TH")}</div>
                      </div>
                    </div>

                    {/* Animated Progress Track */}
                    <div style={{ padding: "20px 16px 12px", overflowX: "auto" }}>
                      <div style={{ position: "relative", minWidth: 480 }}>
                        {/* Track line */}
                        <div style={{ position: "absolute", top: 17, left: "3%", right: "3%", height: 4, background: "#2a2d3a", borderRadius: 4 }} />
                        {/* Progress fill */}
                        <div style={{ position: "absolute", top: 17, left: "3%", width: `${pct * 0.94}%`, height: 4, background: `linear-gradient(90deg, #facc15, ${curStep.color})`, borderRadius: 4, transition: "width 1s ease" }} />
                        {/* Moving package icon */}
                        {curIdx >= 0 && (
                          <div style={{ position: "absolute", top: 0, left: `calc(3% + ${pct * 0.94}% - 12px)`, fontSize: 22, zIndex: 10, transition: "left 1s ease", filter: "drop-shadow(0 0 6px " + curStep.color + ")" }}>
                            <span className={curStep.cls}>📦</span>
                          </div>
                        )}
                        {/* Steps */}
                        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                          {STEPS.map((step, i) => {
                            const done = curIdx >= 0 && i <= curIdx;
                            const active = i === curIdx;
                            return (
                              <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: `${100/STEPS.length}%` }}>
                                <div style={{
                                  width: 34, height: 34, borderRadius: "50%",
                                  background: done ? step.color + "33" : "#1a1d27",
                                  border: `2px solid ${done ? step.color : "#2a2d3a"}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: active ? 18 : 14,
                                  boxShadow: active ? `0 0 12px ${step.color}` : "none",
                                  transition: "all 0.5s",
                                }}>
                                  {active ? <span className={step.cls}>{step.icon}</span> : <span style={{ opacity: done ? 1 : 0.3 }}>{step.icon}</span>}
                                </div>
                                <div style={{ fontSize: 9, color: done ? step.color : "#4a5070", marginTop: 5, textAlign: "center", fontWeight: done ? 700 : 400, lineHeight: 1.3 }}>
                                  {step.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Info row */}
                    <div style={{ padding: "10px 16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                      <div style={{ color: "#64748b" }}>📤 <span style={{ color: "#e2e8f0" }}>{shipment.senderName || "—"}</span></div>
                      <div style={{ color: "#64748b" }}>📬 <span style={{ color: "#e2e8f0" }}>{shipment.receiverName || "—"}</span></div>
                      {shipment.itemDesc && <div style={{ gridColumn: "1/-1", color: "#64748b" }}>📋 <span style={{ color: "#8b8fa8" }}>{shipment.itemDesc}</span></div>}
                      {shipment.trackingCode && <div style={{ gridColumn: "1/-1", color: "#64748b" }}>🏷️ <span style={{ color: "#a78bfa", fontFamily: "monospace", fontWeight: 700 }}>{shipment.trackingCode}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 40, fontSize: 11, color: "#3a3d4a", textAlign: "center" }}>
        © {brandName} · บริการคาโก้ ไทย-เกาหลี
      </div>
    </div>
  );
}
