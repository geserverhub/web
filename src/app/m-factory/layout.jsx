import { Kanit } from "next/font/google";

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export default function MFactoryLayout({ children }) {
  return <div className={kanit.className}>{children}</div>;
}
