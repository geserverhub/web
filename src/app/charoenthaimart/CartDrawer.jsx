"use client";
import { useState } from "react";

const SHIPPING_FEE = 6000;
const BANK_INFO = { bank: "ธนาคารกุ๊กมิน KOOKMIN BANK", account: "217001-04-249820", holder: "SEEHAKUN PHAKHAWAN" };

const THEMES = {
  green: { primary: "#065f46", grad: "linear-gradient(135deg,#065f46,#059669)", light: "#f0fdf4" },
  orange: { primary: "#92400e", grad: "linear-gradient(135deg,#b45309,#d97706)", light: "#fef3c7" },
};

export default function CartDrawer({ cart, setCartQty, showCart, setShowCart, theme = "green" }) {
  const [step, setStep] = useState("cart"); // cart | checkout | done
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNo, setOrderNo] = useState("");

  const c = THEMES[theme] || THEMES.green;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmount = Math.round(subtotal * 0.10 * 100) / 100;
  const grandTotal = subtotal + taxAmount + SHIPPING_FEE;

  const close = () => {
    setShowCart(false);
    setTimeout(() => { setStep("cart"); setSlipUrl(""); setOrderNo(""); }, 300);
  };

  const uploadSlip = async (file) => {
    setUploadingSlip(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ctm/orders/upload-slip", { method: "POST", body: fd });
      const data = await res.json();
      setSlipUrl(data.url || "");
    } finally { setUploadingSlip(false); }
  };

  const submitOrder = async () => {
    if (!recipientName || !recipientPhone || !recipientAddress || !slipUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ctm/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, unit: i.unit })),
          recipientName, recipientPhone, recipientAddress, slipUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) { setOrderNo(data.orderNo); setStep("done"); }
    } finally { setSubmitting(false); }
  };

  const orderMessageLines = () => {
    const lines = cart.map(i => `• ${i.name} ×${i.qty}  ₩${(i.price * i.qty).toLocaleString()}`).join("\n");
    return `สวัสดีครับ/ค่ะ 🙏\nสั่งซื้อสินค้า (เลขที่คำสั่งซื้อ ${orderNo}):\n\n${lines}\n\nยอดรวม: ₩${subtotal.toLocaleString()}\nVAT: ₩${taxAmount.toLocaleString()}\nค่าส่ง: ₩${SHIPPING_FEE.toLocaleString()}\nยอดสุทธิ: ₩${grandTotal.toLocaleString()}\n\nผู้รับ: ${recipientName}\nโทร: ${recipientPhone}\nที่อยู่: ${recipientAddress}\n\nแนบสลิปโอนเงินแล้วค่ะ ✅`;
  };

  const orderViaLine = () => {
    window.open(`https://line.me/R/oaMessage/%40486wfonl/?${encodeURIComponent(orderMessageLines())}`, "_blank");
  };
  const orderViaFacebook = () => {
    window.open(`https://m.me/thaimartsuwon?text=${encodeURIComponent(orderMessageLines())}`, "_blank");
  };

  if (!showCart) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300 }}>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(420px,100vw)", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-4px 0 32px rgba(0,0,0,.2)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0fdf4", display: "flex", justifyContent: "space-between", alignItems: "center", background: c.grad }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>
            {step === "cart" && <>🛒 ตะกร้าสินค้า <span style={{ color: "#fde68a" }}>({cartCount})</span></>}
            {step === "checkout" && "📝 ยืนยันการสั่งซื้อ"}
            {step === "done" && "✅ สั่งซื้อสำเร็จ"}
          </span>
          <button onClick={close} style={{ background: "rgba(255,255,255,.2)", border: "none", fontSize: 20, cursor: "pointer", color: "#fff", lineHeight: 1, width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {step === "cart" && (
            <>
              {cart.length === 0 && <div style={{ textAlign: "center", color: "#9ca3af", padding: "48px 0", fontSize: 14 }}>ไม่มีสินค้าในตะกร้า</div>}
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  {item.image
                    ? <img src={item.image} alt="" style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 54, height: 54, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📦</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: c.primary, fontWeight: 800 }}>₩{item.price.toLocaleString()} / {item.unit || "ชิ้น"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setCartQty(item.id, item.qty - 1)} style={{ width: 28, height: 28, border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>−</button>
                    <span style={{ minWidth: 22, textAlign: "center", fontWeight: 700, fontSize: 14 }}>{item.qty}</span>
                    <button onClick={() => setCartQty(item.id, item.qty + 1)} style={{ width: 28, height: 28, border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>+</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {step === "checkout" && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>รายการสินค้าที่สั่งซื้อ</div>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", color: "#374151" }}>
                  <span>{item.name} ×{item.qty}</span>
                  <span>₩{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px dashed #d1d5db", marginTop: 8, paddingTop: 8, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>ยอดรวม</span><span>₩{subtotal.toLocaleString()}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>ยอด VAT (10%)</span><span>₩{taxAmount.toLocaleString()}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>ค่าส่ง (แทคเป)</span><span>₩{SHIPPING_FEE.toLocaleString()}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", marginTop: 4, borderTop: "1px solid #e2e8f0", fontWeight: 900, fontSize: 15, color: c.primary }}>
                  <span>ยอดสุทธิ</span><span>₩{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginTop: 16, background: c.light, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.primary, marginBottom: 4 }}>เลขบัญชีรับชำระเงิน</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1f2937" }}>{BANK_INFO.bank}</div>
                <div style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 800, color: "#1f2937" }}>{BANK_INFO.account}</div>
                <div style={{ fontSize: 12, color: "#374151" }}>{BANK_INFO.holder}</div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>ที่อยู่จัดส่ง (แทคเป)</div>
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="ชื่อผู้รับ"
                  style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                <input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="เบอร์โทร"
                  style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                <textarea value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} placeholder="ที่อยู่จัดส่ง" rows={3}
                  style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>แนบสลิปยืนยันการโอนเงิน</div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px dashed #d1d5db", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => e.target.files?.[0] && uploadSlip(e.target.files[0])} />
                  {slipUrl ? (
                    <img src={slipUrl} alt="slip" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 20 }}>📎</span>
                  )}
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                    {uploadingSlip ? "กำลังอัพโหลด..." : slipUrl ? "แนบสลิปแล้ว (แตะเพื่อเปลี่ยน)" : "แตะเพื่อแนบสลิป"}
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: c.primary, marginBottom: 4 }}>ได้รับคำสั่งซื้อของคุณแล้ว</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>เลขที่คำสั่งซื้อ: <strong style={{ fontFamily: "monospace" }}>{orderNo}</strong></div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>แจ้งแอดมินเพิ่มเติมผ่านช่องทางด้านล่างเพื่อความรวดเร็ว</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={orderViaLine} style={{ width: "100%", background: "linear-gradient(135deg,#059669,#06c755)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 900, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  💬 สั่งซื้อผ่าน LINE
                </button>
                <button onClick={orderViaFacebook} style={{ width: "100%", background: "linear-gradient(135deg,#1877f2,#0a5cd8)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 900, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  📘 สั่งซื้อผ่าน Facebook
                </button>
              </div>
            </div>
          )}
        </div>

        {step === "cart" && cart.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", background: "#fafaf7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#374151" }}>รวมทั้งหมด</span>
              <span style={{ fontWeight: 900, fontSize: 22, color: c.primary }}>₩{subtotal.toLocaleString()}</span>
            </div>
            <button onClick={() => setStep("checkout")} style={{ width: "100%", background: c.grad, color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 900, fontSize: 15, cursor: "pointer" }}>
              ยืนยันการสั่งซื้อ
            </button>
          </div>
        )}

        {step === "checkout" && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", background: "#fafaf7", display: "flex", gap: 8 }}>
            <button onClick={() => setStep("cart")} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 12, padding: "12px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>← กลับ</button>
            <button onClick={submitOrder} disabled={submitting || !recipientName || !recipientPhone || !recipientAddress || !slipUrl}
              style={{
                flex: 1, border: "none", borderRadius: 12, padding: "12px", fontWeight: 900, fontSize: 14,
                cursor: (submitting || !recipientName || !recipientPhone || !recipientAddress || !slipUrl) ? "default" : "pointer",
                background: (submitting || !recipientName || !recipientPhone || !recipientAddress || !slipUrl) ? "#e5e7eb" : c.grad,
                color: (submitting || !recipientName || !recipientPhone || !recipientAddress || !slipUrl) ? "#9ca3af" : "#fff",
              }}>
              {submitting ? "กำลังส่ง..." : "ยืนยันการโอนเงิน"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
