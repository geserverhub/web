import Stripe from "stripe";

let stripeClient = null;

export function getStripeServer() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function parseJsonSafe(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function mergeNotesJson(prevRaw, patch) {
  const prev = parseJsonSafe(prevRaw) || {};
  return JSON.stringify({ ...prev, ...patch });
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

/** Stripe Checkout unit_amount (KRW/JPY = whole won/yen, THB/USD = smallest currency unit). */
export function toStripeAmount(currency, amount) {
  const cur = String(currency || "usd").toLowerCase();
  const value = Number(amount || 0);
  if (ZERO_DECIMAL_CURRENCIES.has(cur)) {
    return Math.max(1, Math.round(value));
  }
  return Math.max(1, Math.round(value * 100));
}
