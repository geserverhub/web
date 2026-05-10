import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cargo/shipments - Get shipments for public/user list
export async function GET(req) {
  try {
    const shipments = await prisma.cargoOrder.findMany({
      include: {
        cusDetails: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const formatted = shipments.map(s => ({
      id: s.id,
      trackingNo: s.number,
      number: s.number,
      senderName: s.senderName,
      senderPhone: s.senderPhone,
      senderAddress: s.cusDetails?.[0]?.address,
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
      dateCreated: s.createdAt,
      createdAt: s.createdAt,
      deliveredAt: s.deliveredAt,
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
