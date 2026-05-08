import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const tasks = await prisma.partnerTask.findMany({
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { title, type, status, priority, dueDate, notes, brand } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "กรุณากรอกชื่องาน" }, { status: 400 });

    const task = await prisma.partnerTask.create({
      data: {
        title: title.trim(),
        type: type || "OPERATION",
        status: status || "PENDING",
        priority: priority || "NORMAL",
        brand: brand || "MOMOGE SPACE",
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
