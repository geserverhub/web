import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrisma } from '@/lib/prisma';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { getAllErpPages } from '@/lib/erp-pages';

function parseErpUser(req) {
  try {
    const raw = req.headers.get('x-erp-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function assertDeveloper(req) {
  const u = parseErpUser(req);
  if (!u || !['ADMIN', 'SUPER_ADMIN'].includes(u.role)) {
    return null;
  }
  return u;
}

async function ensureAclSchema() {
  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS ge_erp_page_permissions (
      user_id VARCHAR(191) NOT NULL,
      page_id VARCHAR(80) NOT NULL,
      is_allowed TINYINT(1) NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, page_id),
      KEY idx_ge_erp_page_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function saveUserPages(userId, pages) {
  await ensureAclSchema();
  const allIds = getAllErpPages('th').map((p) => p.pageId);
  for (const pageId of allIds) {
    const allowed = pages?.[pageId] !== false ? 1 : 0;
    await queryGeserverhub(
      `INSERT INTO ge_erp_page_permissions (user_id, page_id, is_allowed)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed), updated_at = NOW()`,
      [userId, pageId, allowed]
    );
  }
}

async function loadUserPages(userId) {
  await ensureAclSchema();
  const rows = await queryGeserverhub(
    `SELECT page_id, is_allowed FROM ge_erp_page_permissions WHERE user_id = ?`,
    [userId]
  );
  const map = Object.fromEntries(rows.map((r) => [r.page_id, Boolean(r.is_allowed)]));
  const allIds = getAllErpPages('th').map((p) => p.pageId);
  return Object.fromEntries(allIds.map((id) => [id, id in map ? map[id] : true]));
}

export async function GET(req) {
  if (!assertDeveloper(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['CLIENT', 'ADMIN', 'PARTNER'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      take: 200,
    });
    return NextResponse.json({ users });
  } catch (err) {
    console.error('[ge-energy-erp/users GET]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!assertDeveloper(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { username, name, email, password, role, pages } = body;

    const loginId = String(username || email || '').trim();
    if (!loginId || !password) {
      return NextResponse.json({ error: 'username and password required' }, { status: 400 });
    }

    const existing =
      (await prisma.user.findUnique({ where: { username: loginId } })) ??
      (email ? await prisma.user.findUnique({ where: { email: String(email).trim() } }) : null);

    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username: loginId,
        name: name || loginId,
        email: email ? String(email).trim() : `${loginId}@ge-erp.local`,
        password: hashed,
        role: role === 'ADMIN' ? 'ADMIN' : 'CLIENT',
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
      },
    });

    try {
      await saveUserPages(user.id, pages || {});
    } catch (aclErr) {
      console.warn('[ge-energy-erp/users] ACL save failed:', aclErr);
    }

    const savedPages = await loadUserPages(user.id).catch(() => ({}));

    return NextResponse.json({ user, pages: savedPages });
  } catch (err) {
    console.error('[ge-energy-erp/users POST]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
