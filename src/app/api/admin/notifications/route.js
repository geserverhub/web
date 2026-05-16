import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendInvoiceReminders } from "@/lib/invoiceReminders";

function isSuperAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN";
}

// GET — list recent payment reminder notifications
export async function GET() {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const notifications = await prisma.notification.findMany({
      where: { type: "INVOICE" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ notifications, lineReady: !!process.env.LINE_CHANNEL_ACCESS_TOKEN });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — send payment reminders (PUSH in-system + LINE if configured)
export async function POST(req) {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { invoiceIds, sendAll } = await req.json();
    if (!sendAll && (!Array.isArray(invoiceIds) || invoiceIds.length === 0)) {
      return NextResponse.json({ error: "ระบุ invoiceIds หรือ sendAll=true" }, { status: 400 });
    }

    const result = await sendInvoiceReminders({ invoiceIds, sendAll: !!sendAll });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/admin/notifications]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
