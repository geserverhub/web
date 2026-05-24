"use client";

import { useState } from "react";

const TEXT = {
  th: {
    title: "เอ็มเฟคเตอร์รี่",
    subtitle: "โกดังโรงงานสำเร็จรูป ขาย-ให้เช่า",
    bookingInfo: "ข้อมูลการจอง",
    warehouseInfo: "ข้อมูลโกดัง",
    payment: "หลักฐานการชำระเงิน",
    visitProject: "นัดเยี่ยมชมโครงการโปรดสแกนคิวอาร์โค้ด",
    company: "ชื่อบริษัท",
    fullname: "ชื่อ - นามสกุล",
    phone: "เบอร์โทร",
    email: "อีเมล",
    taxId: "เลขประจำตัวผู้เสียภาษี",
    bookingDate: "วันที่จอง",
    address: "ที่อยู่",
    warehouse: "ประเภทโกดัง",
    rentalType: "ประเภทการจอง",
    warehouse1: "เลือกประเภท",
    warehouse2: "โกดังลาดหลุมแก้ว ปทุมธานี ขนาด 100 ตรม. ค่าเช่า เดือนละ 12,000 บาท",
    warehouse3: "โกดังลาดหลุมแก้ว ปทุมธานี ขนาด 120 ตรม. ค่าเช่า เดือนละ 15,000 บาท",
    warehouse4: "โกดังลาดหลุมแก้ว ปทุมธานี ขนาด 300 ตรม. ค่าเช่า เดือนละ 50,000 บาท",
    rent: "เช่า",
    buy: "ซื้อ",
    selectType: "เลือกประเภท",
    condition: "ยอมรับเงื่อนไขการจอง",
    confirm: "ยืนยันการจอง",
    pickFile: "เลือกไฟล์",
    termsTitle: "เงื่อนไขการจอง",
    term1: "ค่าจองโกดัง 5,000 บาท",
    term2: "การยืนยันการจองพร้อมหลักฐานการชำระเงิน ถือเป็นการทำสัญญาการจองอย่างครบถ้วน",
    term3: "บริษัทขอสงวนสิทธิ์ในการคืนเงินทุกกรณี",
    term4: "เอกสารที่ใช้ในการจองต้องถูกต้องครบถ้วน",
    siteLink: "ดูเว็บไซต์โครงการ",
    submitting: "กำลังส่ง...",
    success: "ส่งคำขอจองเรียบร้อยแล้ว",
    bookingNumberLabel: "เลขที่จอง",
    errorName: "กรุณากรอกชื่อ - นามสกุล",
    errorPhone: "กรุณากรอกเบอร์โทร",
    errorEmail: "กรุณากรอกอีเมล",
    errorAddress: "กรุณากรอกที่อยู่",
    errorWarehouse: "กรุณาเลือกประเภทโกดัง",
    errorRentalType: "กรุณาเลือกประเภทการจอง",
    errorPayment: "กรุณาอัปโหลดหลักฐานการชำระเงิน",
    errorAccept: "กรุณาติกยอมรับเงื่อนไขการจอง",
    requiredMark: "จำเป็นต้องกรอก",
    requiredSelect: "จำเป็นต้องเลือก",
    requiredUpload: "จำเป็นต้องอัปไฟล์",
    requiredCheck: "จำเป็นต้องติก",
    uploading: "กำลังอัปโหลด...",
  },
  en: {
    title: "M Factory",
    subtitle: "Warehouse Factory for Sale & Rent",
    bookingInfo: "Booking Information",
    warehouseInfo: "Warehouse Information",
    payment: "Proof of Payment",
    visitProject: "Scan QR Code to Schedule a Project Visit",
    company: "Company Name",
    fullname: "Name - Lastname",
    phone: "Phone Number",
    email: "Email",
    taxId: "Tax ID",
    bookingDate: "Booking Date",
    address: "Address",
    warehouse: "Warehouse Type",
    rentalType: "Booking Type",
    warehouse1: "Select Types",
    warehouse2: "Ladlumkaew Warehouse, Pathum Thani, Size 100 Sq.m., Rent 12,000 Baht / Month",
    warehouse3: "Ladlumkaew Warehouse, Pathum Thani, Size 120 Sq.m., Rent 15,000 Baht / Month",
    warehouse4: "Ladlumkaew Warehouse, Pathum Thani, Size 300 Sq.m., Rent 50,000 Baht / Month",
    rent: "Rent",
    buy: "Buy",
    selectType: "Select Type",
    condition: "Accept Terms & Conditions",
    confirm: "Confirm Booking",
    pickFile: "Choose file",
    termsTitle: "Terms & Conditions",
    term1: "Warehouse booking fee is 5,000 Baht",
    term2: "Booking confirmation together with payment slip is considered a complete booking agreement",
    term3: "The company reserves the right not to refund in all cases",
    term4: "All booking documents must be complete and valid",
    siteLink: "Project website",
    submitting: "Submitting...",
    success: "Booking request submitted",
    bookingNumberLabel: "Booking no.",
    errorName: "Please enter your name",
    errorPhone: "Please enter your phone number",
    errorEmail: "Please enter your email",
    errorAddress: "Please enter your address",
    errorWarehouse: "Please select a warehouse type",
    errorRentalType: "Please select a booking type",
    errorPayment: "Please upload proof of payment",
    errorAccept: "Please check to accept the terms",
    requiredMark: "Required",
    requiredSelect: "Required",
    requiredUpload: "File required",
    requiredCheck: "Must check",
    uploading: "Uploading...",
  },
};

const today = () => new Date().toISOString().split("T")[0];

function RequiredHint({ text }) {
  return <span className="mf-required block text-sm font-normal text-red-600 mt-0.5">{text}</span>;
}

const inputClass =
  "mf-input w-full border-2 border-black rounded-xl p-3 min-h-[48px] text-base";
const selectClass =
  "mf-select w-full border-2 border-black rounded-xl p-3 min-h-[48px] text-base";
const sectionClass = "mf-section bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 sm:p-6";
const sectionTitleClass = "mf-section-title text-xl sm:text-2xl font-bold mb-4 sm:mb-6";
const labelClass = "mf-label block mb-2 font-semibold text-base";

export default function BookingClient() {
  const [language, setLanguage] = useState("th");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("idle");
  const [paymentUploading, setPaymentUploading] = useState(false);
  const [form, setForm] = useState({
    company: "",
    fullname: "",
    phone: "",
    email: "",
    taxId: "",
    bookingDate: today(),
    address: "",
    warehouse: "",
    rentalType: "",
    paymentFileName: "",
    paymentRef: "",
  });

  const t = TEXT[language] || TEXT.th;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handlePaymentFile(file) {
    if (!file) {
      setForm((prev) => ({ ...prev, paymentFileName: "", paymentRef: "" }));
      return;
    }
    setField("paymentFileName", file.name);
    setPaymentUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/mfactory/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setField("paymentRef", data.paymentRef || data.url || "");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
      setForm((prev) => ({ ...prev, paymentFileName: "", paymentRef: "" }));
    } finally {
      setPaymentUploading(false);
    }
  }

  const canSubmit =
    accepted &&
    Boolean(form.paymentRef) &&
    status !== "loading" &&
    !paymentUploading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.paymentRef) {
      alert(t.errorPayment);
      return;
    }
    if (!accepted) {
      alert(t.errorAccept);
      return;
    }
    if (!form.fullname.trim()) {
      alert(t.errorName);
      return;
    }
    if (!form.phone.trim()) {
      alert(t.errorPhone);
      return;
    }
    if (!form.email.trim()) {
      alert(t.errorEmail);
      return;
    }
    if (!form.address.trim()) {
      alert(t.errorAddress);
      return;
    }
    if (!form.warehouse) {
      alert(t.errorWarehouse);
      return;
    }
    if (!form.rentalType) {
      alert(t.errorRentalType);
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/mfactory/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.fullname.trim(),
          company: form.company.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          taxId: form.taxId.trim(),
          bookingDate: form.bookingDate,
          address: form.address.trim(),
          warehouse: form.warehouse,
          rentalType: form.rentalType,
          paymentRef: form.paymentRef || form.paymentFileName,
          termsAccepted: accepted,
          type: "factory",
          lang: language,
          source: "mfac-booking",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setStatus("success");
      const ref = data.bookingNumber ? `${t.bookingNumberLabel}: ${data.bookingNumber}\n` : "";
      alert(`${ref}${t.success}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
      setStatus("idle");
    }
  }

  return (
    <div className="m-factory-layout mf-booking mf-page min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 px-3 py-4 sm:p-4 md:p-8 text-black">
      <div className="mf-card max-w-6xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl">
        <header className="mf-header bg-gradient-to-r from-blue-700 to-cyan-500 text-white p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-4">
          <div className="mf-header-main min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{t.title}</h1>
            <p className="mt-2 text-base sm:text-lg leading-snug">{t.subtitle}</p>
            <a
              href="https://m-factoryandresort.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm underline text-white/90 hover:text-white break-words"
            >
              {t.siteLink} →
            </a>
          </div>
          <div className="mf-lang grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setLanguage("th")}
              className={`mf-lang-btn min-h-[44px] px-4 py-2.5 rounded-xl font-bold shadow text-base ${
                language === "th" ? "bg-white text-blue-700" : "bg-blue-600/40 text-white"
              }`}
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`mf-lang-btn min-h-[44px] px-4 py-2.5 rounded-xl font-bold shadow text-base ${
                language === "en" ? "bg-white text-blue-700" : "bg-blue-600/40 text-white"
              }`}
            >
              EN
            </button>
          </div>
        </header>

        <form id="mf-booking-form" onSubmit={handleSubmit} className="mf-form p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-8 pb-28 sm:pb-8">
          <div className={sectionClass}>
            <h2 className={sectionTitleClass}>{t.bookingInfo}</h2>
            <div className="mf-field-grid grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className={labelClass}>{t.company}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.fullname}
                  <RequiredHint text={t.requiredMark} />
                </label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={form.fullname}
                  onChange={(e) => setField("fullname", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.phone}
                  <RequiredHint text={t.requiredMark} />
                </label>
                <input
                  type="tel"
                  required
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.email}
                  <RequiredHint text={t.requiredMark} />
                </label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t.taxId}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.taxId}
                  onChange={(e) => setField("taxId", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t.bookingDate}</label>
                <input
                  type="date"
                  readOnly
                  value={form.bookingDate}
                  className={`${inputClass} bg-gray-100`}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>
                  {t.address}
                  <RequiredHint text={t.requiredMark} />
                </label>
                <textarea
                  rows={4}
                  required
                  className={`${inputClass} min-h-[120px] resize-y`}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h2 className={sectionTitleClass}>{t.warehouseInfo}</h2>
            <div className="mf-field-grid grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className={labelClass}>
                  {t.warehouse}
                  <RequiredHint text={t.requiredSelect} />
                </label>
                <select
                  required
                  className={selectClass}
                  value={form.warehouse}
                  onChange={(e) => setField("warehouse", e.target.value)}
                >
                  <option value="">{t.warehouse1}</option>
                  <option value={t.warehouse2}>{t.warehouse2}</option>
                  <option value={t.warehouse3}>{t.warehouse3}</option>
                  <option value={t.warehouse4}>{t.warehouse4}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  {t.rentalType}
                  <RequiredHint text={t.requiredSelect} />
                </label>
                <select
                  required
                  className={selectClass}
                  value={form.rentalType}
                  onChange={(e) => setField("rentalType", e.target.value)}
                >
                  <option value="">{t.selectType}</option>
                  <option value={t.rent}>{t.rent}</option>
                  <option value={t.buy}>{t.buy}</option>
                </select>
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h2 className={`${sectionTitleClass} mb-2`}>{t.payment}</h2>
            <RequiredHint text={t.requiredUpload} />
            <label className="mf-file-btn mt-4 w-full min-h-[52px] border-2 border-black rounded-xl p-3 sm:p-4 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100 transition text-base text-center break-all">
              {paymentUploading ? t.uploading : form.paymentFileName || t.pickFile}
              <input
                type="file"
                accept="image/*,.pdf"
                required
                className="hidden"
                onChange={(e) => void handlePaymentFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="mf-qr-section bg-white border-2 border-blue-200 rounded-2xl p-4 sm:p-6 text-center">
            <h2 className="text-lg sm:text-2xl font-bold mb-4 leading-snug">{t.visitProject}</h2>
            <div className="flex justify-center">
              <img
                src="/m-factory/qr-line.jpg"
                alt="LINE QR"
                width={288}
                height={288}
                className="mf-qr-img w-full max-w-[240px] sm:max-w-[288px] h-auto rounded-2xl shadow-lg"
              />
            </div>
          </div>

          <div className="mf-terms bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">⚠️ {t.termsTitle}</h2>
            <ul className="mf-terms-list list-disc ml-5 sm:ml-6 space-y-2 sm:space-y-3 text-base sm:text-lg leading-relaxed">
              <li>{t.term1}</li>
              <li>{t.term2}</li>
              <li>{t.term3}</li>
              <li>{t.term4}</li>
            </ul>
            <div className="mt-4">
              <label className="mf-check-row flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mf-checkbox mt-1 w-5 h-5 shrink-0"
                />
                <span className="text-base leading-relaxed">
                  {t.condition}
                  <RequiredHint text={t.requiredCheck} />
                </span>
              </label>
            </div>
          </div>

          <div className="mf-submit-wrap hidden sm:block text-center">
            <button
              type="submit"
              disabled={!canSubmit}
              className="mf-submit-btn w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 sm:hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 sm:px-12 py-4 min-h-[52px] rounded-2xl text-lg sm:text-xl font-bold shadow-lg"
            >
              {status === "loading" ? t.submitting : t.confirm}
            </button>
          </div>
        </form>

        <div className="mf-submit-bar sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            form="mf-booking-form"
            disabled={!canSubmit}
            className="mf-submit-btn w-full max-w-6xl mx-auto block bg-gradient-to-r from-emerald-500 to-green-600 transition disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 min-h-[52px] rounded-2xl text-lg font-bold shadow-lg"
          >
            {status === "loading" ? t.submitting : t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
