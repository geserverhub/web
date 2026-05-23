import mysql, { type RowDataPacket } from 'mysql2/promise';

/** Single database for this Next.js app — geserverhub only. */
export const GESERVERHUB_DATABASE = 'geserverhub';

function assertGeserverhubDatabase(name: string): void {
  const normalized = name.trim().toLowerCase();
  if (normalized !== GESERVERHUB_DATABASE) {
    throw new Error(
      `[geserverhub-db] DATABASE_URL must target "${GESERVERHUB_DATABASE}", got "${name}".`
    );
  }
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
  const explicitDb = process.env.DB_NAME?.trim();
  if (explicitDb) assertGeserverhubDatabase(explicitDb);

  const url = process.env.DATABASE_URL;
  if (url?.startsWith('mysql://')) {
    const parsed = new URL(url);
    const urlDb = resolveDatabaseFromUrl(url);
    if (urlDb) assertGeserverhubDatabase(urlDb);

    return {
      host: process.env.DB_HOST || process.env.MYSQL_HOST || parsed.hostname || '127.0.0.1',
      port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: GESERVERHUB_DATABASE,
    };
  }

  return {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'geserverhub',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: GESERVERHUB_DATABASE,
  };
}

const pool = mysql.createPool({
  ...getGeserverhubConnectionConfig(),
  connectionLimit: 10,
  timezone: '+00:00',
  waitForConnections: true,
});

/** Run SQL against geserverhub (energy tables, feedback, tickets, etc.). */
export async function queryGeserverhub(sql: string, values?: unknown[]): Promise<RowDataPacket[]> {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<RowDataPacket[]>(sql, values);
    return Array.isArray(rows) ? rows : [rows];
  } finally {
    conn.release();
  }
}
