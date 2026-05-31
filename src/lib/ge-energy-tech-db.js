import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { readFileSync } from 'fs';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { ORDER_STATUS_ORDER, buildOrderTimeline } from '@/lib/ge-energy-tech/order-status-i18n';

let schemaReady = false;

const STATUS_ORDER = ORDER_STATUS_ORDER;

export async function ensureGeEnergyTechOrdersSchema() {
  if (schemaReady) return;

  const sqlPath = join(process.cwd(), 'prisma', 'migrate-ge-energy-tech-orders.sql');
  const raw = readFileSync(sqlPath, 'utf8');
  const statements = raw
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter((s) => s.length > 0 && !/^SET /i.test(s) && !/^USE /i.test(s));

  for (const stmt of statements) {
    try {
      await queryGeserverhub(stmt);
    } catch (err) {
      const msg = err?.message || '';
      if (/already exists|Duplicate column|Duplicate key name|errno: 121|errno: 1061/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }

  schemaReady = true;
}

function safeExt(name, fallback = '.bin') {
  const m = String(name || '').match(/\.[a-z0-9]+$/i);
  return m ? m[0].toLowerCase() : fallback;
}

export async function saveOrderFiles(orderNo, sitePhoto, paymentSlip) {
  const dir = join(process.cwd(), 'public', 'uploads', 'geet-orders', orderNo);
  await mkdir(dir, { recursive: true });

  const siteExt = safeExt(sitePhoto.name, '.jpg');
  const slipExt = safeExt(paymentSlip.name, '.jpg');
  const siteRel = `/uploads/geet-orders/${orderNo}/site${siteExt}`;
  const slipRel = `/uploads/geet-orders/${orderNo}/slip${slipExt}`;

  await writeFile(join(process.cwd(), 'public', siteRel.replace(/^\//, '')), sitePhoto.buf);
  await writeFile(join(process.cwd(), 'public', slipRel.replace(/^\//, '')), paymentSlip.buf);

  return { sitePhotoPath: siteRel, paymentSlipPath: slipRel };
}

export async function insertMeterOrder(row) {
  await ensureGeEnergyTechOrdersSchema();

  const result = await queryGeserverhub(
    `INSERT INTO geet_meter_order
      (order_no, buyer_name, ship_address, email, phone, breaker_amps, machine_kva,
       quantity, unit_price, total_price, lang, product_code, payment_status, shipment_status,
       site_photo_path, payment_slip_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)`,
    [
      row.orderNo,
      row.buyerName,
      row.shipAddress,
      row.email,
      row.phone,
      row.breakerSize,
      row.machineKva,
      row.quantity,
      row.unitPrice,
      row.totalPrice,
      row.lang,
      row.productCode || 'smart-meter',
      row.sitePhotoPath,
      row.paymentSlipPath,
    ]
  );

  const orderId = result[0]?.insertId;
  if (orderId) {
    await queryGeserverhub(
      `INSERT INTO geet_meter_order_event (order_id, status_key, note)
       VALUES (?, 'pending', 'Order received — payment verification')`,
      [orderId]
    );
  }

  return orderId;
}

export async function findMeterOrder({ orderNo, email }) {
  await ensureGeEnergyTechOrdersSchema();

  let rows;
  if (orderNo) {
    rows = await queryGeserverhub(
      `SELECT id, order_no AS orderNo, email, shipment_status AS shipmentStatus,
              payment_status AS paymentStatus, updated_at AS updatedAt
       FROM geet_meter_order WHERE order_no = ? LIMIT 1`,
      [orderNo]
    );
  } else if (email) {
    rows = await queryGeserverhub(
      `SELECT id, order_no AS orderNo, email, shipment_status AS shipmentStatus,
              payment_status AS paymentStatus, updated_at AS updatedAt
       FROM geet_meter_order WHERE LOWER(email) = LOWER(?) ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
  } else {
    return null;
  }

  const order = rows[0];
  if (!order) return null;

  const events = await queryGeserverhub(
    `SELECT status_key AS statusKey, note, event_at AS eventAt
     FROM geet_meter_order_event WHERE order_id = ? ORDER BY event_at ASC, id ASC`,
    [order.id]
  );

  return { ...order, events };
}

export function buildTimeline(shipmentStatus, labels) {
  return buildOrderTimeline(shipmentStatus, labels);
}

export { STATUS_ORDER };
