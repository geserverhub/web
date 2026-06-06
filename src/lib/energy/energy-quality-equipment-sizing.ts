/** Standard main-breaker ampere ratings (IEC/common panel sizes). */
const STANDARD_BREAKER_AMPS = [
  16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
] as const;

/**
 * Size main breaker from measured peak current with 25% headroom, rounded up to a standard rating.
 */
export function estimateBreakerSizeAmps(peakA: number | null | undefined): number | null {
  if (peakA == null || !Number.isFinite(peakA) || peakA <= 0) return null;
  const required = peakA * 1.25;
  const match = STANDARD_BREAKER_AMPS.find((a) => a >= required);
  if (match != null) return match;
  return Math.ceil(required / 50) * 50;
}

export function formatBreakerSize(peakA: number | null | undefined): string | null {
  const amps = estimateBreakerSizeAmps(peakA);
  return amps != null ? `${amps} A` : null;
}

/** GE Energy Saver kVA recommendation from peak kW or peak line current. */
export function recommendGeEnergySaverKva(
  peakKw: number | null | undefined,
  peakA: number | null | undefined,
): string | null {
  const base = peakKw ?? (peakA != null && Number.isFinite(peakA) ? peakA * 0.22 : null);
  if (base == null || !Number.isFinite(base) || base <= 0) return null;
  const kva = Math.ceil((base * 1.2) / 5) * 5;
  return `${Math.max(50, kva)} kVA`;
}

/** Energy Saver catalog entry: kVA capacity → ex-VAT price (THB). */
export type EnergySaverProduct = { kva: number; priceThb: number };

/** Numeric kVA from a recommendation string like "50 kVA". */
export function parseKvaValue(recommended: string | null | undefined): number | null {
  if (!recommended) return null;
  const m = String(recommended).match(/([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pick the ex-VAT THB price for the recommended kVA: smallest product whose
 * capacity covers the requirement, else the largest available product.
 */
export function priceForRecommendedKva(
  recommendedKva: string | null | undefined,
  products: EnergySaverProduct[] | null | undefined,
): number | null {
  const kva = parseKvaValue(recommendedKva);
  if (kva == null || !products || !products.length) return null;
  const sorted = [...products].filter((p) => p.priceThb > 0).sort((a, b) => a.kva - b.kva);
  if (!sorted.length) return null;
  const match = sorted.find((p) => p.kva >= kva) ?? sorted[sorted.length - 1];
  return match.priceThb;
}
