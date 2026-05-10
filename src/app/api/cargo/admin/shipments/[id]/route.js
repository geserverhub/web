import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/cargo/admin/shipments/[id] - Update shipment
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const shipment = await prisma.cargoOrder.update({
      where: { id },
      data: {
        senderName: body.senderName !== undefined ? body.senderName : undefined,
        senderPhone: body.senderPhone !== undefined ? body.senderPhone : undefined,
        receiverName: body.receiverName !== undefined ? body.receiverName : undefined,
        receiverPhone: body.receiverPhone !== undefined ? body.receiverPhone : undefined,
        receiverAddress: body.receiverAddress !== undefined ? body.receiverAddress : undefined,
        direction: body.direction !== undefined ? body.direction : undefined,
        itemDesc: body.itemDesc !== undefined ? body.itemDesc : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        expense: body.cost !== undefined ? parseFloat(body.cost) : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        passportNo: body.passportNo !== undefined ? body.passportNo : undefined,
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
      },
    });
  } catch (error) {
    console.error("Error updating shipment:", error);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
}

// DELETE /api/cargo/admin/shipments/[id] - Delete shipment
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    await prisma.cargoOrder.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}
