import { Kanit } from "next/font/google";
import MFactoryViewport from "./MFactoryViewport";
import "./m-factory.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Pinch zoom in/out — do not set minimumScale (blocks zoom out on iOS). */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function MFactoryLayout({ children }) {
  return (
    <>
      <MFactoryViewport />
      <div className={`m-factory-layout ${kanit.className}`}>{children}</div>
    </>
  );
}
