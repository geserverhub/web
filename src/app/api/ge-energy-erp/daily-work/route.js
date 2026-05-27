import { NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  getCalendarMonth,
  getDepartmentsForForm,
  insertDailyWorkReport,
  deleteDailyWorkReport,
} from '@/lib/erp-daily-work';

function parseErpUser(req) {
  try {
    const raw = req.headers.get('x-erp-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function canAccess(user) {
  if (!user?.userId) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
  try {
    const rows = await queryGeserverhub(
      `SELECT is_allowed FROM ge_erp_page_permissions
       WHERE user_id = ? AND page_id = 'exec-daily-work-calendar' LIMIT 1`,
      [user.userId]
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
  if (!(await canAccess(user))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year')) || new Date().getFullYear();
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;

  try {
    const calendar = await getCalendarMonth(year, month);
    const departments = await getDepartmentsForForm();
    return NextResponse.json({ calendar, departments });
  } catch (err) {
    console.error('[daily-work GET]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const user = parseErpUser(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await canAccess(user))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (body.action === 'delete' && body.id) {
      await deleteDailyWorkReport(body.id);
      const year = Number(body.year) || new Date().getFullYear();
      const month = Number(body.month) || new Date().getMonth() + 1;
      const calendar = await getCalendarMonth(year, month);
      return NextResponse.json({ success: true, calendar });
    }

    const created = await insertDailyWorkReport(body, user.userId);
    const year = Number(body.year) || new Date().getFullYear();
    const month = Number(body.month) || new Date().getMonth() + 1;
    const calendar = await getCalendarMonth(year, month);
    return NextResponse.json({ success: true, ...created, calendar });
  } catch (err) {
    console.error('[daily-work POST]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
