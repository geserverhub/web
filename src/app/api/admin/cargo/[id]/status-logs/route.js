import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
}

// GET /api/admin/cargo/[id]/status-logs
export async function GET(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const logs = await prisma.cargoStatusLog.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/cargo/[id]/status-logs — manual status log entry
export async function POST(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, note } = body;

    if (!status) return NextResponse.json({ error: "status is required" }, { status: 400 });

    const log = await prisma.cargoStatusLog.create({
      data: {
        orderId: id,
        status,
        note: note || null,
        createdBy: session.user?.name || session.user?.email || "admin",
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
