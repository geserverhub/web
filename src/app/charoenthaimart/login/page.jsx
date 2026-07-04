"use client";
import { useEffect, useState } from "react";
import { credentialsPortalLogin, waitForAuthSession, hardRedirect, portalLoginErrorMessage } from "@/lib/portal-login";

export default function CtmAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    waitForAuthSession(4, 120).then((session) => {
      const role = session?.user?.role;
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        hardRedirect("/charoenthaimart/admin");
      } else {
        setChecking(false);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await credentialsPortalLogin({ email, password, portal: "admin", callbackPath: "/charoenthaimart/admin" });
    if (result.ok) {
      hardRedirect("/charoenthaimart/admin");
    } else {
      setError(portalLoginErrorMessage(result.error, "th"));
      setLoading(false);
    }
  };

  const bg = { minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" };

  if (checking) return (
    <div style={bg}>
      <div style={{ textAlign: "center" }}>
        <img src="/charoenthaimart/charoenthaimart-logo.jpg" alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid #fde68a", marginBottom: 16 }} />
        <div style={{ color: "#b45309", fontWeight: 600, fontSize: 14 }}>กำลังตรวจสอบ...</div>
      </div>
    </div>
  );

  return (
    <div style={bg}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: 420, maxWidth: "100%", boxShadow: "0 16px 56px rgba(0,0,0,.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/charoenthaimart/charoenthaimart-logo.jpg" alt="logo" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid #fde68a", marginBottom: 12, boxShadow: "0 4px 14px #b4530930" }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 4px" }}>เจริญไทยมาร์ท ซูวอน</h1>
          <p style={{ fontSize: 13, color: "#b45309", margin: 0, fontWeight: 600 }}>ระบบหลังบ้าน · Admin Login</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>อีเมล</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoFocus placeholder="admin@example.com"
              style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color .15s" }}
              onFocus={e => e.target.style.borderColor = "#b45309"}
              onBlur={e => e.target.style.borderColor = "#e7e3d8"}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>รหัสผ่าน</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 10, padding: "11px 44px 11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color .15s" }}
                onFocus={e => e.target.style.borderColor = "#b45309"}
                onBlur={e => e.target.style.borderColor = "#e7e3d8"}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9ca3af" }}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ background: loading ? "#d97706" : "#b45309", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 800, fontSize: 15, cursor: loading ? "default" : "pointer", transition: "background .15s", marginTop: 4 }}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="/charoenthaimart" style={{ fontSize: 13, color: "#b45309", textDecoration: "none", fontWeight: 600 }}>← หน้าร้าน</a>
          <a href="/auth/select" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>เมนูหลัก</a>
        </div>
      </div>
    </div>
  );
}
