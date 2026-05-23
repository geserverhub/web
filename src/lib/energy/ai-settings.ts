import { queryGeserverhub } from '@/lib/geserverhub-db';

const MASKED = '********';
const DEFAULT_MODEL = 'gpt-4o-mini';

let schemaReady = false;

export async function ensureAiSettingsSchema(): Promise<void> {
  if (schemaReady) return;
  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS ai_settings (
      id int NOT NULL AUTO_INCREMENT,
      user_id int NOT NULL,
      openai_api_key varchar(512) DEFAULT NULL,
      openai_model varchar(64) NOT NULL DEFAULT 'gpt-4o-mini',
      updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_ai_settings_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  schemaReady = true;
}

export function encryptApiKey(key: string): string {
  return Buffer.from(key.trim()).toString('base64');
}

export function decryptApiKey(stored: string | null | undefined): string {
  if (!stored) return '';
  try {
    return Buffer.from(stored, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

export function maskApiKey(key: string): string {
  const k = key.trim();
  if (k.length <= 8) return MASKED;
  return `${k.slice(0, 3)}…${k.slice(-4)}`;
}

export type AiCredentials = {
  apiKey: string;
  model: string;
  source: 'database' | 'environment' | 'none';
};

/** DB row overrides .env.local OPENAI_API_KEY when set. */
export async function resolveAiCredentials(userId?: string | number | null): Promise<AiCredentials> {
  const envKey = process.env.OPENAI_API_KEY?.trim() || '';
  const envModel = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  if (!userId) {
    return envKey
      ? { apiKey: envKey, model: envModel, source: 'environment' }
      : { apiKey: '', model: envModel, source: 'none' };
  }

  await ensureAiSettingsSchema();
  const rows = await queryGeserverhub(
    `SELECT openai_api_key, openai_model FROM ai_settings WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (rows.length) {
    const row = rows[0] as { openai_api_key?: string; openai_model?: string };
    const dbKey = decryptApiKey(row.openai_api_key);
    if (dbKey) {
      return {
        apiKey: dbKey,
        model: row.openai_model?.trim() || envModel,
        source: 'database',
      };
    }
  }

  if (envKey) {
    return { apiKey: envKey, model: envModel, source: 'environment' };
  }

  return { apiKey: '', model: envModel, source: 'none' };
}

export { MASKED as AI_KEY_MASKED, DEFAULT_MODEL as DEFAULT_OPENAI_MODEL };
