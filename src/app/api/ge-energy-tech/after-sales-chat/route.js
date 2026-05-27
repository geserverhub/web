import { NextResponse } from 'next/server';

function detectLang(text) {
  const t = String(text || '');
  if (/[\u0E00-\u0E7F]/.test(t)) return 'th';
  if (/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/.test(t)) return 'ko';
  if (/[\u3040-\u30FF]/.test(t)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(t)) return 'zh';
  if (/[ăâđêôơưĂÂĐÊÔƠƯ]/i.test(t)) return 'vi';
  if (/\b(saya|anda|boleh|tolong)\b/i.test(t)) return 'ms';
  return 'en';
}

const BOT = {
  th: [
    'ขอบคุณที่ติดต่อค่ะ เจ้าหน้าที่กำลังตรวจสอบข้อมูลให้',
    'เราแนะนำให้ส่งเลขที่ใบสั่งซื้อและรูปหน้างานเพิ่มเติมเพื่อช่วยตรวจสอบได้เร็วขึ้น',
    'รับเรื่องเรียบร้อยค่ะ ทีมงานจะอัปเดตสถานะให้ภายใน 1 วันทำการ',
  ],
  en: [
    'Thanks for contacting us. Our support team is checking your details now.',
    'Please share your order number and site photo so we can assist faster.',
    'Your request is logged. We will update you within 1 business day.',
  ],
  ko: [
    '문의해 주셔서 감사합니다. 지원팀에서 내용을 확인 중입니다.',
    '주문번호와 현장 사진을 보내주시면 더 빠르게 도와드릴 수 있습니다.',
    '접수가 완료되었습니다. 1영업일 내 업데이트 드리겠습니다.',
  ],
};

function pick(lang, idx) {
  const arr = BOT[lang] || BOT.en;
  return arr[idx % arr.length];
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = String(body?.message || '').trim();
    const clientLang = String(body?.lang || '').trim();
    if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const lang = BOT[clientLang] ? clientLang : detectLang(message);
    const seed = message.length + Date.now();
    const reply = pick(lang, seed % 3);

    return NextResponse.json({ ok: true, lang, reply, at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
