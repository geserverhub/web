import { METER_ORDER_BANK } from "@/lib/meter-order";

/** Bank transfer details for /downloads paid orders (override via env). */
export const SOFTWARE_DOWNLOAD_BANK = {
  company:
    process.env.SOFTWARE_DOWNLOAD_BANK_COMPANY?.trim() || METER_ORDER_BANK.company,
  bankNameTh:
    process.env.SOFTWARE_DOWNLOAD_BANK_NAME_TH?.trim() || METER_ORDER_BANK.bankNameTh,
  bankNameEn:
    process.env.SOFTWARE_DOWNLOAD_BANK_NAME_EN?.trim() || METER_ORDER_BANK.bankNameEn,
  accountNumber:
    process.env.SOFTWARE_DOWNLOAD_BANK_ACCOUNT?.trim() || METER_ORDER_BANK.accountNumber,
  accountName:
    process.env.SOFTWARE_DOWNLOAD_BANK_ACCOUNT_NAME?.trim() ||
    METER_ORDER_BANK.accountName,
};

export function getSoftwareDownloadBank(locale = "th") {
  const loc = locale === "en" || locale === "ko" ? locale : "th";
  return {
    company: SOFTWARE_DOWNLOAD_BANK.company,
    bankName:
      loc === "th"
        ? SOFTWARE_DOWNLOAD_BANK.bankNameTh
        : SOFTWARE_DOWNLOAD_BANK.bankNameEn,
    accountNumber: SOFTWARE_DOWNLOAD_BANK.accountNumber,
    accountName: SOFTWARE_DOWNLOAD_BANK.accountName,
  };
}

export function bankToPublicJson() {
  return {
    company: SOFTWARE_DOWNLOAD_BANK.company,
    bankNameTh: SOFTWARE_DOWNLOAD_BANK.bankNameTh,
    bankNameEn: SOFTWARE_DOWNLOAD_BANK.bankNameEn,
    accountNumber: SOFTWARE_DOWNLOAD_BANK.accountNumber,
    accountName: SOFTWARE_DOWNLOAD_BANK.accountName,
  };
}
