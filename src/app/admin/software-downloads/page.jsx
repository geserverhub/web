import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SoftwareDownloadsAdminClient from "./SoftwareDownloadsAdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "ดาวน์โหลดซอฟต์แวร์ — Admin" };

export default async function AdminSoftwareDownloadsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || (role !== "SUPER_ADMIN" && role !== "ADMIN")) {
    redirect("/admin/login");
  }

  return <SoftwareDownloadsAdminClient session={session} />;
}
