"use client";
import { useState, useRef, useEffect } from "react";
import { FlagSVG } from "../../FlagSVG";

const L = {
  th: {
    title: "ปริ้นรายงาน",
    subtitle: "เลือกประเภทเอกสารและช่วงเวลา",
    reportType: "ประเภทรายงาน",
    period: "ช่วงเวลา",
    month: "เดือน",
    year: "ปี",
    allTime: "ทั้งหมด",
    loadPreview: "โหลดตัวอย่าง",
    print: "🖨️ พิมพ์",
    loading: "กำลังโหลด...",
    noData: "ไม่มีข้อมูล",
    store: "ร้านเจริญไทยมาร์ท ซูวอน",
    total: "รวม",
    subtotal: "ยอดก่อน VAT",
    tax: "VAT 10%",
    grand: "ยอดรวมสุทธิ",
    profit: "กำไรขั้นต้น",
    netProfit: "กำไรสุทธิ",
    revenue: "ยอดขาย",
    expense: "รายจ่าย",
    date: "วันที่",
    number: "เลขที่",
    customer: "ลูกค้า",
    items: "รายการ",
    amount: "ยอดเงิน",
    payment: "วิธีชำระ",
    category: "หมวดหมู่",
    description: "รายละเอียด",
    note: "หมายเหตุ",
    name: "ชื่อ",
    phone: "โทร",
    email: "อีเมล",
    address: "ที่อยู่",
    code: "รหัส",
    barcode: "บาร์โค้ด",
    price: "ราคา",
    buyPrice: "ต้นทุน",
    stock: "สต็อก",
    unit: "หน่วย",
    types: {
      sales: "รายงานยอดขาย",
      expenses: "รายงานรายจ่าย",
      pnl: "รายงานกำไร-ขาดทุน",
      products: "รายการสินค้า",
      customers: "รายการลูกค้า",
      suppliers: "รายการคู่ค้า",
      invoice: "ใบแจ้งหนี้ / แจ้งชำระเงิน",
      purchaseOrder: "ใบสั่งซื้อ",
    },
    generated: "พิมพ์เมื่อ",
    issueDate: "วันที่ออกบิล",
    selectCustomer: "เลือกลูกค้า",
    chooseCustomer: "-- เลือกลูกค้า --",
    billTo: "ลูกค้า",
    dueDate: "กำหนดชำระ",
    bankTransfer: "ช่องทางการชำระเงิน / โอนเข้าบัญชี",
    selectInvoices: "เลือกบิล INV ที่ต้องการแสดง",
    selectAll: "เลือกทั้งหมด",
    deselectAll: "ไม่เลือก",
    noInvoiceSelected: "กรุณาเลือกบิล INV อย่างน้อย 1 รายการ",
    noSalesForCustomer: "ลูกค้ารายนี้ยังไม่มีบิล INV",
    printReceipt: "พิมพ์ใบเสร็จอย่างย่อ",
    totalDue: "ยอดที่ต้องชำระทั้งหมด",
    pleasePay: "กรุณาชำระเงินภายในกำหนด ขอบคุณค่ะ",
    receiptThanks: "ขอบคุณที่ใช้บริการค่ะ",
    noCustomerSelected: "กรุณาเลือกลูกค้าก่อนโหลดตัวอย่าง",
    selectSupplier: "เลือกคู่ค้า",
    chooseSupplier: "-- เลือกคู่ค้า --",
    poTo: "คู่ค้า",
    selectPOs: "เลือกใบสั่งซื้อที่ต้องการแสดง",
    noPOSelected: "กรุณาเลือกใบสั่งซื้ออย่างน้อย 1 รายการ",
    noPOForSupplier: "คู่ค้ารายนี้ยังไม่มีใบสั่งซื้อ",
    noSupplierSelected: "กรุณาเลือกคู่ค้าก่อนโหลดตัวอย่าง",
    billNo: "เลขที่บิล",
    paymentTerms: "เงื่อนไขชำระเงิน",
    totalPO: "ยอดสั่งซื้อทั้งหมด",
    qty: "จำนวน",
    unitCost: "ราคา/หน่วย",
    poSubtotal: "รวมบิลนี้",
    storeTagline: "สินค้าไทยคุณภาพสูงในเกาหลีใต้",
    docNoLabel: "เลขที่เอกสาร / Doc No.",
    noSupplierBankInfo: "— ยังไม่มีข้อมูลเลขบัญชีของคู่ค้ารายนี้ —",
    bankKookmin: "ธนาคารกุ๊กมิน KOOKMIN BANK · 217001-04-249820",
    footerDoc: "เอกสารนี้จัดทำโดยระบบ GEserverhub",
    previewHintBefore: 'กด “',
    previewHintAfter: '” เพื่อดูตัวอย่างรายงาน',
    receiptTitle: "ใบเสร็จอย่างย่อ / RECEIPT",
    paidStamp: "ชำระเงินแล้ว",
    productCountLabel: "จำนวนสินค้าทั้งหมด",
    customerCountLabel: "จำนวนลูกค้า",
    supplierCountLabel: "จำนวนคู่ค้า",
    itemsSuffix: "รายการ",
    personSuffix: "ราย",
    productCost: "ต้นทุนสินค้า",
    overview: "สรุปภาพรวม",
  },
  ko: {
    title: "보고서 인쇄",
    subtitle: "문서 유형 및 기간 선택",
    reportType: "보고서 유형",
    period: "기간",
    month: "월",
    year: "연도",
    allTime: "전체",
    loadPreview: "미리보기",
    print: "🖨️ 인쇄",
    loading: "로딩 중...",
    noData: "데이터 없음",
    store: "차로엔 타이 마트 수원",
    total: "합계",
    subtotal: "공급가액",
    tax: "부가세 10%",
    grand: "합계금액",
    profit: "매출총이익",
    netProfit: "순이익",
    revenue: "매출",
    expense: "지출",
    date: "날짜",
    number: "번호",
    customer: "고객",
    items: "품목",
    amount: "금액",
    payment: "결제방법",
    category: "분류",
    description: "설명",
    note: "비고",
    name: "이름",
    phone: "전화",
    email: "이메일",
    address: "주소",
    code: "코드",
    barcode: "바코드",
    price: "판매가",
    buyPrice: "원가",
    stock: "재고",
    unit: "단위",
    types: {
      sales: "매출 보고서",
      expenses: "지출 보고서",
      pnl: "손익 보고서",
      products: "상품 목록",
      customers: "고객 목록",
      suppliers: "공급업체 목록",
      invoice: "청구서 / 결제 안내",
      purchaseOrder: "구매 주문서",
    },
    generated: "출력일시",
    issueDate: "발행일",
    selectCustomer: "고객 선택",
    chooseCustomer: "-- 고객 선택 --",
    billTo: "고객",
    dueDate: "결제 기한",
    bankTransfer: "결제 방법 / 계좌이체",
    selectInvoices: "표시할 INV 청구서 선택",
    selectAll: "전체 선택",
    deselectAll: "선택 해제",
    noInvoiceSelected: "최소 1개의 INV 청구서를 선택하세요",
    noSalesForCustomer: "이 고객은 아직 INV 청구서가 없습니다",
    printReceipt: "간이 영수증 인쇄",
    totalDue: "총 청구 금액",
    pleasePay: "기한 내에 결제 부탁드립니다. 감사합니다.",
    receiptThanks: "이용해 주셔서 감사합니다",
    noCustomerSelected: "먼저 고객을 선택해 주세요",
    selectSupplier: "공급업체 선택",
    chooseSupplier: "-- 공급업체 선택 --",
    poTo: "공급업체",
    selectPOs: "표시할 구매 주문서 선택",
    noPOSelected: "최소 1개의 구매 주문서를 선택하세요",
    noPOForSupplier: "이 공급업체는 아직 구매 주문서가 없습니다",
    noSupplierSelected: "먼저 공급업체를 선택해 주세요",
    billNo: "청구서 번호",
    paymentTerms: "결제 조건",
    totalPO: "총 발주 금액",
    qty: "수량",
    unitCost: "단가",
    poSubtotal: "이 주문서 합계",
    storeTagline: "한국 내 최고 품질의 태국 상품",
    docNoLabel: "문서번호 / Doc No.",
    noSupplierBankInfo: "— 이 공급업체의 계좌 정보가 없습니다 —",
    bankKookmin: "국민은행 KOOKMIN BANK · 217001-04-249820",
    footerDoc: "이 문서는 GEserverhub 시스템에서 작성되었습니다",
    previewHintBefore: '“',
    previewHintAfter: '”을 클릭해 미리보기',
    receiptTitle: "간이 영수증 / RECEIPT",
    paidStamp: "결제완료",
    productCountLabel: "총 상품 수",
    customerCountLabel: "총 고객 수",
    supplierCountLabel: "총 공급업체 수",
    itemsSuffix: "개",
    personSuffix: "명",
    productCost: "상품 원가",
    overview: "전체 요약",
  },
};

const REPORT_TYPES = ["sales", "expenses", "pnl", "products", "customers", "suppliers", "invoice", "purchaseOrder"];
const TYPE_ICON = { sales: "💰", expenses: "📋", pnl: "📈", products: "📦", customers: "👥", suppliers: "🤝", invoice: "📨", purchaseOrder: "📤" };
const TYPE_COLOR = { sales: "#b45309", expenses: "#b91c1c", pnl: "#15803d", products: "#1d4ed8", customers: "#7c3aed", suppliers: "#0369a1", invoice: "#be185d", purchaseOrder: "#0891b2" };

function fmt(n) { return Number(n || 0).toLocaleString("ko-KR"); }
function fmtDate(d, lang) {
  const dt = new Date(d);
  if (lang === "ko") return dt.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "2-digit" });
}
function nowStr(lang) {
  const now = new Date();
  if (lang === "ko") return now.toLocaleString("ko-KR");
  return now.toLocaleString("th-TH");
}

export default function ReportsPage() {
  const [lang, setLang] = useState("th");
  const [reportType, setReportType] = useState("sales");
  const [periodType, setPeriodType] = useState("month");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [custSales, setCustSales] = useState([]);
  const [selectedSaleIds, setSelectedSaleIds] = useState(new Set());
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierPOs, setSupplierPOs] = useState([]);
  const [selectedPoIds, setSelectedPoIds] = useState(new Set());
  const printRef = useRef(null);
  const t = L[lang];

  useEffect(() => {
    fetch("/api/ctm/customers").then(r => r.json()).then(d => setCustomers(d.customers || [])).catch(() => {});
    fetch("/api/ctm/suppliers").then(r => r.json()).then(d => setSuppliers(d.suppliers || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!printingReceipt) return;
    const id = setTimeout(() => window.print(), 80);
    const onAfterPrint = () => setPrintingReceipt(false);
    window.addEventListener("afterprint", onAfterPrint);
    return () => { clearTimeout(id); window.removeEventListener("afterprint", onAfterPrint); };
  }, [printingReceipt]);

  useEffect(() => {
    if (reportType !== "invoice" || !customerId) { setCustSales([]); setSelectedSaleIds(new Set()); return; }
    fetch(`/api/ctm/sales?customerId=${customerId}`).then(r => r.json()).then(d => {
      const sales = d.sales || [];
      setCustSales(sales);
      setSelectedSaleIds(new Set(sales.map(s => s.id)));
    }).catch(() => {});
  }, [reportType, customerId]);

  const toggleSaleSelect = (id) => {
    setSelectedSaleIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (reportType !== "purchaseOrder" || !supplierId) { setSupplierPOs([]); setSelectedPoIds(new Set()); return; }
    fetch(`/api/ctm/purchase-orders?supplierId=${supplierId}`).then(r => r.json()).then(d => {
      const pos = d.purchaseOrders || [];
      setSupplierPOs(pos);
      setSelectedPoIds(new Set(pos.map(p => p.id)));
    }).catch(() => {});
  }, [reportType, supplierId]);

  const togglePoSelect = (id) => {
    setSelectedPoIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const load = async () => {
    if (reportType === "invoice" && !customerId) { alert(t.noCustomerSelected); return; }
    if (reportType === "invoice" && selectedSaleIds.size === 0) { alert(t.noInvoiceSelected); return; }
    if (reportType === "purchaseOrder" && !supplierId) { alert(t.noSupplierSelected); return; }
    if (reportType === "purchaseOrder" && selectedPoIds.size === 0) { alert(t.noPOSelected); return; }
    setLoading(true);
    setData(null);
    try {
      const q = periodType === "month" ? `month=${month}` : periodType === "year" ? `year=${year}` : "";
      if (reportType === "sales") {
        const r = await fetch(`/api/ctm/sales?${q}`);
        setData(await r.json());
      } else if (reportType === "invoice") {
        const sales = custSales.filter(s => selectedSaleIds.has(s.id));
        const totalRevenue = sales.reduce((s, r) => s + Number(r.totalAmount), 0);
        const totalTax = sales.reduce((s, r) => s + Number(r.taxAmount), 0);
        setData({ sales, totalRevenue, totalTax });
      } else if (reportType === "purchaseOrder") {
        const purchaseOrders = supplierPOs.filter(p => selectedPoIds.has(p.id));
        const totalAmount = purchaseOrders.reduce((s, p) => s + Number(p.totalAmount), 0);
        setData({ purchaseOrders, totalAmount });
      } else if (reportType === "expenses") {
        const r = await fetch(`/api/ctm/expenses?${q}`);
        setData(await r.json());
      } else if (reportType === "pnl") {
        const [sr, er] = await Promise.all([
          fetch(`/api/ctm/sales?${q}`).then(r => r.json()),
          fetch(`/api/ctm/expenses?${q}`).then(r => r.json()),
        ]);
        setData({ sales: sr, expenses: er });
      } else if (reportType === "products") {
        const r = await fetch(`/api/ctm/products`);
        const d = await r.json();
        setData(d);
      } else if (reportType === "customers") {
        const r = await fetch(`/api/ctm/customers`);
        setData(await r.json());
      } else if (reportType === "suppliers") {
        const r = await fetch(`/api/ctm/suppliers`);
        setData(await r.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const periodLabel = () => {
    if (periodType === "all") return t.allTime;
    if (periodType === "year") return year;
    const [y, m] = month.split("-");
    const dt = new Date(Number(y), Number(m) - 1);
    if (lang === "ko") return dt.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
    return dt.toLocaleDateString("th-TH", { year: "numeric", month: "long" });
  };

  const cardBtn = (style = {}) => ({
    border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all .15s",
    ...style,
  });

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed; inset: 0; padding: 20px 28px; background: white; z-index: 9999; overflow: visible; font-family: 'TH Sarabun New', Sarabun, sans-serif; font-size: 12pt; }
          #print-area table { border-collapse: collapse !important; width: 100% !important; }
          #print-area th, #print-area td { border: 1px solid #374151 !important; }
          #print-area .doc-header-border { border: 2px solid #374151 !important; }
          #print-area .doc-title-box { border: 2px solid #374151 !important; background: #e5e7eb !important; }
          #print-area .no-print { display: none !important; }
        }
        .rpt-type-btn:hover { opacity: .85; transform: translateY(-1px); }
        ${printingReceipt ? `
        @page { size: A6; margin: 6mm; }
        @media print {
          #print-area { display: none !important; }
          #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
          #receipt-print-area { display: block !important; position: fixed; inset: 0; padding: 4mm; background: #fff; z-index: 10000; }
        }
        ` : ""}
      `}</style>

      {printingReceipt && data && (
        <div id="receipt-print-area" style={{ display: "none" }}>
          <div style={{ width: "100%", fontFamily: "sans-serif" }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <img src="/charoenthaimart/charoenthaimart-logo.jpg" alt="logo" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", marginBottom: 6, display: "block", marginLeft: "auto", marginRight: "auto" }} />
              <div style={{ fontSize: 14, fontWeight: 900, color: "#7f1d1d" }}>{t.store}</div>
              <div style={{ fontSize: 9, color: "#374151" }}>경기도 수원시 권선구 세권로 153(권선동)</div>
              <div style={{ fontSize: 9, color: "#374151" }}>Tel. 010-8766-4569</div>
            </div>
            <div style={{ borderTop: "1px dashed #9ca3af", borderBottom: "1px dashed #9ca3af", padding: "4px 0", marginBottom: 8, textAlign: "center", fontWeight: 800, fontSize: 12 }}>
              {t.receiptTitle}
            </div>
            <div style={{ fontSize: 10, marginBottom: 6 }}>
              <div>{t.billTo}: {(() => { const c = customers.find(c => c.id === customerId); return c ? `${c.customerCode ? c.customerCode + " · " : ""}${c.name}` : "—"; })()}</div>
              <div>{t.issueDate}: {fmtDate(new Date(), lang)}</div>
              {dueDate && <div>{t.dueDate}: {fmtDate(dueDate, lang)}</div>}
            </div>

            {(data.sales || []).map(s => (
              <div key={s.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, borderBottom: "1px solid #374151", paddingBottom: 2, marginBottom: 2 }}>
                  <span style={{ fontFamily: "monospace" }}>{s.number}</span>
                  <span>{fmtDate(s.saleDate, lang)}</span>
                </div>
                <table style={{ width: "100%", fontSize: 9, borderCollapse: "collapse" }}>
                  <tbody>
                    {(s.items || []).map(it => (
                      <tr key={it.id}>
                        <td style={{ padding: "1px 0" }}>{it.productName} ×{it.quantity}</td>
                        <td style={{ padding: "1px 0", textAlign: "right", whiteSpace: "nowrap" }}>₩{fmt(it.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                  <span>{t.grand}</span>
                  <span>₩{fmt(s.totalAmount)}</span>
                </div>
              </div>
            ))}

            <div style={{ borderTop: "1px dashed #9ca3af", paddingTop: 6, fontSize: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span>{t.subtotal}</span>
                <span>₩{fmt(data.totalRevenue - (data.totalTax || 0))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span>{t.tax}</span>
                <span>₩{fmt(data.totalTax || 0)}</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #374151", paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13 }}>
              <span>{t.totalDue}</span>
              <span>₩{fmt(data.totalRevenue)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <div style={{
                border: "3px solid #dc2626", borderRadius: 8,
                color: "#dc2626", fontWeight: 900, fontSize: 14, padding: "4px 10px", transform: "rotate(-12deg)",
                opacity: 0.85, letterSpacing: 1, textAlign: "center",
              }}>
                {t.paidStamp}<br/>PAID
              </div>
            </div>
            <div style={{ marginTop: 10, textAlign: "center", fontSize: 9, color: "#374151" }}>
              💬 Line: @486wfonl<br/>📘 Facebook: {t.store}
            </div>
            <div style={{ marginTop: 8, textAlign: "center", fontSize: 9, color: "#9ca3af" }}>{t.receiptThanks}</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", height: "100vh", background: "#fafaf7", fontFamily: "sans-serif" }}>
        {/* Settings panel */}
        <div style={{ width: 260, background: "#fff", borderRight: "1px solid #e7e3d8", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          {/* Header */}
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#92400e" }}>{t.title}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{t.subtitle}</div>
          </div>

          {/* Language toggle */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>Language / ภาษา</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["th", "ไทย"], ["ko", "한국어"]].map(([l, label]) => (
                <button key={l} onClick={() => setLang(l)} className="rpt-type-btn"
                  style={cardBtn({ flex: 1, padding: "7px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: lang === l ? "#fef3c7" : "#f3f4f6", color: lang === l ? "#92400e" : "#6b7280", border: lang === l ? "1.5px solid #f59e0b" : "1.5px solid transparent", fontSize: 12 })}>
                  <FlagSVG langKey={l} size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Report type */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>{t.reportType}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {REPORT_TYPES.map(rt => (
                <button key={rt} onClick={() => { setReportType(rt); setData(null); }} className="rpt-type-btn"
                  style={cardBtn({
                    display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", textAlign: "left",
                    background: reportType === rt ? TYPE_COLOR[rt] : "#f9fafb",
                    color: reportType === rt ? "#fff" : "#374141",
                    border: reportType === rt ? "none" : "1px solid #e7e3d8",
                  })}>
                  <span style={{ fontSize: 16 }}>{TYPE_ICON[rt]}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{t.types[rt]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Invoice: customer + due date + payment note */}
          {reportType === "invoice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>{t.selectCustomer}</div>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                  <option value="">{t.chooseCustomer}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>{t.dueDate}</div>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              {customerId && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em" }}>{t.selectInvoices}</div>
                    {custSales.length > 0 && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={() => setSelectedSaleIds(new Set(custSales.map(s => s.id)))} style={{ fontSize: 10, color: "#b45309", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>{t.selectAll}</button>
                        <button type="button" onClick={() => setSelectedSaleIds(new Set())} style={{ fontSize: 10, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>{t.deselectAll}</button>
                      </div>
                    )}
                  </div>
                  {custSales.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "10px 0" }}>{t.noSalesForCustomer}</div>
                  ) : (
                    <div style={{ border: "1.5px solid #e7e3d8", borderRadius: 8, maxHeight: 220, overflowY: "auto" }}>
                      {custSales.map(s => (
                        <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", fontSize: 12, borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>
                          <input type="checkbox" checked={selectedSaleIds.has(s.id)} onChange={() => toggleSaleSelect(s.id)} />
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#b45309", flexShrink: 0 }}>{s.number}</span>
                          <span style={{ color: "#9ca3af", flexShrink: 0 }}>{fmtDate(s.saleDate, lang)}</span>
                          <span style={{ marginLeft: "auto", fontWeight: 700, color: "#374151" }}>₩{fmt(s.totalAmount)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Purchase Order: supplier + select POs */}
          {reportType === "purchaseOrder" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>{t.selectSupplier}</div>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                  <option value="">{t.chooseSupplier}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierCode ? `${s.supplierCode} - ` : ""}{s.name}</option>)}
                </select>
              </div>
              {supplierId && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em" }}>{t.selectPOs}</div>
                    {supplierPOs.length > 0 && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={() => setSelectedPoIds(new Set(supplierPOs.map(p => p.id)))} style={{ fontSize: 10, color: "#b45309", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>{t.selectAll}</button>
                        <button type="button" onClick={() => setSelectedPoIds(new Set())} style={{ fontSize: 10, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>{t.deselectAll}</button>
                      </div>
                    )}
                  </div>
                  {supplierPOs.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "10px 0" }}>{t.noPOForSupplier}</div>
                  ) : (
                    <div style={{ border: "1.5px solid #e7e3d8", borderRadius: 8, maxHeight: 220, overflowY: "auto" }}>
                      {supplierPOs.map(p => (
                        <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", fontSize: 12, borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>
                          <input type="checkbox" checked={selectedPoIds.has(p.id)} onChange={() => togglePoSelect(p.id)} />
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0891b2", flexShrink: 0 }}>{p.poNumber}</span>
                          <span style={{ color: "#9ca3af", flexShrink: 0 }}>{fmtDate(p.createdAt, lang)}</span>
                          <span style={{ marginLeft: "auto", fontWeight: 700, color: "#374151" }}>₩{fmt(p.totalAmount)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Period */}
          {(reportType === "sales" || reportType === "expenses" || reportType === "pnl") && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>{t.period}</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                {[["month", t.month], ["year", t.year], ["all", t.allTime]].map(([pt, label]) => (
                  <button key={pt} onClick={() => setPeriodType(pt)} className="rpt-type-btn"
                    style={cardBtn({ flex: 1, padding: "6px 4px", background: periodType === pt ? "#fef3c7" : "#f3f4f6", color: periodType === pt ? "#92400e" : "#6b7280", border: periodType === pt ? "1.5px solid #f59e0b" : "1.5px solid transparent", fontSize: 11 })}>
                    {label}
                  </button>
                ))}
              </div>
              {periodType === "month" && (
                <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              )}
              {periodType === "year" && (
                <select value={year} onChange={e => setYear(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e7e3d8", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={load} disabled={loading}
              style={cardBtn({ padding: "10px", background: "#b45309", color: "#fff", fontSize: 13, opacity: loading ? .7 : 1 })}>
              {loading ? t.loading : t.loadPreview}
            </button>
            {data && (
              <button onClick={handlePrint}
                style={cardBtn({ padding: "10px", background: "linear-gradient(135deg,#1f2937,#374151)", color: "#fff", fontSize: 13 })}>
                {t.print}
              </button>
            )}
            {data && reportType === "invoice" && (
              <button onClick={() => setPrintingReceipt(true)}
                style={cardBtn({ padding: "10px", background: "#fff", color: "#92400e", border: "1.5px solid #f59e0b", fontSize: 13 })}>
                🧾 {t.printReceipt}
              </button>
            )}
          </div>
        </div>

        {/* Preview area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {!data && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16, color: "#9ca3af" }}>
              <div style={{ fontSize: 64 }}>{TYPE_ICON[reportType]}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>{t.types[reportType]}</div>
              <div style={{ fontSize: 13 }}>{t.previewHintBefore}{t.loadPreview}{t.previewHintAfter}</div>
            </div>
          )}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#9ca3af", fontSize: 15 }}>{t.loading}</div>
          )}

          {data && (
            <div id="print-area" ref={printRef} style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", boxShadow: "0 2px 12px rgba(0,0,0,.07)", maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
              {/* Official document header */}
              <div className="doc-header-border" style={{ border: "2px solid #374151", borderRadius: 4, padding: "16px 20px", marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {/* Left: Logo + company info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img src="/charoenthaimart/charoenthaimart-logo.jpg" alt="logo" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid #b45309", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#7f1d1d", lineHeight: 1.2 }}>{t.store}</div>
                      <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>เจริญไทยมาร์ท · Charoen Thai Mart · 수원</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{t.storeTagline}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>경기도 수원시 권선구 세권로 153(권선동)</div>
                    </div>
                  </div>
                  {/* Right: Doc ref info */}
                  <div style={{ textAlign: "right", fontSize: 11, color: "#374151" }}>
                    <div style={{ border: "1px solid #9ca3af", borderRadius: 4, padding: "6px 12px", display: "inline-block", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700 }}>{t.docNoLabel}</div>
                      <div style={{ fontFamily: "monospace", color: "#92400e", fontWeight: 800 }}>{`RPT-${reportType.toUpperCase()}-${Date.now().toString().slice(-6)}`}</div>
                    </div>
                    <div>{t.issueDate}: {fmtDate(new Date(), lang)}</div>
                    <div>{t.generated}: {nowStr(lang)}</div>
                  </div>
                </div>
              </div>

              {/* Title box */}
              <div className="doc-title-box" style={{ background: "#1f2937", borderLeft: "2px solid #374151", borderRight: "2px solid #374151", borderBottom: "2px solid #374151", padding: "10px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: ".04em" }}>{t.types[reportType].toUpperCase()}</div>
                <div style={{ fontSize: 13, color: "#d1d5db", fontWeight: 600 }}>{periodLabel()}</div>
              </div>

              {/* Report content */}
              {reportType === "sales" && <SalesReport data={data} t={t} lang={lang} />}
              {reportType === "invoice" && <InvoiceReport data={data} t={t} lang={lang} customer={customers.find(c => c.id === customerId)} dueDate={dueDate} />}
              {reportType === "purchaseOrder" && <PurchaseOrderReport data={data} t={t} lang={lang} supplier={suppliers.find(s => s.id === supplierId)} />}
              {reportType === "expenses" && <ExpensesReport data={data} t={t} lang={lang} />}
              {reportType === "pnl" && <PnlReport data={data} t={t} lang={lang} />}
              {reportType === "products" && <ProductsReport data={data} t={t} lang={lang} />}
              {reportType === "customers" && <CustomersReport data={data} t={t} lang={lang} />}
              {reportType === "suppliers" && <SuppliersReport data={data} t={t} lang={lang} />}

              {/* Bank transfer info */}
              <div style={{ marginTop: 28, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>{t.bankTransfer}</div>
                {reportType === "purchaseOrder" ? (
                  suppliers.find(s => s.id === supplierId)?.bankAccount ? (
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#7f1d1d", whiteSpace: "pre-line" }}>{suppliers.find(s => s.id === supplierId).bankAccount}</div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>{t.noSupplierBankInfo}</div>
                  )
                ) : (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#7f1d1d" }}>{t.bankKookmin}</div>
                    <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>SEEHAKUN PHAKHAWAN</div>
                  </>
                )}
              </div>

              {/* Signature area */}
              <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, borderTop: "1px solid #e7e3d8", paddingTop: 24 }}>
                {[lang === "ko" ? "작성자" : "ผู้จัดทำ", lang === "ko" ? "검토자" : "ผู้ตรวจสอบ", lang === "ko" ? "승인자" : "ผู้อนุมัติ"].map(label => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ borderBottom: "1px solid #374151", marginBottom: 6, height: 40 }} />
                    <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>วันที่ / 날짜: ____________</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, textAlign: "center", fontSize: 10, color: "#9ca3af", borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
                {t.footerDoc} · {t.store} · {t.generated} {nowStr(lang)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---- Sub-report components ---- */

function THead({ cols }) {
  return (
    <thead>
      <tr style={{ background: "#1f2937" }}>
        {cols.map((c, i) => (
          <th key={i} style={{ padding: "7px 10px", textAlign: c.right ? "right" : "left", fontWeight: 700, color: "#fff", fontSize: 11, whiteSpace: "nowrap", border: "1px solid #374151" }}>{c.label}</th>
        ))}
      </tr>
    </thead>
  );
}

function TBody({ rows, cols, empty }) {
  if (!rows || rows.length === 0) return <tbody><tr><td colSpan={cols.length} style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13, border: "1px solid #d1d5db" }}>{empty}</td></tr></tbody>;
  return (
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} style={{ background: i % 2 ? "#f9fafb" : "#fff" }}>
          {cols.map((c, j) => {
            const color = typeof c.color === "function" ? c.color(row) : (c.color || "#374151");
            return (
              <td key={j} style={{ padding: "6px 10px", textAlign: c.right ? "right" : "left", fontSize: 12, color, fontWeight: c.bold ? 700 : 400, border: "1px solid #d1d5db" }}>
                {c.render ? c.render(row, i) : row[c.key]}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? "#b45309" : "#1f2937" }}>₩{fmt(value)}</span>
    </div>
  );
}

function SalesReport({ data, t, lang }) {
  const sales = data.sales || [];
  const cols = [
    { label: "#", key: "seq", render: (_, i) => i + 1 },
    { label: t.date, key: "saleDate", render: r => fmtDate(r.saleDate, lang) },
    { label: t.number, key: "number" },
    { label: t.customer, key: "customer", render: r => r.customer?.name || "—" },
    { label: t.items, key: "items", right: true, render: r => r.items?.length || 0 },
    { label: t.subtotal, key: "subtotal", right: true, render: r => `₩${fmt(Number(r.totalAmount) - Number(r.taxAmount))}` },
    { label: t.tax, key: "taxAmount", right: true, render: r => `₩${fmt(r.taxAmount)}` },
    { label: t.grand, key: "totalAmount", right: true, bold: true, render: r => `₩${fmt(r.totalAmount)}` },
    { label: t.payment, key: "paymentType" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: t.revenue, val: data.totalRevenue, color: "#b45309" },
          { label: t.tax, val: data.totalTax, color: "#b91c1c" },
          { label: t.profit, val: data.profit, color: "#15803d" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fafaf7", border: "1px solid #e7e3d8", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>₩{fmt(s.val)}</div>
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead cols={cols.map(c => ({ label: c.label, right: c.right }))} />
          <TBody rows={sales} cols={[
            { key: "seq", render: (_, i) => i + 1 },
            { key: "saleDate", render: r => fmtDate(r.saleDate, lang) },
            { key: "number" },
            { key: "customer", render: r => r.customer?.name || "—" },
            { key: "items", right: true, render: r => r.items?.length || 0 },
            { key: "sub", right: true, render: r => `₩${fmt(Number(r.totalAmount) - Number(r.taxAmount))}` },
            { key: "tax", right: true, render: r => `₩${fmt(r.taxAmount)}` },
            { key: "total", right: true, bold: true, render: r => `₩${fmt(r.totalAmount)}` },
            { key: "payment", render: r => r.paymentType },
          ]} empty={t.noData} />
        </table>
      </div>
    </div>
  );
}

function InvoiceReport({ data, t, lang, customer, dueDate }) {
  const sales = data.sales || [];
  const totalDue = data.totalRevenue || 0;
  return (
    <div>
      <div style={{ background: "#fafaf7", border: "1px solid #e7e3d8", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>{t.billTo}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>{customer ? `${customer.customerCode ? customer.customerCode + " · " : ""}${customer.name}` : "—"}</div>
        {customer?.phone && <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{t.phone}: {customer.phone}</div>}
        {customer?.address && <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{t.address}: {customer.address}</div>}
        {dueDate && <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 700, marginTop: 6 }}>{t.dueDate}: {fmtDate(dueDate, lang)}</div>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead cols={[t.date, t.number, t.items, t.subtotal, t.tax, t.grand].map((label, i) => ({ label, right: i >= 3 }))} />
          <TBody rows={sales} cols={[
            { key: "saleDate", render: r => fmtDate(r.saleDate, lang) },
            { key: "number" },
            { key: "items", right: true, render: r => r.items?.length || 0 },
            { key: "sub", right: true, render: r => `₩${fmt(Number(r.totalAmount) - Number(r.taxAmount))}` },
            { key: "tax", right: true, render: r => `₩${fmt(r.taxAmount)}` },
            { key: "total", right: true, bold: true, render: r => `₩${fmt(r.totalAmount)}` },
          ]} empty={t.noData} />
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <div style={{ background: "#fef2f2", border: "2px solid #b91c1c", borderRadius: 10, padding: "14px 22px", minWidth: 260, textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#7f1d1d", fontWeight: 700 }}>{t.totalDue}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#b91c1c" }}>₩{fmt(totalDue)}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "#92400e", fontWeight: 700 }}>{t.pleasePay}</div>
    </div>
  );
}

function PurchaseOrderReport({ data, t, lang, supplier }) {
  const purchaseOrders = data.purchaseOrders || [];
  const totalAmount = data.totalAmount || 0;
  return (
    <div>
      <div style={{ background: "#fafaf7", border: "1px solid #e7e3d8", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>{t.poTo}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>{supplier ? `${supplier.supplierCode ? supplier.supplierCode + " · " : ""}${supplier.name}` : "—"}</div>
        {supplier?.company && <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{supplier.company}</div>}
        {supplier?.phone && <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{t.phone}: {supplier.phone}</div>}
        {supplier?.address && <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{t.address}: {supplier.address}</div>}
      </div>

      {purchaseOrders.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", border: "1px solid #d1d5db" }}>{t.noData}</div>
      )}

      {purchaseOrders.map(po => (
        <div key={po.id} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0891b2", color: "#fff", padding: "8px 14px", borderRadius: "6px 6px 0 0" }}>
            <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14 }}>{t.number}: {po.poNumber}</div>
            <div style={{ fontSize: 12, display: "flex", gap: 16 }}>
              <span>{t.date}: {fmtDate(po.createdAt, lang)}</span>
              <span>{t.billNo}: {po.supplierBillNo || "—"}</span>
              <span>{t.paymentTerms}: {po.paymentTerms}</span>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <THead cols={[t.name, t.qty, t.unit, t.unitCost, t.grand].map((label, i) => ({ label, right: i >= 3 }))} />
              <TBody rows={po.items || []} cols={[
                { key: "productName", bold: true },
                { key: "quantity", right: true },
                { key: "unit", render: r => r.unit || "—" },
                { key: "unitCost", right: true, render: r => `₩${fmt(r.unitCost)}` },
                { key: "totalCost", right: true, bold: true, render: r => `₩${fmt(r.totalCost)}` },
              ]} empty={t.noData} />
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 10px", border: "1px solid #d1d5db", borderTop: "none", background: "#f9fafb" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{t.poSubtotal}: <span style={{ color: "#0891b2" }}>₩{fmt(po.totalAmount)}</span></span>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <div style={{ background: "#ecfeff", border: "2px solid #0891b2", borderRadius: 10, padding: "14px 22px", minWidth: 260, textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#155e75", fontWeight: 700 }}>{t.totalPO}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0891b2" }}>₩{fmt(totalAmount)}</div>
        </div>
      </div>
    </div>
  );
}

function ExpensesReport({ data, t, lang }) {
  const expenses = data.expenses || [];
  const CAT_COLORS = { "ค่าเช่า":"#fee2e2","ค่าสาธารณูปโภค":"#fef9c3","ค่าวัตถุดิบ":"#dcfce7","ค่าขนส่ง":"#dbeafe","ค่าบรรจุภัณฑ์":"#ede9fe","ค่าโฆษณา":"#fce7f3","ค่าซ่อมบำรุง":"#ffedd5","ค่าใช้จ่ายทั่วไป":"#f1f5f9","อื่นๆ":"#f3f4f6" };
  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center" }}>
        <div style={{ background: "#fafaf7", border: "1px solid #e7e3d8", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{t.total}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#b91c1c" }}>₩{fmt(data.total)}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(data.byCategory || {}).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ background: CAT_COLORS[cat] || "#f3f4f6", borderRadius: 7, padding: "3px 10px", fontSize: 11, color: "#374151", fontWeight: 600 }}>
              {cat}: ₩{fmt(amt)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead cols={[t.date, t.category, t.description, t.amount, t.payment, t.note].map((label, i) => ({ label, right: i === 3 }))} />
          <TBody rows={expenses} cols={[
            { key: "date", render: r => fmtDate(r.date, lang) },
            { key: "category", render: r => <span style={{ background: CAT_COLORS[r.category] || "#f3f4f6", borderRadius: 5, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>{r.category}</span> },
            { key: "description", render: r => r.description || "—" },
            { key: "amount", right: true, bold: true, color: "#b91c1c", render: r => `₩${fmt(r.amount)}` },
            { key: "paymentType" },
            { key: "note", render: r => r.note || "—" },
          ]} empty={t.noData} />
        </table>
      </div>
    </div>
  );
}

function PnlReport({ data, t }) {
  const revenue = data.sales?.totalRevenue || 0;
  const tax = data.sales?.totalTax || 0;
  const cost = data.sales?.totalCost || 0;
  const grossProfit = data.sales?.profit || 0;
  const totalExpense = data.expenses?.total || 0;
  const netProfit = grossProfit - totalExpense;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #fef3c7" }}>{t.revenue} / {t.expense}</div>
          <SummaryRow label={t.revenue} value={revenue} />
          <SummaryRow label={`  - ${t.tax}`} value={tax} />
          <SummaryRow label={t.subtotal} value={revenue - tax} />
          <SummaryRow label={`  - ${t.productCost}`} value={cost} />
          <SummaryRow label={t.profit} value={grossProfit} />
          <SummaryRow label={`  - ${t.expense}`} value={totalExpense} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 6, borderTop: "2px solid #92400e" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#374151" }}>{t.netProfit}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: netProfit >= 0 ? "#15803d" : "#b91c1c" }}>₩{fmt(netProfit)}</span>
          </div>
        </div>
        <div>
          {/* Simple visual bar */}
          <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #fef3c7" }}>{t.overview}</div>
          {[
            { label: t.revenue, val: revenue, color: "#f59e0b" },
            { label: t.expense, val: totalExpense, color: "#ef4444" },
            { label: t.netProfit, val: Math.abs(netProfit), color: netProfit >= 0 ? "#16a34a" : "#b91c1c" },
          ].map(({ label, val, color }) => {
            const max = Math.max(revenue, totalExpense, Math.abs(netProfit), 1);
            return (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{label === t.netProfit && netProfit < 0 ? "-" : ""}₩{fmt(val)}</span>
                </div>
                <div style={{ background: "#f3f4f6", borderRadius: 4, height: 10 }}>
                  <div style={{ width: `${(val / max) * 100}%`, background: color, height: 10, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProductsReport({ data, t }) {
  const products = data.products || [];
  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>{t.productCountLabel}: <strong style={{ color: "#374151" }}>{products.length} {t.itemsSuffix}</strong></div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead cols={[t.code, t.barcode, t.name, t.category, t.price, t.buyPrice, t.stock, t.unit].map((label, i) => ({ label, right: i >= 4 }))} />
          <TBody rows={products} cols={[
            { key: "productCode", render: r => <span style={{ fontFamily: "monospace", fontSize: 11, background: "#fef3c7", borderRadius: 4, padding: "1px 6px" }}>{r.productCode || "—"}</span> },
            { key: "barcode", render: r => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{r.barcode || "—"}</span> },
            { key: "name", bold: true },
            { key: "category", render: r => r.category || "—" },
            { key: "price", right: true, bold: true, color: "#b45309", render: r => `₩${fmt(r.price)}` },
            { key: "buyPrice", right: true, color: "#b91c1c", render: r => `₩${fmt(r.buyPrice)}` },
            { key: "stock", right: true, color: r => r.stock <= 5 ? "#b91c1c" : "#15803d", render: r => r.stock },
            { key: "unit", render: r => r.unit || "—" },
          ]} empty={t.noData} />
        </table>
      </div>
    </div>
  );
}

function CustomersReport({ data, t }) {
  const customers = data.customers || [];
  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>{t.customerCountLabel}: <strong style={{ color: "#374151" }}>{customers.length} {t.personSuffix}</strong></div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead cols={["#", t.code, t.name, t.phone, t.email, t.address, t.note].map(label => ({ label }))} />
          <TBody rows={customers} cols={[
            { key: "seq", render: (_, i) => i + 1 },
            { key: "customerCode", render: r => <span style={{ fontFamily: "monospace", fontSize: 11, background: "#e0f2fe", borderRadius: 4, padding: "1px 6px" }}>{r.customerCode || "—"}</span> },
            { key: "name", bold: true },
            { key: "phone", render: r => r.phone || "—" },
            { key: "email", render: r => r.email || "—" },
            { key: "address", render: r => r.address || "—" },
            { key: "note", render: r => r.note || "—" },
          ]} empty={t.noData} />
        </table>
      </div>
    </div>
  );
}

function SuppliersReport({ data, t }) {
  const suppliers = data.suppliers || [];
  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>{t.supplierCountLabel}: <strong style={{ color: "#374151" }}>{suppliers.length} {t.personSuffix}</strong></div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <THead cols={["#", t.code, t.name, t.phone, t.email, t.address, t.note].map(label => ({ label }))} />
          <TBody rows={suppliers} cols={[
            { key: "seq", render: (_, i) => i + 1 },
            { key: "supplierCode", render: r => <span style={{ fontFamily: "monospace", fontSize: 11, background: "#fef3c7", borderRadius: 4, padding: "1px 6px" }}>{r.supplierCode || "—"}</span> },
            { key: "name", bold: true },
            { key: "phone", render: r => r.phone || "—" },
            { key: "email", render: r => r.email || "—" },
            { key: "address", render: r => r.address || "—" },
            { key: "note", render: r => r.note || "—" },
          ]} empty={t.noData} />
        </table>
      </div>
    </div>
  );
}
