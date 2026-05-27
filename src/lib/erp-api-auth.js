/** Lightweight ERP API auth from client localStorage user (internal ERP). */

export function erpApiHeaders() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('ge_energy_erp_user');
    if (!raw) return {};
    return { 'x-erp-user': raw };
  } catch {
    return {};
  }
}

export function canManageErpAccess(user) {
  const role = user?.role;
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
