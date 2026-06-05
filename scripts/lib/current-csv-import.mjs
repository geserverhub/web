/**
 * Parse phase current CSV exports (Timestamp + Current 1/2/3 columns).
 */

export function parseTimestamp(raw) {
  const s = String(raw ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, yyyy, mm, dd, hh, min, sec = '00'] = m;
    return `${yyyy}-${mm}-${dd} ${hh.padStart(2, '0')}:${min}:${sec.padStart(2, '0')}`;
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, dd, mm, yyyy, hh, min, sec = '00'] = m;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')} ${hh.padStart(2, '0')}:${min}:${sec.padStart(2, '0')}`;
  }
  return null;
}

function parseCsvLine(line) {
  const parts = line.split(',').map((p) => p.trim());
  if (parts.length < 2) return null;
  const ts = parseTimestamp(parts[0]);
  if (!ts) return null;
  const nums = parts.slice(1).map((p) => parseFloat(p)).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return { ts, values: nums };
}

/**
 * @param {string} text
 * @param {'l1'|'l2'|'l3'} phase
 */
export function parseCurrentCsv(text, phase) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /^timestamp/i.test(trimmed)) continue;
    const row = parseCsvLine(trimmed);
    if (!row) continue;
    const val = phase === 'l1' ? row.values[0] : phase === 'l2' ? row.values[0] : row.values[row.values.length - 1];
    if (val == null || !Number.isFinite(val)) continue;
    out.set(row.ts, val);
  }
  return out;
}

/** Merge L1/L2/L3 maps into sorted power_records_preinstall rows. */
export function mergePhaseCurrentMaps(l1Map, l2Map, l3Map) {
  const keys = new Set([...l1Map.keys(), ...l2Map.keys(), ...l3Map.keys()]);
  const rows = [];
  for (const record_time of [...keys].sort()) {
    const i1 = l1Map.get(record_time) ?? null;
    const i2 = l2Map.get(record_time) ?? null;
    const i3 = l3Map.get(record_time) ?? null;
    if (i1 == null && i2 == null && i3 == null) continue;
    rows.push({
      record_time,
      before_current_L1: i1,
      before_current_L2: i2,
      before_current_L3: i3,
      before_L1: i1,
      before_L2: i2,
      before_L3: i3,
    });
  }
  return rows;
}
