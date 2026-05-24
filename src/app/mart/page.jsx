import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MartClient from "./MartClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "สินค้า มาร์ท — GOEUN SERVER HUB" };

export default async function MartPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
    redirect("/login");
  }
  return <MartClient session={session} />;
}
