"use client";

import { useEffect } from "react";

export default function MctProductError({ error, reset }) {
  useEffect(() => {
    console.error("[mct-product error boundary]", error);
  }, [error]);

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "#0f1117", color: "#e8eaf0" }}>
      <div className="text-center p-4 rounded-3" style={{ border: "1px solid #2a2d3a", background: "#16181f", maxWidth: 560 }}>
        <h2 className="h4 fw-bold mb-2">เกิดข้อผิดพลาดในหน้าจัดการสินค้า</h2>
        <p className="mb-3" style={{ color: "#9ca3af" }}>
          ระบบป้องกันการล้มทั้งเว็บไซต์ไว้แล้ว คุณสามารถลองโหลดใหม่ได้ทันที
        </p>
        <button className="btn btn-primary" onClick={() => reset()}>
          ลองใหม่
        </button>
      </div>
    </main>
  );
}
