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

/** Auto report number: GE-EQ-{deviceId}-{YYYYMMDD} */
export function buildEnergyQualityReportId(
  deviceId: string | number | null | undefined,
  at: Date = new Date(),
): string {
  const raw = String(deviceId ?? '').trim();
  const numeric = raw.replace(/\D/g, '');
  if (!numeric) return '—';
  return `GE-EQ-${numeric}-${formatReportDateStamp(at)}`;
}
