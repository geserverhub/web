import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const CARGO_CLIENT_ID = "cmozi3vuj0000jhbm7hqvhdhe";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone?.trim()) return NextResponse.json({ error: "กรุณากรอกเบอร์โทรที่ลงทะเบียนไว้" }, { status: 400 });

    const normalised = phone.trim().replace(/[-\s]/g, "");
    const all = await prisma.customer.findMany({
      where: { clientId: CARGO_CLIENT_ID },
      select: { id: true, name: true, phone: true, email: true, address: true },
    });

    const match = all.find(c => c.phone && c.phone.replace(/[-\s]/g, "") === normalised);
    if (!match) return NextResponse.json({ error: "ไม่พบเบอร์นี้ในระบบ กรุณาลงทะเบียนก่อน" }, { status: 404 });

    return NextResponse.json({ user: { id: match.id, name: match.name, phone: match.phone, email: match.email, address: match.address } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
