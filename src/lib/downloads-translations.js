const UI = {
  th: {
    pageTitle: "ดาวน์โหลดโปรแกรมและไฟล์",
    pageSubtitle:
      "เลือกรายการ → ชำระเงิน (Stripe) หรืออัปโหลดสลิป → ดาวน์โหลดได้เมื่อสถานะเป็น「ชำระเงินแล้ว」",
    headerSubtitle: "ดาวน์โหลดซอฟต์แวร์",
    catalogTitle: "รายการดาวน์โหลด",
    loading: "กำลังโหลด...",
    orderSection: "สั่งซื้อ / รับไฟล์",
    emailLabel: "อีเมล (ใช้ตรวจสอบคำสั่งซื้อ)",
    selectLabel: "เลือกจากรายการด้านบน",
    selectPlaceholder: "— เลือกโปรแกรม —",
    lookupSection: "ตรวจสอบคำสั่งซื้อและดาวน์โหลด",
    orderCodeLabel: "รหัสคำสั่งซื้อ",
    checkBtn: "ตรวจสอบ",
    downloadBtn: "ดาวน์โหลด",
    downloadFreeBtn: "ดาวน์โหลดฟรี",
    free: "ฟรี",
    won: "วอน",
    orderCodePrefix: "รหัส",
    statusLabel: "สถานะ",
    downloadable: "ดาวน์โหลดได้",
    payHint: "ชำระด้วยบัตรผ่าน Stripe หรืออัปโหลดสลิปโอนเงิน (รอแอดมินยืนยัน)",
    payStripe: "ชำระด้วยบัตร (Stripe)",
    uploadSlipLabel: "อัปโหลดสลิปโอนเงิน",
    sendSlip: "ส่งสลิป",
    fileFallback: "ไฟล์",
    langLabel: "ภาษา",
    selectProgram: "กรุณาเลือกโปรแกรม",
    enterEmail: "กรุณากรอกอีเมล",
    enterEmailFirst: "กรอกอีเมลด้านล่างก่อน แล้วกดดาวน์โหลดอีกครั้ง",
    loadProductsFailed: "โหลดรายการไม่สำเร็จ",
    orderNotFound: "ไม่พบคำสั่งซื้อ",
    createOrderFailed: "สร้างคำสั่งซื้อไม่สำเร็จ",
    payRedirect: "กรุณาชำระเงินก่อนดาวน์โหลด — กำลังเปิดหน้าชำระเงิน...",
    orderCreated: "สร้างคำสั่งซื้อแล้ว",
    orderCreatedFree: "สร้างคำสั่งซื้อแล้ว — ดาวน์โหลดได้ทันที (ฟรี)",
    paidSuccess: "ชำระเงินสำเร็จ — ตรวจสอบสถานะด้านล่างแล้วกดดาวน์โหลด",
    chooseSlip: "เลือกไฟล์สลิปก่อน",
    uploadFailed: "อัปโหลดไม่สำเร็จ",
    slipUploaded: "อัปโหลดสลิปแล้ว — รอเจ้าหน้าที่ยืนยันการชำระเงิน",
    statusUpdated: "อัปเดตสถานะแล้ว",
    checkoutFailed: "เปิดหน้าชำระเงินไม่สำเร็จ",
    status: {
      PENDING: "รอชำระเงิน",
      AWAITING_REVIEW: "รอตรวจสอบสลิป",
      PAID: "ชำระเงินแล้ว — ดาวน์โหลดได้",
      CANCELLED: "ยกเลิก",
    },
  },
  en: {
    pageTitle: "Download software & files",
    pageSubtitle:
      "Choose an item → pay (Stripe) or upload a transfer slip → download when status is「Paid」",
    headerSubtitle: "Software downloads",
    catalogTitle: "Download catalog",
    loading: "Loading...",
    orderSection: "Order / get file",
    emailLabel: "Email (used to verify your order)",
    selectLabel: "Select from the list above",
    selectPlaceholder: "— Select program —",
    lookupSection: "Check order & download",
    orderCodeLabel: "Order code",
    checkBtn: "Check status",
    downloadBtn: "Download",
    downloadFreeBtn: "Free download",
    free: "Free",
    won: "KRW",
    orderCodePrefix: "Code",
    statusLabel: "Status",
    downloadable: "Ready to download",
    payHint: "Pay by card via Stripe or upload a bank transfer slip (admin approval required)",
    payStripe: "Pay by card (Stripe)",
    uploadSlipLabel: "Upload transfer slip",
    sendSlip: "Submit slip",
    fileFallback: "file",
    langLabel: "Language",
    selectProgram: "Please select a program",
    enterEmail: "Please enter your email",
    enterEmailFirst: "Enter your email below, then click download again",
    loadProductsFailed: "Failed to load catalog",
    orderNotFound: "Order not found",
    createOrderFailed: "Could not create order",
    payRedirect: "Payment required — opening checkout...",
    orderCreated: "Order created",
    orderCreatedFree: "Order created — you can download immediately (free)",
    paidSuccess: "Payment successful — check status below and download",
    chooseSlip: "Please choose a slip file first",
    uploadFailed: "Upload failed",
    slipUploaded: "Slip uploaded — waiting for admin confirmation",
    statusUpdated: "Status updated",
    checkoutFailed: "Could not open checkout",
    status: {
      PENDING: "Awaiting payment",
      AWAITING_REVIEW: "Slip under review",
      PAID: "Paid — download available",
      CANCELLED: "Cancelled",
    },
  },
  ko: {
    pageTitle: "프로그램 및 파일 다운로드",
    pageSubtitle:
      "항목 선택 → 결제(Stripe) 또는 이체 영수증 업로드 → 상태가「결제 완료」일 때 다운로드",
    headerSubtitle: "소프트웨어 다운로드",
    catalogTitle: "다운로드 목록",
    loading: "불러오는 중...",
    orderSection: "주문 / 파일 받기",
    emailLabel: "이메일 (주문 확인용)",
    selectLabel: "위 목록에서 선택",
    selectPlaceholder: "— 프로그램 선택 —",
    lookupSection: "주문 확인 및 다운로드",
    orderCodeLabel: "주문 코드",
    checkBtn: "확인",
    downloadBtn: "다운로드",
    downloadFreeBtn: "무료 다운로드",
    free: "무료",
    won: "원",
    orderCodePrefix: "코드",
    statusLabel: "상태",
    downloadable: "다운로드 가능",
    payHint: "Stripe 카드 결제 또는 이체 영수증 업로드 (관리자 승인 필요)",
    payStripe: "카드 결제 (Stripe)",
    uploadSlipLabel: "이체 영수증 업로드",
    sendSlip: "영수증 제출",
    fileFallback: "파일",
    langLabel: "언어",
    selectProgram: "프로그램을 선택해 주세요",
    enterEmail: "이메일을 입력해 주세요",
    enterEmailFirst: "아래 이메일을 입력한 후 다시 다운로드를 눌러 주세요",
    loadProductsFailed: "목록을 불러오지 못했습니다",
    orderNotFound: "주문을 찾을 수 없습니다",
    createOrderFailed: "주문 생성 실패",
    payRedirect: "결제 후 다운로드 가능 — 결제 페이지로 이동 중...",
    orderCreated: "주문이 생성되었습니다",
    orderCreatedFree: "주문 생성 완료 — 즉시 다운로드 가능 (무료)",
    paidSuccess: "결제 완료 — 아래 상태를 확인한 후 다운로드하세요",
    chooseSlip: "영수증 파일을 먼저 선택해 주세요",
    uploadFailed: "업로드 실패",
    slipUploaded: "영수증 업로드 완료 — 관리자 확인 대기 중",
    statusUpdated: "상태가 업데이트되었습니다",
    checkoutFailed: "결제 페이지를 열 수 없습니다",
    status: {
      PENDING: "결제 대기",
      AWAITING_REVIEW: "영수증 검토 중",
      PAID: "결제 완료 — 다운로드 가능",
      CANCELLED: "취소됨",
    },
  },
};

export const DOWNLOADS_LOCALES = [
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
];

const PRODUCT_I18N = {
  "phone-remote-android": {
    th: {
      title: "Phone Remote — แอป Android",
      description: "แอปรีโมทและแชร์หน้าจอ พร้อมควบคุมจาก Viewer หลังเปิด Accessibility",
    },
    en: {
      title: "Phone Remote (Android)",
      description: "Remote control and screen sharing — Viewer can control the host after Accessibility is enabled",
    },
    ko: {
      title: "Phone Remote (Android)",
      description: "원격 제어 및 화면 공유 — Accessibility 활성화 후 Viewer가 호스트를 제어할 수 있습니다",
    },
  },
  "momoge-space-android": {
    th: {
      title: "Momoge space — แอป Android",
      description: "แอป Customer Dashboard สำหรับ Momoge space",
    },
    en: {
      title: "Momoge space (Android)",
      description: "Customer Dashboard app for Momoge space",
    },
    ko: {
      title: "Momoge space (Android)",
      description: "Momoge space 고객 대시보드 앱",
    },
  },
  "cargo-android": {
    th: {
      title: "คาโก้ ไทย-เกาหลี — แอป Android",
      description: "แอพ บริการส่งสินค้าจากไทย ไปเกาหลี",
    },
    en: {
      title: "Cargo Thailand–Korea (Android)",
      description: "Shipping service app from Thailand to Korea",
    },
    ko: {
      title: "카고 태국–한국 (Android)",
      description: "태국에서 한국으로 물품 배송 서비스 앱",
    },
  },
};

export function normalizeDownloadsLocale(locale) {
  if (locale === "en" || locale === "ko") return locale;
  return "th";
}

export function getDownloadsT(locale) {
  return UI[normalizeDownloadsLocale(locale)];
}

export function getProductDisplay(product, locale) {
  if (!product) return { title: "", description: "" };
  const loc = normalizeDownloadsLocale(locale);
  const localized = PRODUCT_I18N[product.slug]?.[loc];
  if (localized) return localized;
  if (loc === "th") {
    return {
      title: product.titleTh || product.title,
      description: product.description,
    };
  }
  return {
    title: product.title || product.titleTh,
    description: product.description,
  };
}

export function formatDownloadPrice(product, locale, t) {
  if (!product || product.free || product.price <= 0) return t.free;
  const loc = normalizeDownloadsLocale(locale);
  if (product.currency === "KRW") {
    const n = product.price.toLocaleString(loc === "ko" ? "ko-KR" : "en-US");
    return loc === "ko" ? `${n}${t.won}` : loc === "en" ? `₩${n}` : `${n} ${t.won}`;
  }
  return `${product.price.toLocaleString()} ${product.currency}`;
}
