/**
 * API base for ERP pages when opened via ngrok / external hub URL.
 * On localhost, uses same-origin paths.
 */
export function getErpHubBase() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return '';
  const base =
    process.env.NEXT_PUBLIC_PUBLIC_HUB_URL ||
    process.env.NEXT_PUBLIC_PORTAL_BASE_URL ||
    '';
  return String(base).replace(/\/$/, '');
}

export function erpHubApiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = getErpHubBase();
  return base ? `${base}${normalized}` : normalized;
}

export function erpHubFetchHeaders(extra = {}) {
  return {
    'ngrok-skip-browser-warning': 'true',
    ...extra,
  };
}
