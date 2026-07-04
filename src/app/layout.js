import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { CHUNK_RECOVERY_INLINE_SCRIPT } from "@/lib/chunk-recovery";
import AppRefreshNotice from "@/components/AppRefreshNotice";

export const metadata = {
  title: "GE SERVER HUB",
  description: "Professional client access portal built with Next.js, React, Bootstrap, and a Python/MySQL backend.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Itim&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY_INLINE_SCRIPT }} />
        <AppRefreshNotice />
        {children}
      </body>
    </html>
  );
}
