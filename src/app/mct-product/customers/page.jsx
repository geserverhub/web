import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "บัญชีลูกค้า — MCT Product" };

export default async function MctCustomersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!["ADMIN", "SUPER_ADMIN", "CLIENT"].includes(session?.user?.role)) {
    redirect("/mct-product");
  }

  return <CustomersClient session={session} />;
}
