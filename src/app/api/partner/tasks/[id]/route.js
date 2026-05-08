import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, type, status, priority, dueDate, notes } = body;

    const data = {};
    if (title !== undefined)    data.title    = title.trim();
    if (type !== undefined)     data.type     = type;
    if (status !== undefined)   data.status   = status;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined)  data.dueDate  = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined)    data.notes    = notes || null;
    if (status === "COMPLETED") data.completedAt = new Date();
    if (status !== undefined && status !== "COMPLETED") data.completedAt = null;

    const task = await prisma.partnerTask.update({ where: { id }, data });
    return NextResponse.json(task);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.partnerTask.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
