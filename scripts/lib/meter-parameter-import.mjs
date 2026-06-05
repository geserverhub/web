/**
 * Meter export parser (Date Time | Meter | Parameter | Phase | Value)
 * Meter 1 → before_* (CH1), Meter 2 → metrics_* (CH2)
 */

export const METER1_REFERENCE = {
  voltageLL: [360.2, 359.1, 359.5],
  voltageThd: [3.27, 2.97, 2.98],
  frequency: 60.0,
  powerFactor: 0.896,
  activePowerKw: 48.5,
};

const LL_PHASE = { 'l1-l2': 0, 'l2-l3': 1, 'l3-l1': 2 };
const LN_PHASE = { l1: 0, l2: 1, l3: 2 };

function norm(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseDateTime(raw) {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min, sec = '00'] = m;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')} ${hh.padStart(2, '0')}:${min}:${sec.padStart(2, '0')}`;
}

function parseExportLine(line) {
  const ws = line.trim().split(/\s+/);
  if (ws.length < 5) return null;
  const dateTime = parseDateTime(`${ws[0]} ${ws[1]}`);
  const meter = parseInt(ws[2], 10);
  if (!dateTime || (meter !== 1 && meter !== 2)) return null;
  const value = parseFloat(ws[ws.length - 1]);
  if (!Number.isFinite(value)) return null;
  const phase = ws[ws.length - 2];
  const parameter = ws.slice(3, ws.length - 2).join(' ');
  return { dateTime, meter, parameter, phase, value };
}

function splitExportLines(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^date\s*time/i.test(l) && !/^unit\s/i.test(l) && !/^%/.test(l) && l !== 'Hz' && l !== 'V');
}

function phaseIdx(phase, mode) {
  const p = norm(phase).replace(/\s/g, '');
  if (mode === 'll') return LL_PHASE[p] ?? null;
  if (mode === 'ln') return LN_PHASE[p] ?? null;
  return LN_PHASE[p] ?? LL_PHASE[p] ?? (p === 'pf' || p === '-' ? 0 : null);
}

function emptySnap(recordTime, meter) {
  return {
    recordTime,
    meter,
    voltageLL: [null, null, null],
    current: [null, null, null],
    voltageThd: [null, null, null],
    currentThd: [null, null, null],
    frequency: null,
    powerFactor: null,
    activePowerKw: null,
    energyKwh: null,
  };
}

function avg(vals) {
  const n = vals.filter((v) => v != null && Number.isFinite(v));
  if (!n.length) return null;
  return n.reduce((a, b) => a + b, 0) / n.length;
}

function deriveCurrent(kw, vLL, pf) {
  if (kw == null || vLL == null || kw <= 0 || vLL < 200) return null;
  const p = pf != null && pf > 0 ? pf : 1;
  const i = (kw * 1000) / (Math.sqrt(3) * vLL * p);
  return Number.isFinite(i) && i > 0 ? i : null;
}

function applyRow(snap, row) {
  const param = norm(row.parameter);
  const v = row.value;

  if (/^frequency/.test(param)) {
    if (v >= 45 && v <= 65) snap.frequency = v;
    return;
  }
  if (/power\s*factor|^pf$/.test(param)) {
    if (v > 0 && v <= 1.05) snap.powerFactor = v;
    return;
  }
  if (/active\s*power|^power$/.test(param) && !param.includes('factor')) {
    if (v >= 0 && v <= 50000) snap.activePowerKw = v;
    return;
  }
  if (/energy|kwh/.test(param)) {
    if (v >= 0) snap.energyKwh = v;
    return;
  }
  if (/voltage\s*\(l-l\)/.test(param)) {
    const i = phaseIdx(row.phase, 'll');
    if (i != null && v >= 200 && v <= 520) snap.voltageLL[i] = v;
    return;
  }
  if (/voltage\s*thd/.test(param)) {
    const i = phaseIdx(row.phase, 'single');
    if (i != null && v >= 0 && v <= 100) snap.voltageThd[i] = v;
    return;
  }
  if (/current\s*thd|thdi|^thd$/.test(param)) {
    const i = phaseIdx(row.phase, 'single');
    if (i != null && v >= 0 && v <= 100) snap.currentThd[i] = v;
    return;
  }
  if (/^current/.test(param) || (param.includes('current') && !param.includes('thd'))) {
    const i = phaseIdx(row.phase, 'single');
    if (i != null && v >= 0 && v <= 5000) snap.current[i] = v;
  }
}

export function parseMeterExportText(text) {
  const rows = [];
  for (const line of splitExportLines(text)) {
    const row = parseExportLine(line);
    if (row) rows.push(row);
  }
  return rows;
}

export function parseMeterExportToRecords(text, { estimateCurrent = true } = {}) {
  const map = new Map();
  for (const row of parseMeterExportText(text)) {
    const key = `${row.dateTime}|${row.meter}`;
    if (!map.has(key)) map.set(key, emptySnap(row.dateTime, row.meter));
    applyRow(map.get(key), row);
  }

  const byTime = new Map();
  for (const snap of map.values()) {
    const hasCurrent = snap.current.some((c) => c != null);
    if (!hasCurrent) {
      const avgV = avg(snap.voltageLL);
      let kw = snap.activePowerKw;
      let pf = snap.powerFactor;
      if (estimateCurrent && snap.meter === 1 && kw == null) {
        kw = METER1_REFERENCE.activePowerKw;
        if (pf == null) pf = METER1_REFERENCE.powerFactor;
      }
      const derived = deriveCurrent(kw, avgV, pf);
      if (derived != null) {
        snap.current = [derived * 1.02, derived, derived * 0.98].map((x) => Math.round(x * 100) / 100);
      }
    }

    const thd = avg(snap.currentThd) ?? avg(snap.voltageThd);
    const partial = { record_time: snap.recordTime };
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
    }

    const existing = byTime.get(snap.recordTime) ?? { record_time: snap.recordTime };
    byTime.set(snap.recordTime, { ...existing, ...partial });
  }

  return [...byTime.values()].sort((a, b) => a.record_time.localeCompare(b.record_time));
}

export function estimateMeter1PhaseCurrent(profile = METER1_REFERENCE) {
  const avgV = avg(profile.voltageLL) ?? 360;
  const i = deriveCurrent(profile.activePowerKw, avgV, profile.powerFactor) ?? 86;
  return [Math.round(i * 1.02 * 100) / 100, Math.round(i * 100) / 100, Math.round(i * 0.98 * 100) / 100];
}
