"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import "./client-login.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      portal: "client",
      redirect: false,
    });

    if (!res?.ok || res?.error) {
      setLoading(false);
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    setLoading(false);

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      router.push("/admin/clients");
    } else {
      router.push("/mct-product");
    }
  }

  return (
    <div className="hub-login-page">
      <div className="hub-login-card">
        <header className="hub-login-brand">
          <img
            src="/logo-mark.svg"
            alt=""
            className="hub-login-logo"
            width={52}
            height={52}
          />
          <span className="hub-login-kicker">GE SERVER HUB</span>
          <h1 className="hub-login-title">เข้าสู่ระบบ</h1>
          <p className="hub-login-sub">
            ลูกค้าและพาร์ทเนอร์ — ใช้ username หรืออีเมลที่ลงทะเบียนไว้
          </p>
        </header>

        {error ? (
          <div className="hub-login-error" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="hub-login-field">
            <label className="hub-login-label" htmlFor="hub-email">
              Username / Email
            </label>
            <div className="hub-login-input-wrap">
              <User size={18} className="hub-login-input-icon" aria-hidden />
              <input
                id="hub-email"
                type="text"
                className="hub-login-input"
                autoComplete="username"
                placeholder="กรอก username หรือ email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="hub-login-field">
            <label className="hub-login-label" htmlFor="hub-password">
              รหัสผ่าน
            </label>
            <div className="hub-login-input-wrap">
              <Lock size={18} className="hub-login-input-icon" aria-hidden />
              <input
                id="hub-password"
                type={showPassword ? "text" : "password"}
                className="hub-login-input"
                autoComplete="current-password"
                placeholder="กรอกรหัสผ่าน"
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
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
