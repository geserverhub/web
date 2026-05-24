import { Kanit } from "next/font/google";
import "./m-factory.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Allow pinch-zoom on phones (accessibility). */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function MFactoryLayout({ children }) {
  return <div className={`m-factory-layout ${kanit.className}`}>{children}</div>;
}
