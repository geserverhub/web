import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStripeServer, mergeNotesJson, parseJsonSafe } from "@/lib/stripe-server";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

function toStripeAmount(currency, amount) {
  const cur = String(currency || "usd").toLowerCase();
  const value = Number(amount || 0);
  if (ZERO_DECIMAL_CURRENCIES.has(cur)) {
    return Math.max(1, Math.round(value));
  }
  return Math.max(1, Math.round(value * 100));
}

function toLineItems(tx, noteObj) {
  const cur = String(tx.currency || "THB").toLowerCase();
  const items = Array.isArray(noteObj?.items) ? noteObj.items : [];
  if (items.length > 0) {
    return items.map((i) => ({
      price_data: {
        currency: cur,
        product_data: {
          name: i.name || "Product",
          description: i.model ? `Model: ${i.model}` : undefined,
        },
        unit_amount: toStripeAmount(cur, i.unitPrice || 0),
      },
      quantity: Math.max(1, Number(i.qty || 1)),
    }));
  }

  return [{
    price_data: {
      currency: cur,
      product_data: {
        name: tx.description || `Order ${tx.number}`,
      },
      unit_amount: toStripeAmount(cur, tx.amount || 0),
    },
    quantity: 1,
  }];
}

function resolveOrigin(req) {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req) {
  try {
    const stripe = getStripeServer();
    const body = await req.json();
    const transactionId = String(body.transactionId || "").trim();
    const paymentType = String(body.paymentType || "CARD").toUpperCase();

    if (!transactionId) {
      return NextResponse.json({ error: "ไม่พบ transactionId" }, { status: 400 });
    }

    const tx = await prisma.partnerTransaction.findUnique({ where: { id: transactionId } });
    if (!tx) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    const noteObj = parseJsonSafe(tx.notes) || {};
    const origin = resolveOrigin(req);

    if (paymentType === "PROMPTPAY") {
      if ((tx.currency || "").toUpperCase() !== "THB") {
        return NextResponse.json({
          error: "PromptPay รองรับเฉพาะคำสั่งซื้อสกุล THB เท่านั้น",
        }, { status: 400 });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.max(1, Math.round(Number(tx.amount || 0) * 100)),
        currency: "thb",
        payment_method_types: ["promptpay"],
        metadata: {
          transactionId: tx.id,
          orderNumber: tx.number,
        },
        confirm: true,
        return_url: `${origin}/momoge-product?order=${encodeURIComponent(tx.number)}`,
      });

      await prisma.partnerTransaction.update({
        where: { id: tx.id },
        data: {
          notes: mergeNotesJson(tx.notes, {
            ...noteObj,
            paymentGateway: "STRIPE_PROMPTPAY",
            stripePaymentIntentId: paymentIntent.id,
            stripePaymentStatus: paymentIntent.status,
            stripeUpdatedAt: new Date().toISOString(),
          }),
        },
      });

      const promptpay = paymentIntent.next_action?.promptpay_display_qr_code;
      return NextResponse.json({
        ok: true,
        mode: "PROMPTPAY",
        paymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status,
        hostedInstructionsUrl: promptpay?.hosted_instructions_url || null,
        qrData: promptpay?.data || null,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/momoge-product?order=${encodeURIComponent(tx.number)}&paid=1`,
      cancel_url: `${origin}/momoge-product?order=${encodeURIComponent(tx.number)}&cancelled=1`,
      line_items: toLineItems(tx, noteObj),
      customer_email: noteObj.customerEmail || undefined,
      metadata: {
        transactionId: tx.id,
        orderNumber: tx.number,
      },
      payment_intent_data: {
        metadata: {
          transactionId: tx.id,
          orderNumber: tx.number,
        },
      },
    });

    await prisma.partnerTransaction.update({
      where: { id: tx.id },
      data: {
        notes: mergeNotesJson(tx.notes, {
          ...noteObj,
          paymentGateway: "STRIPE_CARD",
          stripeCheckoutSessionId: session.id,
          stripePaymentStatus: "pending",
          stripeUpdatedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ ok: true, mode: "CARD", checkoutUrl: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message || "สร้างการชำระเงินไม่สำเร็จ" }, { status: 500 });
  }
}
