import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientsUsersClient from "./ClientsUsersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "จัดการลูกค้า & Users — Admin" };

export default async function ClientsUsersPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || (role !== "SUPER_ADMIN" && role !== "ADMIN")) redirect("/admin/login");
  return <ClientsUsersClient session={session} />;
}
