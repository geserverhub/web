"use client";
import { useState } from "react";
import { credentialsPortalLogin, portalLoginErrorMessage, waitForAuthSession, hardRedirect } from "@/lib/portal-login";

export default function CtmAdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const result = await credentialsPortalLogin({ username, password, portal: "admin", callbackPath: "/charoenthaimart/admin" });
    if (result.ok) {
      setSuccess("เข้าสู่ระบบสำเร็จ กำลังเข้าสู่ระบบ...");
      await waitForAuthSession(6, 150);
      hardRedirect("/charoenthaimart/admin");
    } else {
      setError(portalLoginErrorMessage(result.error, "th"));
      setLoading(false);
    }
  };

  const bg = { minHeight: "100vh", background: "linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" };

  return (
    <div style={bg}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: 420, maxWidth: "100%", boxShadow: "0 16px 56px rgba(0,0,0,.12)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 28 }}>
          <img src="/charoenthaimart/charoenthaimart-logo.jpg" alt="logo" style={{ display: "block", width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid #fde68a", margin: "0 0 12px", boxShadow: "0 4px 14px #b4530930" }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#92400e", margin: "0 0 4px" }}>เจริญไทยมาร์ท ซูวอน</h1>
          <p style={{ fontSize: 13, color: "#b45309", margin: 0, fontWeight: 600 }}>ระบบหลังบ้าน · Admin Login</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 18 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 14px", color: "#047857", fontSize: 13, marginBottom: 18 }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>ชื่อผู้ใช้</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} autoFocus placeholder="ชื่อผู้ใช้" autoComplete="off"
              style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color .15s" }}
              onFocus={e => e.target.style.borderColor = "#b45309"}
              onBlur={e => e.target.style.borderColor = "#e7e3d8"}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>รหัสผ่าน</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password"
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
        </div>
      </div>
    </div>
  );
}
