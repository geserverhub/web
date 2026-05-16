import { NextResponse } from "next/server";
import { sendInvoiceReminders } from "@/lib/invoiceReminders";

function isAuthorized(req) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const vercelCron = req.headers.get("x-vercel-cron") === "1";

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (vercelCron) return true;
  return false;
}

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "1";
  const today = new Date();

  if (!force && today.getDate() !== 1) {
    return NextResponse.json({ ok: true, skipped: true, message: "Not the 1st day of month" });
  }

  const result = await sendInvoiceReminders({ sendAll: true });
  return NextResponse.json({ ok: true, ...result, runAt: today.toISOString() });
}
