import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function getScope(session) {
  const role = session?.user?.role;
  const clientId = session?.user?.clientId || null;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isClient = role === "CLIENT";
  return { isAdmin, isClient, clientId };
}

export async function GET() {
  const session = await auth();
  const { isAdmin, isClient, clientId } = getScope(session);
  if (!isAdmin && !isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({
      where: isClient ? { id: clientId || "" } : undefined,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to fetch clients" }, { status: 500 });
  }
}
