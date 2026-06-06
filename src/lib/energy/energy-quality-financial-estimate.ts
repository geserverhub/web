import { PAYBACK_EXCELLENT_MAX_MONTHS } from './energy-quality-payback';

export function avgLineVoltage(volts: (number | null | undefined)[]): number {
  const n = volts.filter((v): v is number => v != null && Number.isFinite(v) && v > 50);
  if (!n.length) return 400;
  return n.reduce((a, b) => a + b, 0) / n.length;
}

/** Estimate 3-phase active power (kW) from DB current / live channel. */
export function estimateActivePowerKw(input: {
  avgCurrentA: number | null;
  powerFactor: number | null;
  voltageLL?: number | null;
  activePowerKw?: number | null;
}): number | null {
  if (input.activePowerKw != null && input.activePowerKw > 0) return input.activePowerKw;
  if (input.avgCurrentA == null || input.avgCurrentA <= 0) return null;
  const v = input.voltageLL != null && input.voltageLL > 50 ? input.voltageLL : 400;
  const pf = input.powerFactor != null && input.powerFactor > 0 ? input.powerFactor : 0.9;
  const kw = (Math.sqrt(3) * v * input.avgCurrentA * pf) / 1000;
  return Number.isFinite(kw) && kw > 0 ? kw : null;
}

export function estimateMonthlyKwh(activePowerKw: number | null): number | null {
  if (activePowerKw == null || activePowerKw <= 0) return null;
  return activePowerKw * 24 * 30;
}

/**
 * Monthly savings from GE Energy Tech (PF, peak, imbalance, stored energy).
 * Conservative model: base 3% + PF correction + imbalance + peak-shaving.
 * With investment taken from the real product price (per recommended kVA),
 * a typical factory profile reaches payback ~11 months.
 */
export function estimatePotentialSaving(input: {
  monthlyCost: number;
  pf: number | null;
  curImb: number | null;
  peakRatio: number | null;
}): number {
  const { monthlyCost, pf, curImb, peakRatio } = input;
  let save = monthlyCost * 0.03;
  if (pf != null && pf < 0.95) {
    save += monthlyCost * (0.95 - pf) * 1.2;
  }
  if (curImb != null && curImb > 15) save += monthlyCost * 0.025;
  if (peakRatio != null && peakRatio > 1.3) save += monthlyCost * 0.035;
  return save;
}

export function meetsExcellentPayback(investment: number, monthlySaving: number): boolean {
  if (monthlySaving <= 0) return false;
  return investment / monthlySaving <= PAYBACK_EXCELLENT_MAX_MONTHS;
}
