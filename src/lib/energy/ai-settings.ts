import { queryGeserverhub } from '@/lib/geserverhub-db';

const MASKED = '********';
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

let schemaReady = false;

export async function ensureAiSettingsSchema(): Promise<void> {
  if (schemaReady) return;
  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS ai_settings (
      id int NOT NULL AUTO_INCREMENT,
      user_id int NOT NULL,
      openai_api_key varchar(512) DEFAULT NULL,
      openai_model varchar(64) NOT NULL DEFAULT 'gpt-4o-mini',
      anthropic_api_key varchar(512) DEFAULT NULL,
      anthropic_model varchar(64) NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
      updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_ai_settings_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  // Add Anthropic columns if table existed before this migration
  try {
    await queryGeserverhub(`ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS anthropic_api_key varchar(512) DEFAULT NULL`);
    await queryGeserverhub(`ALTER TABLE ai_settings ADD COLUMN IF NOT EXISTS anthropic_model varchar(64) NOT NULL DEFAULT 'claude-haiku-4-5-20251001'`);
  } catch { /* columns already exist */ }
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

export type AiProvider = 'anthropic' | 'openai';

export type AiCredentials = {
  apiKey: string;
  model: string;
  provider: AiProvider;
  source: 'database' | 'environment' | 'none';
};

/**
 * Priority: ANTHROPIC_API_KEY env → OPENAI_API_KEY env → DB per-user OpenAI key.
 * Anthropic (Claude) is the preferred provider when available.
 */
export async function resolveAiCredentials(userId?: string | number | null): Promise<AiCredentials> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim() || '';
  const anthropicModel =
    (process.env.ANTHROPIC_MODEL?.trim() || process.env.CLAUDE_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL);

  if (anthropicKey) {
    return { apiKey: anthropicKey, model: anthropicModel, provider: 'anthropic', source: 'environment' };
  }

  const envOpenAiKey = process.env.OPENAI_API_KEY?.trim() || '';
  const envOpenAiModel = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;

  if (userId) {
    await ensureAiSettingsSchema();
    const rows = await queryGeserverhub(
      `SELECT openai_api_key, openai_model, anthropic_api_key, anthropic_model FROM ai_settings WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    if (rows.length) {
      const row = rows[0] as {
        openai_api_key?: string; openai_model?: string;
        anthropic_api_key?: string; anthropic_model?: string;
      };
      const dbAnthropic = decryptApiKey(row.anthropic_api_key);
      if (dbAnthropic) {
        return {
          apiKey: dbAnthropic,
          model: row.anthropic_model?.trim() || DEFAULT_ANTHROPIC_MODEL,
          provider: 'anthropic',
          source: 'database',
        };
      }
      const dbOpenAi = decryptApiKey(row.openai_api_key);
      if (dbOpenAi) {
        return {
          apiKey: dbOpenAi,
          model: row.openai_model?.trim() || envOpenAiModel,
          provider: 'openai',
          source: 'database',
        };
      }
    }
  }

  if (envOpenAiKey) {
    return { apiKey: envOpenAiKey, model: envOpenAiModel, provider: 'openai', source: 'environment' };
  }

  return { apiKey: '', model: DEFAULT_ANTHROPIC_MODEL, provider: 'anthropic', source: 'none' };
}

/**
 * Unified AI text completion. Handles both Anthropic (Claude) and OpenAI.
 * Returns null when no API key is configured.
 */
export async function callAiText(
  system: string,
  user: string,
  opts: {
    maxTokens?: number;
    temperature?: number;
    userId?: string | number | null;
    jsonMode?: boolean;
  } = {}
): Promise<{ text: string | null; provider: AiProvider; source: string }> {
  const creds = await resolveAiCredentials(opts.userId);
  if (!creds.apiKey) {
    return { text: null, provider: creds.provider, source: 'none' };
  }

  const maxTokens = opts.maxTokens ?? 600;
  const temperature = opts.temperature ?? 0.3;

  try {
    if (creds.provider === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': creds.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: creds.model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (!resp.ok) return { text: null, provider: 'anthropic', source: creds.source };
      const data = await resp.json();
      const text = data.content?.[0]?.text?.trim() || null;
      return { text, provider: 'anthropic', source: creds.source };
    }

    // OpenAI
    const body: Record<string, unknown> = {
      model: creds.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature,
    };
    if (opts.jsonMode) body.response_format = { type: 'json_object' };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) return { text: null, provider: 'openai', source: creds.source };
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim() || null;
    return { text, provider: 'openai', source: creds.source };
  } catch (err) {
    console.error('[callAiText]', err);
    return { text: null, provider: creds.provider, source: creds.source };
  }
}

export { MASKED as AI_KEY_MASKED, DEFAULT_OPENAI_MODEL, DEFAULT_ANTHROPIC_MODEL };
