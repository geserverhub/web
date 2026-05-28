import { NextResponse } from 'next/server';
import { buildTimeline, findMeterOrder } from '@/lib/ge-energy-tech-db';
import {
  getOrderStatusLabels,
  resolveOrderStatusLang,
} from '@/lib/ge-energy-tech/order-status-i18n';

export async function POST(req) {
  try {
    const body = await req.json();
    const lang = resolveOrderStatusLang(String(body?.lang || 'en'));
    const labels = getOrderStatusLabels(lang);

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
