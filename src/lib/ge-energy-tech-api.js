/**
 * API base for GE Energy Tech customer tools.
 * On the monorepo (localhost:3005) uses same-origin paths.
 * On geet (Vercel) uses NEXT_PUBLIC_PUBLIC_HUB_URL / ngrok → hub :3005.
 */
export function getGeEnergyTechHubBase() {
  const base =
    process.env.NEXT_PUBLIC_PUBLIC_HUB_URL ||
    process.env.NEXT_PUBLIC_PORTAL_BASE_URL ||
    '';
  return String(base).replace(/\/$/, '');
}

export function geEnergyTechApiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = getGeEnergyTechHubBase();
  if (base) return `${base}${normalized}`;
  return normalized;
}

/** Platform pages (register, login, admin) — defaults to ngrok hub when env unset */
export function portalHubHref(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base =
    getGeEnergyTechHubBase() || 'https://strong-dory-enabled.ngrok-free.app';
  return `${base.replace(/\/$/, '')}${normalized}`;
}

/** Alias for geet standalone (sync renames calls to portalHref) */
export const portalHref = portalHubHref;
