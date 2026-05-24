import BookingClient from "./BookingClient";

export const metadata = {
  title: "M-Factory — จองโกดัง / Warehouse Booking",
  description: "จองโกดัง M-Factory ลาดหลุมแก้ว ปทุมธานี ขาย-ให้เช่าโกดังโรงงาน",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  userScalable: true,
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MFactoryPage() {
  return <BookingClient />;
}
