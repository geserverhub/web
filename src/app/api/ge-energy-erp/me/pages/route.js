import { NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { getAllErpPages, ERP_ADMIN_PAGE_IDS } from '@/lib/erp-pages';
import { ensureGeErpSchema } from '@/lib/erp-db';
import { parseErpUserHeader } from '@/lib/erp-user-header';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureAclSchema() {
  await ensureGeErpSchema();
}

export async function GET(req) {
  const user = parseErpUserHeader(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const allIds = getAllErpPages('th').map((p) => p.pageId);

  if (isAdmin) {
    const pages = Object.fromEntries([
      ...allIds.map((id) => [id, true]),
      ...ERP_ADMIN_PAGE_IDS.map((id) => [id, true]),
    ]);
    return NextResponse.json({ pages, isAdmin: true });
  }

  try {
    await ensureAclSchema();
    const rows = await queryGeserverhub(
      `SELECT page_id, is_allowed FROM ge_erp_page_permissions WHERE user_id = ?`,
      [user.userId]
    );
    const map = Object.fromEntries(rows.map((r) => [r.page_id, Boolean(r.is_allowed)]));
    const pages = Object.fromEntries(allIds.map((id) => [id, id in map ? map[id] : true]));
    return NextResponse.json({ pages, isAdmin: false });
  } catch (err) {
    console.error('[ge-energy-erp/me/pages GET]', err);
    const pages = Object.fromEntries(allIds.map((id) => [id, true]));
    return NextResponse.json({ pages, isAdmin: false });
  }
}
