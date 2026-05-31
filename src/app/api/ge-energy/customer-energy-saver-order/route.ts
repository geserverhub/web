import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { queryGe } from '@/lib/mysql-ge';
import { ensureEnergySaverOrderSchema } from '@/lib/ge-energy/ensure-energy-saver-schema';
import { requireCustomerDashboardAuth } from '@/lib/customer-dashboard-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

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
    const auth = requireCustomerDashboardAuth(req);
    if (auth.ok === false) return auth.response;

    await ensureEnergySaverOrderSchema();
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
    if (validBillFiles.length > 12) {
      return NextResponse.json(
        { success: false, error: 'You can upload at most 12 monthly electricity bills' },
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
