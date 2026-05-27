import { NextResponse } from 'next/server';
import { buildTimeline, findMeterOrder } from '@/lib/ge-energy-tech-db';

const STATUS_TEXT = {
  th: {
    pending: 'รอยืนยันการชำระเงิน',
    processing: 'กำลังเตรียมสินค้า',
    shipped: 'จัดส่งแล้ว',
    delivered: 'จัดส่งสำเร็จ',
  },
  en: {
    pending: 'Pending payment verification',
    processing: 'Preparing order',
    shipped: 'Shipped',
    delivered: 'Delivered',
  },
  ko: {
    pending: '결제 확인 대기',
    processing: '상품 준비 중',
    shipped: '배송 중',
    delivered: '배송 완료',
  },
};

function resolveLang(code) {
  if (STATUS_TEXT[code]) return code;
  if (['zh', 'zh-tw', 'vi', 'ja', 'ms'].includes(code)) return 'en';
  return 'en';
}

export async function POST(req) {
  try {
    const body = await req.json();
    const lang = resolveLang(String(body?.lang || 'en'));
    const labels = STATUS_TEXT[lang] || STATUS_TEXT.en;

    const orderIdRaw = String(body?.orderId || '').trim().toUpperCase();
    const emailRaw = String(body?.email || '').trim().toLowerCase();

    if (!orderIdRaw && !emailRaw) {
      return NextResponse.json({ error: 'Missing search criteria' }, { status: 400 });
    }

    const row = await findMeterOrder({
      orderNo: orderIdRaw || null,
      email: emailRaw || null,
    });

    if (!row) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const statusKey = row.shipmentStatus || 'pending';
    const timeline = buildTimeline(statusKey, labels);

    return NextResponse.json({
      ok: true,
      order: {
        orderId: row.orderNo,
        email: row.email,
        status: labels[statusKey] || statusKey,
        statusKey,
        paymentStatus: row.paymentStatus,
        updatedAt: row.updatedAt,
        timeline,
      },
    });
  } catch (error) {
    console.error('[order-tracking]', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
