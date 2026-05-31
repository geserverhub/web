import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryGeserverhub } from '@/lib/geserverhub-db';

const VALID_PORTALS = ['energy', 'customer', 'geet_login', 'classroom', 'partner', 'client', 'erp', 'admin'];

function isSuperAdmin(session) {
  return session?.user?.role === 'SUPER_ADMIN';
}

async function ensureSchema() {
  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS \`user_permissions\` (
      \`id\`         INT(11)      NOT NULL AUTO_INCREMENT,
      \`user_id\`    VARCHAR(191) NOT NULL,
      \`portal\`     VARCHAR(50)  NOT NULL,
      \`is_allowed\` TINYINT(1)   NOT NULL DEFAULT 1,
      \`created_at\` DATETIME     DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_user_portal\` (\`user_id\`, \`portal\`),
      KEY \`idx_user_permissions_user\` (\`user_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * GET /api/admin/users/permissions?userId=xxx
 * Returns { portals: { energy: true, customer: false, ... } }
 * Portals with no row = allowed by default (returns true)
 */
export async function GET(req) {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await ensureSchema();

  const rows = await queryGeserverhub(
    `SELECT portal, is_allowed FROM user_permissions WHERE user_id = ?`,
    [userId]
  );

  const map = Object.fromEntries(rows.map(r => [r.portal, Boolean(r.is_allowed)]));
  const portals = Object.fromEntries(
    VALID_PORTALS.map(p => [p, p in map ? map[p] : true])
  );

  return NextResponse.json({ portals });
}

/**
 * PUT /api/admin/users/permissions
 * Body: { userId, portals: { energy: true, customer: false, ... } }
 */
export async function PUT(req) {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, portals } = await req.json();
  if (!userId || !portals) return NextResponse.json({ error: 'userId and portals required' }, { status: 400 });

  await ensureSchema();

  for (const portal of VALID_PORTALS) {
    const allowed = portals[portal] !== false ? 1 : 0;
    await queryGeserverhub(
      `INSERT INTO user_permissions (user_id, portal, is_allowed)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed), updated_at = NOW()`,
      [userId, portal, allowed]
    );
  }

  return NextResponse.json({ success: true });
}
