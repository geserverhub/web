"use client";

import { SessionProvider } from "next-auth/react";

export default function PartnerLayout({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
