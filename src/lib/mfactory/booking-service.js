import { getPrisma } from '@/lib/prisma';
import { ensureMFactoryInquirySchema } from '@/lib/mfactory/ensure-inquiry-schema';

function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseBookingDate(value) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {Record<string, unknown>} body
 */
export async function createMFactoryBooking(body) {
  await ensureMFactoryInquirySchema();

  const name = trim(body.name);
  if (!name) {
    return { ok: false, status: 400, error: 'กรุณากรอกชื่อ' };
  }

  const company = trim(body.company);
  const phone = trim(body.phone);
  const email = trim(body.email);
  const taxId = trim(body.taxId);
  const address = trim(body.address);
  const warehouse = trim(body.warehouse);
  const rentalType = trim(body.rentalType);
  const paymentRef = trim(body.paymentRef || body.paymentFileName);
  const message = trim(body.message);
  const type = trim(body.type) || 'factory';
  const lang = trim(body.lang) || 'th';
  const source = trim(body.source) || 'mfac-booking';
  const bookingDate = parseBookingDate(body.bookingDate);

  const prisma = getPrisma();
  if (!prisma) {
    return { ok: false, status: 503, error: 'Database unavailable' };
  }

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
    },
  });

  return {
    ok: true,
    status: 201,
    id: inquiry.id,
    createdAt: inquiry.createdAt,
  };
}
