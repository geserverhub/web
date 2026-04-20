import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MctProductClient from "./MctProductClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "จัดการสินค้า — MCT Product" };

export default async function MctProductPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userWithClient = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { client: { select: { name: true } } },
  });
  const companyName = userWithClient?.client?.name || "GOEUN SERVER HUB";

  return <MctProductClient session={session} companyName={companyName} />;
}
