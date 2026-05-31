import { GE_ADMIN_TOKEN_KEY } from '@/lib/ge-storage-keys';

export function getCustomerAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GE_ADMIN_TOKEN_KEY)?.trim() || '';
}

/** Fetch with customer dashboard JWT (Authorization: Bearer). */
export function customerDashboardFetch(input, init = {}) {
  const token = getCustomerAuthToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers, credentials: init.credentials ?? 'same-origin' });
}
