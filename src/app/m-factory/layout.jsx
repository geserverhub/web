import { Kanit } from "next/font/google";
import "./m-factory.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function MFactoryLayout({ children }) {
  return <div className={`m-factory-layout ${kanit.className}`}>{children}</div>;
}
