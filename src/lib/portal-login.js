async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Read session via HTTP (does not depend on next-auth/react SessionProvider). */
export async function fetchAuthSession(timeoutMs = 5000) {
  try {
    const res = await fetchWithTimeout('/api/auth/session', { credentials: 'include' }, timeoutMs);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ? data : null;
  } catch {
    return null;
  }
}

/** Poll until session cookie is readable (short — never blocks UI for long). */
export async function waitForAuthSession(maxAttempts = 3, delayMs = 100) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const session = await fetchAuthSession(3000);
    if (session?.user?.role) return session;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}

/** Full navigation so middleware sees the new session cookie immediately. */
export function hardRedirect(path) {
  if (typeof window === 'undefined') return;
  window.location.assign(path);
}

const ERROR_MESSAGES = {
  th: {
    invalid: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    timeout: 'เซิร์ฟเวอร์ตอบช้า — ลองใหม่หรือ restart dev server',
    network: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจว่า npm run dev รันอยู่',
    server: 'ระบบขัดข้อง — ดู console ของเซิร์ฟเวอร์',
  },
  en: {
    invalid: 'Incorrect email or password',
    timeout: 'Server timeout — retry or restart dev server',
    network: 'Cannot reach server — is npm run dev running?',
    server: 'Server error — check server console',
  },
};

export function portalLoginErrorMessage(error, locale = 'th') {
  const msg = ERROR_MESSAGES[locale] || ERROR_MESSAGES.en;
  if (error === 'timeout') return msg.timeout;
  if (error === 'network_error') return msg.network;
  if (error === 'server_error') return msg.server;
  return msg.invalid;
}

/**
 * Portal login via server API (avoids Auth.js CSRF issues in the browser).
 */
export async function credentialsPortalLogin({ username, email, identifier, password, portal, callbackPath }) {
  void callbackPath;
  const loginIdentifier = String(identifier || username || email || '').trim();
  try {
    const res = await fetchWithTimeout('/api/portal-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: loginIdentifier,
        password: String(password || ''),
        portal: String(portal || ''),
      }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }

    if (res.ok && data?.ok) {
      return { ok: true };
    }

    return { ok: false, error: data?.error || (res.status >= 500 ? 'server_error' : 'invalid_credentials') };
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    return { ok: false, error: aborted ? 'timeout' : 'network_error' };
  }
}
