/**
 * Parse GE / EM4374 meter export rows:
 * Date Time | Meter | Parameter | Phase | Value
 *
 * Meter 1 → CH1 (before_*), Meter 2 → CH2 (metrics_*)
 */

import { deriveBalancedPhaseCurrent } from './power-record-fields';

export type MeterExportRow = {
  dateTime: string;
  meter: 1 | 2;
  parameter: string;
  phase: string;
  value: number;
};

export type MeterSnapshot = {
  recordTime: string;
  meter: 1 | 2;
  voltageLL: [number | null, number | null, number | null];
  voltageLN: [number | null, number | null, number | null];
  current: [number | null, number | null, number | null];
  voltageThd: [number | null, number | null, number | null];
  currentThd: [number | null, number | null, number | null];
  frequency: number | null;
  powerFactor: number | null;
  activePowerKw: number | null;
  energyKwh: number | null;
};

export type PowerRecordPartial = {
  record_time: string;
  before_L1?: number;
  before_L2?: number;
  before_L3?: number;
  before_current_L1?: number;
  before_current_L2?: number;
  before_current_L3?: number;
  before_PF?: number;
  before_F?: number;
  before_THD?: number;
  before_P?: number;
  before_kWh?: number;
  metrics_L1?: number;
  metrics_L2?: number;
  metrics_L3?: number;
  metrics_PF?: number;
  metrics_F?: number;
  metrics_THD?: number;
  metrics_P?: number;
  metrics_kWh?: number;
};

const LL_PHASE_INDEX: Record<string, number> = {
  'l1-l2': 0,
  'l2-l3': 1,
  'l3-l1': 2,
};

const LN_PHASE_INDEX: Record<string, number> = {
  l1: 0,
  l2: 1,
  l3: 2,
};

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parsePhaseIndex(phase: string, mode: 'll' | 'ln' | 'single'): number | null {
  const p = norm(phase).replace(/\s/g, '');
  if (mode === 'll') return LL_PHASE_INDEX[p] ?? null;
  if (mode === 'ln') return LN_PHASE_INDEX[p] ?? null;
  if (LN_PHASE_INDEX[p] != null) return LN_PHASE_INDEX[p];
  if (LL_PHASE_INDEX[p] != null) return LL_PHASE_INDEX[p];
  if (p === 'pf' || p === '-') return 0;
  return null;
}

function parseDateTime(raw: string): string | null {
  const s = raw.trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min, sec = '00'] = m;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')} ${hh.padStart(2, '0')}:${min}:${sec.padStart(2, '0')}`;
}

function parseMeter(raw: string): 1 | 2 | null {
  const n = parseInt(raw.trim(), 10);
  if (n === 1 || n === 2) return n;
  return null;
}

function parseValue(raw: string): number | null {
  const n = parseFloat(String(raw).trim().replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Split export text into data lines (skip headers / unit rows). */
export function splitExportLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^date\s*time/i.test(l) && !/^unit\s/i.test(l) && l !== '%' && l !== 'Hz' && l !== 'V');
}

export function parseExportLine(line: string): MeterExportRow | null {
  const ws = line.trim().split(/\s+/);
  if (ws.length < 5) return null;

  const dateTime = parseDateTime(`${ws[0]} ${ws[1]}`);
  const meter = parseMeter(ws[2]);
  if (!dateTime || !meter) return null;

  const value = parseValue(ws[ws.length - 1]);
  if (value == null) return null;

  const phase = ws[ws.length - 2];
  const parameter = ws.slice(3, ws.length - 2).join(' ');

  return { dateTime, meter, parameter, phase, value };
}

function emptySnapshot(recordTime: string, meter: 1 | 2): MeterSnapshot {
  return {
    recordTime,
    meter,
    voltageLL: [null, null, null],
    voltageLN: [null, null, null],
    current: [null, null, null],
    voltageThd: [null, null, null],
    currentThd: [null, null, null],
    frequency: null,
    powerFactor: null,
    activePowerKw: null,
    energyKwh: null,
  };
}

function avgNonNull(vals: (number | null)[]): number | null {
  const n = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (!n.length) return null;
  return n.reduce((a, b) => a + b, 0) / n.length;
}

function isValidVoltageLL(v: number): boolean {
  return v >= 200 && v <= 520;
}

function isValidVoltageLN(v: number): boolean {
  return v >= 100 && v <= 320;
}

function isValidThd(v: number): boolean {
  return v >= 0 && v <= 100;
}

function isValidCurrent(v: number): boolean {
  return v >= 0 && v <= 5000;
}

function isValidPf(v: number): boolean {
  return v > 0 && v <= 1.05;
}

function isValidFreq(v: number): boolean {
  return v >= 45 && v <= 65;
}

function isValidPowerKw(v: number): boolean {
  return v >= 0 && v <= 50000;
}

export function applyExportRow(snapshot: MeterSnapshot, row: MeterExportRow): void {
  const param = norm(row.parameter);
  const v = row.value;

  if (/^frequency/.test(param) || param === 'freq') {
    if (isValidFreq(v)) snapshot.frequency = v;
    return;
  }

  if (/power\s*factor|^pf$/.test(param) || (param.includes('power') && param.includes('factor'))) {
    if (isValidPf(v)) snapshot.powerFactor = v;
    return;
  }

  if (/active\s*power|^power$|real\s*power/.test(param) && !param.includes('factor')) {
    if (isValidPowerKw(v)) snapshot.activePowerKw = v;
    return;
  }

  if (/energy|kwh/.test(param)) {
    if (v >= 0) snapshot.energyKwh = v;
    return;
  }

  if (/voltage\s*\(l-l\)|voltage\s*ll/.test(param)) {
    const i = parsePhaseIndex(row.phase, 'll');
    if (i != null && isValidVoltageLL(v)) snapshot.voltageLL[i] = v;
    return;
  }

  if (/voltage\s*\(l-n\)|voltage\s*ln/.test(param)) {
    const i = parsePhaseIndex(row.phase, 'ln');
    if (i != null && isValidVoltageLN(v)) snapshot.voltageLN[i] = v;
    return;
  }

  if (/voltage\s*thd|thdv/.test(param)) {
    const i = parsePhaseIndex(row.phase, 'single');
    if (i != null && isValidThd(v)) snapshot.voltageThd[i] = v;
    return;
  }

  if (/current\s*thd|thdi|^thd$/.test(param)) {
    const i = parsePhaseIndex(row.phase, 'single');
    if (i != null && isValidThd(v)) snapshot.currentThd[i] = v;
    return;
  }

  if (/^current|current\s*l/.test(param) || (param.includes('current') && !param.includes('thd'))) {
    const i = parsePhaseIndex(row.phase, 'single');
    if (i != null && isValidCurrent(v)) snapshot.current[i] = v;
    return;
  }
}

export function parseMeterExportText(text: string): MeterExportRow[] {
  const rows: MeterExportRow[] = [];
  for (const line of splitExportLines(text)) {
    const row = parseExportLine(line);
    if (row) rows.push(row);
  }
  return rows;
}

export function groupSnapshots(rows: MeterExportRow[]): Map<string, MeterSnapshot> {
  const map = new Map<string, MeterSnapshot>();
  for (const row of rows) {
    const key = `${row.dateTime}|${row.meter}`;
    let snap = map.get(key);
    if (!snap) {
      snap = emptySnapshot(row.dateTime, row.meter);
      map.set(key, snap);
    }
    applyExportRow(snap, row);
  }
  return map;
}

function fillDerivedCurrent(snap: MeterSnapshot): void {
  const hasCurrent = snap.current.some((c) => c != null);
  if (hasCurrent) return;
  const avgV = avgNonNull(snap.voltageLL);
  const derived = deriveBalancedPhaseCurrent(snap.activePowerKw, avgV, snap.powerFactor);
  if (derived == null) return;
  snap.current = [derived, derived, derived];
}

export function snapshotToPartial(snap: MeterSnapshot, opts?: { deriveCurrent?: boolean }): PowerRecordPartial {
  if (opts?.deriveCurrent !== false) fillDerivedCurrent(snap);

  const thd = avgNonNull(snap.currentThd) ?? avgNonNull(snap.voltageThd);
  const partial: PowerRecordPartial = { record_time: snap.recordTime };

  if (snap.meter === 1) {
    if (snap.voltageLL[0] != null) partial.before_L1 = snap.voltageLL[0];
    if (snap.voltageLL[1] != null) partial.before_L2 = snap.voltageLL[1];
    if (snap.voltageLL[2] != null) partial.before_L3 = snap.voltageLL[2];
    if (snap.current[0] != null) partial.before_current_L1 = snap.current[0];
    if (snap.current[1] != null) partial.before_current_L2 = snap.current[1];
    if (snap.current[2] != null) partial.before_current_L3 = snap.current[2];
    if (snap.powerFactor != null) partial.before_PF = snap.powerFactor;
    if (snap.frequency != null) partial.before_F = snap.frequency;
    if (thd != null) partial.before_THD = thd;
    if (snap.activePowerKw != null) partial.before_P = snap.activePowerKw;
    if (snap.energyKwh != null) partial.before_kWh = snap.energyKwh;
  } else {
    if (snap.current[0] != null) partial.metrics_L1 = snap.current[0];
    if (snap.current[1] != null) partial.metrics_L2 = snap.current[1];
    if (snap.current[2] != null) partial.metrics_L3 = snap.current[2];
    if (snap.powerFactor != null) partial.metrics_PF = snap.powerFactor;
    if (snap.frequency != null) partial.metrics_F = snap.frequency;
    if (thd != null) partial.metrics_THD = thd;
    if (snap.activePowerKw != null) partial.metrics_P = snap.activePowerKw;
    if (snap.energyKwh != null) partial.metrics_kWh = snap.energyKwh;
  }

  return partial;
}

export function mergeSnapshotsByTime(
  snapshots: Iterable<MeterSnapshot>,
): Map<string, PowerRecordPartial> {
  const byTime = new Map<string, PowerRecordPartial>();
  for (const snap of snapshots) {
    const partial = snapshotToPartial(snap);
    const existing = byTime.get(snap.recordTime) ?? { record_time: snap.recordTime };
    byTime.set(snap.recordTime, { ...existing, ...partial, record_time: snap.recordTime });
  }
  return byTime;
}

export function parseMeterExportToRecords(text: string): PowerRecordPartial[] {
  const rows = parseMeterExportText(text);
  const grouped = groupSnapshots(rows);
  const merged = mergeSnapshotsByTime(grouped.values());
  return [...merged.values()].sort((a, b) => a.record_time.localeCompare(b.record_time));
}

/** CH1 (meter 1) reference from field export @ 20/04/2026 17:40. */
export const METER1_REFERENCE = {
  voltageLL: [360.2, 359.1, 359.5] as const,
  voltageThd: [3.27, 2.97, 2.98] as const,
  frequency: 60.0,
  powerFactor: 0.896,
  activePowerKw: 48.5,
};

export function estimateMeter1PhaseCurrent(
  profile: typeof METER1_REFERENCE = METER1_REFERENCE,
): [number, number, number] {
  const avgV = avgNonNull([...profile.voltageLL]) ?? 360;
  const i = deriveBalancedPhaseCurrent(profile.activePowerKw, avgV, profile.powerFactor) ?? 86;
  return [round2(i * 1.02), round2(i), round2(i * 0.98)];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
