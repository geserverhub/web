"use client";

import { useEffect, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { User, Lock, Eye, EyeOff, Package, Layers, Upload, Store } from "lucide-react";
import { NEXTAUTH_PORTAL_ROLES } from "@/lib/login-portals";
import "./client-login.css";

const MCT_PRODUCT_PATH = "/mct-product";

async function loadSession(maxAttempts = 4) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const session = await getSession();
    if (session?.user) return session;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return null;
}

const copy = {
  th: {
    badge: "MCT · M-GROUP",
    portal: "ระบบหลังบ้าน",
    title: "เข้าสู่ระบบจัดการข้อมูลสินค้า",
    subtitle:
      "พอร์ทัล MCT สำหรับทีม M-Group — อัปเดตรายการสินค้า ราคา สต็อก และหมวดหมู่ที่แสดงบนหน้าร้านออนไลน์",
    features: [
      { icon: Package, label: "จัดการสินค้าและ SKU" },
      { icon: Layers, label: "หมวดหมู่ / ราคาส่ง" },
      { icon: Upload, label: "นำเข้าข้อมูล CSV" },
      { icon: Store, label: "เชื่อมกับหน้า M-Group" },
    ],
    username: "Username / อีเมล",
    usernamePh: "กรอก username หรือ email",
    password: "รหัสผ่าน",
    passwordPh: "กรอกรหัสผ่าน",
    signIn: "เข้าสู่ระบบหลังบ้าน",
    signingIn: "กำลังเข้าสู่ระบบ…",
    back: "← กลับหน้าเลือกระบบ",
    invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    powered: "GE SERVER HUB · MCT Product Backend",
  },
  en: {
    badge: "MCT · M-GROUP",
    portal: "Back office",
    title: "Product data management sign-in",
    subtitle:
      "MCT portal for the M-Group team — update products, pricing, stock, and categories shown on the storefront.",
    features: [
      { icon: Package, label: "Products & SKU" },
      { icon: Layers, label: "Categories / wholesale" },
      { icon: Upload, label: "CSV import" },
      { icon: Store, label: "Sync to M-Group shop" },
    ],
    username: "Username / Email",
    usernamePh: "Enter username or email",
    password: "Password",
    passwordPh: "Enter password",
    signIn: "Sign in to back office",
    signingIn: "Signing in…",
    back: "← Portal menu",
    invalid: "Invalid email or password",
    powered: "GE SERVER HUB · MCT Product Backend",
  },
  ko: {
    badge: "MCT · M-GROUP",
    portal: "백오피스",
    title: "상품 데이터 관리 로그인",
    subtitle:
      "M-Group 팀용 MCT 포털 — 온라인 매장에 표시되는 상품, 가격, 재고, 카테고리를 관리합니다.",
    features: [
      { icon: Package, label: "상품 및 SKU" },
      { icon: Layers, label: "카테고리 / 도매가" },
      { icon: Upload, label: "CSV 가져오기" },
      { icon: Store, label: "M-Group 연동" },
    ],
    username: "사용자명 / 이메일",
    usernamePh: "사용자명 또는 이메일",
    password: "비밀번호",
    passwordPh: "비밀번호 입력",
    signIn: "백오피스 로그인",
    signingIn: "로그인 중…",
    back: "← 시스템 선택",
    invalid: "이메일 또는 비밀번호가 올바르지 않습니다",
    powered: "GE SERVER HUB · MCT Product Backend",
  },
};

export default function LoginPage() {
  const [lang, setLang] = useState("th");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [checking, setChecking] = useState(true);

  const t = copy[lang] || copy.th;

  useEffect(() => {
    loadSession()
      .then((session) => {
        const role = session?.user?.role;
        if (role && NEXTAUTH_PORTAL_ROLES.client.includes(role)) {
          window.location.href = MCT_PRODUCT_PATH;
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        portal: "client",
        redirect: false,
      });

      if (!res?.ok || res?.error) {
        setError(t.invalid);
        return;
      }

      const session = await loadSession();
      const role = session?.user?.role;
      if (role && NEXTAUTH_PORTAL_ROLES.client.includes(role)) {
        window.location.href = MCT_PRODUCT_PATH;
        return;
      }

      setError(t.invalid);
    } catch {
      setError(t.invalid);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="hub-login-page" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#86efac", fontSize: 14, fontWeight: 600 }}>กำลังตรวจสอบ...</div>
      </div>
    );
  }

  return (
    <div className="hub-login-page">
      <div className="hub-login-lang" role="group" aria-label="Language">
        {[
          { code: "th", label: "ไทย" },
          { code: "ko", label: "한국어" },
          { code: "en", label: "EN" },
        ].map((opt) => (
          <button
            key={opt.code}
            type="button"
            className={lang === opt.code ? "is-active" : ""}
            onClick={() => setLang(opt.code)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="hub-login-card">
        <header className="hub-login-brand">
          {logoOk ? (
            <img
              src="/m-group-logo.png"
              alt="M-Group"
              className="hub-login-logo hub-login-logo--mgroup"
              width={160}
              height={56}
              onError={() => setLogoOk(false)}
            />
          ) : (
            <div className="hub-login-logo-fallback" aria-hidden>
              🌾
            </div>
          )}
          <span className="hub-login-kicker">{t.badge}</span>
          <p className="hub-login-portal">{t.portal}</p>
          <h1 className="hub-login-title">{t.title}</h1>
          <p className="hub-login-sub">{t.subtitle}</p>

          <ul className="hub-login-features">
            {t.features.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon size={15} strokeWidth={2.25} aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </header>

        {error ? (
          <div className="hub-login-error" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="hub-login-field">
            <label className="hub-login-label" htmlFor="hub-email">
              {t.username}
            </label>
            <div className="hub-login-input-wrap">
              <User size={18} className="hub-login-input-icon" aria-hidden />
              <input
                id="hub-email"
                type="text"
                className="hub-login-input"
                autoComplete="username"
                placeholder={t.usernamePh}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="hub-login-field">
            <label className="hub-login-label" htmlFor="hub-password">
              {t.password}
            </label>
            <div className="hub-login-input-wrap">
              <Lock size={18} className="hub-login-input-icon" aria-hidden />
              <input
                id="hub-password"
                type={showPassword ? "text" : "password"}
                className="hub-login-input"
                autoComplete="current-password"
                placeholder={t.passwordPh}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="hub-login-toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="hub-login-submit"
            disabled={loading}
          >
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>

        <footer className="hub-login-footer">
          <Link href="/auth/select" className="hub-login-back">
            {t.back}
          </Link>
          <p className="hub-login-powered">{t.powered}</p>
        </footer>
      </div>
    </div>
  );
}
