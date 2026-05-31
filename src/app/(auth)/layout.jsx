"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthLayout({ children }) {
  return <SessionProvider basePath="/api/auth">{children}</SessionProvider>;
}
