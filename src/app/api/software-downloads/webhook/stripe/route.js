import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStripeServer, mergeNotesJson } from "@/lib/stripe-server";

async function markPaid(orderId, patch = {}) {
  const order = await prisma.softwareDownloadOrder.findUnique({ where: { id: orderId } });
  if (!order || order.status === "PAID") return;
  await prisma.softwareDownloadOrder.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      notes: mergeNotesJson(order.notes, {
        stripePaymentStatus: "paid",
        paidAt: new Date().toISOString(),
        ...patch,
      }),
    },
  });
}

function orderIdFromMeta(meta) {
  if (!meta) return null;
  if (meta.orderType !== "software-download") return null;
  return meta.orderId || null;
}

export async function POST(req) {
  try {
    const stripe = getStripeServer();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SOFTWARE || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const payload = await req.text();
    const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = orderIdFromMeta(session?.metadata);
      if (orderId) {
        await markPaid(orderId, {
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
        });
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const orderId = orderIdFromMeta(pi?.metadata);
      if (orderId) {
        await markPaid(orderId, { stripePaymentIntentId: pi.id });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Webhook error" }, { status: 400 });
  }
}
