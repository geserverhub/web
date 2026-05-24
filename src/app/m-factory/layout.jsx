import { Kanit } from "next/font/google";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const BOOKING_CSS = "/m-factory/booking.css?v=3";

export default function MFactoryLayout({ children }) {
  return (
    <>
      <link rel="stylesheet" href={BOOKING_CSS} />
      <div className={`m-factory-layout ${kanit.className}`}>{children}</div>
    </>
  );
}
