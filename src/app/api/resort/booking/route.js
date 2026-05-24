import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function genBookingNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `RST-${yy}${mm}${dd}-${rand}`;
}

// POST /api/resort/booking
export async function POST(req) {
  try {
    const body = await req.json();
    const guestName = (body.guestName || "").trim();
    const guestPhone = (body.guestPhone || "").trim();
    const guestEmail = (body.guestEmail || "").trim();
    const checkIn = body.checkIn ? new Date(body.checkIn) : null;
    const checkOut = body.checkOut ? new Date(body.checkOut) : null;
    const stayType = body.stayType === "HOURLY" ? "HOURLY" : "OVERNIGHT";
    const adults = Number(body.adults) || 1;
    const children = Number(body.children) || 0;
    const totalPrice = body.totalPrice ? Number(body.totalPrice) : null;
    const note = (body.note || "").trim();

    if (!guestName || !checkIn) {
      return NextResponse.json({ error: "กรุณากรอกชื่อและวันที่เข้าพัก" }, { status: 400 });
    }

    let number = genBookingNumber();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.resortBooking.findUnique({ where: { number } });
      if (!exists) break;
      number = genBookingNumber();
      attempts++;
    }

    const pricePerNight = stayType === "OVERNIGHT" ? 800 : 300;

    const booking = await prisma.resortBooking.create({
      data: {
        number,
        guestName,
        guestPhone: guestPhone || null,
        guestEmail: guestEmail || null,
        checkIn,
        checkOut,
        stayType,
        adults,
        children,
        pricePerNight,
        totalPrice,
        note: note || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, number: booking.number, id: booking.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/resort/booking?phone=xxx or ?number=xxx
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const number = searchParams.get("number");

    if (!phone && !number) {
      return NextResponse.json({ error: "Provide phone or number" }, { status: 400 });
    }

    const where = number ? { number } : { guestPhone: phone };
    const bookings = await prisma.resortBooking.findMany({
      where,
      orderBy: { checkIn: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
