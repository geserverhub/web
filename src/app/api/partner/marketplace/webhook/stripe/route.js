import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStripeServer, mergeNotesJson, parseJsonSafe } from "@/lib/stripe-server";

async function applyPaid(transactionId, patch = {}) {
  const tx = await prisma.partnerTransaction.findUnique({ where: { id: transactionId } });
  if (!tx) return;
  const noteObj = parseJsonSafe(tx.notes) || {};
  await prisma.partnerTransaction.update({
    where: { id: transactionId },
    data: {
      status: "COMPLETED",
      notes: mergeNotesJson(tx.notes, {
        ...noteObj,
        stripePaymentStatus: "paid",
        paidAt: new Date().toISOString(),
        ...patch,
      }),
    },
  });
}

async function applyFailed(transactionId, patch = {}) {
  const tx = await prisma.partnerTransaction.findUnique({ where: { id: transactionId } });
  if (!tx) return;
  const noteObj = parseJsonSafe(tx.notes) || {};
  await prisma.partnerTransaction.update({
    where: { id: transactionId },
    data: {
      status: "PENDING",
      notes: mergeNotesJson(tx.notes, {
        ...noteObj,
        stripePaymentStatus: "failed",
        failedAt: new Date().toISOString(),
        ...patch,
      }),
    },
  });
}

export async function POST(req) {
  try {
    const stripe = getStripeServer();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
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
      const txId = session?.metadata?.transactionId;
      if (txId) {
        await applyPaid(txId, {
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
        });
      }
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      const txId = session?.metadata?.transactionId;
      if (txId) {
        await applyFailed(txId, {
          stripeCheckoutSessionId: session.id,
        });
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const txId = pi?.metadata?.transactionId;
      if (txId) {
        await applyPaid(txId, {
          stripePaymentIntentId: pi.id,
        });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object;
      const txId = pi?.metadata?.transactionId;
      if (txId) {
        await applyFailed(txId, {
          stripePaymentIntentId: pi.id,
          stripeFailureMessage: pi?.last_payment_error?.message || null,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Webhook error" }, { status: 400 });
  }
}
