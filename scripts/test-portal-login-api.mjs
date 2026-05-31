/** Test /api/portal-login (browser path) */
const base = process.env.BASE_URL || 'http://127.0.0.1:3005';

async function portalLogin(username, password, portal) {
  const res = await fetch(`${base}/api/portal-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password, portal }),
  });
  const data = await res.json().catch(() => ({}));
  const cookies = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]);
  return { ok: res.ok && data.ok, data, cookies, status: res.status };
}

const admin = await portalLogin('goeun', '23504000', 'admin');
console.log('admin portal-login:', admin);

if (admin.cookies.some((c) => c.includes('authjs.session-token'))) {
  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: admin.cookies.join('; ') },
  });
  const session = await sessionRes.json();
  console.log('session role:', session?.user?.role);
}

const bad = await portalLogin('goeun', 'wrong', 'admin');
console.log('bad login:', bad.status, bad.data);

process.exit(admin.ok ? 0 : 1);
