"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildDownloadsLoginUrl,
  getSoftwareDownloadSession,
} from "@/lib/software-download-session";

export default function SoftwareDownloadAccessGate({ productSlug, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSoftwareDownloadSession();
    if (session?.productSlug === productSlug) {
      setReady(true);
      return;
    }
    router.replace(
      buildDownloadsLoginUrl({
        order: session?.orderCode,
        email: session?.email,
        returnTo: pathname,
      })
    );
  }, [productSlug, pathname, router]);

  if (!ready) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: "#0f172a", color: "#e2e8f0" }}
      >
        <p className="mb-0 small">กำลังตรวจสอบสิทธิ์เข้าใช้…</p>
      </div>
    );
  }

  return children;
}
