"use client";

import Link from "next/link";
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
    errorAccept: "กรุณายอมรับเงื่อนไขการจอง",
    errorName: "กรุณากรอกชื่อ - นามสกุล",
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
    errorAccept: "Please accept the terms",
    errorName: "Please enter your name",
  },
};

const today = () => new Date().toISOString().split("T")[0];

export default function BookingClient() {
  const [language, setLanguage] = useState("th");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("idle");
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
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!accepted) {
      alert(t.errorAccept);
      return;
    }
    if (!form.fullname.trim()) {
      alert(t.errorName);
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
          type: "factory",
          lang: language,
          source: "mfac-booking",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setStatus("success");
      alert(t.success);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 p-4 md:p-8 text-black">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-cyan-500 text-white p-6 md:p-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{t.title}</h1>
            <p className="mt-2 text-lg">{t.subtitle}</p>
            <Link
              href="/m-factory/site"
              className="inline-block mt-3 text-sm underline text-white/90 hover:text-white"
            >
              {t.siteLink} →
            </Link>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setLanguage("th")}
              className={`px-5 py-2 rounded-xl font-bold shadow ${language === "th" ? "bg-white text-blue-700" : "bg-blue-600/40 text-white"}`}
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-5 py-2 rounded-xl font-bold shadow ${language === "en" ? "bg-white text-blue-700" : "bg-blue-600/40 text-white"}`}
            >
              EN
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">{t.bookingInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold">{t.company}</label>
                <input
                  type="text"
                  className="w-full border-2 border-black rounded-xl p-3"
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">{t.fullname}</label>
                <input
                  type="text"
                  required
                  className="w-full border-2 border-black rounded-xl p-3"
                  value={form.fullname}
                  onChange={(e) => setField("fullname", e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">{t.phone}</label>
                <input
                  type="text"
                  className="w-full border-2 border-black rounded-xl p-3"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">{t.email}</label>
                <input
                  type="email"
                  className="w-full border-2 border-black rounded-xl p-3"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">{t.taxId}</label>
                <input
                  type="text"
                  className="w-full border-2 border-black rounded-xl p-3"
                  value={form.taxId}
                  onChange={(e) => setField("taxId", e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">{t.bookingDate}</label>
                <input
                  type="date"
                  readOnly
                  value={form.bookingDate}
                  className="w-full border-2 border-black rounded-xl p-3 bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 font-semibold">{t.address}</label>
                <textarea
                  rows={4}
                  className="w-full border-2 border-black rounded-xl p-3"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">{t.warehouseInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold">{t.warehouse}</label>
                <select
                  className="w-full border-2 border-black rounded-xl p-3"
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
                <label className="block mb-2 font-semibold">{t.rentalType}</label>
                <select
                  className="w-full border-2 border-black rounded-xl p-3"
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

          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">{t.payment}</h2>
            <label className="w-full border-2 border-black rounded-xl p-3 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">
              {form.paymentFileName || t.pickFile}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => void handlePaymentFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{t.visitProject}</h2>
            <div className="flex justify-center">
              <img
                src="/m-factory/qr-line.jpg"
                alt="LINE QR"
                width={288}
                height={288}
                className="w-72 max-w-full rounded-2xl shadow-lg"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">⚠️ {t.termsTitle}</h2>
            <ul className="list-disc ml-6 space-y-3 text-lg">
              <li>{t.term1}</li>
              <li>{t.term2}</li>
              <li>{t.term3}</li>
              <li>{t.term4}</li>
            </ul>
            <div className="mt-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                {t.condition}
              </label>
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105 transition disabled:opacity-60 text-white px-12 py-4 rounded-2xl text-xl font-bold shadow-lg"
            >
              {status === "loading" ? t.submitting : t.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
