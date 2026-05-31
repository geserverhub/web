function isInvestmentType(type) {
  return type === 'PARTNER_INVESTMENT';
}

/**
 * เงินลงทุนคงเหลือรายเดือน = ยอดเดือนก่อน + เงินลงทุนใหม่ − รายจ่าย
 */
export function computeMonthlyInvestmentBalances(monthlyRows, openingBalance = 0) {
  let balance = Number(openingBalance) || 0;
  let hasActivity = balance !== 0;

  return (monthlyRows || []).map((m) => {
    const inv = Number(m.investment) || 0;
    const exp = Number(m.expense) || 0;
    if (inv > 0 || exp > 0) hasActivity = true;

    if (!hasActivity) {
      return { ...m, investmentBalance: null };
    }

    balance = balance + inv - exp;
    return { ...m, investmentBalance: balance };
  });
}

/** Sum KRW investment minus expense before a date (for year opening balance). */
export function sumInvestmentBalanceBefore(transactions, beforeDate) {
  const cutoff = beforeDate instanceof Date ? beforeDate : new Date(beforeDate);
  let balance = 0;
  for (const t of transactions) {
    if (t.status === 'CANCELLED' || t.currency !== 'KRW') continue;
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime()) || d >= cutoff) continue;
    if (isInvestmentType(t.type)) balance += Number(t.amount);
    else if (t.type === 'EXPENSE') balance -= Number(t.amount);
  }
  return balance;
}
