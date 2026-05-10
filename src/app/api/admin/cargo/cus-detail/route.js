import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) {
  return s?.user?.role === "SUPER_ADMIN" || s?.user?.role === "ADMIN";
}

function parseData(body) {
  return {
    name: (body.name || "").trim(),
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    address: body.address?.trim() || null,
    nationality: body.nationality?.trim() || null,
    passportNo: body.passportNo?.trim() || null,
    passportExp: body.passportExp ? new Date(body.passportExp) : null,
    idCard: body.idCard?.trim() || null,
    customsNo: body.customsNo?.trim() || null,
    notes: body.notes?.trim() || null,
    customerId: body.customerId || null,
    cargoOrderId: body.cargoOrderId || null,
  };
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const records = await prisma.cargoCusDetail.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        cargoOrder: { select: { id: true, number: true, direction: true, status: true } },
      },
    });
    return NextResponse.json({ records });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const record = await prisma.cargoCusDetail.create({ data: parseData(body) });
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const record = await prisma.cargoCusDetail.update({ where: { id }, data: parseData(data) });
    return NextResponse.json({ record });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await prisma.cargoCusDetail.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
