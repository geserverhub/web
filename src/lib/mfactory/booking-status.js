/** M-Factory booking workflow statuses (stored in MFactoryInquiry.status). */
export const MFACTORY_STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'ยื่นขอจอง', color: '#fbbf24' },
  { value: 'CONFIRMED', label: 'ยืนยันการจองแล้ว', color: '#4ade80' },
  { value: 'AWAITING_CALLBACK', label: 'รอติดต่อกลับ', color: '#38bdf8' },
  { value: 'VISIT_SCHEDULED', label: 'นัดเข้าชม', color: '#a78bfa' },
  { value: 'OCCUPIED', label: 'เข้าอยู่แล้ว', color: '#34d399' },
  { value: 'MOVED_OUT', label: 'ย้ายออกแล้ว', color: '#94a3b8' },
  { value: 'SOLD', label: 'ขายแล้ว', color: '#f472b6' },
];

export const MFACTORY_STATUS_VALUES = new Set(MFACTORY_STATUS_OPTIONS.map((o) => o.value));

/** Map legacy DB values to current workflow keys. */
export function normalizeMfactoryStatus(status) {
  if (!status || status === 'PENDING') return 'SUBMITTED';
  if (status === 'REVIEWED') return 'AWAITING_CALLBACK';
  if (MFACTORY_STATUS_VALUES.has(status)) return status;
  return 'SUBMITTED';
}

export function mfactoryStatusLabel(status) {
  const key = normalizeMfactoryStatus(status);
  return MFACTORY_STATUS_OPTIONS.find((o) => o.value === key)?.label || status || '—';
}

export function mfactoryStatusColor(status) {
  const key = normalizeMfactoryStatus(status);
  return MFACTORY_STATUS_OPTIONS.find((o) => o.value === key)?.color || '#8b8fa8';
}

export function isValidMfactoryStatus(status) {
  return MFACTORY_STATUS_VALUES.has(status);
}
