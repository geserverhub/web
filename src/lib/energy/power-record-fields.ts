/**
 * Canonical mapping for power_records telemetry.
 * - before_L1/L2/L3 = CH1 line/phase voltage (V)
 * - before_current_L1/L2/L3 = CH1 phase current (A)
 * - metrics_L1/L2/L3 = CH2 line/phase voltage (V)
 * - metrics_current_L1/L2/L3 = CH2 phase current (A)
 */

export const CH1_VOLTAGE_COLUMNS = ['before_L1', 'before_L2', 'before_L3'] as const;
export const CH1_CURRENT_COLUMNS = ['before_current_L1', 'before_current_L2', 'before_current_L3'] as const;
export const CH2_VOLTAGE_COLUMNS = ['metrics_L1', 'metrics_L2', 'metrics_L3'] as const;
export const CH2_CURRENT_COLUMNS = ['metrics_current_L1', 'metrics_current_L2', 'metrics_current_L3'] as const;

export type PowerRecordRow = Record<string, unknown>;

export function pickAvailableColumn(
  available: Set<string>,
  candidates: readonly string[],
): string | null {
  return candidates.find((c) => available.has(c)) ?? null;
}

export function pickCh1VoltageColumns(available: Set<string>): (string | null)[] {
  return CH1_VOLTAGE_COLUMNS.map((c) => (available.has(c) ? c : null));
}

export function pickCh1CurrentColumns(available: Set<string>): (string | null)[] {
  return CH1_CURRENT_COLUMNS.map((c) => (available.has(c) ? c : null));
}

export function pickCh2VoltageColumns(available: Set<string>): (string | null)[] {
  return CH2_VOLTAGE_COLUMNS.map((c) => (available.has(c) ? c : null));
}

export function pickCh2CurrentColumns(available: Set<string>): (string | null)[] {
  return CH2_CURRENT_COLUMNS.map((c) => (available.has(c) ? c : null));
}

export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/** Values above this on before_L* are treated as voltage (V), not current (A). */
export const VOLTAGE_READING_MIN = 50;

export function isLikelyVoltageReading(value: number | null): boolean {
  return value != null && value >= VOLTAGE_READING_MIN;
}

/**
 * Read CH1 phase current (A) from a DB row — never treat voltage columns as current.
 * Falls back to physics-based estimate only when P + voltage exist in the same row.
 */
export function readCh1PhaseCurrent(
  row: PowerRecordRow,
  phaseIndex: 0 | 1 | 2,
  currentCols: (string | null)[],
  voltageCols: (string | null)[],
): number | null {
  const curCol = currentCols[phaseIndex];
  if (curCol) {
    const direct = toFiniteNumber(row[curCol]);
    if (direct != null) return direct;
  }

  const voltCol = voltageCols[phaseIndex];
  const legacyCol = CH1_VOLTAGE_COLUMNS[phaseIndex];
  const legacyVal = voltCol ? toFiniteNumber(row[voltCol]) : toFiniteNumber(row[legacyCol]);
  if (legacyVal != null && !isLikelyVoltageReading(legacyVal)) {
    return legacyVal;
  }

  return null;
}

/** Derive balanced per-phase current from measured kW, voltage (V), and PF. */
export function deriveBalancedPhaseCurrent(
  activePowerKw: number | null,
  voltage: number | null,
  powerFactor: number | null,
): number | null {
  if (activePowerKw == null || voltage == null || activePowerKw <= 0 || voltage < VOLTAGE_READING_MIN) {
    return null;
  }
  const pf = powerFactor != null && powerFactor > 0 ? powerFactor : 1;
  const lineCurrent = (activePowerKw * 1000) / (Math.sqrt(3) * voltage * pf);
  return Number.isFinite(lineCurrent) && lineCurrent > 0 ? lineCurrent : null;
}

export function readCh1Currents(
  row: PowerRecordRow,
  currentCols: (string | null)[],
  voltageCols: (string | null)[],
): [number | null, number | null, number | null] {
  const phases: [number | null, number | null, number | null] = [null, null, null];
  for (let i = 0; i < 3; i += 1) {
    phases[i] = readCh1PhaseCurrent(row, i as 0 | 1 | 2, currentCols, voltageCols);
  }

  const hasAny = phases.some((v) => v != null);
  if (hasAny) return phases;

  const pKw = toFiniteNumber(row.before_P);
  const v1 = voltageCols[0] ? toFiniteNumber(row[voltageCols[0]!]) : toFiniteNumber(row.before_L1);
  const pf = toFiniteNumber(row.before_PF);
  const derived = deriveBalancedPhaseCurrent(pKw, v1, pf);
  if (derived != null) return [derived, derived, derived];

  return phases;
}

export function readCh2Currents(
  row: PowerRecordRow,
  currentCols: (string | null)[],
): [number | null, number | null, number | null] {
  return [
    currentCols[0] ? toFiniteNumber(row[currentCols[0]]) : null,
    currentCols[1] ? toFiniteNumber(row[currentCols[1]]) : null,
    currentCols[2] ? toFiniteNumber(row[currentCols[2]]) : null,
  ];
}

export function avgCurrent(vals: (number | null)[]): number | null {
  const n = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (!n.length) return null;
  return n.reduce((a, b) => a + b, 0) / n.length;
}
