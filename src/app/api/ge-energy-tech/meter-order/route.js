import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  escapeHtml,
  getMissingSmtpEnv,
  getSmtpTransportOptions,
} from '@/lib/smtp-config';
import { formatThb, METER_ORDER_BANK } from '@/lib/meter-order';
import { insertMeterOrder, saveOrderFiles } from '@/lib/ge-energy-tech-db';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;

function readFile(field) {
  if (!field || typeof field === 'string') return null;
  if (field.size > MAX_BYTES) throw new Error('File too large (max 8 MB)');
  return field;
}

export async function POST(request) {
  try {
    const missing = getMissingSmtpEnv();
    const smtpOpts = getSmtpTransportOptions();
    if (missing.length > 0 || !smtpOpts.host) {
      return NextResponse.json(
        { error: 'Email service is not configured on the server.' },
        { status: 500 }
      );
    }

    const form = await request.formData();
    const buyerName = String(form.get('buyerName') || '').trim();
    const shipAddress = String(form.get('shipAddress') || '').trim();
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    const breakerSize = String(form.get('breakerSize') || '').trim();
    const machineKva = String(form.get('machineKva') || '').trim();
    const quantity = Math.max(1, parseInt(String(form.get('quantity') || '1'), 10) || 1);
    const unitPrice = parseInt(String(form.get('unitPrice') || '0'), 10);
    const totalPrice = parseInt(String(form.get('totalPrice') || '0'), 10);
    const lang = String(form.get('lang') || 'th').trim();

    const sitePhotoFile = readFile(form.get('sitePhoto'));
    const paymentSlipFile = readFile(form.get('paymentSlip'));

    if (!buyerName || !shipAddress || !email || !phone || !breakerSize || !machineKva) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!sitePhotoFile || !paymentSlipFile) {
      return NextResponse.json({ error: 'Site photo and payment slip are required' }, { status: 400 });
    }
    if (unitPrice <= 0 || totalPrice <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const orderId = `GE-MTR-${Date.now().toString(36).toUpperCase()}`;
    const unitFmt = formatThb(unitPrice);
    const totalFmt = formatThb(totalPrice);

    const siteBuf = Buffer.from(await sitePhotoFile.arrayBuffer());
    const slipBuf = Buffer.from(await paymentSlipFile.arrayBuffer());

    const sitePhoto = { name: sitePhotoFile.name, buf: siteBuf };
    const paymentSlip = { name: paymentSlipFile.name, buf: slipBuf };

    let dbSaved = false;
    try {
      const paths = await saveOrderFiles(orderId, sitePhoto, paymentSlip);
      await insertMeterOrder({
        orderNo: orderId,
        buyerName,
        shipAddress,
        email,
        phone,
        breakerSize,
        machineKva,
        quantity,
        unitPrice,
        totalPrice,
        lang,
        sitePhotoPath: paths.sitePhotoPath,
        paymentSlipPath: paths.paymentSlipPath,
      });
      dbSaved = true;
    } catch (dbErr) {
      console.error('[meter-order] DB save failed:', dbErr?.message || dbErr);
    }

    const attachments = [
      {
        filename: sitePhotoFile.name || 'site-photo.jpg',
        content: siteBuf,
        contentType: sitePhotoFile.type || 'image/jpeg',
      },
      {
        filename: paymentSlipFile.name || 'payment-slip.jpg',
        content: slipBuf,
        contentType: paymentSlipFile.type || 'image/jpeg',
      },
    ];

    const safe = {
      orderId: escapeHtml(orderId),
      buyerName: escapeHtml(buyerName),
      shipAddress: escapeHtml(shipAddress),
      email: escapeHtml(email),
      phone: escapeHtml(phone),
      breakerSize: escapeHtml(breakerSize),
      machineKva: escapeHtml(machineKva),
      quantity: escapeHtml(String(quantity)),
      unitFmt: escapeHtml(unitFmt),
      totalFmt: escapeHtml(totalFmt),
      lang: escapeHtml(lang),
    };

    const textBody = [
      `Order ID: ${orderId}`,
      `Product: GE-IoT Power Meter`,
      `Buyer: ${buyerName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Shipping: ${shipAddress}`,
      `Breaker: ${breakerSize} A`,
      `Machine kVA: ${machineKva}`,
      `Quantity: ${quantity}`,
      `Unit price: ${unitFmt}`,
      `Total: ${totalFmt}`,
      `Database: ${dbSaved ? 'saved to goeunserverhub' : 'email only (DB unavailable)'}`,
      '',
      `Bank: ${METER_ORDER_BANK.bankNameEn}`,
      `Account: ${METER_ORDER_BANK.accountNumber}`,
      `Name: ${METER_ORDER_BANK.accountName}`,
    ].join('\n');

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
        <h2 style="color:#166534;margin:0 0 12px">GE-IoT Power Meter — Order ${safe.orderId}</h2>
        <p><strong>Buyer:</strong> ${safe.buyerName}</p>
        <p><strong>Email:</strong> ${safe.email}</p>
        <p><strong>Phone:</strong> ${safe.phone}</p>
        <p><strong>Shipping address:</strong><br/>${safe.shipAddress}</p>
        <p><strong>Breaker:</strong> ${safe.breakerSize} A · <strong>kVA:</strong> ${safe.machineKva}</p>
        <p><strong>Quantity:</strong> ${safe.quantity}</p>
        <p><strong>Unit:</strong> ${safe.unitFmt} · <strong>Total:</strong> ${safe.totalFmt}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p><strong>${METER_ORDER_BANK.company}</strong><br/>
        ${METER_ORDER_BANK.bankNameEn}<br/>
        ${METER_ORDER_BANK.accountNumber}<br/>
        ${METER_ORDER_BANK.accountName}</p>
        <p style="font-size:12px;color:#64748b">Attachments: site photo, payment slip</p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      ...smtpOpts,
      tls: { minVersion: 'TLSv1.2' },
    });

    const from = process.env.SMTP_FROM_EMAIL?.trim() || process.env.SMTP_USER;
    const adminTo = process.env.CONTACT_TO_EMAIL?.trim() || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to: email,
      subject: `[GE Energy Tech] Order confirmation ${orderId}`,
      text: `Thank you for your order.\n\n${textBody}\n\nWe will verify your payment and contact you shortly.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="color:#166534">Order confirmed</h2>
          <p>Thank you, ${safe.buyerName}. Your GE-IoT Power Meter order has been received.</p>
          ${htmlBody}
          <p style="margin-top:16px">Please keep this email for your records.</p>
        </div>
      `,
      attachments,
    });

    await transporter.sendMail({
      from,
      to: adminTo,
      replyTo: email,
      subject: `[GE Energy Tech] New meter order ${orderId} — ${buyerName}`,
      text: textBody,
      html: htmlBody,
      attachments,
    });

    return NextResponse.json({ ok: true, orderId, dbSaved });
  } catch (err) {
    console.error('[meter-order]', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
