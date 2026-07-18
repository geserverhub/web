import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Itim, Inter } from "next/font/google";
import { CHUNK_RECOVERY_INLINE_SCRIPT } from "@/lib/chunk-recovery";
import AppRefreshNotice from "@/components/AppRefreshNotice";

const itim = Itim({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-itim",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "GE SERVER HUB",
  description: "Professional client access portal built with Next.js, React, Bootstrap, and a Python/MySQL backend.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${itim.variable} ${inter.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY_INLINE_SCRIPT }} />
        <AppRefreshNotice />
        {children}
      </body>
    </html>
  );
}
