import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { queryGe } from '@/lib/mysql-ge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

async function ensureSchema() {
  await queryGe(`
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
      site_photo_path VARCHAR(512) NOT NULL,
      payment_slip_path VARCHAR(512) NOT NULL,
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
}

function cleanFileName(name: string) {
  return String(name || 'file').replace(/[^\w.\-]+/g, '_');
}

async function saveUpload(orderNo: string, subdir: string, file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`File too large: ${file.name}`);
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const folder = path.join(process.cwd(), 'public', 'uploads', 'customer-energy-orders', orderNo, subdir);
  await fs.mkdir(folder, { recursive: true });
  const filename = `${Date.now()}_${cleanFileName(file.name)}`;
  const absPath = path.join(folder, filename);
  await fs.writeFile(absPath, bytes);
  return `/uploads/customer-energy-orders/${orderNo}/${subdir}/${filename}`;
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const form = await req.formData();

    const customerName = String(form.get('customerName') || '').trim();
    const shippingAddress = String(form.get('shippingAddress') || '').trim();
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    const breakerSize = String(form.get('breakerSize') || '').trim();
    const machineKva = String(form.get('machineKva') || '').trim();
    const quantity = Math.max(1, Number(form.get('quantity') || 1));
    const unitPrice = Math.max(0, Number(form.get('unitPrice') || 0));
    const totalPrice = Math.max(0, Number(form.get('totalPrice') || 0));

    const sitePhoto = form.get('sitePhoto');
    const paymentSlip = form.get('paymentSlip');
    const billFiles = form.getAll('monthlyBills');

    if (
      !customerName ||
      !shippingAddress ||
      !email ||
      !phone ||
      !breakerSize ||
      !machineKva
    ) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (!(sitePhoto instanceof File) || !(paymentSlip instanceof File)) {
      return NextResponse.json({ success: false, error: 'Site photo and payment slip are required' }, { status: 400 });
    }

    const validBillFiles = billFiles.filter((f) => f instanceof File) as File[];
    if (validBillFiles.length !== 12) {
      return NextResponse.json(
        { success: false, error: 'Please upload exactly 12 monthly electricity bills' },
        { status: 400 }
      );
    }

    const orderNo = `GES-${Date.now().toString(36).toUpperCase()}`;
    const sitePhotoPath = await saveUpload(orderNo, 'site-photo', sitePhoto);
    const paymentSlipPath = await saveUpload(orderNo, 'payment-slip', paymentSlip);

    const monthlyBillPaths: string[] = [];
    for (const bill of validBillFiles) {
      monthlyBillPaths.push(await saveUpload(orderNo, 'monthly-bills', bill));
    }

    await queryGe(
      `INSERT INTO ge_customer_energy_saver_orders
      (order_no, customer_name, shipping_address, email, phone, breaker_size, machine_kva,
       quantity, unit_price, total_price, site_photo_path, payment_slip_path,
       monthly_bill_paths_json, monthly_bill_count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        orderNo,
        customerName,
        shippingAddress,
        email,
        phone,
        breakerSize,
        machineKva,
        quantity,
        Math.round(unitPrice),
        Math.round(totalPrice),
        sitePhotoPath,
        paymentSlipPath,
        JSON.stringify(monthlyBillPaths),
        monthlyBillPaths.length,
      ]
    );

    return NextResponse.json({
      success: true,
      orderNo,
      monthlyBillCount: monthlyBillPaths.length,
    });
  } catch (error) {
    console.error('customer-energy-saver-order POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to submit order' },
      { status: 500 }
    );
  }
}
