import { Suspense } from "react";
import PhoneRemoteViewClient from "./PhoneRemoteViewClient";

export default function PhoneRemoteViewPage() {
  return (
    <Suspense fallback={<main className="container py-4">กำลังโหลด...</main>}>
      <PhoneRemoteViewClient />
    </Suspense>
  );
}
