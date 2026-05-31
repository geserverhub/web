import { getPrisma } from '@/lib/prisma';
import { ensureMFactoryInquirySchema } from '@/lib/mfactory/ensure-inquiry-schema';
import { isValidMfactoryStatus, normalizeMfactoryStatus } from '@/lib/mfactory/booking-status';

function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseBookingDate(value) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function makeBookingNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MF-${date}-${suffix}`;
}

/** @param {import('@prisma/client').PrismaClient} prisma */
async function nextBookingNumber(prisma) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bookingNumber = makeBookingNumber();
    const existing = await prisma.mFactoryInquiry.findUnique({
      where: { bookingNumber },
      select: { id: true },
    });
    if (!existing) return bookingNumber;
  }
  return `MF-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * @param {Record<string, unknown>} body
 */
export async function createMFactoryBooking(body) {
  await ensureMFactoryInquirySchema();

  const name = trim(body.name);
  if (!name) {
    return { ok: false, status: 400, error: 'กรุณากรอกชื่อ - นามสกุล' };
  }

  const company = trim(body.company);
  const phone = trim(body.phone);
  const email = trim(body.email);
  const taxId = trim(body.taxId);
  const address = trim(body.address);
  const warehouse = trim(body.warehouse);
  const rentalType = trim(body.rentalType);

  if (!phone) {
    return { ok: false, status: 400, error: 'กรุณากรอกเบอร์โทร' };
  }
  if (!email) {
    return { ok: false, status: 400, error: 'กรุณากรอกอีเมล' };
  }
  if (!address) {
    return { ok: false, status: 400, error: 'กรุณากรอกที่อยู่' };
  }
  if (!warehouse) {
    return { ok: false, status: 400, error: 'กรุณาเลือกประเภทโกดัง' };
  }
  if (!rentalType) {
    return { ok: false, status: 400, error: 'กรุณาเลือกประเภทการจอง' };
  }

  const paymentRef = trim(body.paymentRef || body.paymentFileName);
  if (!paymentRef) {
    return { ok: false, status: 400, error: 'กรุณาอัปโหลดหลักฐานการชำระเงิน' };
  }

  const termsAccepted = body.termsAccepted !== false && body.termsAccepted !== 'false';
  if (!termsAccepted) {
    return { ok: false, status: 400, error: 'กรุณาติกยอมรับเงื่อนไขการจอง' };
  }

  const message = trim(body.message);
  const type = trim(body.type) || 'factory';
  const lang = trim(body.lang) || 'th';
  const source = trim(body.source) || 'mfac-booking';
  const bookingDate = parseBookingDate(body.bookingDate);

  const prisma = getPrisma();
  if (!prisma) {
    return { ok: false, status: 503, error: 'Database unavailable' };
  }

  const bookingNumber = await nextBookingNumber(prisma);

  const inquiry = await prisma.mFactoryInquiry.create({
    data: {
      type,
      lang,
      source: source || null,
      company: company || null,
      name,
      phone: phone || null,
      email: email || null,
      taxId: taxId || null,
      bookingDate,
      address: address || null,
      warehouse: warehouse || null,
      rentalType: rentalType || null,
      paymentRef: paymentRef || null,
      message: message || null,
      bookingNumber,
      status: 'SUBMITTED',
      termsAccepted: true,
    },
  });

  return {
    ok: true,
    status: 201,
    id: inquiry.id,
    bookingNumber: inquiry.bookingNumber,
    createdAt: inquiry.createdAt,
  };
}

/** @param {{ limit?: number }} [opts] */
export async function listMFactoryBookings(opts = {}) {
  await ensureMFactoryInquirySchema();

  const prisma = getPrisma();
  if (!prisma) {
    return { ok: false, status: 503, error: 'Database unavailable', bookings: [] };
  }

  const limit = Math.min(Math.max(Number(opts.limit) || 200, 1), 500);

  const rows = await prisma.mFactoryInquiry.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return {
    ok: true,
    status: 200,
    count: rows.length,
    bookings: rows.map((r) => ({
      id: r.id,
      bookingNumber: r.bookingNumber,
      status: r.status,
      type: r.type,
      lang: r.lang,
      source: r.source,
      company: r.company,
      name: r.name,
      phone: r.phone,
      email: r.email,
      taxId: r.taxId,
      bookingDate: r.bookingDate,
      address: r.address,
      warehouse: r.warehouse,
      rentalType: r.rentalType,
      paymentRef: r.paymentRef,
      message: r.message,
      termsAccepted: r.termsAccepted,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  };
}

/** @param {string} id @param {string} status */
export async function updateMFactoryBookingStatus(id, status) {
  await ensureMFactoryInquirySchema();

  const trimmedId = typeof id === 'string' ? id.trim() : '';
  const nextStatus = typeof status === 'string' ? status.trim() : '';

  if (!trimmedId) {
    return { ok: false, status: 400, error: 'Missing booking id' };
  }
  if (!isValidMfactoryStatus(nextStatus)) {
    return { ok: false, status: 400, error: 'Invalid status' };
  }

  const prisma = getPrisma();
  if (!prisma) {
    return { ok: false, status: 503, error: 'Database unavailable' };
  }

  try {
    const updated = await prisma.mFactoryInquiry.update({
      where: { id: trimmedId },
      data: { status: nextStatus },
    });

    return {
      ok: true,
      status: 200,
      booking: {
        id: updated.id,
        bookingNumber: updated.bookingNumber,
        status: updated.status,
        statusLabel: normalizeMfactoryStatus(updated.status),
        updatedAt: updated.updatedAt,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    if (message.includes('Record to update not found')) {
      return { ok: false, status: 404, error: 'Booking not found' };
    }
    return { ok: false, status: 500, error: message };
  }
}
