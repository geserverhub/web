import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const CARGO_CLIENT_ID = "cmqyzvsqj0000jhsa11kicccu";

// GET /api/cargo/admin/shipments - Get all shipments
export async function GET(req) {
  try {
    const shipments = await prisma.cargoOrder.findMany({
      where: {
        // Filter by cargo client if needed
      },
      include: {
        cusDetails: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = shipments.map(s => ({
      id: s.id,
      trackingNo: s.number,
      number: s.number,
      senderName: s.senderName,
      senderPhone: s.senderPhone,
      receiverName: s.receiverName,
      receiverPhone: s.receiverPhone,
      receiverAddress: s.receiverAddress,
      direction: s.direction,
      cost: s.expense.toNumber ? s.expense.toNumber() : s.expense,
      revenue: s.income.toNumber ? s.income.toNumber() : s.income,
      currency: s.currency,
      notes: s.notes,
      itemDesc: s.itemDesc,
      passportNo: s.passportNo,
      customsNo: s.cusDetails?.[0]?.customsNo,
      status: s.status,
      warehouseReceived: s.status?.includes("รับ"),
      createdAt: s.createdAt,
      dateCreated: s.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

// POST /api/cargo/admin/shipments - Create new shipment
export async function POST(req) {
  try {
    const body = await req.json();
    
    // Generate unique tracking number if not provided
    let trackingNo = body.trackingNo;
    if (!trackingNo) {
      const count = await prisma.cargoOrder.count();
      const date = new Date().toISOString().slice(0, 8).replace(/-/g, "");
      trackingNo = `CGO${date}-${String(count + 1).padStart(5, "0")}`;
    }

    const shipment = await prisma.cargoOrder.create({
      data: {
        number: trackingNo,
        senderName: body.senderName || "",
        senderPhone: body.senderPhone || "",
        receiverName: body.receiverName || "",
        receiverPhone: body.receiverPhone || "",
        receiverAddress: body.receiverAddress || "",
        direction: body.direction || "TH_TO_KR",
        itemDesc: body.itemDesc || "",
        currency: body.currency || "THB",
        expense: body.cost ? parseFloat(body.cost) : 0,
        income: 0,
        notes: body.notes || "",
        status: "รับพัสดุแล้ว",
        passportNo: body.passportNo || "",
      },
      include: {
        cusDetails: true,
      },
    });

    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment.id,
        trackingNo: shipment.number,
        number: shipment.number,
      },
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
