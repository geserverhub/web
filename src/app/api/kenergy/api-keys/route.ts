import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/kenergy/api-keys
 * ดึงรายกา�?API keys ขอ�?user (ไม่แสด�?secret)
 * Query params:
 *   - userId: number
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 })
    }

    const keys = await queryGe(`
      SELECT
        id, key_name, api_key,
        is_active, last_used_at, expires_at,
        created_at
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId])

    // Format keys (never show secret)
    const formattedKeys = keys.map((k: any) => ({
      ...k,
      api_secret: '?�••••••••••�?, // Never show secret
      status: k.is_active ? 'Active' : 'Inactive',
      expiresAt: k.expires_at,
      lastUsed: k.last_used_at || 'Never'
    }))

    return NextResponse.json({
      success: true,
      count: formattedKeys.length,
      keys: formattedKeys
    })
  } catch (err: any) {
    console.error('API keys GET error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to fetch API keys'
    }, { status: 500 })
  }
}

/**
 * POST /api/kenergy/api-keys
 * สร้า�?API key ใหม่
 * Body: {
 *   userId: number,
 *   keyName: string,
 *   permissions?: object (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, keyName, permissions } = body

    // Validate required fields
    if (!userId || !keyName) {
      return NextResponse.json({
        success: false,
        error: 'userId and keyName are required'
      }, { status: 400 })
    }

    // Generate secure random keys
    const apiKey = crypto.randomBytes(32).toString('hex')      // 64 characters
    const apiSecret = crypto.randomBytes(64).toString('hex')   // 128 characters

    // Insert into database
    const result = await queryGe(`
      INSERT INTO api_keys
        (user_id, key_name, api_key, api_secret, permissions, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      userId,
      keyName,
      apiKey,
      apiSecret,
      permissions ? JSON.stringify(permissions) : null,
      `user_${userId}`
    ])

    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save the secret - it will not be shown again!',
      apiKey,
      apiSecret,
      keyId: (result as any)[0]?.insertId,
      warning: '?�️ Please save the secret key now. You will not be able to see it again.'
    })
  } catch (err: any) {
    console.error('API keys POST error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to create API key'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/kenergy/api-keys
 * �?��หรือปิดใช้งา�?API key
 * Query params:
 *   - keyId: number
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('keyId')

    if (!keyId) {
      return NextResponse.json({
        success: false,
        error: 'keyId is required'
      }, { status: 400 })
    }

    // Soft delete by setting is_active to 0
    await queryGe(`
      UPDATE api_keys
      SET is_active = 0, updated_at = NOW()
      WHERE id = ?
    `, [keyId])

    // Or hard delete:
    // await queryGe('DELETE FROM api_keys WHERE id = ?', [keyId])

    return NextResponse.json({
      success: true,
      message: 'API key deactivated successfully'
    })
  } catch (err: any) {
    console.error('API keys DELETE error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to delete API key'
    }, { status: 500 })
  }
}

/**
 * PUT /api/kenergy/api-keys
 * �?��พ�?ดท API key (เช่�?เปลี่ยนชื่อหรือ permissions)
 * Body: { keyId: number, keyName?: string, permissions?: object, is_active?: boolean }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { keyId, keyName, permissions, is_active } = body

    if (!keyId) {
      return NextResponse.json({
        success: false,
        error: 'keyId is required'
      }, { status: 400 })
    }

    // Build update query
    const updates: string[] = []
    const params: any[] = []

    if (keyName !== undefined) {
      updates.push('key_name = ?')
      params.push(keyName)
    }
    if (permissions !== undefined) {
      updates.push('permissions = ?')
      params.push(JSON.stringify(permissions))
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?')
      params.push(is_active ? 1 : 0)
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No fields to update'
      }, { status: 400 })
    }

    updates.push('updated_at = NOW()')
    params.push(keyId)

    await queryGe(`
      UPDATE api_keys
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params)

    return NextResponse.json({
      success: true,
      message: 'API key updated successfully'
    })
  } catch (err: any) {
    console.error('API keys PUT error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to update API key'
    }, { status: 500 })
  }
}
