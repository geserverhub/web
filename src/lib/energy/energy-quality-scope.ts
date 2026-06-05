export type RecordScope = 'installed' | 'pre_install';

/** Pre-install analysis is the default — meters read CH1 (before install) only. */
export function normalizeRecordScope(scope?: string | null): RecordScope {
  const normalized = String(scope || '').trim().toLowerCase();
  if (normalized === 'installed') return 'installed';
  return 'pre_install';
}

/** True when analysis uses only CH1 (before-install) — no CH2 comparison. */
export function isCh1OnlyScope(scope?: string | null): boolean {
  return normalizeRecordScope(scope) !== 'installed';
}
