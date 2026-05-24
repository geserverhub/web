/** User-facing hint when Prisma/MySQL auth fails (Windows MySQL80 vs WSL). */
export function formatDbConnectError(err) {
  const msg = String(err?.message || err || '');
  if (
    msg.includes('Authentication failed') ||
    msg.includes('ER_ACCESS_DENIED') ||
    msg.includes('credentials for `geserverhub`')
  ) {
    return [
      'Database login failed for user geserverhub on localhost:3306.',
      'On Windows this usually means MySQL80 has no geserverhub user (WSL MySQL does).',
      'Fix: run dev from WSL — npm run dev:wsl — or create the user: node scripts/setup-windows-db-user.mjs',
    ].join(' ');
  }
  return msg;
}
