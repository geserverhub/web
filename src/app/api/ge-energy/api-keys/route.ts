import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ensureApiKeysSchema() {
  await queryGe(`
    CREATE TABLE IF NOT EXISTS \`api_keys\` (
      \`id\`           INT(11)      NOT NULL AUTO_INCREMENT,
      \`user_id\`      INT(11)      DEFAULT NULL,
      \`key_name\`     VARCHAR(100) NOT NULL,
      \`api_key\`      VARCHAR(64)  NOT NULL,
      \`api_secret\`   VARCHAR(128) NOT NULL DEFAULT '',
      \`is_active\`    TINYINT(1)   NOT NULL DEFAULT 1,
      \`last_used_at\` DATETIME     DEFAULT NULL,
      \`expires_at\`   DATETIME     DEFAULT NULL,
      \`created_at\`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_api_key\` (\`api_key\`),
      KEY \`idx_api_keys_user\` (\`user_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

/** GET /api/ge-energy/api-keys?userId= */
export async function GET(req: NextRequest) {
  try {
    await ensureApiKeysSchema()
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
    }

    const keys = await queryGe(
      `
      SELECT id, key_name, api_key, is_active, last_used_at, expires_at, created_at
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `,
      [userId]
    )

    const formattedKeys = (keys as Record<string, unknown>[]).map((k) => ({
      ...k,
      api_secret: '********',
      status: k.is_active ? 'Active' : 'Inactive',
      expiresAt: k.expires_at,
      lastUsed: k.last_used_at || 'Never',
    }))

    return NextResponse.json({ success: true, count: formattedKeys.length, keys: formattedKeys })
  } catch (error: unknown) {
    console.error('api-keys GET error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

/** POST /api/ge-energy/api-keys */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, keyName } = body as { userId?: number | string; keyName?: string }
    if (!userId || !keyName) {
      return NextResponse.json({ success: false, error: 'userId and keyName are required' }, { status: 400 })
    }

    const apiKey = `ge_${crypto.randomBytes(16).toString('hex')}`
    const apiSecret = crypto.randomBytes(32).toString('hex')

    await queryGe(
      `
      INSERT INTO api_keys (user_id, key_name, api_key, api_secret, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, NOW())
    `,
      [userId, keyName, apiKey, apiSecret]
    )

    return NextResponse.json({
      success: true,
      key: { api_key: apiKey, api_secret: apiSecret, key_name: keyName },
    })
  } catch (error: unknown) {
    console.error('api-keys POST error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create API key' },
      { status: 500 }
    )
  }
}

/** DELETE /api/ge-energy/api-keys?id= */
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }

    await queryGe('DELETE FROM api_keys WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('api-keys DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete API key' },
      { status: 500 }
    )
  }
}
