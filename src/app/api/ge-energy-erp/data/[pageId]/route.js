import { NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { getAllErpPages, ERP_ADMIN_PAGE_IDS } from '@/lib/erp-pages';
import { getErpPageData, ERP_REPORT_PAGES } from '@/lib/erp-page-registry';
import { ensureGeErpSchema, insertErpRow, listErpRows } from '@/lib/erp-db';

function parseErpUser(req) {
  try {
    const raw = req.headers.get('x-erp-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function userCanAccessPage(user, pageId) {
  if (!user?.userId) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
  if (ERP_ADMIN_PAGE_IDS.includes(pageId)) return false;

  const allIds = getAllErpPages('th').map((p) => p.pageId);
  if (!allIds.includes(pageId) && !ERP_REPORT_PAGES.has(pageId)) {
    return ERP_ADMIN_PAGE_IDS.includes(pageId) ? false : Boolean(getErpPageData(pageId));
  }

  try {
    const rows = await queryGeserverhub(
      `SELECT is_allowed FROM ge_erp_page_permissions WHERE user_id = ? AND page_id = ? LIMIT 1`,
      [user.userId, pageId]
    );
    if (!rows.length) return true;
    return Boolean(rows[0].is_allowed);
  } catch {
    return true;
  }
}

export async function GET(req, { params }) {
  const user = parseErpUser(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageId = params.pageId;
  if (!pageId) {
    return NextResponse.json({ error: 'pageId required' }, { status: 400 });
  }

  if (!(await userCanAccessPage(user, pageId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureGeErpSchema();
    const data = await listErpRows(pageId);
    return NextResponse.json({ pageId, ...data });
  } catch (err) {
    console.error('[ge-energy-erp/data GET]', pageId, err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const user = parseErpUser(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageId = params.pageId;
  if (!pageId) {
    return NextResponse.json({ error: 'pageId required' }, { status: 400 });
  }

  if (!(await userCanAccessPage(user, pageId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cfg = getErpPageData(pageId);
  if (!cfg?.fields || ERP_REPORT_PAGES.has(pageId)) {
    return NextResponse.json({ error: 'Page does not accept form saves' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const payload = body?.data && typeof body.data === 'object' ? body.data : body;
    const created = await insertErpRow(pageId, payload, user.userId);
    const listed = await listErpRows(pageId);
    return NextResponse.json({ success: true, ...created, ...listed });
  } catch (err) {
    console.error('[ge-energy-erp/data POST]', pageId, err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
