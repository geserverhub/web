import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  AI_KEY_MASKED,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_ANTHROPIC_MODEL,
  encryptApiKey,
  ensureAiSettingsSchema,
  maskApiKey,
  resolveAiCredentials,
} from '@/lib/energy/ai-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/ge-energy/ai-settings?userId=1 */
export async function GET(req: NextRequest) {
  try {
    await ensureAiSettingsSchema();
    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const creds = await resolveAiCredentials(userId);
    const rows = await queryGeserverhub(
      `SELECT openai_model, anthropic_model, updated_at FROM ai_settings WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    const row = rows[0] as { openai_model?: string; anthropic_model?: string; updated_at?: string } | undefined;

    // Env status (server-side only, mask the actual keys)
    const hasEnvAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    const hasEnvOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());

    return NextResponse.json({
      success: true,
      settings: {
        openai_model: row?.openai_model || DEFAULT_OPENAI_MODEL,
        anthropic_model: row?.anthropic_model || DEFAULT_ANTHROPIC_MODEL,
        api_key_masked: creds.apiKey ? maskApiKey(creds.apiKey) : '',
        has_api_key: Boolean(creds.apiKey),
        key_source: creds.source,
        active_provider: creds.provider,
        updated_at: row?.updated_at || null,
        env_anthropic: hasEnvAnthropic,
        env_openai: hasEnvOpenAi,
      },
    });
  } catch (err: unknown) {
    console.error('ai-settings GET:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}

/** PUT /api/ge-energy/ai-settings
 * Body: { userId, provider?, apiKey?, model?, clearKey? }
 */
export async function PUT(req: NextRequest) {
  try {
    await ensureAiSettingsSchema();
    const body = await req.json();
    const userId = body.userId;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const provider: 'openai' | 'anthropic' = body.provider === 'anthropic' ? 'anthropic' : 'openai';
    const rawKey = String(body.apiKey || '').trim();
    const model = String(body.model || body.openai_model || (provider === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL)).trim();
    const clearKey = body.clearKey === true;

    if (provider === 'anthropic') {
      if (clearKey) {
        await queryGeserverhub(
          `INSERT INTO ai_settings (user_id, anthropic_api_key, anthropic_model)
           VALUES (?, '', ?)
           ON DUPLICATE KEY UPDATE anthropic_api_key = '', anthropic_model = VALUES(anthropic_model), updated_at = NOW()`,
          [userId, model]
        );
      } else if (rawKey && rawKey !== AI_KEY_MASKED) {
        if (!rawKey.startsWith('sk-ant-')) {
          return NextResponse.json({ success: false, error: 'Invalid Anthropic key (must start with sk-ant-)' }, { status: 400 });
        }
        const encrypted = encryptApiKey(rawKey);
        await queryGeserverhub(
          `INSERT INTO ai_settings (user_id, anthropic_api_key, anthropic_model)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE anthropic_api_key = VALUES(anthropic_api_key), anthropic_model = VALUES(anthropic_model), updated_at = NOW()`,
          [userId, encrypted, model]
        );
      } else {
        await queryGeserverhub(
          `INSERT INTO ai_settings (user_id, anthropic_model)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE anthropic_model = VALUES(anthropic_model), updated_at = NOW()`,
          [userId, model]
        );
      }
    } else {
      // OpenAI
      if (clearKey) {
        await queryGeserverhub(
          `INSERT INTO ai_settings (user_id, openai_api_key, openai_model)
           VALUES (?, '', ?)
           ON DUPLICATE KEY UPDATE openai_api_key = '', openai_model = VALUES(openai_model), updated_at = NOW()`,
          [userId, model]
        );
      } else if (rawKey && rawKey !== AI_KEY_MASKED) {
        if (!rawKey.startsWith('sk-')) {
          return NextResponse.json({ success: false, error: 'Invalid OpenAI key (must start with sk-)' }, { status: 400 });
        }
        const encrypted = encryptApiKey(rawKey);
        await queryGeserverhub(
          `INSERT INTO ai_settings (user_id, openai_api_key, openai_model)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE openai_api_key = VALUES(openai_api_key), openai_model = VALUES(openai_model), updated_at = NOW()`,
          [userId, encrypted, model]
        );
      } else {
        await queryGeserverhub(
          `INSERT INTO ai_settings (user_id, openai_model)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE openai_model = VALUES(openai_model), updated_at = NOW()`,
          [userId, model]
        );
      }
    }

    const creds = await resolveAiCredentials(userId);
    return NextResponse.json({
      success: true,
      message: clearKey ? 'Key cleared' : rawKey ? 'Key saved' : 'Model updated',
      settings: {
        api_key_masked: creds.apiKey ? maskApiKey(creds.apiKey) : '',
        has_api_key: Boolean(creds.apiKey),
        key_source: creds.source,
        active_provider: creds.provider,
      },
    });
  } catch (err: unknown) {
    console.error('ai-settings PUT:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
