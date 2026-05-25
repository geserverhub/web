import { queryGeserverhub } from '@/lib/geserverhub-db';

const MASKED = '********';
const DEFAULT_MODEL_OPENAI = 'gpt-4o-mini';
const DEFAULT_MODEL_ANTHROPIC = 'claude-haiku-4-5-20251001';

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
  // Add anthropic columns if table was created before they were added
  await queryGeserverhub(`
    ALTER TABLE ai_settings
      ADD COLUMN IF NOT EXISTS anthropic_api_key varchar(512) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS anthropic_model varchar(64) NOT NULL DEFAULT 'claude-haiku-4-5-20251001'
  `).catch(() => {/* ignore if syntax unsupported */});
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
  provider: 'anthropic' | 'openai' | 'none';
};

type AiSettingsRow = {
  openai_api_key?: string;
  openai_model?: string;
  anthropic_api_key?: string;
  anthropic_model?: string;
};

/**
 * Resolve the best available AI credentials.
 * Priority: env ANTHROPIC_API_KEY → DB anthropic key → DB openai key → env OPENAI_API_KEY.
 */
export async function resolveAiCredentials(userId?: string | number | null): Promise<AiCredentials> {
  const envAnthropicKey = process.env.ANTHROPIC_API_KEY?.trim() || '';
  const envAnthropicModel = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL_ANTHROPIC;
  const envOpenAiKey = process.env.OPENAI_API_KEY?.trim() || '';
  const envOpenAiModel = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL_OPENAI;

  if (userId) {
    await ensureAiSettingsSchema();
    const rows = await queryGeserverhub(
      `SELECT openai_api_key, openai_model, anthropic_api_key, anthropic_model
       FROM ai_settings WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    if (rows.length) {
      const row = rows[0] as AiSettingsRow;
      const dbAnthropic = decryptApiKey(row.anthropic_api_key);
      if (dbAnthropic) {
        return { apiKey: dbAnthropic, model: row.anthropic_model?.trim() || envAnthropicModel, source: 'database', provider: 'anthropic' };
      }
      const dbOpenAi = decryptApiKey(row.openai_api_key);
      if (dbOpenAi) {
        return { apiKey: dbOpenAi, model: row.openai_model?.trim() || envOpenAiModel, source: 'database', provider: 'openai' };
      }
    }
  }

  if (envAnthropicKey) {
    return { apiKey: envAnthropicKey, model: envAnthropicModel, source: 'environment', provider: 'anthropic' };
  }
  if (envOpenAiKey) {
    return { apiKey: envOpenAiKey, model: envOpenAiModel, source: 'environment', provider: 'openai' };
  }

  return { apiKey: '', model: envOpenAiModel, source: 'none', provider: 'none' };
}

export type AiTextResult = {
  text: string | null;
  source: 'anthropic' | 'openai' | 'none';
  /** Alias for source — same value, kept for API compatibility. */
  provider: 'anthropic' | 'openai' | 'none';
};

/**
 * Call AI text generation.
 * Anthropic (env ANTHROPIC_API_KEY) takes priority; falls back to OpenAI (DB or env).
 */
export async function callAiText(
  system: string,
  user: string,
  options?: { maxTokens?: number; temperature?: number; userId?: string | number | null }
): Promise<AiTextResult> {
  const maxTokens = options?.maxTokens ?? 500;
  const temperature = options?.temperature ?? 0.4;

  const creds = await resolveAiCredentials(options?.userId);
  if (!creds.apiKey) return { text: null, source: 'none', provider: 'none' };

  if (creds.provider === 'anthropic') {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': creds.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: creds.model,
          max_tokens: maxTokens,
          temperature,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (res.ok) {
        const data = await res.json() as { content?: Array<{ type: string; text: string }> };
        const text = data.content?.find((c) => c.type === 'text')?.text ?? null;
        return { text, source: 'anthropic', provider: 'anthropic' };
      }
    } catch {
      // fall through
    }
    return { text: null, source: 'anthropic', provider: 'anthropic' };
  }

  // OpenAI
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${creds.apiKey}` },
      body: JSON.stringify({
        model: creds.model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        max_tokens: maxTokens,
        temperature,
      }),
    });
    if (!res.ok) return { text: null, source: 'openai', provider: 'openai' };
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? null;
    return { text, source: 'openai', provider: 'openai' };
  } catch {
    return { text: null, source: 'openai', provider: 'openai' };
  }
}

export {
  MASKED as AI_KEY_MASKED,
  DEFAULT_MODEL_OPENAI as DEFAULT_OPENAI_MODEL,
  DEFAULT_MODEL_ANTHROPIC as DEFAULT_ANTHROPIC_MODEL,
};
