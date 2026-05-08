"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const LANGS = {
  th: {
    title: "เข้าสู่ระบบพาร์ทเนอร์",
    emailLabel: "Username / Email",
    emailPlaceholder: "กรอก username หรือ email",
    passwordLabel: "รหัสผ่าน",
    btn: "เข้าสู่ระบบ",
    loading: "กำลังตรวจสอบ...",
    back: "← กลับหน้าเลือกประเภทผู้ใช้",
    errorLogin: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    errorRole: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงพอร์ทัลพาร์ทเนอร์",
  },
  en: {
    title: "Partner Sign In",
    emailLabel: "Username / Email",
    emailPlaceholder: "Enter username or email",
    passwordLabel: "Password",
    btn: "Sign In",
    loading: "Verifying...",
    back: "← Back to user type selection",
    errorLogin: "Incorrect email or password",
    errorRole: "This account does not have access to the Partner Portal",
  },
  ko: {
    title: "파트너 로그인",
    emailLabel: "사용자명 / 이메일",
    emailPlaceholder: "사용자명 또는 이메일 입력",
    passwordLabel: "비밀번호",
    btn: "로그인",
    loading: "확인 중...",
    back: "← 사용자 유형 선택으로 돌아가기",
    errorLogin: "이메일 또는 비밀번호가 올바르지 않습니다",
    errorRole: "이 계정은 파트너 포털에 접근 권한이 없습니다",
  },
};

export default function PartnerLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState("th");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const t = LANGS[lang];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (!res?.ok || res?.error) {
      setLoading(false);
      setError(t.errorLogin);
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    setLoading(false);

    if (role === "PARTNER" || role === "SUPER_ADMIN" || role === "ADMIN") {
      router.push("/partner/dashboard");
    } else {
      await signOut({ redirect: false });
      setError(t.errorRole);
    }
  }

  const S = {
    page: {
      minHeight: "100vh",
      background: "#0a0c12",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      gap: 16,
    },
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
    card: {
      background: "#16181f",
      border: "1px solid #1a3a2a",
      borderRadius: 14,
      padding: "40px 36px",
      width: "100%",
      maxWidth: 420,
      boxShadow: "0 8px 40px rgba(0,0,0,.5)",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "#14532d",
      color: "#4ade80",
      borderRadius: 20,
      padding: "4px 14px",
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 20,
    },
    title: { color: "#e8eaf0", fontWeight: 800, fontSize: 22, margin: "0 0 6px" },
    sub: { color: "#8b8fa8", fontSize: 13, margin: "0 0 28px" },
    label: { color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 },
    input: {
      width: "100%",
      background: "#1e2130",
      border: "1px solid #2a2d3a",
      color: "#e8eaf0",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box",
    },
    error: {
      background: "#3b0000",
      border: "1px solid #7f1d1d",
      color: "#fca5a5",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 13,
      marginBottom: 18,
    },
    btn: {
      width: "100%",
      background: "linear-gradient(135deg, #16a34a, #15803d)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "12px",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      marginTop: 8,
      letterSpacing: 0.3,
    },
    btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
    divider: { borderColor: "#2a2d3a", margin: "24px 0" },
    backLink: { color: "#8b8fa8", fontSize: 12, textDecoration: "none", display: "block", textAlign: "center", marginTop: 20 },
  };

  return (
    <div style={S.page}>
      <div style={S.langBar}>
        {[["th", "ไทย"], ["en", "EN"], ["ko", "한국어"]].map(([code, label]) => (
          <button key={code} style={S.langBtn(lang === code)} onClick={() => setLang(code)}>
            {label}
          </button>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
          <div style={{ ...S.badge, margin: "0 auto 16px" }}>
            <span>🔒</span> Partner Portal
          </div>
          <h1 style={S.title}>{t.title}</h1>
          <p style={S.sub}>GOEUN SERVER HUB — Partner System</p>
        </div>

        {error && <div style={S.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>{t.emailLabel}</label>
            <input
              style={S.input}
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>{t.passwordLabel}</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...S.input, paddingRight: 42 }}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#8b8fa8",
                }}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? t.loading : t.btn}
          </button>
        </form>

        <hr style={S.divider} />

        <a href="/auth/select" style={S.backLink}>
          {t.back}
        </a>
      </div>
    </div>
  );
}
