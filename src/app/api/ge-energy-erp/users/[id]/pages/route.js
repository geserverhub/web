import { NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { getAllErpPages } from '@/lib/erp-pages';
import { ensureGeErpSchema } from '@/lib/erp-db';
import { parseErpUserHeader } from '@/lib/erp-user-header';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function assertDeveloper(req) {
  const u = parseErpUserHeader(req);
  if (!u || !['ADMIN', 'SUPER_ADMIN'].includes(u.role)) {
    return null;
  }
  return u;
}

async function ensureAclSchema() {
  await ensureGeErpSchema();
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

export async function GET(req, context) {
  try {
    if (!assertDeveloper(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const p = await Promise.resolve(context?.params);
    const userId = p?.id;
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    const pages = await loadUserPages(userId);
    return NextResponse.json({ pages });
  } catch (err) {
    console.error('[ge-energy-erp/users/pages GET]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    if (!assertDeveloper(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const p = await Promise.resolve(context?.params);
    const userId = p?.id;
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    const { pages } = await req.json();
    if (!pages || typeof pages !== 'object') {
      return NextResponse.json({ error: 'pages object required' }, { status: 400 });
    }
    await saveUserPages(userId, pages);
    const saved = await loadUserPages(userId);
    return NextResponse.json({ success: true, pages: saved });
  } catch (err) {
    console.error('[ge-energy-erp/users/pages PUT]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
