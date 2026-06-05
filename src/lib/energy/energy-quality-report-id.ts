const BANGKOK_TZ = 'Asia/Bangkok';

/** YYYYMMDD in Asia/Bangkok (matches GE-EQ-3-20260605). */
export function formatReportDateStamp(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const d = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}${m}${d}`;
}

function deviceNumericId(deviceId: string | number | null | undefined): string | null {
  const raw = String(deviceId ?? '').trim();
  const numeric = raw.replace(/\D/g, '');
  return numeric || null;
}

/** Base report number: GE-EQ-{deviceId}-{YYYYMMDD} */
export function buildEnergyQualityReportIdBase(
  deviceId: string | number | null | undefined,
  at: Date = new Date(),
): string | null {
  const numeric = deviceNumericId(deviceId);
  if (!numeric) return null;
  return `GE-EQ-${numeric}-${formatReportDateStamp(at)}`;
}

/** Sequence suffix e.g. 1 → 001 */
export function formatReportSequence(seq: number): string {
  return String(seq).padStart(3, '0');
}

/** Full ID with sequence: GE-EQ-3-20260605-001 */
export function buildEnergyQualityReportIdWithSeq(base: string, seq: number): string {
  return `${base}-${formatReportSequence(seq)}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Highest sequence used for this base (legacy bare base counts as 001). */
export function maxSequenceFromReportNumbers(numbers: string[], base: string): number {
  let max = 0;
  const re = new RegExp(`^${escapeRegExp(base)}-(\\d+)$`);
  for (const n of numbers) {
    if (n === base) {
      max = Math.max(max, 1);
      continue;
    }
    const m = n.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

/**
 * Next unique report number for a device/day.
 * First report: GE-EQ-3-20260605-001, then -002, -003, …
 */
export function nextReportNumberFromExisting(existing: string[], base: string): string {
  const maxSeq = maxSequenceFromReportNumbers(existing, base);
  return buildEnergyQualityReportIdWithSeq(base, maxSeq + 1);
}

/** Default report ID preview (without DB): GE-EQ-{deviceId}-{YYYYMMDD}-001 */
export function buildEnergyQualityReportId(
  deviceId: string | number | null | undefined,
  at: Date = new Date(),
): string {
  const base = buildEnergyQualityReportIdBase(deviceId, at);
  if (!base) return '—';
  return buildEnergyQualityReportIdWithSeq(base, 1);
}
