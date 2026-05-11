import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/mfactory/inquiry
export async function POST(req) {
  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const phone = (body.phone || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const type = body.type || "factory"; // "factory" | "resort" | "sale"
    const lang = body.lang || "th";
    const source = body.source || null;

    if (!name) {
      return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });
    }

    const inquiry = await prisma.mFactoryInquiry.create({
      data: {
        type,
        name,
        phone: phone || null,
        email: email || null,
        message: message || null,
        lang,
        source,
      },
    });

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
