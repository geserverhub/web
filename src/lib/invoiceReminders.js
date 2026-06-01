import prisma from "@/lib/prisma";

function buildMonthLabel(now = new Date()) {
  return now.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

function buildInvoiceMessage(inv, monthLabel) {
  const statusTh = inv.status === "PENDING" ? "รอชำระ" : "⚠️ เกินกำหนด";
  const dueStr = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("th-TH") : "—";
  const clientName = inv.user?.name || inv.client?.name || "ลูกค้า";
  const amount = `${Number(inv.amount).toLocaleString("th-TH")} ${inv.currency || "THB"}`;

  return `📢 แจ้งเตือนค่าบริการ — ${monthLabel}\n\nเรียน ${clientName}\nรายการ: ${inv.number}\nสถานะ: ${statusTh}\nยอดชำระ: ${amount}\nกำหนดชำระ: ${dueStr}\n\nกรุณาชำระเงินตามกำหนด ขอบคุณครับ/ค่ะ\n— GE SERVER HUB`;
}

async function sendLineMessage(lineUserId, message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !lineUserId) {
    return { ok: false, reason: !token ? "no_token" : "no_line_id" };
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: data?.message || String(res.status) };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err?.message || "line_request_failed" };
  }
}

export async function sendInvoiceReminders({ invoiceIds, sendAll = false }) {
  let invoices;

  if (sendAll) {
    invoices = await prisma.invoice.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      include: {
        client: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (Array.isArray(invoiceIds) && invoiceIds.length > 0) {
    invoices = await prisma.invoice.findMany({
      where: { id: { in: invoiceIds }, status: { in: ["PENDING", "OVERDUE"] } },
      include: {
        client: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  } else {
    return {
      sent: 0,
      pushSent: 0,
      lineSent: 0,
      skipped: 0,
      lineErrors: [],
      lineReady: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      message: "ระบุ invoiceIds หรือ sendAll=true",
    };
  }

  if (invoices.length === 0) {
    return {
      sent: 0,
      pushSent: 0,
      lineSent: 0,
      skipped: 0,
      lineErrors: [],
      lineReady: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      message: "ไม่มีรายการที่ต้องแจ้งเตือน",
    };
  }

  const monthLabel = buildMonthLabel(new Date());
  let pushSent = 0;
  let lineSent = 0;
  let skipped = 0;
  const lineErrors = [];

  for (const inv of invoices) {
    const recipient = inv.user?.email || inv.client?.contactEmail || "admin";
    const body = buildInvoiceMessage(inv, monthLabel);
    const subject = `แจ้งเตือนค่าบริการรายเดือน — ${monthLabel} (${inv.number})`;

    const existingPush = await prisma.notification.findFirst({
      where: {
        type: "INVOICE",
        channel: "PUSH",
        recipient,
        subject,
      },
      select: { id: true },
    });

    if (existingPush) {
      skipped++;
    } else {
      await prisma.notification.create({
        data: {
          type: "INVOICE",
          channel: "PUSH",
          recipient,
          subject,
          body,
          sent: true,
          sentAt: new Date(),
        },
      });
      pushSent++;
    }

    const lineUserId = inv.client?.lineUserId;
    if (!lineUserId) continue;

    const existingLine = await prisma.notification.findFirst({
      where: {
        type: "INVOICE",
        channel: "LINE",
        recipient: lineUserId,
        subject,
      },
      select: { id: true },
    });

    if (existingLine) continue;

    const result = await sendLineMessage(lineUserId, body);
    if (result.ok) {
      lineSent++;
      await prisma.notification.create({
        data: {
          type: "INVOICE",
          channel: "LINE",
          recipient: lineUserId,
          subject,
          body,
          sent: true,
          sentAt: new Date(),
        },
      });
    } else {
      lineErrors.push({ inv: inv.number, reason: result.reason });
      await prisma.notification.create({
        data: {
          type: "INVOICE",
          channel: "LINE",
          recipient: lineUserId,
          subject,
          body,
          sent: false,
          error: String(result.reason || "line_send_failed"),
        },
      });
    }
  }

  return {
    sent: pushSent + lineSent,
    pushSent,
    lineSent,
    skipped,
    lineErrors,
    lineReady: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    message: `ส่งแจ้งเตือน PUSH ${pushSent} รายการ${lineSent > 0 ? ` และ LINE ${lineSent} รายการ` : ""}`,
  };
}
