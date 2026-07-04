const FALLBACK_CTM_ADMIN_IDENTIFIERS = new Set(["crtm", "user", "ctm", "charoenthaimart", "admin"]);
const FALLBACK_CTM_ADMIN_PASSWORD = "9999";

export function isCtmAdminFallbackCredentials(identifier, password) {
  const normalizedIdentifier = String(identifier || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();

  return (
    FALLBACK_CTM_ADMIN_IDENTIFIERS.has(normalizedIdentifier) &&
    normalizedPassword === FALLBACK_CTM_ADMIN_PASSWORD
  );
}

export function getCtmAdminFallbackUser(identifier, password) {
  if (!isCtmAdminFallbackCredentials(identifier, password)) return null;

  return {
    id: "ctm-admin-fallback",
    email: "crtm@charoenthaimart.local",
    name: "crtm",
    role: "ADMIN",
    clientId: null,
  };
}
