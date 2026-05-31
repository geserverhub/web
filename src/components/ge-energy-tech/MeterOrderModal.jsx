'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateMeterUnitPrice,
  formatThb,
  METER_ORDER_BANK,
} from '@/lib/meter-order';
import { getMeterOrderCopy } from '@/lib/ge-energy-tech-meter-order-i18n';
import { geEnergyTechApiUrl } from '@/lib/ge-energy-tech-api';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPT_IMAGE = 'image/jpeg,image/png,image/webp';
const ACCEPT_SLIP = 'image/jpeg,image/png,image/webp,application/pdf';

export default function MeterOrderModal({ open, onClose, lang }) {
  const t = useMemo(() => getMeterOrderCopy(lang), [lang]);
  const siteInputRef = useRef(null);
  const slipInputRef = useRef(null);

  const [form, setForm] = useState({
    buyerName: '',
    shipAddress: '',
    email: '',
    phone: '',
    breakerSize: '',
    machineKva: '',
    quantity: 1,
  });
  const [sitePreview, setSitePreview] = useState(null);
  const [siteFile, setSiteFile] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [unitPrice, setUnitPrice] = useState(null);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('form');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && phase !== 'submitting') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, phase]);

  useEffect(() => {
    if (!open) {
      setForm({
        buyerName: '',
        shipAddress: '',
        email: '',
        phone: '',
        breakerSize: '',
        machineKva: '',
        quantity: 1,
      });
      setSitePreview(null);
      setSiteFile(null);
      setSlipFile(null);
      setUnitPrice(null);
      setError('');
      setPhase('form');
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (sitePreview) URL.revokeObjectURL(sitePreview);
    };
  }, [sitePreview]);

  if (!open) return null;

  const total = unitPrice != null ? unitPrice * Math.max(1, Number(form.quantity) || 1) : null;
  const bankName = lang === 'th' ? METER_ORDER_BANK.bankNameTh : METER_ORDER_BANK.bankNameEn;

  function onField(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function pickFile(file, kind) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(lang === 'th' ? 'ไฟล์ใหญ่เกิน 8 MB' : 'File too large (max 8 MB)');
      return;
    }
    setError('');
    if (kind === 'site') {
      if (sitePreview) URL.revokeObjectURL(sitePreview);
      setSiteFile(file);
      setSitePreview(URL.createObjectURL(file));
    } else {
      setSlipFile(file);
    }
  }

  function handleCalculate() {
    const price = calculateMeterUnitPrice(form.breakerSize, form.machineKva);
    if (price == null) {
      setError(t.errCalc);
      setUnitPrice(null);
      return;
    }
    setError('');
    setUnitPrice(price);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (unitPrice == null) {
      setError(t.errForm);
      return;
    }
    if (!form.buyerName.trim() || !form.shipAddress.trim() || !form.email.trim() || !form.phone.trim()) {
      setError(t.errForm);
      return;
    }
    if (!siteFile) {
      setError(t.errSite);
      return;
    }
    if (!slipFile) {
      setError(t.errSlip);
      return;
    }

    setSubmitting(true);
    setError('');

    const fd = new FormData();
    fd.append('lang', lang);
    fd.append('buyerName', form.buyerName.trim());
    fd.append('shipAddress', form.shipAddress.trim());
    fd.append('email', form.email.trim());
    fd.append('phone', form.phone.trim());
    fd.append('breakerSize', form.breakerSize.trim());
    fd.append('machineKva', form.machineKva.trim());
    fd.append('quantity', String(Math.max(1, Number(form.quantity) || 1)));
    fd.append('unitPrice', String(unitPrice));
    fd.append('totalPrice', String(total));
    fd.append('sitePhoto', siteFile);
    fd.append('paymentSlip', slipFile);

    try {
      const res = await fetch(geEnergyTechApiUrl('/api/ge-energy-tech/meter-order'), {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errGeneric);
        return;
      }
      setPhase('success');
    } catch {
      setError(t.errGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="get-meter-modal-overlay" role="presentation" onClick={phase === 'success' ? onClose : undefined}>
      <div
        className="get-meter-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="get-meter-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="get-meter-modal-close" onClick={onClose} aria-label={t.close}>
          ×
        </button>

        {phase === 'success' ? (
          <div className="get-meter-success">
            <div className="get-meter-success-icon" aria-hidden>
              ✓
            </div>
            <h2 id="get-meter-modal-title">{t.successTitle}</h2>
            <p>{t.successMsg}</p>
            <button type="button" className="get-meter-btn get-meter-btn--primary" onClick={onClose}>
              {t.close}
            </button>
          </div>
        ) : (
          <>
            <header className="get-meter-modal-head">
              <h2 id="get-meter-modal-title">{t.title}</h2>
              <p>{t.sub}</p>
            </header>

            <form className="get-meter-form" onSubmit={handleSubmit}>
              <div className="get-meter-grid">
                <label className="get-meter-field">
                  <span>{t.buyerName}</span>
                  <input name="buyerName" value={form.buyerName} onChange={onField} required />
                </label>
                <label className="get-meter-field">
                  <span>{t.email}</span>
                  <input name="email" type="email" value={form.email} onChange={onField} required />
                </label>
                <label className="get-meter-field get-meter-field--full">
                  <span>{t.shipAddress}</span>
                  <textarea name="shipAddress" rows={2} value={form.shipAddress} onChange={onField} required />
                </label>
                <label className="get-meter-field">
                  <span>{t.phone}</span>
                  <input name="phone" type="tel" value={form.phone} onChange={onField} required />
                </label>
                <label className="get-meter-field">
                  <span>{t.breakerSize}</span>
                  <input name="breakerSize" inputMode="decimal" value={form.breakerSize} onChange={onField} placeholder="63" required />
                </label>
                <label className="get-meter-field">
                  <span>{t.machineKva}</span>
                  <input name="machineKva" inputMode="decimal" value={form.machineKva} onChange={onField} placeholder="50" required />
                </label>
                <div className="get-meter-field get-meter-field--full">
                  <button type="button" className="get-meter-btn get-meter-btn--calc" onClick={handleCalculate}>
                    {t.calcPrice}
                  </button>
                </div>
              </div>

              <div className="get-meter-upload-row">
                <div className="get-meter-upload-col">
                  <span className="get-meter-upload-label">{t.uploadSite}</span>
                  <input
                    ref={siteInputRef}
                    type="file"
                    accept={ACCEPT_IMAGE}
                    className="get-meter-file-input"
                    onChange={(e) => pickFile(e.target.files?.[0], 'site')}
                  />
                  <button type="button" className="get-meter-btn get-meter-btn--ghost" onClick={() => siteInputRef.current?.click()}>
                    {t.uploadSite}
                  </button>
                  <div className="get-meter-preview-card">
                    {sitePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sitePreview} alt="" className="get-meter-preview-img" />
                    ) : (
                      <span className="get-meter-preview-empty">{t.previewEmpty}</span>
                    )}
                  </div>
                </div>
              </div>

              {unitPrice != null ? (
                <div className="get-meter-price-card">
                  <h3>{t.priceTitle}</h3>
                  <dl>
                    <div>
                      <dt>{t.unitPrice}</dt>
                      <dd>{formatThb(unitPrice)}</dd>
                    </div>
                    <div>
                      <dt>{t.qtyLabel}</dt>
                      <dd>
                        <input
                          name="quantity"
                          type="number"
                          min={1}
                          max={999}
                          value={form.quantity}
                          onChange={onField}
                          className="get-meter-qty-input"
                        />
                      </dd>
                    </div>
                    <div className="get-meter-price-total">
                      <dt>{t.total}</dt>
                      <dd>{formatThb(total)}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              <div className="get-meter-bank-card">
                <h3>{t.bankTitle}</h3>
                <p>
                  <strong>{t.bankCompany}:</strong> {METER_ORDER_BANK.company}
                </p>
                <p>
                  <strong>{t.bankName}:</strong> {bankName}
                </p>
                <p>
                  <strong>{t.bankAccount}:</strong> {METER_ORDER_BANK.accountNumber}
                </p>
                <p>
                  <strong>{t.bankAccountName}:</strong> {METER_ORDER_BANK.accountName}
                </p>
              </div>

              <div className="get-meter-slip-block">
                <span className="get-meter-upload-label">{t.uploadSlip}</span>
                <input
                  ref={slipInputRef}
                  type="file"
                  accept={ACCEPT_SLIP}
                  className="get-meter-file-input"
                  required
                  onChange={(e) => pickFile(e.target.files?.[0], 'slip')}
                />
                <button type="button" className="get-meter-btn get-meter-btn--ghost" onClick={() => slipInputRef.current?.click()}>
                  {slipFile ? slipFile.name : t.uploadSlip}
                </button>
              </div>

              {error ? (
                <p className="get-meter-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="get-meter-btn get-meter-btn--primary" disabled={submitting || unitPrice == null}>
                {submitting ? t.submitting : t.confirm}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
