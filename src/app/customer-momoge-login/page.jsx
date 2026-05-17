'use client';

import { useEffect, useMemo, useState } from 'react';
import { LocaleProvider, useLocale } from '@/lib/LocaleContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

function currencySymbol(code) {
  return { KRW: '₩', USD: '$', THB: '฿' }[code] || code;
}

function toNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function CustomerDashboardLoginPageImpl() {
    const { t, locale } = useLocale();
  const tr = (key, fallback) => {
    const text = t(key);
    return !text || text === key ? fallback : text;
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('STRIPE_CARD');

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [payingCard, setPayingCard] = useState(false);
  const [creatingPromptPay, setCreatingPromptPay] = useState(false);
  const [promptPayInfo, setPromptPayInfo] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  const [orderQuery, setOrderQuery] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [statusError, setStatusError] = useState('');

  async function checkOrderStatus(orderNumber) {
    const number = String(orderNumber || '').trim();
    if (!number) {
      setStatusError(t('pleaseEnterOrderNumber') || 'กรุณากรอกเลขออเดอร์');
      setStatusResult(null);
      return;
    }
    setCheckingStatus(true);
    setStatusError('');
    try {
      const res = await fetch(`/api/partner/marketplace/status?number=${encodeURIComponent(number)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('orderStatusCheckFailed') || 'ตรวจสอบสถานะไม่สำเร็จ');
      setStatusResult(data.order || null);
    } catch (err) {
      setStatusResult(null);
      setStatusError(err.message || t('orderStatusCheckFailed') || 'ตรวจสอบสถานะไม่สำเร็จ');
    } finally {
      setCheckingStatus(false);
    }
  }

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/partner/marketplace', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('loadProductsFailed') || 'โหลดสินค้าไม่สำเร็จ');
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        setError(err.message || t('loadProductsFailed') || 'โหลดสินค้าไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();

    const q = new URLSearchParams(window.location.search);
    const order = q.get('order');
    if (order) {
      setOrderQuery(order);
      checkOrderStatus(order);
    }
  }, []);

  const cartItems = useMemo(() => {
    return products
      .map((p) => {
        const qty = Number(cart[p.id] || 0);
        if (qty <= 0) return null;
        const price = toNum(p.sellPrice ?? p.costPrice ?? 0);
        return {
          ...p,
          qty,
          unitPrice: price,
          total: price * qty,
        };
      })
      .filter(Boolean);
  }, [products, cart]);

  const grandTotal = useMemo(() => cartItems.reduce((s, i) => s + i.total, 0), [cartItems]);
  const cartCurrency = cartItems[0]?.currency || 'KRW';

  function updateQty(productId, nextQty) {
    const normalized = Math.max(0, Math.floor(toNum(nextQty)));
    setCart((prev) => {
      const next = { ...prev };
      if (normalized <= 0) delete next[productId];
      else next[productId] = normalized;
      return next;
    });
  }

  async function uploadSlipForOrder(transactionId, file) {
    if (!transactionId || !file) return null;

    const formData = new FormData();
    formData.append('transactionId', transactionId);
    formData.append('file', file);

    const res = await fetch('/api/partner/marketplace/slip', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || t('uploadSlipFailed') || 'อัปโหลดสลิปไม่สำเร็จ');
    }
    return data;
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError(t('pleaseSelectAtLeastOneProduct') || 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    setCreatingOrder(true);
    setError('');
    setPaymentMessage('');
    setPromptPayInfo(null);
    try {
      const res = await fetch('/api/partner/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerContact,
          customerEmail,
          shippingAddress,
          note,
          paymentMethod,
          items: cartItems.map((i) => ({ productId: i.id, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('orderCreateFailed') || 'สร้างคำสั่งซื้อไม่สำเร็จ');
      setCreatedOrder(data);
      setCart({});
      setNote('');
      setShippingAddress('');
      setPaymentMessage('✅ ' + (t('orderCreatedSuccess') || 'สร้างคำสั่งซื้อสำเร็จ เลือกช่องทางชำระเงินได้ด้านล่าง'));
      setOrderQuery(data.number || '');
      checkOrderStatus(data.number || '');

      if (slipFile && data?.transactionId) {
        setUploadingSlip(true);
        try {
          await uploadSlipForOrder(data.transactionId, slipFile);
          setPaymentMessage('✅ ' + (t('orderCreatedAndSlipUploaded') || 'สร้างคำสั่งซื้อสำเร็จและแนบสลิปเรียบร้อยแล้ว'));
          setSlipFile(null);
        } catch (uploadErr) {
          setError(uploadErr.message || t('uploadSlipFailed') || 'อัปโหลดสลิปไม่สำเร็จ');
        } finally {
          setUploadingSlip(false);
        }
      }
    } catch (err) {
      setError(err.message || t('orderCreateFailed') || 'สร้างคำสั่งซื้อไม่สำเร็จ');
    } finally {
      setCreatingOrder(false);
    }
  }

  async function startStripeCardPayment() {
    if (!createdOrder?.transactionId) return;
    setPayingCard(true);
    setError('');
    setPaymentMessage('');
    try {
      const res = await fetch('/api/partner/marketplace/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: createdOrder.transactionId,
          paymentType: 'CARD',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('openPaymentFailed') || 'เปิดหน้าชำระเงินไม่สำเร็จ');
      if (!data.checkoutUrl) throw new Error(t('paymentLinkNotFound') || 'ไม่พบลิงก์ชำระเงิน');
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err.message || t('openPaymentFailed') || 'เปิดหน้าชำระเงินไม่สำเร็จ');
    } finally {
      setPayingCard(false);
    }
  }

  async function startPromptPayPayment() {
    if (!createdOrder?.transactionId) return;
    setCreatingPromptPay(true);
    setError('');
    setPaymentMessage('');
    try {
      const res = await fetch('/api/partner/marketplace/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: createdOrder.transactionId,
          paymentType: 'PROMPTPAY',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('promptpayCreateFailed') || 'สร้าง PromptPay ไม่สำเร็จ');
      setPromptPayInfo(data);
      setPaymentMessage('✅ ' + (t('promptpayCreated') || 'สร้าง PromptPay แล้ว กรุณาชำระเงินผ่านลิงก์/QR ด้านล่าง จากนั้นกดเช็กสถานะออเดอร์'));
    } catch (err) {
      setError(err.message || t('promptpayCreateFailed') || 'สร้าง PromptPay ไม่สำเร็จ');
    } finally {
      setCreatingPromptPay(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0b1120 100%)', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '18px 0 0 0' }}>
        <LanguageSwitcher allowedCodes={['th','cn','en','ko']} />
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1d4ed822', border: '1px solid #60a5fa66', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>
            🔗 {t('customerConnectedMarketplace') || 'Customer Connected Marketplace'}
          </div>
          <h1 style={{ margin: '14px 0 8px', fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', fontWeight: 800, color: '#f8fafc' }}>
            /customer-momoge-login · MOMOGE SPACE MARKET PLACE
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
            {t('pageDescriptionMarketplace') || 'หน้านี้ดึงสินค้าที่ partner บันทึกในระบบโดยตรง, ส่งคำสั่งซื้อเข้า Partner Transaction, เช็กสถานะด้วยเลขออเดอร์ และชำระเงินผ่าน Stripe/PromptPay'}
          </p>
        </div>

        <section style={{ marginBottom: 16, background: '#0b1220cc', border: '1px solid #1e293b', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#bfdbfe' }}>🔎 {t('checkOrderStatus') || 'เช็กสถานะออเดอร์ลูกค้า'}</div>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>{t('enterOrderNumberExample') || 'กรอกเลขออเดอร์ เช่น MKT20260517-0001'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder={t('orderNumber') || 'Order Number'}
              style={{ minWidth: 260, flex: '1 1 260px', background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }}
            />
            <button
              type="button"
              onClick={() => checkOrderStatus(orderQuery)}
              disabled={checkingStatus}
              style={{ background: checkingStatus ? '#475569' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontWeight: 700, cursor: checkingStatus ? 'not-allowed' : 'pointer' }}
            >
              {checkingStatus ? t('checkingStatus') || 'กำลังตรวจสอบ...' : t('checkStatus') || 'เช็กสถานะ'}
            </button>
          </div>

          {statusError && <div style={{ marginTop: 8, color: '#fca5a5', fontSize: 12 }}>{statusError}</div>}

          {statusResult && (
            <div style={{ marginTop: 10, borderTop: '1px solid #1f2937', paddingTop: 10, fontSize: 13 }}>
              <div style={{ color: '#e2e8f0' }}>{t('orderNumber') || 'เลขที่'}: <b>{statusResult.number}</b></div>
              <div style={{ color: '#93c5fd', marginTop: 2 }}>
                {t('status') || 'สถานะ'}: <b>{statusResult.status}</b>
                {statusResult.paymentStatus ? <span> · {t('paymentStatus') || 'Payment'}: <b>{statusResult.paymentStatus}</b></span> : null}
              </div>
              <div style={{ color: '#94a3b8', marginTop: 2 }}>
                {t('grandTotal') || 'ยอดรวม'}: <b>{currencySymbol(statusResult.currency)}{toNum(statusResult.amount).toLocaleString()}</b>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div style={{ marginBottom: 16, background: '#7f1d1d33', border: '1px solid #ef4444aa', borderRadius: 10, padding: '10px 14px', color: '#fecaca', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <section style={{ background: '#0b1220cc', border: '1px solid #1e293b', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#bfdbfe' }}>📦 {t('productsFromPartner') || 'สินค้าจากระบบ Partner'}</div>
            {loading ? (
              <div style={{ color: '#93c5fd', fontSize: 14 }}>{t('loadingProducts') || 'กำลังโหลดสินค้า...'}</div>
            ) : products.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 14 }}>{t('noProductsInPartner') || 'ยังไม่มีสินค้าในระบบ partner'}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {products.map((p) => {
                  const price = toNum(p.sellPrice ?? p.costPrice ?? 0);
                  const qty = Number(cart[p.id] || 0);
                  return (
                    <article key={p.id} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#93c5fd', minHeight: 18 }}>
                        {p.model ? `${t('model') || 'Model'}: ${p.model}` : `${t('model') || 'Model'}: -`}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', minHeight: 18 }}>
                        {p.brand ? `${t('brand') || 'Brand'}: ${p.brand}` : `${t('brand') || 'Brand'}: -`}
                      </div>
                      <div style={{ marginTop: 8, fontWeight: 800, color: '#4ade80' }}>
                        {currencySymbol(p.currency)}{price.toLocaleString()} / {t('unit') || 'unit'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <button type="button" onClick={() => updateQty(p.id, qty - 1)} style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 8, width: 30, height: 30, cursor: 'pointer' }}>-</button>
                        <input
                          type="number"
                          min={0}
                          value={qty}
                          onChange={(e) => updateQty(p.id, e.target.value)}
                          style={{ width: 64, textAlign: 'center', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '5px 8px' }}
                        />
                        <button type="button" onClick={() => updateQty(p.id, qty + 1)} style={{ background: '#1d4ed8', color: '#fff', border: '1px solid #2563eb', borderRadius: 8, width: 30, height: 30, cursor: 'pointer' }}>+</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside style={{ background: '#0b1220cc', border: '1px solid #1e293b', borderRadius: 16, padding: 16, alignSelf: 'start', position: 'sticky', top: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#bfdbfe' }}>🛒 ซื้อ-ขาย & ชำระเงินจริง</div>

            <div style={{ marginBottom: 12, maxHeight: 190, overflow: 'auto', border: '1px solid #1f2937', borderRadius: 10, padding: 10, background: '#111827' }}>
              {cartItems.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>ยังไม่มีสินค้าในตะกร้า</div>
              ) : cartItems.map((it) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#e2e8f0' }}>{it.name} x {it.qty}</span>
                  <strong style={{ color: '#4ade80' }}>{currencySymbol(it.currency)}{it.total.toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: '#94a3b8' }}>ยอดรวม</span>
              <strong style={{ color: '#f8fafc', fontSize: 18 }}>{currencySymbol(cartCurrency)}{grandTotal.toLocaleString()}</strong>
            </div>

            <form onSubmit={submitOrder}>
              <div style={{ display: 'grid', gap: 8 }}>
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={tr('customerName', 'ชื่อลูกค้า')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }} />
                <input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder={tr('customerContact', 'เบอร์โทร / LINE')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }} />
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder={tr('customerEmail', 'อีเมล')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }} />
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={2}
                  placeholder={tr('shippingAddress', 'ที่อยู่จัดส่ง')}
                  style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px', resize: 'vertical' }}
                />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }}>
                  <option value="STRIPE_CARD">{t('stripeCard') || 'Stripe Card'}</option>
                  <option value="PROMPTPAY">{tr('promptpay', 'PromptPay')}</option>
                </select>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={tr('orderNote', 'หมายเหตุคำสั่งซื้อ')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px', resize: 'vertical' }} />
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#93c5fd' }}>
                    {tr('uploadSlipFile', 'Upload file slip (optional)')}
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                    style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '8px 10px' }}
                  />
                  {slipFile && (
                    <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                      {tr('selectedFile', 'Selected file')}: {slipFile.name}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={creatingOrder || cartItems.length === 0} style={{ width: '100%', marginTop: 10, border: 'none', borderRadius: 10, padding: '11px 12px', cursor: creatingOrder ? 'not-allowed' : 'pointer', fontWeight: 800, color: '#fff', background: creatingOrder ? '#475569' : 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                {creatingOrder || uploadingSlip
                  ? (uploadingSlip
                    ? tr('uploadingSlip', 'กำลังอัปโหลดสลิป...')
                    : tr('creatingOrder', 'กำลังสร้างคำสั่งซื้อ...'))
                  : tr('createOrderInPartner', 'confirm')}
              </button>
            </form>

            {createdOrder && (
              <div style={{ marginTop: 12, borderTop: '1px solid #1f2937', paddingTop: 12 }}>
                <div style={{ fontSize: 13, color: '#86efac', marginBottom: 6 }}>✅ {t('orderCreatedSuccess') || 'สร้างคำสั่งซื้อสำเร็จ'}</div>
                <div style={{ fontSize: 12, color: '#93c5fd', marginBottom: 8 }}>
                  {t('orderNumber') || 'เลขที่'}: <b>{createdOrder.number}</b> · {t('status') || 'สถานะ'}: <b>{createdOrder.status}</b>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <button
                    type="button"
                    onClick={startStripeCardPayment}
                    disabled={payingCard}
                    style={{ background: payingCard ? '#475569' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontWeight: 700, cursor: payingCard ? 'not-allowed' : 'pointer' }}
                  >
                    {payingCard ? t('openingStripe') || 'กำลังเปิด Stripe...' : '💳 ' + (t('payWithStripeCard') || 'ชำระด้วย Stripe Card')}
                  </button>

                  <button
                    type="button"
                    onClick={startPromptPayPayment}
                    disabled={creatingPromptPay}
                    style={{ background: creatingPromptPay ? '#475569' : '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontWeight: 700, cursor: creatingPromptPay ? 'not-allowed' : 'pointer' }}
                  >
                    {creatingPromptPay ? t('creatingPromptpay') || 'กำลังสร้าง PromptPay...' : '📱 ' + (t('payWithPromptpay') || 'ชำระด้วย PromptPay (Stripe)')}
                  </button>
                </div>

                {paymentMessage && <div style={{ marginTop: 8, fontSize: 12, color: '#86efac' }}>{paymentMessage}</div>}

                {promptPayInfo?.hostedInstructionsUrl && (
                  <a
                    href={promptPayInfo.hostedInstructionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#67e8f9' }}
                  >
                    {t('openPromptpayInstructions') || 'เปิดลิงก์ PromptPay QR / Payment Instructions'}
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboardLoginPage() {
  return (
    <LocaleProvider>
      <CustomerDashboardLoginPageImpl />
    </LocaleProvider>
  );
}
