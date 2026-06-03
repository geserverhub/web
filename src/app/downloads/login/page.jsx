import { Suspense } from "react";
import DownloadsLoginClient from "./DownloadsLoginClient";

export const metadata = {
  title: "เข้าสู่ระบบแอป — GE SERVER HUB",
  description: "ล็อกอินเข้าแอปที่สั่งซื้อและชำระเงินแล้ว",
};

export default function DownloadsLoginPage() {
  return (
    <Suspense fallback={<main className="container py-5 text-center text-white">Loading…</main>}>
      <DownloadsLoginClient />
    </Suspense>
  );
}
