'use client';

import { useEffect, useMemo, useState } from 'react';
import { languageStorageKey, languageOptions } from '@/lib/data';
import './momoge-product.css';

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
    pageTitle: 'MOMOGE SPACE',
    pageSubtitle: 'สินค้าและสั่งซื้อออนไลน์',
    energyBadge: 'Smart Energy',
    checkOrderTitle: 'เช็กสถานะออเดอร์',
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
    productsFromPartner: 'สินค้า',
    loadingProducts: 'กำลังโหลดสินค้า...',
    noProducts: 'ไม่พบสินค้า',
    model: 'Model',
    brand: 'Brand',
    unit: 'unit',
    cartAndPayment: 'ตะกร้า & ชำระเงิน',
    noCartItems: 'ยังไม่มีสินค้าในตะกร้า',
    customerName: 'ชื่อลูกค้า',
    customerContact: 'เบอร์โทร / LINE',
    customerEmail: 'อีเมล',
    shippingAddress: 'ที่อยู่จัดส่ง',
    paymentMethod: 'ช่องทางชำระเงิน',
    paymentBankTransfer: 'โอนเงินผ่านธนาคาร',
    orderNote: 'หมายเหตุคำสั่งซื้อ',
    createOrder: 'สร้างคำสั่งซื้อ',
    creatingOrder: 'กำลังสร้างคำสั่งซื้อ...',
    createOrderFailed: 'สร้างคำสั่งซื้อไม่สำเร็จ',
    selectAtLeastOne: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ',
    orderCreatedOk: '✅ สร้างคำสั่งซื้อสำเร็จ',
    orderCreatedMessage: '✅ สร้างคำสั่งซื้อสำเร็จ เลือกช่องทางชำระเงินได้ด้านล่าง',
    bankTransferTitle: 'ชำระด้วยการโอนเงิน',
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
    noImage: 'ไม่มีรูป',
  },
  en: {
    pageTitle: 'MOMOGE SPACE',
    pageSubtitle: 'Products & online ordering',
    energyBadge: 'Smart Energy',
    checkOrderTitle: 'Check order status',
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
    productsFromPartner: 'Products',
    loadingProducts: 'Loading products...',
    noProducts: 'No products found',
    model: 'Model',
    brand: 'Brand',
    unit: 'unit',
    cartAndPayment: 'Cart & payment',
    noCartItems: 'No items in cart',
    customerName: 'Customer Name',
    customerContact: 'Phone / LINE',
    customerEmail: 'Email',
    shippingAddress: 'Shipping Address',
    paymentMethod: 'Payment Method',
    paymentBankTransfer: 'Bank Transfer',
    orderNote: 'Order Note',
    createOrder: 'Create Order',
    creatingOrder: 'Creating order...',
    createOrderFailed: 'Failed to create order',
    selectAtLeastOne: 'Please select at least one product',
    orderCreatedOk: '✅ Order created successfully',
    orderCreatedMessage: '✅ Order created. Choose a payment method below.',
    bankTransferTitle: 'Pay by bank transfer',
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
    noImage: 'No image',
  },
  ko: {
    pageTitle: 'MOMOGE SPACE',
    pageSubtitle: '상품 및 온라인 주문',
    energyBadge: 'Smart Energy',
    checkOrderTitle: '주문 상태 확인',
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
    productsFromPartner: '상품',
    loadingProducts: '상품 불러오는 중...',
    noProducts: '상품이 없습니다',
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
    createOrder: '주문 생성',
    creatingOrder: '주문 생성 중...',
    createOrderFailed: '주문 생성 실패',
    selectAtLeastOne: '최소 1개 이상의 상품을 선택해 주세요',
    orderCreatedOk: '✅ 주문이 생성되었습니다',
    orderCreatedMessage: '✅ 주문 생성 완료. 아래에서 결제 수단을 선택하세요.',
    bankTransferTitle: '계좌이체 결제',
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
    noImage: '이미지 없음',
  },
};

const supportedLanguages = ['th', 'en', 'ko'];

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

  const t = (key) => translations[language]?.[key] ?? translations.th[key] ?? key;

  useEffect(() => {
    const saved = window.localStorage.getItem(languageStorageKey);
    if (saved && supportedLanguages.includes(saved)) setLanguage(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language;
  }, [language]);

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
    <div className="momo-page">
      <div className="momo-wrap">
        <header className="momo-header">
          <div className="momo-logo-wrap">
            <img src="/momoge/Logo-brand.png" alt="MOMOGE" className="momo-logo" />
          </div>
          <div className="momo-header-text">
            <h1>{t('pageTitle')}</h1>
            <p>{t('pageSubtitle')}</p>
          </div>
          <div className="momo-header-actions">
            <div className="momo-lang-switcher" role="group" aria-label="Language">
              {languageOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`momo-lang-btn ${language === opt.key ? 'is-active' : ''}`}
                  onClick={() => setLanguage(opt.key)}
                  aria-pressed={language === opt.key}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="momo-energy-badge">{t('energyBadge')}</span>
          </div>
        </header>

        <section className="momo-card" style={{ marginBottom: 20 }}>
          <div className="momo-card-title">{t('checkOrderTitle')}</div>
          <div className="momo-card-hint">{t('checkOrderHint')}</div>
          <div className="momo-row">
            <input
              className="momo-input momo-input-inline"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder={t('orderNumberPlaceholder')}
            />
            <button
              type="button"
              className="momo-btn momo-btn-primary"
              onClick={() => checkOrderStatus(orderQuery)}
              disabled={checkingStatus}
            >
              {checkingStatus ? t('checking') : t('checkStatus')}
            </button>
          </div>
          {statusError && <div className="momo-alert-error" style={{ marginTop: 12, marginBottom: 0 }}>{statusError}</div>}
          {statusResult && (
            <div className="momo-status-box">
              <div>{t('orderNo')}: <strong>{statusResult.number}</strong></div>
              <div>
                {t('status')}: <strong>{statusResult.status}</strong>
                {statusResult.paymentStatus ? <> · {t('payment')}: <strong>{statusResult.paymentStatus}</strong></> : null}
              </div>
              <div>
                {t('total')}: <strong>{currencySymbol(statusResult.currency)}{toNum(statusResult.amount).toLocaleString()}</strong>
              </div>
            </div>
          )}
        </section>

        {error && <div className="momo-alert-error">{error}</div>}

        <div className="momo-grid-main">
          <section className="momo-card">
            <div className="momo-section-label">{t('productsFromPartner')}</div>
            {loading ? (
              <div className="momo-loading">{t('loadingProducts')}</div>
            ) : products.length === 0 ? (
              <div className="momo-empty">{t('noProducts')}</div>
            ) : (
              <div className="momo-products-grid">
                {products.map((p) => {
                  const price = toNum(p.sellPrice ?? p.costPrice ?? 0);
                  const qty = Number(cart[p.id] || 0);
                  const imageUrl = pickProductImage(p);
                  return (
                    <article key={p.id} className="momo-product-card">
                      <div className="momo-product-img-wrap">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={p.name || 'product'}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fb = e.currentTarget.nextElementSibling;
                              if (fb) fb.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="momo-product-img-placeholder"
                          style={{ display: imageUrl ? 'none' : 'flex', width: '100%', height: '100%' }}
                        >
                          {t('noImage')}
                        </div>
                      </div>
                      <div className="momo-product-body">
                        <div className="momo-product-name">{p.name}</div>
                        <div className="momo-product-meta">
                          {p.model ? `${t('model')}: ${p.model}` : `${t('model')}: —`}
                          <br />
                          {p.brand ? `${t('brand')}: ${p.brand}` : `${t('brand')}: —`}
                        </div>
                        <div className="momo-product-price">
                          {currencySymbol(p.currency)}{price.toLocaleString()} <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>/ {t('unit')}</span>
                        </div>
                        <div className="momo-qty-row">
                          <button type="button" className="momo-btn momo-btn-qty momo-btn-qty-minus" onClick={() => updateQty(p.id, qty - 1)} aria-label="ลด">−</button>
                          <input
                            type="number"
                            min={0}
                            className="momo-input momo-qty-input"
                            value={qty}
                            onChange={(e) => updateQty(p.id, e.target.value)}
                          />
                          <button type="button" className="momo-btn momo-btn-qty momo-btn-qty-plus" onClick={() => updateQty(p.id, qty + 1)} aria-label="เพิ่ม">+</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="momo-card momo-cart-aside">
            <div className="momo-section-label">{t('cartAndPayment')}</div>

            <div className="momo-cart-list">
              {cartItems.length === 0 ? (
                <div className="momo-empty" style={{ padding: 12 }}>{t('noCartItems')}</div>
              ) : (
                cartItems.map((it) => (
                  <div key={it.id} className="momo-cart-line">
                    <span>{it.name} × {it.qty}</span>
                    <strong style={{ color: '#047857' }}>{currencySymbol(it.currency)}{it.total.toLocaleString()}</strong>
                  </div>
                ))
              )}
            </div>

            <div className="momo-cart-total">
              <span style={{ color: '#059669' }}>{t('total')}</span>
              <strong>{currencySymbol(cartCurrency)}{grandTotal.toLocaleString()}</strong>
            </div>

            <form onSubmit={submitOrder}>
              <div className="momo-form-stack">
                <input required className="momo-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t('customerName')} />
                <input className="momo-input" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder={t('customerContact')} />
                <input type="email" className="momo-input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder={t('customerEmail')} />
                <textarea className="momo-textarea" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={2} placeholder={t('shippingAddress')} />
                <select className="momo-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="BANK_TRANSFER">{t('paymentBankTransfer')}</option>
                </select>
                <textarea className="momo-textarea" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={t('orderNote')} />
              </div>

              <button type="submit" className="momo-btn momo-btn-primary" style={{ width: '100%', marginTop: 14 }} disabled={creatingOrder || cartItems.length === 0}>
                {creatingOrder ? t('creatingOrder') : t('createOrder')}
              </button>
            </form>

            {createdOrder && (
              <div className="momo-status-box">
                <div className="momo-alert-success" style={{ marginTop: 0, marginBottom: 10 }}>{t('orderCreatedOk')}</div>
                <div style={{ marginBottom: 10 }}>
                  {t('orderNo')}: <strong>{createdOrder.number}</strong> · {t('status')}: <strong>{createdOrder.status}</strong>
                </div>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="momo-form-stack">
                    <div className="momo-bank-box">
                      <div style={{ fontWeight: 700, marginBottom: 6, color: '#065f46' }}>{t('bankTransferTitle')}</div>
                      <div>{t('bankNameLabel')}: <strong>{bankInfo.bankName}</strong></div>
                      <div>{t('accountNameLabel')}: <strong>{bankInfo.accountName}</strong></div>
                      <div>{t('accountNoLabel')}: <strong>{bankInfo.accountNumber}</strong></div>
                      <div>{t('transferAmountLabel')}: <strong>{currencySymbol(createdOrder.currency || cartCurrency)}{toNum(createdOrder.amount || grandTotal).toLocaleString()}</strong></div>
                      <div style={{ marginTop: 6, color: '#059669' }}>{t('transferNote')}</div>
                    </div>

                    <label style={{ fontSize: '0.82rem', color: '#047857' }}>{t('uploadSlipLabel')}</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} style={{ fontSize: '0.82rem' }} />
                    <button type="button" className="momo-btn momo-btn-teal" onClick={uploadBankSlip} disabled={uploadingSlip}>
                      {uploadingSlip ? t('uploadingSlip') : t('uploadSlipBtn')}
                    </button>
                  </div>
                )}

                {paymentMessage && <div className="momo-alert-success">{paymentMessage}</div>}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
