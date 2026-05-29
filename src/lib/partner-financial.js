import prisma from '@/lib/prisma';

const REVENUE_TYPES = new Set(['SALE', 'PROFIT_SHARE']);
const INVESTMENT_TYPES = new Set(['PARTNER_INVESTMENT']);

export { REVENUE_TYPES, INVESTMENT_TYPES };

export function isRevenueType(type) {
  return REVENUE_TYPES.has(type);
}

export function isInvestmentType(type) {
  return INVESTMENT_TYPES.has(type);
}

/** Resolve display name for profit-share / investment rows. */
export function resolvePartnerPersonName(t) {
  const direct = String(t.customerName || '').trim();
  if (direct) return direct;

  const text = `${t.description || ''} ${t.notes || ''}`;
  if (/파위니|pawinee|복녀/i.test(text)) return '복녀파위니';
  if (/동규|강동규|김동규/i.test(text)) return '김동규 부사님';

  return 'ไม่ระบุ';
}

/** Upsert person ledger row when profit-share or investment transaction changes. */
export async function syncPartnerPersonFinancialFromTransaction(tx) {
  if (!tx || tx.status === 'CANCELLED') return;
  if (!isRevenueType(tx.type) && !isInvestmentType(tx.type)) return;
  if (tx.type === 'SALE') return;

  const ledgerType = isInvestmentType(tx.type) ? 'INVESTMENT' : 'PROFIT_SHARE';
  const personName = resolvePartnerPersonName(tx);

  if (tx.id) {
    await prisma.partnerPersonFinancial.upsert({
      where: { transactionId: tx.id },
      create: {
        personName,
        ledgerType,
        amount: tx.amount,
        currency: tx.currency || 'KRW',
        transactionId: tx.id,
        recordedAt: tx.date || new Date(),
        notes: tx.notes || null,
      },
      update: {
        personName,
        ledgerType,
        amount: tx.amount,
        currency: tx.currency || 'KRW',
        recordedAt: tx.date || new Date(),
        notes: tx.notes || null,
      },
    });
    return;
  }

  await prisma.partnerPersonFinancial.create({
    data: {
      personName,
      ledgerType,
      amount: tx.amount,
      currency: tx.currency || 'KRW',
      recordedAt: tx.date || new Date(),
      notes: tx.notes || null,
    },
  });
}

/** Persist monthly snapshot for a given year/month. */
export async function syncPartnerMonthlyFinancial(year, month, { revenueKrw, investmentKrw, expenseKrw }) {
  if (revenueKrw === 0 && investmentKrw === 0 && expenseKrw === 0) return;

  await prisma.partnerMonthlyFinancial.upsert({
    where: { year_month: { year, month } },
    create: { year, month, revenueKrw, investmentKrw, expenseKrw },
    update: { revenueKrw, investmentKrw, expenseKrw },
  });
}

export function buildPartnerIncomeSummary(transactions) {
  const partnerIncomeMap = {};

  for (const t of transactions) {
    if (t.status === 'CANCELLED') continue;
    const name = resolvePartnerPersonName(t);
    if (!partnerIncomeMap[name]) {
      partnerIncomeMap[name] = { profitShare: 0, investment: 0, byCurrency: {} };
    }

    if (t.type === 'PROFIT_SHARE') {
      if (t.currency === 'KRW') {
        partnerIncomeMap[name].profitShare += Number(t.amount);
      } else {
        partnerIncomeMap[name].byCurrency[t.currency] = (partnerIncomeMap[name].byCurrency[t.currency] || 0) + Number(t.amount);
      }
    } else if (t.type === 'PARTNER_INVESTMENT') {
      if (t.currency === 'KRW') {
        partnerIncomeMap[name].investment += Number(t.amount);
      } else {
        const key = `${t.currency}_invest`;
        partnerIncomeMap[name].byCurrency[key] = (partnerIncomeMap[name].byCurrency[key] || 0) + Number(t.amount);
      }
    }
  }

  return Object.entries(partnerIncomeMap)
    .map(([name, data]) => ({
      name,
      profitShare: data.profitShare,
      investment: data.investment,
      total: data.profitShare + data.investment,
      byCurrency: data.byCurrency,
    }))
    .sort((a, b) => b.total - a.total);
}
