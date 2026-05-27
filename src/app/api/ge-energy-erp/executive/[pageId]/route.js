import { NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { getAllErpPages, ERP_ADMIN_PAGE_IDS } from '@/lib/erp-pages';
import { getExecutivePageData, reviewApproval } from '@/lib/erp-executive';

const EXEC_PAGES = new Set([
  'exec-dept-kpi',
  'exec-pending-approvals',
  'exec-ai-performance',
  'exec-ai-issues',
  'exec-ai-growth',
]);

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
  if (!EXEC_PAGES.has(pageId)) return false;

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

  const { pageId } = await params;
  if (!EXEC_PAGES.has(pageId)) {
    return NextResponse.json({ error: 'Invalid executive page' }, { status: 400 });
  }

  if (!(await userCanAccessPage(user, pageId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await getExecutivePageData(pageId);
    return NextResponse.json({ pageId, ...data });
  } catch (err) {
    console.error('[ge-energy-erp/executive GET]', pageId, err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const user = parseErpUser(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId } = await params;
  if (pageId !== 'exec-pending-approvals') {
    return NextResponse.json({ error: 'POST not supported for this page' }, { status: 400 });
  }

  if (!(await userCanAccessPage(user, pageId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { approvalId, action, note } = body;
    if (!approvalId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'approvalId and action required' }, { status: 400 });
    }
    await reviewApproval(approvalId, action, user.userId, note || '');
    const data = await getExecutivePageData(pageId);
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error('[ge-energy-erp/executive POST]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
