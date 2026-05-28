import { NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { ERP_ADMIN_PAGE_IDS } from '@/lib/erp-pages';
import {
  appendChatMessage,
  getThreadByCode,
  listChatThreads,
  listThreadMessages,
  markThreadReadByAgent,
} from '@/lib/ge-after-sales-chat-db';
import { parseErpUserHeader } from '@/lib/erp-user-header';

const PAGE_ID = 'after-sales-chat-live';

async function userCanAccessPage(user, pageId) {
  if (!user?.userId) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
  if (ERP_ADMIN_PAGE_IDS.includes(pageId)) return false;
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
  const user = parseErpUserHeader(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await userCanAccessPage(user, PAGE_ID))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const threadCode = String(searchParams.get('threadId') || '').trim();
    const afterId = Number(searchParams.get('after') || '0');

    if (!threadCode) {
      const threads = await listChatThreads(120);
      return NextResponse.json({
        ok: true,
        threads: threads.map((row) => ({
          id: row.thread_code,
          status: row.status,
          customerLang: row.customer_lang,
          customerName: row.customer_name,
          preview: row.last_message_preview,
          unreadCustomerCount: Number(row.unread_customer_count || 0),
          updatedAt: row.updated_at,
          createdAt: row.created_at,
        })),
      });
    }

    const thread = await getThreadByCode(threadCode);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    const rows = await listThreadMessages(thread.id, afterId);
    await markThreadReadByAgent(thread.id);
    return NextResponse.json({
      ok: true,
      thread: {
        id: thread.thread_code,
        status: thread.status,
        customerLang: thread.customer_lang,
        customerName: thread.customer_name,
        updatedAt: thread.updated_at,
      },
      messages: rows.map((row) => ({
        id: row.id,
        role: row.sender,
        senderName: row.sender_name,
        text: row.message_text,
        at: row.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req) {
  const user = parseErpUserHeader(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await userCanAccessPage(user, PAGE_ID))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const threadCode = String(body?.threadId || '').trim();
    const message = String(body?.message || '').trim();
    if (!threadCode || !message) {
      return NextResponse.json({ error: 'threadId and message required' }, { status: 400 });
    }

    const thread = await getThreadByCode(threadCode);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    await appendChatMessage({
      threadId: thread.id,
      sender: 'agent',
      senderName: user.name || user.username || 'ERP Agent',
      text: message,
    });

    const rows = await listThreadMessages(thread.id, 0);
    await markThreadReadByAgent(thread.id);
    return NextResponse.json({
      ok: true,
      threadId: thread.thread_code,
      messages: rows.map((row) => ({
        id: row.id,
        role: row.sender,
        senderName: row.sender_name,
        text: row.message_text,
        at: row.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
