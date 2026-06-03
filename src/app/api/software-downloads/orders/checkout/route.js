import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStripeServer, mergeNotesJson, toStripeAmount } from "@/lib/stripe-server";
import { resolveCheckoutOrigin } from "@/lib/software-downloads";

export async function POST(req) {
  try {
    const stripe = getStripeServer();
    const body = await req.json();
    const orderCode = String(body.orderCode || "").trim().toUpperCase();
    const email = String(body.email || "").trim().toLowerCase();

    if (!orderCode || !email) {
      return NextResponse.json({ error: "ต้องระบุ orderCode และ email" }, { status: 400 });
    }

    const order = await prisma.softwareDownloadOrder.findUnique({ where: { orderCode } });
    if (!order || order.email.toLowerCase() !== email) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }
    if (order.status === "PAID") {
      return NextResponse.json({ error: "ชำระเงินแล้ว" }, { status: 400 });
    }

    const amount = Number(order.amount);
    if (amount <= 0) {
      return NextResponse.json({ error: "รายการนี้ไม่ต้องชำระเงิน" }, { status: 400 });
    }

    const origin = resolveCheckoutOrigin(req);
    const cur = String(order.currency || "THB").toLowerCase();
    const unitAmount = toStripeAmount(cur, amount);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/downloads?order=${encodeURIComponent(order.orderCode)}&email=${encodeURIComponent(email)}&paid=1`,
      cancel_url: `${origin}/downloads?order=${encodeURIComponent(order.orderCode)}&email=${encodeURIComponent(email)}&cancelled=1`,
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: cur,
            product_data: {
              name: order.productTitle,
              description: `Download order ${order.orderCode}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderType: "software-download",
        orderId: order.id,
        orderCode: order.orderCode,
      },
      payment_intent_data: {
        metadata: {
          orderType: "software-download",
          orderId: order.id,
          orderCode: order.orderCode,
        },
      },
    });

    await prisma.softwareDownloadOrder.update({
      where: { id: order.id },
      data: {
        notes: mergeNotesJson(order.notes, {
          paymentGateway: "STRIPE_CARD",
          stripeCheckoutSessionId: session.id,
          stripePaymentStatus: "pending",
        }),
      },
    });

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message || "สร้างการชำระเงินไม่สำเร็จ" }, { status: 500 });
  }
}
