import { NextResponse } from "next/server";

export function middleware(req) {
  const response = NextResponse.next({
    request: {
      headers: (() => {
        const headers = new Headers(req.headers);
        headers.set("x-forwarded-proto", "http");
        headers.set("x-forwarded-host", "localhost:3005");
        return headers;
      })(),
    },
  });

  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css)$).*)",
  ],
};
