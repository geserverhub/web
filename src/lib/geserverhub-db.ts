import mysql, { type RowDataPacket } from 'mysql2/promise';

/** Canonical database name for this Next.js app. */
export const GESERVERHUB_DATABASE = 'goeunserverhub';

/** WSL dumps sometimes restore into `geserverhub`; set DB_LEGACY_GESERVERHUB=1 locally. */
export const LEGACY_GESERVERHUB_DATABASE = 'geserverhub';

function resolveDatabaseName(): string {
  const fromEnv = process.env.DB_NAME?.trim();
  if (fromEnv) return fromEnv;

  const url = process.env.DATABASE_URL;
  if (url?.startsWith('mysql://')) {
    const pathDb = resolveDatabaseFromUrl(url);
    if (pathDb) return pathDb;
  }
  return GESERVERHUB_DATABASE;
}

function assertGeserverhubDatabase(name: string): void {
  const normalized = name.trim().toLowerCase();
  const legacyOk =
    process.env.DB_LEGACY_GESERVERHUB === '1' &&
    normalized === LEGACY_GESERVERHUB_DATABASE;
  if (normalized === GESERVERHUB_DATABASE || legacyOk) return;
  throw new Error(
    `[geserverhub-db] DATABASE_URL/DB_NAME must target "${GESERVERHUB_DATABASE}"` +
      (process.env.DB_LEGACY_GESERVERHUB === '1'
        ? ` or legacy "${LEGACY_GESERVERHUB_DATABASE}"`
        : '') +
      `, got "${name}".`
  );
}

function activeDatabase(): string {
  return resolveDatabaseName();
}

function resolveDatabaseFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathDb = parsed.pathname.replace(/^\//, '').split('/')[0];
    return pathDb || null;
  } catch {
    return null;
  }
}

export function getGeserverhubConnectionConfig() {
  const database = activeDatabase();

  const url = process.env.DATABASE_URL;
  if (url?.startsWith('mysql://')) {
    const parsed = new URL(url);

    return {
      host: process.env.DB_HOST || process.env.MYSQL_HOST || parsed.hostname || '127.0.0.1',
      port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database,
    };
  }

  return {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'geserverhub',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database,
  };
}

const pool = mysql.createPool({
  ...getGeserverhubConnectionConfig(),
  connectionLimit: 10,
  timezone: '+00:00',
  waitForConnections: true,
});

// Force utf8mb4_unicode_ci on every new connection to prevent collation mismatch
(pool as unknown as { pool: { on(e: string, cb: (c: { query(s: string): void }) => void): void } })
  .pool.on('connection', (conn) => {
    conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
  });

/** Run SQL against goeunserverhub (energy tables, feedback, tickets, etc.). */
export async function queryGeserverhub(sql: string, values?: unknown[]): Promise<RowDataPacket[]> {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<RowDataPacket[]>(sql, values);
    return Array.isArray(rows) ? rows : [rows];
  } finally {
    conn.release();
  }
}
