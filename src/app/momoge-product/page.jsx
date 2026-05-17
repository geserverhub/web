'use client';

import { useEffect, useMemo, useState } from 'react';

function currencySymbol(code) {
  return { KRW: '₩', USD: '$', THB: '฿' }[code] || code;
}

function toNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function normalizePartnerImageUrl(value) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/api/uploads/partner-products/')) return raw;
  if (raw.startsWith('/uploads/partner-products/')) {
    const name = raw.split('/').pop();
    return name ? `/api/uploads/partner-products/${encodeURIComponent(name)}` : null;
  }

  const normalizedPath = raw.replaceAll('\\', '/');
  const fileName = normalizedPath.split('/').pop();
  if (!fileName) return null;

  return `/api/uploads/partner-products/${encodeURIComponent(fileName)}`;
}

function pickProductImage(product) {
  const raw = product?.imageUrls;
  let images = [];

  if (Array.isArray(raw)) {
    images = raw;
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) images = parsed;
      else if (parsed) images = [String(parsed)];
    } catch {
      images = [raw];
    }
  }

  for (const item of images) {
    const normalized = normalizePartnerImageUrl(item);
    if (normalized) return normalized;
  }
  return null;
}

const translations = {
  th: {
    partnerConnected: '🔗 Partner Connected Marketplace',
    title: '/momoge-product · ระบบแสดงสินค้า + ซื้อขาย + ชำระเงิน',
    subtitle:
      'หน้านี้ดึงสินค้าที่ partner บันทึกในระบบโดยตรง, ส่งคำสั่งซื้อเข้า Partner Transaction, เช็กสถานะด้วยเลขออเดอร์ และชำระเงินด้วยการโอนเงิน',
    checkOrderTitle: '🔎 เช็กสถานะออเดอร์ลูกค้า',
    checkOrderHint: 'กรอกเลขออเดอร์ เช่น MKT20260517-0001',
    orderNumberPlaceholder: 'Order Number',
    checking: 'กำลังตรวจสอบ...',
    checkStatus: 'เช็กสถานะ',
    orderNumberRequired: 'กรุณากรอกเลขออเดอร์',
    checkStatusFailed: 'ตรวจสอบสถานะไม่สำเร็จ',
    orderNo: 'เลขที่',
    status: 'สถานะ',
    payment: 'Payment',
    total: 'ยอดรวม',
    loadProductsFailed: 'โหลดสินค้าไม่สำเร็จ',
    productsFromPartner: '📦 สินค้าจากระบบ Partner',
    loadingProducts: 'กำลังโหลดสินค้า...',
    noProducts: 'ยังไม่มีสินค้าในระบบ partner',
    model: 'Model',
    brand: 'Brand',
    unit: 'unit',
    cartAndPayment: '🛒 ซื้อ-ขาย & ชำระเงินจริง',
    noCartItems: 'ยังไม่มีสินค้าในตะกร้า',
    customerName: 'ชื่อลูกค้า',
    customerContact: 'เบอร์โทร / LINE',
    customerEmail: 'อีเมล',
    shippingAddress: 'ที่อยู่จัดส่ง',
    paymentMethod: 'ช่องทางชำระเงิน',
    paymentBankTransfer: 'โอนเงินผ่านธนาคาร',
    orderNote: 'หมายเหตุคำสั่งซื้อ',
    createOrder: 'สร้างคำสั่งซื้อเข้าระบบ Partner',
    creatingOrder: 'กำลังสร้างคำสั่งซื้อ...',
    createOrderFailed: 'สร้างคำสั่งซื้อไม่สำเร็จ',
    selectAtLeastOne: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ',
    orderCreatedOk: '✅ สร้างคำสั่งซื้อสำเร็จ',
    orderCreatedMessage: '✅ สร้างคำสั่งซื้อสำเร็จ เลือกช่องทางชำระเงินได้ด้านล่าง',
    bankTransferTitle: '🏦 ชำระด้วยการโอนเงิน',
    bankNameLabel: 'ธนาคาร',
    accountNameLabel: 'ชื่อบัญชี',
    accountNoLabel: 'เลขบัญชี',
    transferAmountLabel: 'ยอดที่ต้องโอน',
    transferNote: 'หลังโอนเงิน กรุณาแนบสลิปเพื่อยืนยันการชำระเงิน',
    uploadSlipLabel: 'แนบสลิปการโอนเงิน (PDF/JPG/PNG/WEBP)',
    uploadSlipBtn: 'ยืนยันโอนเงินและอัปโหลดสลิป',
    uploadingSlip: 'กำลังอัปโหลดสลิป...',
    uploadSlipSuccess: '✅ แนบสลิปเรียบร้อยแล้ว กรุณารอทีมงานตรวจสอบ',
    uploadSlipFailed: 'อัปโหลดสลิปไม่สำเร็จ',
    selectSlipFirst: 'กรุณาเลือกไฟล์สลิปก่อน',
  },
  en: {
    partnerConnected: '🔗 Partner Connected Marketplace',
    title: '/momoge-product · Product Listing + Trading + Payment',
    subtitle:
      'This page loads partner products directly, creates orders in Partner Transaction, checks order status, and supports Bank Transfer payment.',
    checkOrderTitle: '🔎 Check Customer Order Status',
    checkOrderHint: 'Enter order number e.g. MKT20260517-0001',
    orderNumberPlaceholder: 'Order Number',
    checking: 'Checking...',
    checkStatus: 'Check Status',
    orderNumberRequired: 'Please enter an order number',
    checkStatusFailed: 'Failed to check order status',
    orderNo: 'Number',
    status: 'Status',
    payment: 'Payment',
    total: 'Total',
    loadProductsFailed: 'Failed to load products',
    productsFromPartner: '📦 Products from Partner System',
    loadingProducts: 'Loading products...',
    noProducts: 'No products found in partner system',
    model: 'Model',
    brand: 'Brand',
    unit: 'unit',
    cartAndPayment: '🛒 Trading & Real Payment',
    noCartItems: 'No items in cart',
    customerName: 'Customer Name',
    customerContact: 'Phone / LINE',
    customerEmail: 'Email',
    shippingAddress: 'Shipping Address',
    paymentMethod: 'Payment Method',
    paymentBankTransfer: 'Bank Transfer',
    orderNote: 'Order Note',
    createOrder: 'Create Order in Partner System',
    creatingOrder: 'Creating order...',
    createOrderFailed: 'Failed to create order',
    selectAtLeastOne: 'Please select at least one product',
    orderCreatedOk: '✅ Order created successfully',
    orderCreatedMessage: '✅ Order created. Choose a payment method below.',
    bankTransferTitle: '🏦 Pay by Bank Transfer',
    bankNameLabel: 'Bank',
    accountNameLabel: 'Account Name',
    accountNoLabel: 'Account Number',
    transferAmountLabel: 'Amount to Transfer',
    transferNote: 'After transfer, please upload your payment slip for verification.',
    uploadSlipLabel: 'Upload transfer slip (PDF/JPG/PNG/WEBP)',
    uploadSlipBtn: 'Confirm Transfer & Upload Slip',
    uploadingSlip: 'Uploading slip...',
    uploadSlipSuccess: '✅ Slip uploaded successfully. Please wait for review.',
    uploadSlipFailed: 'Failed to upload slip',
    selectSlipFirst: 'Please select a slip file first',
  },
  ko: {
    partnerConnected: '🔗 파트너 연동 마켓플레이스',
    title: '/momoge-product · 상품 목록 + 주문 + 결제',
    subtitle:
      '이 페이지는 파트너 상품을 직접 불러오고, 주문을 Partner Transaction에 생성하며, 주문 상태 조회 및 계좌이체 결제를 지원합니다.',
    checkOrderTitle: '🔎 고객 주문 상태 확인',
    checkOrderHint: '주문번호 입력 예: MKT20260517-0001',
    orderNumberPlaceholder: '주문 번호',
    checking: '확인 중...',
    checkStatus: '상태 확인',
    orderNumberRequired: '주문 번호를 입력해 주세요',
    checkStatusFailed: '주문 상태 확인 실패',
    orderNo: '주문번호',
    status: '상태',
    payment: '결제',
    total: '합계',
    loadProductsFailed: '상품을 불러오지 못했습니다',
    productsFromPartner: '📦 파트너 시스템 상품',
    loadingProducts: '상품 불러오는 중...',
    noProducts: '파트너 시스템에 상품이 없습니다',
    model: '모델',
    brand: '브랜드',
    unit: '개',
    cartAndPayment: '🛒 주문 & 실결제',
    noCartItems: '장바구니가 비어 있습니다',
    customerName: '고객명',
    customerContact: '전화 / LINE',
    customerEmail: '이메일',
    shippingAddress: '배송 주소',
    paymentMethod: '결제 수단',
    paymentBankTransfer: '계좌이체',
    orderNote: '주문 메모',
    createOrder: '파트너 시스템에 주문 생성',
    creatingOrder: '주문 생성 중...',
    createOrderFailed: '주문 생성 실패',
    selectAtLeastOne: '최소 1개 이상의 상품을 선택해 주세요',
    orderCreatedOk: '✅ 주문이 생성되었습니다',
    orderCreatedMessage: '✅ 주문 생성 완료. 아래에서 결제 수단을 선택하세요.',
    bankTransferTitle: '🏦 계좌이체로 결제',
    bankNameLabel: '은행',
    accountNameLabel: '예금주',
    accountNoLabel: '계좌번호',
    transferAmountLabel: '이체 금액',
    transferNote: '이체 후 결제 확인을 위해 입금증(슬립)을 업로드해 주세요.',
    uploadSlipLabel: '이체 슬립 업로드 (PDF/JPG/PNG/WEBP)',
    uploadSlipBtn: '이체 확인 및 슬립 업로드',
    uploadingSlip: '슬립 업로드 중...',
    uploadSlipSuccess: '✅ 슬립 업로드 완료. 검토를 기다려 주세요.',
    uploadSlipFailed: '슬립 업로드 실패',
    selectSlipFirst: '먼저 슬립 파일을 선택해 주세요',
  },
};

const bankInfo = {
  bankName: 'Kasikorn Bank',
  accountName: 'MOMOGE SPACE CO., LTD.',
  accountNumber: '123-4-56789-0',
};

export default function MomogeMarketplacePage() {
  const [language, setLanguage] = useState('th');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  const [orderQuery, setOrderQuery] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [statusError, setStatusError] = useState('');

  const t = (key) => translations[language]?.[key] || translations.th[key] || key;

  async function checkOrderStatus(orderNumber) {
    const number = String(orderNumber || '').trim();
    if (!number) {
      setStatusError(t('orderNumberRequired'));
      setStatusResult(null);
      return;
    }
    setCheckingStatus(true);
    setStatusError('');
    try {
      const res = await fetch(`/api/partner/marketplace/status?number=${encodeURIComponent(number)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('checkStatusFailed'));
      setStatusResult(data.order || null);
    } catch (err) {
      setStatusResult(null);
      setStatusError(err.message || t('checkStatusFailed'));
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
        if (!res.ok) throw new Error(data.error || t('loadProductsFailed'));
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        setError(err.message || t('loadProductsFailed'));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function uploadBankSlip() {
    if (!createdOrder?.transactionId) return;
    if (!slipFile) {
      setError(t('selectSlipFirst'));
      return;
    }

    setUploadingSlip(true);
    setError('');
    setPaymentMessage('');
    try {
      const formData = new FormData();
      formData.append('transactionId', createdOrder.transactionId);
      formData.append('file', slipFile);

      const res = await fetch('/api/partner/marketplace/slip', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('uploadSlipFailed'));
      setPaymentMessage(t('uploadSlipSuccess'));
      setSlipFile(null);
    } catch (err) {
      setError(err.message || t('uploadSlipFailed'));
    } finally {
      setUploadingSlip(false);
    }
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError(t('selectAtLeastOne'));
      return;
    }
    setCreatingOrder(true);
    setError('');
    setPaymentMessage('');
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
      if (!res.ok) throw new Error(data.error || t('createOrderFailed'));
      setCreatedOrder(data);
      setCart({});
      setNote('');
      setShippingAddress('');
      setPaymentMessage(t('orderCreatedMessage'));
      setOrderQuery(data.number || '');
      checkOrderStatus(data.number || '');
    } catch (err) {
      setError(err.message || t('createOrderFailed'));
    } finally {
      setCreatingOrder(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0b1120 100%)', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1d4ed822', border: '1px solid #60a5fa66', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>
              {t('partnerConnected')}
            </div>

            <div style={{ display: 'inline-flex', gap: 6, background: '#0b1220cc', border: '1px solid #334155', borderRadius: 999, padding: 4 }}>
              {[
                { code: 'th', label: 'ไทย' },
                { code: 'en', label: 'EN' },
                { code: 'ko', label: '한국어' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 12,
                    color: language === lang.code ? '#fff' : '#cbd5e1',
                    background: language === lang.code ? '#2563eb' : 'transparent',
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', fontWeight: 800, color: '#f8fafc' }}>{t('title')}</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>{t('subtitle')}</p>
        </div>

        <section style={{ marginBottom: 16, background: '#0b1220cc', border: '1px solid #1e293b', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#bfdbfe' }}>{t('checkOrderTitle')}</div>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>{t('checkOrderHint')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder={t('orderNumberPlaceholder')}
              style={{ minWidth: 260, flex: '1 1 260px', background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }}
            />
            <button
              type="button"
              onClick={() => checkOrderStatus(orderQuery)}
              disabled={checkingStatus}
              style={{ background: checkingStatus ? '#475569' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontWeight: 700, cursor: checkingStatus ? 'not-allowed' : 'pointer' }}
            >
              {checkingStatus ? t('checking') : t('checkStatus')}
            </button>
          </div>

          {statusError && <div style={{ marginTop: 8, color: '#fca5a5', fontSize: 12 }}>{statusError}</div>}

          {statusResult && (
            <div style={{ marginTop: 10, borderTop: '1px solid #1f2937', paddingTop: 10, fontSize: 13 }}>
              <div style={{ color: '#e2e8f0' }}>{t('orderNo')}: <b>{statusResult.number}</b></div>
              <div style={{ color: '#93c5fd', marginTop: 2 }}>
                {t('status')}: <b>{statusResult.status}</b>
                {statusResult.paymentStatus ? <span> · {t('payment')}: <b>{statusResult.paymentStatus}</b></span> : null}
              </div>
              <div style={{ color: '#94a3b8', marginTop: 2 }}>
                {t('total')}: <b>{currencySymbol(statusResult.currency)}{toNum(statusResult.amount).toLocaleString()}</b>
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
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#bfdbfe' }}>{t('productsFromPartner')}</div>
            {loading ? (
              <div style={{ color: '#93c5fd', fontSize: 14 }}>{t('loadingProducts')}</div>
            ) : products.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 14 }}>{t('noProducts')}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {products.map((p) => {
                  const price = toNum(p.sellPrice ?? p.costPrice ?? 0);
                  const qty = Number(cart[p.id] || 0);
                  const imageUrl = pickProductImage(p);
                  return (
                    <article key={p.id} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
                      <div style={{ marginBottom: 8, borderRadius: 10, overflow: 'hidden', background: '#0f172a', border: '1px solid #1f2937', aspectRatio: '16 / 10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={p.name || 'product image'}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            display: imageUrl ? 'none' : 'flex',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: 12,
                            letterSpacing: 0.2,
                          }}
                        >
                          No Image
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#93c5fd', minHeight: 18 }}>
                        {p.model ? `${t('model')}: ${p.model}` : `${t('model')}: -`}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', minHeight: 18 }}>
                        {p.brand ? `${t('brand')}: ${p.brand}` : `${t('brand')}: -`}
                      </div>
                      <div style={{ marginTop: 8, fontWeight: 800, color: '#4ade80' }}>
                        {currencySymbol(p.currency)}{price.toLocaleString()} / {t('unit')}
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
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#bfdbfe' }}>{t('cartAndPayment')}</div>

            <div style={{ marginBottom: 12, maxHeight: 190, overflow: 'auto', border: '1px solid #1f2937', borderRadius: 10, padding: 10, background: '#111827' }}>
              {cartItems.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{t('noCartItems')}</div>
              ) : cartItems.map((it) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#e2e8f0' }}>{it.name} x {it.qty}</span>
                  <strong style={{ color: '#4ade80' }}>{currencySymbol(it.currency)}{it.total.toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: '#94a3b8' }}>{t('total')}</span>
              <strong style={{ color: '#f8fafc', fontSize: 18 }}>{currencySymbol(cartCurrency)}{grandTotal.toLocaleString()}</strong>
            </div>

            <form onSubmit={submitOrder}>
              <div style={{ display: 'grid', gap: 8 }}>
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t('customerName')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }} />
                <input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder={t('customerContact')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }} />
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder={t('customerEmail')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }} />
                <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={2} placeholder={t('shippingAddress')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px', resize: 'vertical' }} />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px' }}>
                  <option value="BANK_TRANSFER">{t('paymentBankTransfer')}</option>
                </select>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={t('orderNote')} style={{ background: '#111827', border: '1px solid #334155', color: '#e5e7eb', borderRadius: 8, padding: '9px 10px', resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={creatingOrder || cartItems.length === 0} style={{ width: '100%', marginTop: 10, border: 'none', borderRadius: 10, padding: '11px 12px', cursor: creatingOrder ? 'not-allowed' : 'pointer', fontWeight: 800, color: '#fff', background: creatingOrder ? '#475569' : 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                {creatingOrder ? t('creatingOrder') : t('createOrder')}
              </button>
            </form>

            {createdOrder && (
              <div style={{ marginTop: 12, borderTop: '1px solid #1f2937', paddingTop: 12 }}>
                <div style={{ fontSize: 13, color: '#86efac', marginBottom: 6 }}>{t('orderCreatedOk')}</div>
                <div style={{ fontSize: 12, color: '#93c5fd', marginBottom: 8 }}>
                  {t('orderNo')}: <b>{createdOrder.number}</b> · {t('status')}: <b>{createdOrder.status}</b>
                </div>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 1.7 }}>
                      <div style={{ color: '#bfdbfe', fontWeight: 700, marginBottom: 4 }}>{t('bankTransferTitle')}</div>
                      <div>{t('bankNameLabel')}: <b>{bankInfo.bankName}</b></div>
                      <div>{t('accountNameLabel')}: <b>{bankInfo.accountName}</b></div>
                      <div>{t('accountNoLabel')}: <b>{bankInfo.accountNumber}</b></div>
                      <div>{t('transferAmountLabel')}: <b>{currencySymbol(createdOrder.currency || cartCurrency)}{toNum(createdOrder.amount || grandTotal).toLocaleString()}</b></div>
                      <div style={{ color: '#94a3b8', marginTop: 4 }}>{t('transferNote')}</div>
                    </div>

                    <label style={{ fontSize: 12, color: '#cbd5e1' }}>{t('uploadSlipLabel')}</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                      style={{ fontSize: 12, color: '#cbd5e1' }}
                    />
                    <button
                      type="button"
                      onClick={uploadBankSlip}
                      disabled={uploadingSlip}
                      style={{ background: uploadingSlip ? '#475569' : '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontWeight: 700, cursor: uploadingSlip ? 'not-allowed' : 'pointer' }}
                    >
                      {uploadingSlip ? t('uploadingSlip') : t('uploadSlipBtn')}
                    </button>
                  </div>
                )}

                {paymentMessage && <div style={{ marginTop: 8, fontSize: 12, color: '#86efac' }}>{paymentMessage}</div>}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
