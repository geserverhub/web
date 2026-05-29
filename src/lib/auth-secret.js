import nextEnv from '@next/env';

let cachedSecret = null;

/** Resolve Auth.js secret, loading .env.local if Next has not yet. */
export function getAuthSecret() {
  if (cachedSecret) return cachedSecret;

  nextEnv.loadEnvConfig(process.cwd());

  const fromEnv =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    '';

  if (fromEnv) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'development') {
    cachedSecret = 'dev-local-auth-secret-change-me';
    return cachedSecret;
  }

  return '';
}
