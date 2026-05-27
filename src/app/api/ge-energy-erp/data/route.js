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

function resolvePageId(req, body = null) {
  const fromHeader = req.headers.get('x-erp-page-id') || '';
  if (fromHeader) return String(fromHeader);

  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('pageId') || url.searchParams.get('p') || '';
  if (fromQuery) return String(fromQuery);

  const fromBody =
    body?.pageId ||
    body?.pageid ||
    body?.['page-id'] ||
    body?.data?.pageId ||
    '';
  if (fromBody) return String(fromBody);

  try {
    const referer = req.headers.get('referer') || '';
    if (referer) {
      const p = new URL(referer).searchParams.get('p') || '';
      if (p) return String(p);
    }
  } catch {
    // ignore invalid referer
  }

  return '';
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

export async function GET(req) {
  const user = parseErpUser(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageId = resolvePageId(req);
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

export async function POST(req) {
  const user = parseErpUser(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const pageId = resolvePageId(req, body);
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

    const payload = body?.data && typeof body.data === 'object' ? body.data : body;
    const created = await insertErpRow(pageId, payload, user.userId);
    const listed = await listErpRows(pageId);
    return NextResponse.json({ success: true, ...created, ...listed });
  } catch (err) {
    console.error('[ge-energy-erp/data POST]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
