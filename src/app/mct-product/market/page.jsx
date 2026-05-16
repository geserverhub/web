import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MarketClient from "./MarketClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "มาร์ทซื้อ-ขายออนไลน์ — MCT Product" };

export default async function MctMarketPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
    redirect("/mct-product");
  }

  return <MarketClient session={session} />;
}
