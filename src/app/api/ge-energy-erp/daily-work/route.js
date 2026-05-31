import { NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  getCalendarMonth,
  getDepartmentByCode,
  getDepartmentsForForm,
  insertDailyWorkReport,
  deleteDailyWorkReport,
} from '@/lib/erp-daily-work';
import { parseErpUserHeader } from '@/lib/erp-user-header';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_WORK_PAGES = new Set([
  'exec-daily-work-calendar',
  'dept-daily-report',
  'dept-monthly-summary',
]);

async function canAccess(user, pageId) {
  if (!user?.userId) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
  const checkPage = DAILY_WORK_PAGES.has(pageId) ? pageId : 'dept-daily-report';
  try {
    const rows = await queryGeserverhub(
      `SELECT is_allowed FROM ge_erp_page_permissions
       WHERE user_id = ? AND page_id = ? LIMIT 1`,
      [user.userId, checkPage]
    );
    if (!rows.length) return true;
    return Boolean(rows[0].is_allowed);
  } catch {
    return true;
  }
}

export async function GET(req) {
  try {
    const user = parseErpUserHeader(req);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('pageId') || 'dept-daily-report';
    if (!(await canAccess(user, pageId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const year = Number(searchParams.get('year')) || new Date().getFullYear();
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;
    const dept = searchParams.get('dept') || null;

    const calendar = await getCalendarMonth(year, month, dept);
    const departments = await getDepartmentsForForm();
    const department = dept ? await getDepartmentByCode(dept) : null;
    return NextResponse.json({ calendar, departments, dept, department });
  } catch (err) {
    console.error('[daily-work GET]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = parseErpUserHeader(req);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const pageId = body.pageId || 'dept-daily-report';
    if (!(await canAccess(user, pageId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dept = body.dept || null;
    if (body.action === 'delete' && body.id) {
      await deleteDailyWorkReport(body.id);
      const year = Number(body.year) || new Date().getFullYear();
      const month = Number(body.month) || new Date().getMonth() + 1;
      const calendar = await getCalendarMonth(year, month, dept);
      return NextResponse.json({ success: true, calendar });
    }

    const created = await insertDailyWorkReport(body, user.userId);
    const year = Number(body.year) || new Date().getFullYear();
    const month = Number(body.month) || new Date().getMonth() + 1;
    const calendar = await getCalendarMonth(year, month, dept);
    return NextResponse.json({ success: true, ...created, calendar });
  } catch (err) {
    console.error('[daily-work POST]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
