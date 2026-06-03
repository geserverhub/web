import { Suspense } from "react";
import DownloadsClient from "./DownloadsClient";

export const metadata = {
  title: "ดาวน์โหลดซอฟต์แวร์ — GE SERVER HUB",
  description: "ดาวน์โหลดโปรแกรมและไฟล์ใช้งานหลังชำระเงินได้รับการยืนยัน",
};

export default function DownloadsPage() {
  return (
    <Suspense fallback={<main className="container py-5 text-center text-white">กำลังโหลด...</main>}>
      <DownloadsClient />
    </Suspense>
  );
}
