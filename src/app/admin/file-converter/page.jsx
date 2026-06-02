import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FileConverterClient from "./FileConverterClient";

export const metadata = { title: "ระบบแปลงไฟล์มือถือ — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminFileConverterPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    redirect("/admin/login");
  }
  return <FileConverterClient />;
}
