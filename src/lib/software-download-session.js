/** Client-side session after /downloads/login (paid order verified). */

export const SOFTWARE_DOWNLOAD_SESSION_KEY = "software_download_order_session";

export function buildDownloadsLoginUrl({ order, email, returnTo } = {}) {
  const params = new URLSearchParams();
  if (order) params.set("order", String(order).trim().toUpperCase());
  if (email) params.set("email", String(email).trim().toLowerCase());
  if (returnTo) params.set("returnTo", returnTo);
  const q = params.toString();
  return q ? `/downloads/login?${q}` : "/downloads/login";
}

export function saveSoftwareDownloadSession(session) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SOFTWARE_DOWNLOAD_SESSION_KEY,
      JSON.stringify({
        ...session,
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    /* ignore */
  }
}

export function getSoftwareDownloadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SOFTWARE_DOWNLOAD_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSoftwareDownloadSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SOFTWARE_DOWNLOAD_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSoftwareDownloadAccess(productSlug) {
  const session = getSoftwareDownloadSession();
  return Boolean(session && session.productSlug === productSlug);
}
