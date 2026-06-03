import { Suspense } from "react";
import WebTargetClient from "./WebTargetClient";

export const metadata = {
  title: "Phone Remote — แท็บควบคุมเว็บ",
  robots: "noindex",
};

export default function PhoneRemoteWebTargetPage() {
  return (
    <Suspense fallback={<main className="container py-4">กำลังโหลด...</main>}>
      <WebTargetClient />
    </Suspense>
  );
}
