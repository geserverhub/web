import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  AI_KEY_MASKED,
  DEFAULT_OPENAI_MODEL,
  encryptApiKey,
  ensureAiSettingsSchema,
  maskApiKey,
  resolveAiCredentials,
} from '@/lib/energy/ai-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/kenergy/ai-settings?userId=1
 */
export async function GET(req: NextRequest) {
  try {
    await ensureAiSettingsSchema();
    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const creds = await resolveAiCredentials(userId);
    const rows = await queryGeserverhub(
      `SELECT openai_model, updated_at FROM ai_settings WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    const row = rows[0] as { openai_model?: string; updated_at?: string } | undefined;

    const hasStoredKey = creds.source === 'database';
    const hasAnyKey = Boolean(creds.apiKey);

    return NextResponse.json({
      success: true,
      settings: {
        openai_model: row?.openai_model || creds.model || DEFAULT_OPENAI_MODEL,
        api_key_masked: hasAnyKey ? maskApiKey(creds.apiKey) : '',
        has_api_key: hasAnyKey,
        key_source: creds.source,
        updated_at: row?.updated_at || null,
        env_fallback: Boolean(process.env.OPENAI_API_KEY),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load AI settings';
    console.error('ai-settings GET:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PUT /api/kenergy/ai-settings
 * Body: { userId, apiKey?, openai_model?, clearKey? }
 */
export async function PUT(req: NextRequest) {
  try {
    await ensureAiSettingsSchema();
    const body = await req.json();
    const userId = body.userId;
    const model = (body.openai_model || body.model || DEFAULT_OPENAI_MODEL).trim();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    if (body.clearKey === true) {
      await queryGeserverhub(
        `INSERT INTO ai_settings (user_id, openai_api_key, openai_model)
         VALUES (?, '', ?)
         ON DUPLICATE KEY UPDATE openai_api_key = '', openai_model = VALUES(openai_model), updated_at = NOW()`,
        [userId, model]
      );
      const creds = await resolveAiCredentials(userId);
      return NextResponse.json({
        success: true,
        message: 'AI token cleared',
        settings: { key_source: creds.source, has_api_key: Boolean(creds.apiKey) },
      });
    }

    const rawKey = String(body.apiKey || body.openai_api_key || '').trim();
    const shouldUpdateKey = rawKey && rawKey !== AI_KEY_MASKED;

    if (shouldUpdateKey) {
      if (!rawKey.startsWith('sk-')) {
        return NextResponse.json(
          { success: false, error: 'Invalid OpenAI API key format (expected sk-...)' },
          { status: 400 }
        );
      }
      const encrypted = encryptApiKey(rawKey);
      await queryGeserverhub(
        `INSERT INTO ai_settings (user_id, openai_api_key, openai_model)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           openai_api_key = VALUES(openai_api_key),
           openai_model = VALUES(openai_model),
           updated_at = NOW()`,
        [userId, encrypted, model]
      );
    } else {
      await queryGeserverhub(
        `INSERT INTO ai_settings (user_id, openai_api_key, openai_model)
         VALUES (?, NULL, ?)
         ON DUPLICATE KEY UPDATE openai_model = VALUES(openai_model), updated_at = NOW()`,
        [userId, model]
      );
    }

    const creds = await resolveAiCredentials(userId);

    return NextResponse.json({
      success: true,
      message: shouldUpdateKey ? 'AI token saved' : 'AI model updated',
      settings: {
        openai_model: model,
        api_key_masked: creds.apiKey ? maskApiKey(creds.apiKey) : '',
        has_api_key: Boolean(creds.apiKey),
        key_source: creds.source,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save AI settings';
    console.error('ai-settings PUT:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
