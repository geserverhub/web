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
