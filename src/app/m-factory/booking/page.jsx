"use client";

import { useState } from "react";

export default function Home() {

  const [language, setLanguage] = useState("th");

  const text = {
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

      warehouse1:
        "เลือกประเภท",

      warehouse2:
        "โกดังลาดหลุมแก้ว ปทุมธานี ขนาด 100 ตรม. ค่าเช่า เดือนละ 12,000 บาท",

      warehouse3:
        "โกดังลาดหลุมแก้ว ปทุมธานี ขนาด 120 ตรม. ค่าเช่า เดือนละ 15,000 บาท",

      warehouse4:
        "โกดังลาดหลุมแก้ว ปทุมธานี ขนาด 300 ตรม. ค่าเช่า เดือนละ 50,000 บาท",

      rent: "เช่า",
      buy: "ซื้อ",

      condition: "ยอมรับเงื่อนไขการจอง",

      confirm: "ยืนยันการจอง",

      term1: "ค่าจองโกดัง 5,000 บาท",

      term2:
        "การยืนยันการจองพร้อมหลักฐานการชำระเงิน ถือเป็นการทำสัญญาการจองอย่างครบถ้วน",

      term3:
        "บริษัทขอสงวนสิทธิ์ในการคืนเงินทุกกรณี",

      term4:
        "เอกสารที่ใช้ในการจองต้องถูกต้องครบถ้วน",
    },

    en: {
      title: "M Factory",
      subtitle: "Warehouse Factory for Sale & Rent",

      bookingInfo: "Booking Information",
      warehouseInfo: "Warehouse Information",
      payment: "Proof of Payment",
      visitProject:"Scan QR Code to Schedule a Project Visit",
      company: "Company Name",
      fullname: "Name - Lastname",
      phone: "Phone Number",
      email: "Email",
      taxId: "Tax ID",
      bookingDate: "Booking Date",
      address: "Address",

      warehouse: "Warehouse Type",
      rentalType: "Booking Type",

      warehouse1:
        "Select Types",
      warehouse2:
        "Ladlumkaew Warehouse, Pathum Thani, Size 100 Sq.m., Rent 12,000 Baht / Month",

      warehouse3:
        "Ladlumkaew Warehouse, Pathum Thani, Size 120 Sq.m., Rent 15,000 Baht / Month",

      warehouse4:
        "Ladlumkaew Warehouse, Pathum Thani, Size 300 Sq.m., Rent 50,000 Baht / Month",

      rent: "Rent",
      buy: "Buy",

      condition: "Accept Terms & Conditions",

      confirm: "Confirm Booking",

      term1: "Warehouse booking fee is 5,000 Baht",

      term2:
        "Booking confirmation together with payment slip is considered a complete booking agreement",

      term3:
        "The company reserves the right not to refund in all cases",

      term4:
        "All booking documents must be complete and valid",
    },
  };

  const t = text[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 p-8 text-black">

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-700 to-cyan-500 text-white p-8 flex justify-between items-center">

          <div>
            <h1 className="text-4xl font-bold">
              {t.title}
            </h1>

            <p className="mt-2 text-lg">
              {t.subtitle}
            </p>
          </div>

          {/* LANGUAGE */}
          <div className="flex gap-3">

            <button
              onClick={() => setLanguage("th")}
              className="bg-white text-blue-700 px-5 py-2 rounded-xl font-bold shadow"
            >
              TH
            </button>

            <button
              onClick={() => setLanguage("en")}
              className="bg-white text-blue-700 px-5 py-2 rounded-xl font-bold shadow"
            >
              EN
            </button>

          </div>

        </div>

        {/* BODY */}
        <div className="p-8 space-y-8">

          {/* SECTION 1 */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-6">
              {t.bookingInfo}
            </h2>

            <div className="grid grid-cols-2 gap-6">

              {/* Company Name */}
              <div>
                <label className="block mb-2 font-semibold">
                  {t.company}
                </label>

                <input
                  type="text"
                  className="w-full border-2 border-black rounded-xl p-3"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block mb-2 font-semibold">
                  {t.fullname}
                </label>

                <input
                  type="text"
                  className="w-full border-2 border-black rounded-xl p-3"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2 font-semibold">
                  {t.phone}
                </label>

                <input
                  type="text"
                  className="w-full border-2 border-black rounded-xl p-3"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2 font-semibold">
                  {t.email}
                </label>

                <input
                  type="email"
                  className="w-full border-2 border-black rounded-xl p-3"
                />
              </div>

              {/* Tax ID */}
              <div>
                <label className="block mb-2 font-semibold">
                  {t.taxId}
                </label>

                <input
                  type="text"
                  className="w-full border-2 border-black rounded-xl p-3"
                />
              </div>

              {/* Booking Date */}
              <div>
                <label className="block mb-2 font-semibold">
                  {t.bookingDate}
                </label>

                <input
                  type="date"
                  value={new Date().toISOString().split("T")[0]}
                  readOnly
                  className="w-full border-2 border-black rounded-xl p-3 bg-gray-100"
                />
              </div>

              {/* Address */}
              <div className="col-span-2">

                <label className="block mb-2 font-semibold">
                  {t.address}
                </label>

                <textarea
                  rows="4"
                  className="w-full border-2 border-black rounded-xl p-3"
                />

              </div>

            </div>

          </div>

          {/* SECTION 2 */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-6">
              {t.warehouseInfo}
            </h2>

            <div className="grid grid-cols-2 gap-6">

              {/* Warehouse Type */}
              <div>

                <label className="block mb-2 font-semibold">
                  {t.warehouse}
                </label>

                <select className="w-full border-2 border-black rounded-xl p-3">

                  <option>{t.warehouse1}</option>

                  <option>{t.warehouse2}</option>

                  <option>{t.warehouse3}</option>

                  <option>{t.warehouse4}</option>

                </select>

              </div>

              {/* Rental Type */}
              <div>

                <label className="block mb-2 font-semibold">
                  {t.rentalType}
                </label>

                <select className="w-full border-2 border-black rounded-xl p-3">

                  <option>
                    {language === "th"
                      ? "เลือกประเภท"
                      : "Select Type"}
                  </option>

                  <option>{t.rent}</option>

                  <option>{t.buy}</option>

                </select>                

              </div>

            </div>

          </div>

          {/* SECTION 3 */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">

              <h2 className="text-2xl font-bold mb-6">
              {t.payment}
              </h2>

              <label className="w-full border-2 border-black rounded-xl p-3 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">

                เลือกไฟล์

                <input
                  type="file"
                  className="hidden"
                />

              </label>

            </div>

          {/* SECTION 4 */}
          {/* PROJECT VISIT */}
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 text-center">

            <h2 className="text-2xl font-bold mb-4">
              นัดเยี่ยมชมโครงการโปรดสแกนคิวอาร์โค้ด
            </h2>

            <div className="flex justify-center">

              <img
                src="/m-factory/qr-line.jpg"
                alt="QR Code"
                className="w-72 rounded-2xl shadow-lg"
              />

            </div>

          </div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">

            <h2 className="text-xl font-bold mb-4">
              ⚠️ Terms & Conditions
            </h2>

            <ul className="list-disc ml-6 space-y-3 text-lg">

              <li>{t.term1}</li>

              <li>{t.term2}</li>

              <li>{t.term3}</li>

              <li>{t.term4}</li>

            </ul>

            <div className="mt-4">

              <label className="flex items-center gap-3">

                <input type="checkbox" />

                {t.condition}

              </label>

            </div>

          </div>

          {/* BUTTON */}
          <div className="text-center">

            <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105 transition text-white px-12 py-4 rounded-2xl text-xl font-bold shadow-lg">

              {t.confirm}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}