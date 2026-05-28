import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub as query } from '@/lib/geserverhub-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toStr(v: unknown) {
  return String(v || '').trim();
}

function hasValue(v: unknown) {
  return toStr(v).length > 0;
}

export async function GET(req: NextRequest) {
  try {
    // Ensure table exists — swallow if DB user lacks CREATE privilege
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS ge_customer_energy_saver_orders (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          order_no VARCHAR(64) NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          shipping_address TEXT NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(80) NOT NULL,
          breaker_size VARCHAR(64) NOT NULL,
          machine_kva VARCHAR(64) NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          unit_price INT NOT NULL DEFAULT 0,
          total_price INT NOT NULL DEFAULT 0,
          site_photo_path VARCHAR(512) NOT NULL DEFAULT '',
          payment_slip_path VARCHAR(512) NOT NULL DEFAULT '',
          monthly_bill_paths_json LONGTEXT NULL,
          monthly_bill_count INT NOT NULL DEFAULT 0,
          status VARCHAR(32) NOT NULL DEFAULT 'pending',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_customer_energy_saver_order_no (order_no),
          KEY idx_customer_energy_saver_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch {
      // CREATE TABLE failed (e.g. insufficient privileges) — continue; SELECT may still work
    }

    const { searchParams } = new URL(req.url);
    const userId = toStr(searchParams.get('userId'));
    const email = toStr(searchParams.get('email'));
    const phone = toStr(searchParams.get('phone'));

    const whereOrders: string[] = [];
    const orderParams: unknown[] = [];
    if (hasValue(email)) {
      whereOrders.push('email = ?');
      orderParams.push(email);
    }
    if (hasValue(phone)) {
      whereOrders.push('phone = ?');
      orderParams.push(phone);
    }
    if (!whereOrders.length) {
      return NextResponse.json({ success: true, activities: [] });
    }

    let orderRows: Array<Record<string, unknown>> = [];
    try {
      orderRows = (await query(
        `SELECT id, order_no, customer_name, shipping_address, email, phone, breaker_size, machine_kva,
                quantity, unit_price, total_price, monthly_bill_count, status, created_at, updated_at
         FROM ge_customer_energy_saver_orders
         WHERE ${whereOrders.join(' OR ')}
         ORDER BY created_at DESC
         LIMIT 300`,
        orderParams
      )) as Array<Record<string, unknown>>;
    } catch (e: unknown) {
      // Table not yet created — return empty, other activity types still load
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("doesn't exist") && !msg.includes('does not exist')) throw e;
    }

    const geetRows = (await query(
      `SELECT id, order_no, buyer_name, ship_address, email, phone, breaker_amps, machine_kva,
              quantity, unit_price, total_price, payment_status, shipment_status, created_at, updated_at
       FROM geet_meter_order
       WHERE ${whereOrders.join(' OR ')}
       ORDER BY created_at DESC
       LIMIT 300`,
      orderParams
    )) as Array<Record<string, unknown>>;

    let feedbackRows: Array<Record<string, unknown>> = [];
    if (hasValue(userId)) {
      feedbackRows = (await query(
        `SELECT id, category, subject, status, created_at
         FROM user_feedback
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 300`,
        [Number(userId)]
      )) as Array<Record<string, unknown>>;
    }

    let ticketRows: Array<Record<string, unknown>> = [];
    if (hasValue(userId)) {
      ticketRows = (await query(
        `SELECT id, ticket_id, subject, type, priority, status, created_at, updated_at
         FROM support_tickets
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 300`,
        [Number(userId)]
      )) as Array<Record<string, unknown>>;
    }

    const orderActivities = orderRows.map((r) => {
      const monthlyBillCount = Number(r.monthly_bill_count || 0);
      const incomplete =
        !hasValue(r.customer_name) ||
        !hasValue(r.shipping_address) ||
        !hasValue(r.email) ||
        !hasValue(r.phone) ||
        !hasValue(r.breaker_size) ||
        !hasValue(r.machine_kva) ||
        monthlyBillCount < 12 ||
        toStr(r.status).toLowerCase() === 'pending';

      return {
        type: 'energy_saver_order',
        id: Number(r.id),
        title: `Order ${toStr(r.order_no) || `#${r.id}`}`,
        status: toStr(r.status) || 'pending',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        incomplete,
        fields: {
          customer_name: toStr(r.customer_name),
          shipping_address: toStr(r.shipping_address),
          email: toStr(r.email),
          phone: toStr(r.phone),
          breaker_size: toStr(r.breaker_size),
          machine_kva: toStr(r.machine_kva),
          quantity: Number(r.quantity || 1),
          unit_price: Number(r.unit_price || 0),
          total_price: Number(r.total_price || 0),
          monthly_bill_count: monthlyBillCount,
        },
      };
    });

    const feedbackActivities = feedbackRows.map((r) => ({
      type: 'feedback',
      id: Number(r.id),
      title: toStr(r.subject) || `Feedback #${r.id}`,
      status: toStr(r.status) || 'open',
      createdAt: r.created_at,
      updatedAt: r.created_at,
      incomplete: false,
      fields: {
        category: toStr(r.category),
      },
    }));

    const geetActivities = geetRows.map((r) => {
      const paymentStatus = toStr(r.payment_status) || 'pending';
      const shipmentStatus = toStr(r.shipment_status) || 'pending';
      const incomplete = paymentStatus !== 'paid' || shipmentStatus !== 'delivered';
      return {
        type: 'geet_meter_order',
        id: Number(r.id),
        title: `GEET Order ${toStr(r.order_no) || `#${r.id}`}`,
        status: `${paymentStatus}/${shipmentStatus}`,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        incomplete,
        fields: {
          customer_name: toStr(r.buyer_name),
          shipping_address: toStr(r.ship_address),
          email: toStr(r.email),
          phone: toStr(r.phone),
          breaker_size: toStr(r.breaker_amps),
          machine_kva: toStr(r.machine_kva),
          quantity: Number(r.quantity || 1),
          unit_price: Number(r.unit_price || 0),
          total_price: Number(r.total_price || 0),
          payment_status: paymentStatus,
          shipment_status: shipmentStatus,
        },
      };
    });

    const ticketActivities = ticketRows.map((r) => ({
      type: 'support_ticket',
      id: Number(r.id),
      title: `${toStr(r.ticket_id) || `TKT-${r.id}`} — ${toStr(r.subject)}`,
      status: toStr(r.status) || 'Open',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      incomplete: ['open', 'pending'].includes(toStr(r.status).toLowerCase()),
      fields: {
        ticket_id: toStr(r.ticket_id),
        type: toStr(r.type),
        priority: toStr(r.priority),
        subject: toStr(r.subject),
      },
    }));

    const activities = [...orderActivities, ...geetActivities, ...ticketActivities, ...feedbackActivities].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('customer-activity-history GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load activity history' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const type = toStr(body?.type);
    const id = Number(body?.id);
    const fields = body?.fields || {};

    if (!id || !['energy_saver_order', 'geet_meter_order'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid type or id' }, { status: 400 });
    }
    if (type === 'energy_saver_order') {
      await query(
        `UPDATE ge_customer_energy_saver_orders
         SET customer_name = ?, shipping_address = ?, email = ?, phone = ?,
             breaker_size = ?, machine_kva = ?, quantity = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          toStr(fields.customer_name),
          toStr(fields.shipping_address),
          toStr(fields.email),
          toStr(fields.phone),
          toStr(fields.breaker_size),
          toStr(fields.machine_kva),
          Math.max(1, Number(fields.quantity || 1)),
          id,
        ]
      );
    } else if (type === 'geet_meter_order') {
      await query(
        `UPDATE geet_meter_order
         SET buyer_name = ?, ship_address = ?, email = ?, phone = ?,
             breaker_amps = ?, machine_kva = ?, quantity = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          toStr(fields.customer_name),
          toStr(fields.shipping_address),
          toStr(fields.email),
          toStr(fields.phone),
          toStr(fields.breaker_size),
          toStr(fields.machine_kva),
          Math.max(1, Number(fields.quantity || 1)),
          id,
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('customer-activity-history PUT error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update activity' },
      { status: 500 }
    );
  }
}
