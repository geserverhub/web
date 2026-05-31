import { NextResponse } from 'next/server';
import {
  appendChatMessage,
  ensureThreadByCode,
  getThreadByCode,
  listThreadMessages,
  markThreadReadByCustomer,
} from '@/lib/ge-after-sales-chat-db';

const WAITING_REPLY = {
  th: 'รับข้อความแล้วค่ะ ทีมการตลาดจะตอบกลับในไม่กี่นาที',
  en: 'Message received. Our marketing team will reply shortly.',
  ko: '메시지를 확인했습니다. 마케팅팀이 곧 답변드리겠습니다.',
  zh: '已收到消息，市场团队将尽快回复。',
  vi: 'Đã nhận tin nhắn. Đội marketing sẽ phản hồi sớm.',
  ja: 'メッセージを受け付けました。マーケティング担当が間もなく返信します。',
  'zh-tw': '已收到訊息，行銷團隊將儘快回覆。',
  ms: 'Mesej diterima. Pasukan pemasaran akan membalas sebentar lagi.',
};

function mapMessageRole(sender) {
  return sender === 'customer' ? 'user' : sender === 'agent' ? 'agent' : 'system';
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    const after = Number(searchParams.get('after') || '0');
    const thread = await getThreadByCode(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const rows = await listThreadMessages(thread.id, after);
    await markThreadReadByCustomer(thread.id);
    return NextResponse.json({
      ok: true,
      threadId: thread.thread_code,
      messages: rows.map((row) => ({
        id: row.id,
        role: mapMessageRole(row.sender),
        text: row.message_text,
        at: row.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = String(body?.message || '').trim();
    const clientLang = String(body?.lang || 'en').trim();
    const threadId = String(body?.threadId || '').trim();
    if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const thread = await ensureThreadByCode(threadId, clientLang);
    await appendChatMessage({
      threadId: thread.id,
      sender: 'customer',
      senderName: null,
      text: message,
    });

    const waiting = WAITING_REPLY[clientLang] || WAITING_REPLY.en;
    return NextResponse.json({
      ok: true,
      threadId: thread.thread_code,
      reply: waiting,
      at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
