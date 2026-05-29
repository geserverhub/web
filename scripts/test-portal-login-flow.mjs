/**
 * Test login + protected page access (middleware must see role).
 */
const base = process.env.BASE_URL || 'http://127.0.0.1:3005';

async function loginAndVisit(username, password, portal, targetPath) {
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

  const sessionRes = await fetch(`${base}/api/auth/session`, { headers: { Cookie: cookies.join('; ') } });
  const session = await sessionRes.json();

  const pageRes = await fetch(`${base}${targetPath}`, {
    headers: { Cookie: cookies.join('; '), Accept: 'text/html' },
    redirect: 'manual',
  });

  return {
    portal,
    sessionRole: session?.user?.role ?? null,
    pageStatus: pageRes.status,
    location: pageRes.headers.get('location'),
  };
}

const admin = await loginAndVisit('goeun', '23504000', 'admin', '/admin/clients');
const partner = await loginAndVisit('partner01', '898989', 'partner', '/partner/dashboard');

console.log(JSON.stringify({ admin, partner }, null, 2));

const ok =
  admin.sessionRole === 'SUPER_ADMIN' &&
  admin.pageStatus === 200 &&
  partner.sessionRole === 'PARTNER' &&
  partner.pageStatus === 200;

process.exit(ok ? 0 : 1);
