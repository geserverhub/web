/**
 * Smoke-test every login entry point against role rules.
 * Usage: node scripts/test-all-logins.mjs
 */
const base = process.env.BASE_URL || 'http://127.0.0.1:3005';

const USERS = {
  admin: { username: 'goeun', password: '23504000', role: 'SUPER_ADMIN' },
  partner: { username: 'partner01', password: '898989', role: 'PARTNER' },
};

async function signOutCookies(cookies) {
  if (!cookies.length) return;
  const csrfRes = await fetch(`${base}/api/auth/csrf`, { headers: { Cookie: cookies.join('; ') } });
  const { csrfToken } = await csrfRes.json();
  const merged = [...cookies, ...(csrfRes.headers.getSetCookie?.() || []).map((c) => c.split(';')[0])];
  await fetch(`${base}/api/auth/signout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: merged.join('; ') },
    body: new URLSearchParams({ csrfToken, callbackUrl: base }).toString(),
  });
}

async function nextAuthLogin(username, password, portal) {
  let cookies = [];
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  cookies = (csrfRes.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]);

  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies.join('; '),
    },
    body: new URLSearchParams({
      csrfToken,
      email: username,
      password,
      portal,
      callbackUrl: base,
      json: 'true',
    }).toString(),
    redirect: 'manual',
  });

  cookies = [...cookies, ...(res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0])];
  let session = null;
  if (cookies.some((c) => c.includes('authjs.session-token'))) {
    const sessionRes = await fetch(`${base}/api/auth/session`, { headers: { Cookie: cookies.join('; ') } });
    session = await sessionRes.json().catch(() => null);
  }
  await signOutCookies(cookies);
  return Boolean(session?.user);
}

async function userLogin(username, password, pageName) {
  const res = await fetch(`${base}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, pageName }),
  });
  const data = await res.json().catch(() => ({}));
  return res.ok && Boolean(data.token);
}

const cases = [
  { label: 'Admin /admin/login', fn: () => nextAuthLogin(USERS.admin.username, USERS.admin.password, 'admin'), expect: true },
  { label: 'Admin blocked partner01', fn: () => nextAuthLogin(USERS.partner.username, USERS.partner.password, 'admin'), expect: false },
  { label: 'Partner /partner/login', fn: () => nextAuthLogin(USERS.partner.username, USERS.partner.password, 'partner'), expect: true },
  { label: 'Partner admin goeun', fn: () => nextAuthLogin(USERS.admin.username, USERS.admin.password, 'partner'), expect: true },
  { label: 'MCT /login client goeun', fn: () => nextAuthLogin(USERS.admin.username, USERS.admin.password, 'client'), expect: true },
  { label: 'MCT blocked partner01', fn: () => nextAuthLogin(USERS.partner.username, USERS.partner.password, 'client'), expect: false },
  { label: 'Customer dashboard', fn: () => userLogin(USERS.admin.username, USERS.admin.password, '/customer-dashboard'), expect: true },
  { label: 'Customer dashboard partner', fn: () => userLogin(USERS.partner.username, USERS.partner.password, '/customer-dashboard'), expect: true },
  { label: 'Energy dashboard', fn: () => userLogin(USERS.admin.username, USERS.admin.password, '/energy-dashboard'), expect: true },
  { label: 'Online classroom', fn: () => userLogin(USERS.admin.username, USERS.admin.password, '/online-classroom'), expect: true },
  { label: 'GE Energy ERP', fn: () => userLogin(USERS.admin.username, USERS.admin.password, '/ge-energy-erp'), expect: true },
  { label: 'GE Energy Tech login', fn: () => userLogin(USERS.admin.username, USERS.admin.password, '/ge-energy-tech/login'), expect: true },
  { label: 'Momoge product', fn: () => userLogin(USERS.admin.username, USERS.admin.password, '/momoge-product'), expect: true },
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  try {
    const ok = await c.fn();
    const pass = ok === c.expect;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${c.label} (got session/token: ${ok}, expected: ${c.expect})`);
    if (pass) passed += 1;
    else failed += 1;
  } catch (err) {
    console.log(`FAIL  ${c.label} (${err.message || err})`);
    failed += 1;
  }
}

console.log(`\n${passed}/${cases.length} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
