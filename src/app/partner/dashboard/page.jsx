"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const LANGS = {
  th: {
    loading: "⏳ กำลังโหลด...",
    signOut: "ออกจากระบบ",
    tabs: { overview: "📊 ภาพรวม", transactions: "📋 รายการ", add: "➕ เพิ่มรายการ", tasks: "📝 งานดำเนินการ", vat: "🧾 ภาษีมูลค่าเพิ่ม", income: "💼 ภาษีรายได้สิ้นปี" },
    yearLabel: (y) => `ปี ${y}`,
    stats: {
      totalRevenue: "รายรับรวม",
      saleCount: (n) => `${n} รายการ`,
      totalExpense: "รายจ่ายรวม",
      netProfit: "กำไรสุทธิ",
      totalPending: "รอชำระ",
      pendingCount: (n) => `${n} รายการ`,
    },
    monthlyTitle: (y) => `ยอดขายรายเดือน`,
    profitTitle: (y) => `กำไรสุทธิรายเดือน (หลังหัก VAT 10%) — ${y}`,
    profitCols: { month: "เดือน", revenue: "รายรับ (₩)", expense: "รายจ่าย (₩)", net: "กำไรสุทธิ (₩)", afterVat: "หลังหัก VAT 10% (₩)", perPerson: "ต่อคน (₩)" },
    vatNote: "สูตร: (รายรับ − รายจ่าย) × 90% ÷ 2",
    categoryTitle: "รายรับแยกตามประเภท",
    categoryCols: { name: "ประเภท", amount: "ยอดรวม (₩)", share: "สัดส่วน" },
    txTitle: (n) => `รายการทั้งหมด (${n} รายการ)`,
    txCols: { number: "เลขที่", date: "วันที่", type: "ประเภท", desc: "รายละเอียด", customer: "คู่ค้า", amount: "จำนวน", status: "สถานะ" },
    noData: "ไม่มีข้อมูล",
    types: { SALE: "ขาย", EXPENSE: "ค่าใช้จ่าย", REFUND: "คืนเงิน", PROFIT_SHARE: "รายได้กำไรส่วนแบ่งรายบุคคล" },
    statuses: { COMPLETED: "สำเร็จ", PENDING: "รอดำเนินการ", CANCELLED: "ยกเลิก" },
    statusColors: { COMPLETED: "#4ade80", PENDING: "#fbbf24", CANCELLED: "#6b7280" },
    typeColors: { SALE: "#60a5fa", EXPENSE: "#f87171", REFUND: "#a78bfa", PROFIT_SHARE: "#22c55e" },
    form: {
      title: "เพิ่มรายการใหม่",
      type: "ประเภท", desc: "รายละเอียด", customer: "ชื่อคู่ค้า", supplier: "ชื่อซัพพลายเออร์", amount: "จำนวนเงิน",
      currency: "สกุลเงิน", category: "หมวดหมู่", status: "สถานะ", date: "วันที่", notes: "หมายเหตุ",
      currencies: { KRW: "₩ วอน (KRW)", USD: "$ ดอลล่า (USD)", THB: "฿ บาท (THB)" },
      categories: {
        SALE: ["ค่าบริการ", "ค่าจ้าง", "ค่าคอมมิชชั่น", "อื่นๆ"],
        EXPENSE: ["ค่าอาหาร", "ค่าที่พัก", "ค่าขนส่ง", "ค่าอุปกรณ์", "ค่าบริการ", "อื่นๆ"],
        REFUND: ["คืนเงิน", "ปรับราคา", "อื่นๆ"],
        PROFIT_SHARE: ["แบ่งกำไร", "โบนัส", "อื่นๆ"],
      },
      selectCategory: "เลือกหมวดหมู่",
      submit: "บันทึก", submitting: "กำลังบันทึก...", success: "✅ บันทึกสำเร็จ", error: "❌ เกิดข้อผิดพลาด",
    },
    tasks: {
      title: "งานดำเนินการและยื่นภาษี",
      addBtn: "+ เพิ่มงาน",
      cols: { title: "ชื่องาน", type: "ประเภท", priority: "ความสำคัญ", status: "สถานะ", due: "กำหนดส่ง", completed: "เสร็จสิ้น" },
      types: { TAX_FILING: "🧾 ยื่นภาษี", OPERATION: "⚙️ งานดำเนินการ", DOCUMENT: "📄 เอกสาร", OTHER: "📌 อื่นๆ" },
      priorities: { LOW: "ต่ำ", NORMAL: "ปกติ", HIGH: "สูง", URGENT: "เร่งด่วน" },
      statuses: { PENDING: "รอดำเนินการ", IN_PROGRESS: "กำลังดำเนินการ", COMPLETED: "เสร็จแล้ว", CANCELLED: "ยกเลิก" },
      statusColors: { PENDING: "#fbbf24", IN_PROGRESS: "#60a5fa", COMPLETED: "#4ade80", CANCELLED: "#6b7280" },
      priorityColors: { LOW: "#6b7280", NORMAL: "#8b8fa8", HIGH: "#fbbf24", URGENT: "#f87171" },
      formTitle: "เพิ่มงานใหม่",
      fTitle: "ชื่องาน / รายละเอียด", fType: "ประเภท", fPriority: "ความสำคัญ", fStatus: "สถานะ", fDue: "กำหนดส่ง", fNotes: "หมายเหตุ",
      submit: "บันทึกงาน", submitting: "กำลังบันทึก...", success: "✅ เพิ่มงานสำเร็จ", error: "❌ เกิดข้อผิดพลาด",
      noData: "ยังไม่มีงาน — กด + เพิ่มงาน",
      deleteConfirm: "ลบงานนี้?",
      changeStatus: "เปลี่ยนสถานะ",
      editHint: "คลิกเพื่อแก้ไข",
      editSave: "บันทึก",
      editCancel: "ยกเลิก",
    },
    vat: {
      title: "รายงานภาษีมูลค่าเพิ่ม 10%",
      subtitle: "กำหนดชำระ: เดือน 1 และ เดือน 7 ของทุกปี",
      h1Label: "ครึ่งปีแรก (ม.ค. – มิ.ย.)",
      h2Label: "ครึ่งปีหลัง (ก.ค. – ธ.ค.)",
      dueH1: (y) => `กำหนดชำระ กรกฎาคม ${y}`,
      dueH2: (y) => `กำหนดชำระ มกราคม ${y + 1}`,
      nextDue: "กำหนดชำระถัดไป",
      daysLeft: (n) => n > 0 ? `อีก ${n} วัน` : n === 0 ? "วันนี้!" : `เกินกำหนด ${Math.abs(n)} วัน`,
      vatAmount: "ยอด VAT 10%",
      base: "ฐาน (กำไรสุทธิ)",
      cols: { number: "เลขที่", date: "วันที่", desc: "รายละเอียด", customer: "คู่ค้า", amount: "ยอดรายรับ (₩)", vat: "VAT 10% (₩)", period: "รอบ" },
      total: "รวม",
      noData: "ยังไม่มีรายการขาย (KRW)",
      note: "VAT คำนวณจากยอดขาย (SALE) สกุลเงิน KRW × 10% ต่อรายการ",
    },
    income: {
      title: "รายงานภาษีรายได้สิ้นปี",
      subtitle: (y) => `กำหนดชำระ: พฤษภาคม ${y + 1} (สำหรับรายได้ปี ${y})`,
      annualCard: "สรุปรายได้สุทธิทั้งปี",
      dueLabel: (y) => `กำหนดชำระ พฤษภาคม ${y}`,
      profitShareDueLabel: (y) => `กำหนดชำระ พฤษภาคม ${y}`,
      nextDue: "กำหนดชำระถัดไป",
      daysLeft: (n) => n > 0 ? `อีก ${n} วัน` : n === 0 ? "วันนี้!" : `เกินกำหนด ${Math.abs(n)} วัน`,
      totalNet: "รายได้สุทธิรวม (₩)",
      totalRevenue: "รายรับรวม (₩)",
      totalExpense: "รายจ่ายรวม (₩)",
      estTax: "ประมาณการภาษีรายได้",
      estNote: "* ตามอัตราภาษีเกาหลีสำหรับรายได้ธุรกิจ",
      cols: { quarter: "ไตรมาส", months: "เดือน", revenue: "รายรับ (₩)", expense: "รายจ่าย (₩)", net: "รายได้สุทธิ (₩)" },
      quarters: { Q1: "Q1 (ม.ค.–มี.ค.)", Q2: "Q2 (เม.ย.–มิ.ย.)", Q3: "Q3 (ก.ค.–ก.ย.)", Q4: "Q4 (ต.ค.–ธ.ค.)" },
      total: "รวมทั้งปี",
      taxBrackets: "อัตราภาษีรายได้เกาหลี (참고)",
      note: "ภาษีรายได้คำนวณจากรายได้สุทธิสะสมทั้งปี ยื่นแบบภาษีเดือนพฤษภาคมของปีถัดไป",
      perPersonTitle: "ภาษีเงินได้รายบุคคล (หลังแบ่งกำไรคนละ 50%)",
      perPersonShare: "กำไรส่วนบุคคล (₩)",
      perPersonTax: "ภาษีรายบุคคล (₩)",
      perPersonRate: "อัตราภาษีที่แท้จริง",
      perPersonNote: "* คำนวณจากกำไรสุทธิ ÷ 2 คน ตามอัตราภาษีเงินได้บุคคลธรรมดาเกาหลี",
      profitShareTitle: "รายการและยืนยันการชำระส่วนแบ่งกำไร",
      profitShareCols: { date: "วันที่", desc: "รายละเอียด", customer: "พาทเนอร์", amount: "จำนวน (₩)", status: "สถานะ" },
      noProfitShare: "ยังไม่มีรายการรายได้กำไรส่วนแบ่ง",
    },
    locale: "th-TH-u-ca-gregory",
  },
  ko: {
    loading: "⏳ 로딩 중...",
    signOut: "로그아웃",
    tabs: { overview: "📊 개요", transactions: "📋 거래내역", add: "➕ 거래추가", tasks: "📝 업무관리", vat: "🧾 부가세", income: "💼 종합소득세" },
    yearLabel: (y) => `${y}년`,
    stats: {
      totalRevenue: "총 매출",
      saleCount: (n) => `${n}건`,
      totalExpense: "총 지출",
      netProfit: "순이익",
      totalPending: "미수금",
      pendingCount: (n) => `${n}건`,
    },
    monthlyTitle: (y) => `월별 매출 — ${y}`,
    profitTitle: (y) => `월별 순이익 (VAT 10% 공제 후) — ${y}`,
    profitCols: { month: "월", revenue: "매출 (₩)", expense: "지출 (₩)", net: "순이익 (₩)", afterVat: "VAT 10% 후 (₩)", perPerson: "1인당 (₩)" },
    vatNote: "공식: (매출 − 지출) × 90% ÷ 2",
    categoryTitle: "카테고리별 매출",
    categoryCols: { name: "카테고리", amount: "합계 (₩)", share: "비율" },
    txTitle: (n) => `전체 거래내역 (${n}건)`,
    txCols: { number: "번호", date: "날짜", type: "유형", desc: "내용", customer: "거래처", amount: "금액", status: "상태" },
    noData: "데이터 없음",
    types: { SALE: "매출", EXPENSE: "지출", REFUND: "환불", PROFIT_SHARE: "개인 이익 분배 수익" },
    statuses: { COMPLETED: "완료", PENDING: "대기", CANCELLED: "취소" },
    statusColors: { COMPLETED: "#4ade80", PENDING: "#fbbf24", CANCELLED: "#6b7280" },
    typeColors: { SALE: "#60a5fa", EXPENSE: "#f87171", REFUND: "#a78bfa", PROFIT_SHARE: "#22c55e" },
    form: {
      title: "거래 추가",
      type: "유형", desc: "내용", customer: "거래처명", supplier: "공급업체명", amount: "금액",
      currency: "통화", category: "카테고리", status: "상태", date: "날짜", notes: "메모",
      currencies: { KRW: "₩ 원 (KRW)", USD: "$ 달러 (USD)", THB: "฿ 바트 (THB)" },
      categories: {
        SALE: ["서비스비", "임금", "커미션", "기타"],
        EXPENSE: ["식비", "숙박비", "교통비", "장비비", "서비스비", "기타"],
        REFUND: ["환불", "가격조정", "기타"],
        PROFIT_SHARE: ["이익분배", "보너스", "기타"],
      },
      selectCategory: "카테고리 선택",
      submit: "저장", submitting: "저장 중...", success: "✅ 저장 완료", error: "❌ 오류 발생",
    },
    tasks: {
      title: "업무 및 세금신고 관리",
      addBtn: "+ 업무 추가",
      cols: { title: "업무명", type: "유형", priority: "우선순위", status: "상태", due: "마감일", completed: "완료일" },
      types: { TAX_FILING: "🧾 세금신고", OPERATION: "⚙️ 업무", DOCUMENT: "📄 서류", OTHER: "📌 기타" },
      priorities: { LOW: "낮음", NORMAL: "보통", HIGH: "높음", URGENT: "긴급" },
      statuses: { PENDING: "대기", IN_PROGRESS: "진행중", COMPLETED: "완료", CANCELLED: "취소" },
      statusColors: { PENDING: "#fbbf24", IN_PROGRESS: "#60a5fa", COMPLETED: "#4ade80", CANCELLED: "#6b7280" },
      priorityColors: { LOW: "#6b7280", NORMAL: "#8b8fa8", HIGH: "#fbbf24", URGENT: "#f87171" },
      formTitle: "업무 추가",
      fTitle: "업무명 / 내용", fType: "유형", fPriority: "우선순위", fStatus: "상태", fDue: "마감일", fNotes: "메모",
      submit: "저장", submitting: "저장 중...", success: "✅ 저장 완료", error: "❌ 오류 발생",
      noData: "업무가 없습니다 — + 업무 추가를 눌러주세요",
      deleteConfirm: "이 업무를 삭제하시겠습니까?",
      changeStatus: "상태 변경",
      editHint: "클릭하여 편집",
      editSave: "저장",
      editCancel: "취소",
    },
    vat: {
      title: "부가세 10% 보고서",
      subtitle: "납부 기한: 매년 1월 및 7월",
      h1Label: "상반기 (1월 – 6월)",
      h2Label: "하반기 (7월 – 12월)",
      dueH1: (y) => `납부 기한: ${y}년 7월`,
      dueH2: (y) => `납부 기한: ${y + 1}년 1월`,
      nextDue: "다음 납부 기한",
      daysLeft: (n) => n > 0 ? `${n}일 남음` : n === 0 ? "오늘!" : `${Math.abs(n)}일 초과`,
      vatAmount: "부가세 10%",
      base: "기준 (순이익)",
      cols: { number: "번호", date: "날짜", desc: "내용", customer: "거래처", amount: "매출 (₩)", vat: "부가세 10% (₩)", period: "기간" },
      total: "합계",
      noData: "KRW 매출 내역 없음",
      note: "부가세 = KRW 매출 (SALE) × 10% (건별 적용)",
    },
    income: {
      title: "종합소득세 연말정산 보고서",
      subtitle: (y) => `납부 기한: ${y + 1}년 5월 (${y}년 소득 기준)`,
      annualCard: "연간 순이익 요약",
      dueLabel: (y) => `납부 기한: ${y}년 5월`,
      profitShareDueLabel: (y) => `납부 기한: ${y}년 5월`,
      nextDue: "다음 납부 기한",
      daysLeft: (n) => n > 0 ? `${n}일 남음` : n === 0 ? "오늘!" : `${Math.abs(n)}일 초과`,
      totalNet: "연간 순이익 (₩)",
      totalRevenue: "총 매출 (₩)",
      totalExpense: "총 지출 (₩)",
      estTax: "소득세 추정액",
      estNote: "* 한국 사업소득세율 기준 참고용",
      cols: { quarter: "분기", months: "기간", revenue: "매출 (₩)", expense: "지출 (₩)", net: "순이익 (₩)" },
      quarters: { Q1: "Q1 (1월–3월)", Q2: "Q2 (4월–6월)", Q3: "Q3 (7월–9월)", Q4: "Q4 (10월–12월)" },
      total: "연간 합계",
      taxBrackets: "한국 소득세율 참고",
      note: "종합소득세는 해당 연도 순이익 기준으로 익년 5월에 신고·납부합니다.",
      perPersonTitle: "개인 소득세 (순이익 50% 분배 후)",
      perPersonShare: "1인당 소득 (₩)",
      perPersonTax: "개인 소득세 (₩)",
      perPersonRate: "실효세율",
      perPersonNote: "* 순이익 ÷ 2인 기준, 한국 종합소득세율 적용 (참고용)",
      profitShareTitle: "이익 분배 내역 확인",
      profitShareCols: { date: "날짜", desc: "내용", customer: "파트너", amount: "금액 (₩)", status: "상태" },
      noProfitShare: "이익 분배 내역이 없습니다",
    },
    locale: "ko-KR",
  },
};

function fmtNum(n, locale) {
  return Number(n).toLocaleString(locale || "ko-KR");
}

function currencySymbol(code) {
  return { KRW: "₩", USD: "$", THB: "฿" }[code] || code;
}

function StatCard({ icon, label, value, sub, color, extra }) {
  return (
    <div style={{ background: "#16181f", border: `1px solid ${color}33`, borderRadius: 12, padding: "20px 24px", flex: "1 1 180px", minWidth: 160 }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 20, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: "#8b8fa8", fontSize: 11, marginTop: 4 }}>{sub}</div>}
      {extra && Object.entries(extra).length > 0 && (
        <div style={{ marginTop: 8, borderTop: "1px solid #1e2130", paddingTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
          {Object.entries(extra).map(([cur, amt]) => (
            <div key={cur} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ background: "#fbbf2422", color: "#fbbf24", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{cur}</span>
              <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700 }}>
                {cur === "USD" ? "$" : cur === "THB" ? "฿" : cur}{Number(amt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthBar({ month, revenue, maxRevenue }) {
  const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 600 }}>
        {revenue > 0 ? `${Math.round(revenue / 10000)}만` : ""}
      </div>
      <div style={{ width: "100%", height: 80, background: "#1e2130", borderRadius: 4, display: "flex", alignItems: "flex-end" }}>
        <div style={{ width: "100%", height: `${Math.max(pct, revenue > 0 ? 4 : 0)}%`, background: "linear-gradient(180deg,#4ade80,#16a34a)", borderRadius: "3px 3px 0 0", transition: "height .4s" }} />
      </div>
      <div style={{ fontSize: 10, color: "#8b8fa8" }}>{month}</div>
    </div>
  );
}

const INPUT_STYLE = {
  width: "100%", background: "#1e2130", border: "1px solid #2a2d3a",
  color: "#e8eaf0", borderRadius: 8, padding: "9px 12px", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};

export default function PartnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");
  const [lang, setLang] = useState("th");

  const [form, setForm] = useState({ type: "SALE", description: "", customerName: "", amount: "", currency: "KRW", category: "", status: "COMPLETED", date: new Date().toISOString().slice(0, 10), notes: "" });
  const [formState, setFormState] = useState("");

  const [editingTx, setEditingTx] = useState(null); // { id, field, value }
  const [editingTxSaving, setEditingTxSaving] = useState(false);
  const [uploadingTxId, setUploadingTxId] = useState(null);
  const [uploadErrorId, setUploadErrorId] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({ title: "", type: "OPERATION", priority: "NORMAL", status: "PENDING", dueDate: "", notes: "" });
  const [taskFormState, setTaskFormState] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // { id, title, notes }
  const [editingTaskSaving, setEditingTaskSaving] = useState(false);

  const t = LANGS[lang];

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      router.push("/partner/login");
    }
  }, [status, router]);

  const fetchData = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch(`/api/partner/transactions?year=${year}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchTasks = () => {
    if (status !== "authenticated") return;
    fetch("/api/partner/tasks").then(r => r.json()).then(d => setTasks(Array.isArray(d) ? d : []));
  };

  useEffect(fetchData, [year, status]);
  useEffect(fetchTasks, [status]);

  async function handleAddTask(e) {
    e.preventDefault();
    setTaskFormState("loading");
    try {
      const res = await fetch("/api/partner/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskForm, dueDate: taskForm.dueDate || null }),
      });
      if (!res.ok) throw new Error();
      setTaskFormState("success");
      setTaskForm({ title: "", type: "OPERATION", priority: "NORMAL", status: "PENDING", dueDate: "", notes: "" });
      setShowTaskForm(false);
      fetchTasks();
      setTimeout(() => setTaskFormState(""), 3000);
    } catch {
      setTaskFormState("error");
      setTimeout(() => setTaskFormState(""), 3000);
    }
  }

  async function handleUpdateTaskStatus(id, newStatus) {
    await fetch(`/api/partner/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  }

  async function handleDeleteTask(id) {
    if (!confirm(t.tasks.deleteConfirm)) return;
    await fetch(`/api/partner/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  async function handleInlineTaskSave() {
    if (!editingTask) return;
    setEditingTaskSaving(true);
    try {
      await fetch(`/api/partner/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTask.title, notes: editingTask.notes }),
      });
      fetchTasks();
    } finally {
      setEditingTask(null);
      setEditingTaskSaving(false);
    }
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    setFormState("loading");
    try {
      const res = await fetch("/api/partner/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount.replace(/,/g, "")) }),
      });
      if (!res.ok) throw new Error();
      setFormState("success");
      setForm({ type: "SALE", description: "", customerName: "", amount: "", currency: "KRW", category: "", status: "COMPLETED", date: new Date().toISOString().slice(0, 10), notes: "" });
      fetchData();
      setTimeout(() => setFormState(""), 3000);
    } catch {
      setFormState("error");
      setTimeout(() => setFormState(""), 3000);
    }
  }

  async function handleInlineAmountSave(tx) {
    if (!editingTx || editingTx.id !== tx.id) return;
    const raw = editingTx.value.replace(/,/g, "");
    if (raw === "" || isNaN(Number(raw))) { setEditingTx(null); return; }
    const amountChanged = Number(raw) !== Number(tx.amount);
    const currencyChanged = editingTx.currency !== tx.currency;
    if (!amountChanged && !currencyChanged) { setEditingTx(null); return; }
    setEditingTxSaving(true);
    try {
      const res = await fetch(`/api/partner/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: raw, currency: editingTx.currency }),
      });
      if (res.ok) fetchData();
    } finally {
      setEditingTx(null);
      setEditingTxSaving(false);
    }
  }

  async function handleReceiptUpload(tx, file) {
    if (!file) return;
    setUploadingTxId(tx.id);
    setUploadErrorId(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/partner/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed (${uploadRes.status})`);
      }
      const { path: filePath } = await uploadRes.json();
      const patchRes = await fetch(`/api/partner/transactions/${tx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptFile: filePath, status: "COMPLETED" }),
      });
      if (!patchRes.ok) {
        const patchErr = await patchRes.json().catch(() => ({}));
        throw new Error(patchErr.error || `PATCH failed (${patchRes.status})`);
      }
      fetchData();
    } catch (err) {
      setUploadErrorId(tx.id);
      alert("อัพโหลดไฟล์ไม่สำเร็จ: " + err.message);
    } finally {
      setUploadingTxId(null);
    }
  }

  const S = {
    page: { minHeight: "100vh", background: "#0a0c12", color: "#e8eaf0", fontFamily: "system-ui, sans-serif" },
    header: { background: "#16181f", borderBottom: "1px solid #1e2130", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    content: { padding: "24px", maxWidth: 1200, margin: "0 auto" },
    section: { marginBottom: 32 },
    sectionTitle: { color: "#8b8fa8", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { color: "#8b8fa8", fontWeight: 600, padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #1e2130", whiteSpace: "nowrap" },
    td: { padding: "10px 12px", borderBottom: "1px solid #1a1d26", color: "#e8eaf0" },
    tabBtn: (active) => ({
      padding: "8px 18px", background: active ? "#16a34a" : "transparent",
      color: active ? "#fff" : "#8b8fa8", border: `1px solid ${active ? "#16a34a" : "#2a2d3a"}`,
      borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
    }),
    langBtn: (active) => ({
      background: active ? "#23263a" : "transparent", border: `1px solid ${active ? "#4a5070" : "#2a2d40"}`,
      borderRadius: 6, color: active ? "#e8eaf0" : "#4a5070", fontSize: 12, fontWeight: 700, padding: "4px 10px", cursor: "pointer",
    }),
  };

  if (status === "loading" || status === "unauthenticated" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0c12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#4ade80", fontSize: 16 }}>{t.loading}</div>
      </div>
    );
  }

  const { summary, monthlyRevenue, recentTransactions, byCategory, profitShareTransactions } = data || {};
  const maxMonthRevenue = Math.max(...(monthlyRevenue || []).map(m => m.revenue), 1);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🤝</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#e8eaf0" }}>Partner Dashboard</div>
            <div style={{ fontSize: 11, color: "#8b8fa8" }}>GOEUN SERVER HUB</div>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "linear-gradient(135deg,#1e1040,#2d1b6e)", border: "1px solid #6d28d9",
            borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 800, color: "#c4b5fd", letterSpacing: 0.8,
          }}>
            🚀 MOMOGE SPACE
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[["th", "ไทย"], ["ko", "한국어"]].map(([code, label]) => (
              <button key={code} style={S.langBtn(lang === code)} onClick={() => setLang(code)}>{label}</button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "#8b8fa8" }}>{session?.user?.name || session?.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: "/auth/select" })} style={{ background: "#1e2130", border: "1px solid #2a2d3a", color: "#8b8fa8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>
            {t.signOut}
          </button>
        </div>
      </div>

      <div style={S.content}>
        {/* Tabs + Year */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["overview", "transactions", "add", "tasks", "vat", "income"].map(tabKey => (
              <button key={tabKey} style={S.tabBtn(tab === tabKey)} onClick={() => setTab(tabKey)}>
                {t.tabs[tabKey]}
              </button>
            ))}
          </div>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ background: "#16181f", border: "1px solid #2a2d3a", color: "#e8eaf0", borderRadius: 8, padding: "7px 14px", fontSize: 13 }}>
            {[year + 1, year, year - 1, year - 2].map(y => <option key={y} value={y}>{t.yearLabel(y)}</option>)}
          </select>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && summary && (
          <>
            <div style={S.section}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <StatCard icon="💰" label={t.stats.totalRevenue} value={`₩${fmtNum(summary.totalRevenue, t.locale)}`} sub={t.stats.saleCount(summary.saleCount)} color="#4ade80" extra={summary.revenueByCurrency} />
                <StatCard icon="💸" label={t.stats.totalExpense} value={`₩${fmtNum(summary.totalExpense, t.locale)}`} color="#f87171" extra={summary.expenseByCurrency} />
                <StatCard icon="📈" label={t.stats.netProfit} value={`₩${fmtNum(summary.netProfit, t.locale)}`} color={summary.netProfit >= 0 ? "#4ade80" : "#f87171"} />
                <StatCard icon="⏳" label={t.stats.totalPending} value={`₩${fmtNum(summary.totalPending, t.locale)}`} sub={t.stats.pendingCount(summary.pendingCount)} color="#fbbf24" extra={summary.pendingByCurrency} />
              </div>
            </div>

            <div style={S.section}>
              <div style={S.sectionTitle}>{t.monthlyTitle(year)}</div>
              <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, padding: "20px 16px" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
                  {(monthlyRevenue || []).map(m => <MonthBar key={m.month} month={new Date(year, m.month - 1, 1).toLocaleString(t.locale, { month: "short" })} revenue={m.revenue} maxRevenue={maxMonthRevenue} />)}
                </div>
              </div>
            </div>

            {/* Monthly profit after VAT / per person */}
            <div style={S.section}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div style={S.sectionTitle}>{t.profitTitle(year)}</div>
                <div style={{ fontSize: 11, color: "#8b8fa8", background: "#1e2130", borderRadius: 6, padding: "3px 10px" }}>{t.vatNote}</div>
              </div>
              <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, overflow: "auto" }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, whiteSpace: "nowrap" }}>{t.profitCols.month}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.profitCols.revenue}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.profitCols.expense}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.profitCols.net}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.profitCols.afterVat}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap", color: "#4ade80" }}>{t.profitCols.perPerson}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(monthlyRevenue || []).map(m => {
                      const net = m.revenue - m.expense;
                      const afterVat = net * 0.9;
                      const perPerson = afterVat / 2;
                      const hasData = m.revenue > 0 || m.expense > 0;
                      return (
                        <tr key={m.month} style={{ opacity: hasData ? 1 : 0.4 }}>
                          <td style={{ ...S.td, whiteSpace: "nowrap", fontWeight: 600 }}>
                            {new Date(year, m.month - 1, 1).toLocaleString(t.locale, { month: "short" })}
                          </td>
                          <td style={{ ...S.td, textAlign: "right", color: "#4ade80", fontFamily: "monospace" }}>
                            {m.revenue > 0 ? `₩${fmtNum(m.revenue, t.locale)}` : "-"}
                          </td>
                          <td style={{ ...S.td, textAlign: "right", color: "#f87171", fontFamily: "monospace" }}>
                            {m.expense > 0 ? `₩${fmtNum(m.expense, t.locale)}` : "-"}
                          </td>
                          <td style={{ ...S.td, textAlign: "right", color: net >= 0 ? "#4ade80" : "#f87171", fontWeight: 700, fontFamily: "monospace" }}>
                            {hasData ? `₩${fmtNum(net, t.locale)}` : "-"}
                          </td>
                          <td style={{ ...S.td, textAlign: "right", color: afterVat >= 0 ? "#60a5fa" : "#f87171", fontFamily: "monospace" }}>
                            {hasData ? `₩${fmtNum(Math.round(afterVat), t.locale)}` : "-"}
                          </td>
                          <td style={{ ...S.td, textAlign: "right", color: "#4ade80", fontWeight: 800, fontFamily: "monospace", fontSize: 14 }}>
                            {hasData ? `₩${fmtNum(Math.round(perPerson), t.locale)}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {byCategory?.length > 0 && (
              <div style={S.section}>
                <div style={S.sectionTitle}>{t.categoryTitle}</div>
                <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, overflow: "hidden" }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>{t.categoryCols.name}</th>
                        <th style={{ ...S.th, textAlign: "right" }}>{t.categoryCols.amount}</th>
                        <th style={{ ...S.th, textAlign: "right" }}>{t.categoryCols.share}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCategory.map((c, i) => (
                        <tr key={i}>
                          <td style={S.td}>{c.name}</td>
                          <td style={{ ...S.td, textAlign: "right", color: "#4ade80", fontWeight: 700 }}>₩{fmtNum(c.amount, t.locale)}</td>
                          <td style={{ ...S.td, textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                              <div style={{ width: 80, height: 6, background: "#1e2130", borderRadius: 3 }}>
                                <div style={{ height: "100%", width: `${summary.totalRevenue > 0 ? (c.amount / summary.totalRevenue) * 100 : 0}%`, background: "#4ade80", borderRadius: 3 }} />
                              </div>
                              <span style={{ color: "#8b8fa8", fontSize: 12, minWidth: 36 }}>
                                {summary.totalRevenue > 0 ? ((c.amount / summary.totalRevenue) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* TRANSACTIONS */}
        {tab === "transactions" && (
          <div style={S.section}>
            <div style={S.sectionTitle}>{t.txTitle(recentTransactions?.length || 0)}</div>
            <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, overflow: "auto" }}>
              <table style={S.table}>
                <colgroup>
                  <col style={{ width: 160 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: "auto" }} />
                  <col style={{ width: 180 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 140 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ ...S.th, whiteSpace: "nowrap" }}>{t.txCols.number}</th>
                    <th style={{ ...S.th, whiteSpace: "nowrap" }}>{t.txCols.date}</th>
                    <th style={{ ...S.th, textAlign: "center", whiteSpace: "nowrap" }}>{t.txCols.type}</th>
                    <th style={S.th}>{t.txCols.desc}</th>
                    <th style={S.th}>{t.txCols.customer}</th>
                    <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.txCols.amount}</th>
                    <th style={{ ...S.th, whiteSpace: "nowrap" }}>{t.txCols.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {!recentTransactions?.length ? (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#8b8fa8" }}>{t.noData}</td></tr>
                  ) : recentTransactions.map(tx => {
                    const typeColor = t.typeColors[tx.type] || "#8b8fa8";
                    const statusColor = t.statusColors[tx.status] || "#8b8fa8";
                    return (
                      <tr key={tx.id}>
                        <td style={{ ...S.td, color: "#60a5fa", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{tx.number}</td>
                        <td style={{ ...S.td, whiteSpace: "nowrap", color: "#8b8fa8", fontSize: 12 }}>{new Date(tx.date).toLocaleDateString(t.locale)}</td>
                        <td style={{ ...S.td, textAlign: "center" }}>
                          <span style={{ background: `${typeColor}22`, color: typeColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {t.types[tx.type] || tx.type}
                          </span>
                        </td>
                        <td style={{ ...S.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.description || ""}>{tx.description || "-"}</td>
                        <td style={{ ...S.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }} title={tx.customerName || ""}>{tx.customerName || "-"}</td>
                        <td style={{ ...S.td, textAlign: "right", minWidth: 150 }}>
                          {editingTx?.id === tx.id ? (
                            <div
                              onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) handleInlineAmountSave(tx); }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}
                            >
                              <select
                                tabIndex={0}
                                value={editingTx.currency}
                                onChange={e => setEditingTx(v => ({ ...v, currency: e.target.value }))}
                                disabled={editingTxSaving}
                                style={{ background: "#1e2130", border: "1px solid #4ade80", color: "#8b8fa8", borderRadius: 6, padding: "3px 6px", fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}
                              >
                                <option value="KRW">₩ KRW</option>
                                <option value="USD">$ USD</option>
                                <option value="THB">฿ THB</option>
                              </select>
                              <input
                                autoFocus
                                tabIndex={0}
                                type="text"
                                inputMode="numeric"
                                value={editingTx.value}
                                onChange={e => setEditingTx(v => ({ ...v, value: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter") handleInlineAmountSave(tx); if (e.key === "Escape") setEditingTx(null); }}
                                disabled={editingTxSaving}
                                style={{ width: 80, background: "#1e2130", border: "1px solid #4ade80", color: "#4ade80", borderRadius: 6, padding: "3px 8px", fontSize: 13, fontWeight: 700, textAlign: "right", outline: "none" }}
                              />
                            </div>
                          ) : (
                            <span
                              title="คลิกเพื่อแก้ไข"
                              onClick={() => setEditingTx({ id: tx.id, value: String(Number(tx.amount)), currency: tx.currency })}
                              style={{ color: tx.type === "EXPENSE" ? "#f87171" : "#4ade80", fontWeight: 700, cursor: "pointer", borderBottom: "1px dashed", borderColor: tx.type === "EXPENSE" ? "#f8717166" : "#4ade8066", paddingBottom: 1 }}
                            >
                              {tx.type === "EXPENSE" ? "-" : ""}{currencySymbol(tx.currency)}{fmtNum(tx.amount, t.locale)}
                            </span>
                          )}
                        </td>
                        <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ background: `${statusColor}22`, color: statusColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                              {t.statuses[tx.status] || tx.status}
                            </span>
                            {/* Receipt file button */}
                            {uploadingTxId === tx.id ? (
                              <span style={{ fontSize: 11, color: "#8b8fa8" }}>⏳</span>
                            ) : (
                              <>
                                {tx.receiptFile && (
                                  <a href={tx.receiptFile} target="_blank" rel="noopener noreferrer" title="ดูบิล / ดูเอกสาร" style={{ fontSize: 14, textDecoration: "none", lineHeight: 1 }}>📄</a>
                                )}
                                {tx.status !== "COMPLETED" && (
                                  <label title="อัพโหลดไฟล์" style={{ cursor: "pointer", lineHeight: 1, display: "inline-flex", alignItems: "center", gap: 3, background: "#1e293b", border: `1px solid ${uploadErrorId === tx.id ? "#f87171" : "#334155"}`, borderRadius: 4, padding: "2px 7px", fontSize: 11, color: uploadErrorId === tx.id ? "#f87171" : "#60a5fa", whiteSpace: "nowrap" }}>
                                    📎 อัพโหลดไฟล์
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                                      style={{ display: "none" }}
                                      onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(tx, f); e.target.value = ""; }}
                                    />
                                  </label>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TASKS */}
        {tab === "tasks" && (
          <div style={S.section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={S.sectionTitle}>{t.tasks.title}</div>
              <button onClick={() => setShowTaskForm(v => !v)} style={{
                background: "#16a34a", color: "#fff", border: "none", borderRadius: 8,
                padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700,
              }}>
                {t.tasks.addBtn}
              </button>
            </div>

            {/* Add task form */}
            {showTaskForm && (
              <div style={{ background: "#16181f", border: "1px solid #2a2d3a", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: "#e8eaf0", marginBottom: 14, fontSize: 14 }}>{t.tasks.formTitle}</div>
                <form onSubmit={handleAddTask}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>{t.tasks.fTitle}</label>
                      <input required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} style={INPUT_STYLE} />
                    </div>
                    <div>
                      <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>{t.tasks.fType}</label>
                      <select value={taskForm.type} onChange={e => setTaskForm(f => ({ ...f, type: e.target.value }))} style={INPUT_STYLE}>
                        {Object.entries(t.tasks.types).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>{t.tasks.fPriority}</label>
                      <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} style={INPUT_STYLE}>
                        {Object.entries(t.tasks.priorities).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>{t.tasks.fStatus}</label>
                      <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))} style={INPUT_STYLE}>
                        {Object.entries(t.tasks.statuses).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>{t.tasks.fDue}</label>
                      <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} style={INPUT_STYLE} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>{t.tasks.fNotes}</label>
                      <textarea value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ ...INPUT_STYLE, resize: "vertical" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button type="submit" disabled={taskFormState === "loading"} style={{
                      background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", border: "none",
                      borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                    }}>
                      {taskFormState === "loading" ? t.tasks.submitting : t.tasks.submit}
                    </button>
                    <button type="button" onClick={() => setShowTaskForm(false)} style={{
                      background: "#1e2130", color: "#8b8fa8", border: "1px solid #2a2d3a",
                      borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer",
                    }}>✕</button>
                  </div>
                  {taskFormState === "success" && <div style={{ marginTop: 8, color: "#4ade80", fontSize: 13 }}>{t.tasks.success}</div>}
                  {taskFormState === "error"   && <div style={{ marginTop: 8, color: "#f87171", fontSize: 13 }}>{t.tasks.error}</div>}
                </form>
              </div>
            )}

            {/* Task list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.length === 0 ? (
                <div style={{ color: "#8b8fa8", textAlign: "center", padding: 32, fontSize: 13 }}>{t.tasks.noData}</div>
              ) : tasks.map(task => {
                const sc = t.tasks.statusColors[task.status] || "#8b8fa8";
                const pc = t.tasks.priorityColors[task.priority] || "#8b8fa8";
                const isOverdue = task.dueDate && task.status !== "COMPLETED" && task.status !== "CANCELLED" && new Date(task.dueDate) < new Date();
                return (
                  <div key={task.id} style={{
                    background: "#16181f", border: `1px solid ${task.status === "COMPLETED" ? "#16a34a33" : isOverdue ? "#f8717133" : "#1e2130"}`,
                    borderRadius: 10, padding: "14px 18px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingTask?.id === task.id ? (
                        /* Inline edit mode */
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <input
                            autoFocus
                            value={editingTask.title}
                            onChange={e => setEditingTask(v => ({ ...v, title: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") handleInlineTaskSave(); if (e.key === "Escape") setEditingTask(null); }}
                            disabled={editingTaskSaving}
                            style={{ ...INPUT_STYLE, fontSize: 14, fontWeight: 700, padding: "6px 10px" }}
                          />
                          <textarea
                            value={editingTask.notes}
                            onChange={e => setEditingTask(v => ({ ...v, notes: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Escape") setEditingTask(null); }}
                            disabled={editingTaskSaving}
                            rows={2}
                            placeholder={t.tasks.fNotes}
                            style={{ ...INPUT_STYLE, fontSize: 12, resize: "vertical", padding: "6px 10px" }}
                          />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={handleInlineTaskSave} disabled={editingTaskSaving} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              {editingTaskSaving ? "..." : t.tasks.editSave}
                            </button>
                            <button onClick={() => setEditingTask(null)} style={{ background: "#1e2130", color: "#8b8fa8", border: "1px solid #2a2d3a", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                              {t.tasks.editCancel}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display mode */
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                            <span
                              title={t.tasks.editHint}
                              onClick={() => setEditingTask({ id: task.id, title: task.title, notes: task.notes || "" })}
                              style={{ fontWeight: 700, color: task.status === "COMPLETED" ? "#6b7280" : "#e8eaf0", fontSize: 14, textDecoration: task.status === "COMPLETED" ? "line-through" : "none", cursor: "text", borderBottom: "1px dashed #2a2d3a" }}
                            >
                              {task.title}
                            </span>
                            <span style={{ background: `${sc}22`, color: sc, borderRadius: 20, padding: "1px 9px", fontSize: 11, fontWeight: 700 }}>
                              {t.tasks.statuses[task.status]}
                            </span>
                            <span style={{ background: `${pc}22`, color: pc, borderRadius: 20, padding: "1px 9px", fontSize: 11, fontWeight: 600 }}>
                              {t.tasks.priorities[task.priority]}
                            </span>
                            <span style={{ color: "#8b8fa8", fontSize: 11 }}>{t.tasks.types[task.type]}</span>
                          </div>
                          {task.notes && (
                            <div
                              title={t.tasks.editHint}
                              onClick={() => setEditingTask({ id: task.id, title: task.title, notes: task.notes || "" })}
                              style={{ color: "#8b8fa8", fontSize: 12, marginBottom: 4, cursor: "text", borderBottom: "1px dashed #2a2d3a22", paddingBottom: 2 }}
                            >
                              {task.notes}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 12, fontSize: 11, color: isOverdue ? "#f87171" : "#6b7280" }}>
                            {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString(t.locale)}{isOverdue ? " ⚠️" : ""}</span>}
                            {task.completedAt && <span>✅ {new Date(task.completedAt).toLocaleDateString(t.locale)}</span>}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Status quick-change */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <select
                        value={task.status}
                        onChange={e => handleUpdateTaskStatus(task.id, e.target.value)}
                        style={{ background: "#1e2130", border: "1px solid #2a2d3a", color: "#e8eaf0", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
                      >
                        {Object.entries(t.tasks.statuses).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <button onClick={() => handleDeleteTask(task.id)} style={{ background: "#3b0000", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ADD TRANSACTION */}
        {tab === "add" && (
          <div style={S.section}>
            <div style={S.sectionTitle}>{t.form.title}</div>
            <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, padding: 28, maxWidth: 560 }}>
              <form onSubmit={handleAddTransaction}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Type */}
                  <div>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{t.form.type}</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, category: "" }))} style={INPUT_STYLE}>
                      {Object.entries(t.types).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {/* Status */}
                  <div>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{t.form.status}</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={INPUT_STYLE}>
                      {Object.entries(t.statuses).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {/* Currency */}
                  <div>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{t.form.currency}</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={INPUT_STYLE}>
                      {Object.entries(t.form.currencies).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {/* Amount */}
                  <div>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                      {t.form.amount} <span style={{ color: "#4ade80", fontWeight: 800 }}>{currencySymbol(form.currency)}</span>
                    </label>
                    <input type="text" inputMode="numeric" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={INPUT_STYLE} />
                  </div>
                  {/* Date */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{t.form.date}</label>
                    <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...INPUT_STYLE, maxWidth: 220 }} />
                  </div>
                  {/* Description */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{t.form.desc}</label>
                    <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={INPUT_STYLE} />
                  </div>
                  {/* Customer / Supplier */}
                  <div>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                      {form.type === "EXPENSE" ? t.form.supplier : t.form.customer}
                    </label>
                    <input type="text" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} style={INPUT_STYLE} />
                  </div>
                  {/* Category */}
                  <div>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{t.form.category}</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={INPUT_STYLE}>
                      <option value="">{t.form.selectCategory}</option>
                      {(t.form.categories[form.type] || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  {/* Notes */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#8b8fa8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{t.form.notes}</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...INPUT_STYLE, resize: "vertical" }} />
                  </div>
                </div>

                <button type="submit" disabled={formState === "loading"} style={{
                  marginTop: 20, width: "100%", background: "linear-gradient(135deg,#16a34a,#15803d)",
                  color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontWeight: 700,
                  fontSize: 15, cursor: formState === "loading" ? "not-allowed" : "pointer", opacity: formState === "loading" ? 0.6 : 1,
                }}>
                  {formState === "loading" ? t.form.submitting : t.form.submit}
                </button>

                {formState === "success" && <div style={{ marginTop: 12, color: "#4ade80", fontSize: 13, textAlign: "center" }}>{t.form.success}</div>}
                {formState === "error" && <div style={{ marginTop: 12, color: "#f87171", fontSize: 13, textAlign: "center" }}>{t.form.error}</div>}
              </form>
            </div>
          </div>
        )}

        {/* VAT REPORT */}
        {tab === "vat" && (() => {
          const vatData = (monthlyRevenue || []).map(m => {
            const net = Math.max(0, m.revenue - m.expense);
            return { ...m, net, vat: Math.round(net * 0.1) };
          });
          const h1 = vatData.filter(m => m.month <= 6);
          const h2 = vatData.filter(m => m.month > 6);
          const h1Vat = h1.reduce((s, m) => s + m.vat, 0);
          const h2Vat = h2.reduce((s, m) => s + m.vat, 0);
          const h1Base = h1.reduce((s, m) => s + m.net, 0);
          const h2Base = h2.reduce((s, m) => s + m.net, 0);

          // Next due date calculation
          const today = new Date();
          const dueH1 = new Date(year, 6, 1); // July 1
          const dueH2 = new Date(year + 1, 0, 1); // Jan 1 next year
          const diffDays = (d) => Math.round((d - today) / 86400000);
          const nextDue = today < dueH1 ? { label: t.vat.dueH1(year), days: diffDays(dueH1), vat: h1Vat } : { label: t.vat.dueH2(year), days: diffDays(dueH2), vat: h2Vat };
          const urgentColor = nextDue.days < 30 ? "#f87171" : nextDue.days < 60 ? "#fbbf24" : "#4ade80";

          const PeriodCard = ({ label, due, base, vat, active }) => (
            <div style={{ background: "#16181f", border: `1px solid ${active ? "#60a5fa44" : "#1e2130"}`, borderRadius: 12, padding: "20px 24px", flex: "1 1 260px" }}>
              {active && <div style={{ fontSize: 10, fontWeight: 800, color: "#60a5fa", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>▶ {t.vat.nextDue}</div>}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e8eaf0", marginBottom: 12 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#8b8fa8", marginBottom: 4 }}>{due}</div>
              <div style={{ fontSize: 11, color: "#8b8fa8", marginBottom: 12 }}>{t.vat.base}: ₩{fmtNum(base, t.locale)}</div>
              <div style={{ fontSize: 11, color: "#8b8fa8", marginBottom: 4 }}>{t.vat.vatAmount}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#fbbf24" }}>₩{fmtNum(vat, t.locale)}</div>
              {active && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: urgentColor }}>{t.vat.daysLeft(nextDue.days)}</div>}
            </div>
          );

          // Per-transaction VAT: all KRW SALE transactions in selected year
          const saleTxs = (recentTransactions || [])
            .filter(tx => tx.type === "SALE" && tx.status !== "CANCELLED" && tx.currency === "KRW")
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          const txH1Vat = saleTxs.filter(tx => new Date(tx.date).getMonth() < 6).reduce((s, tx) => s + Math.round(Number(tx.amount) * 0.1), 0);
          const txH2Vat = saleTxs.filter(tx => new Date(tx.date).getMonth() >= 6).reduce((s, tx) => s + Math.round(Number(tx.amount) * 0.1), 0);
          const txTotalVat = txH1Vat + txH2Vat;

          return (
            <div style={S.section}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#e8eaf0", marginBottom: 4 }}>{t.vat.title}</div>
                <div style={{ fontSize: 12, color: "#8b8fa8" }}>{t.vat.subtitle}</div>
              </div>

              {/* Period summary cards */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
                <PeriodCard label={t.vat.h1Label} due={t.vat.dueH1(year)} base={h1Base} vat={txH1Vat} active={today < dueH1} />
                <PeriodCard label={t.vat.h2Label} due={t.vat.dueH2(year)} base={h2Base} vat={txH2Vat} active={today >= dueH1} />
              </div>

              {/* Transaction list */}
              <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, overflow: "auto" }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, whiteSpace: "nowrap" }}>{t.vat.cols.number}</th>
                      <th style={{ ...S.th, whiteSpace: "nowrap" }}>{t.vat.cols.date}</th>
                      <th style={S.th}>{t.vat.cols.desc}</th>
                      <th style={S.th}>{t.vat.cols.customer}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.vat.cols.amount}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap", color: "#fbbf24" }}>{t.vat.cols.vat}</th>
                      <th style={{ ...S.th, textAlign: "center", whiteSpace: "nowrap" }}>{t.vat.cols.period}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleTxs.length === 0 ? (
                      <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#8b8fa8" }}>{t.vat.noData}</td></tr>
                    ) : saleTxs.map(tx => {
                      const mo = new Date(tx.date).getMonth();
                      const isH1 = mo < 6;
                      const txVat = Math.round(Number(tx.amount) * 0.1);
                      const isH2Start = mo === 6 && saleTxs.findIndex(x => new Date(x.date).getMonth() >= 6) === saleTxs.indexOf(tx);
                      return (
                        <tr key={tx.id} style={{ borderTop: isH2Start ? "2px solid #2a2d3a" : undefined }}>
                          <td style={{ ...S.td, color: "#60a5fa", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{tx.number}</td>
                          <td style={{ ...S.td, whiteSpace: "nowrap", color: "#8b8fa8", fontSize: 12 }}>{new Date(tx.date).toLocaleDateString(t.locale)}</td>
                          <td style={{ ...S.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.description || ""}>{tx.description || "-"}</td>
                          <td style={{ ...S.td, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }} title={tx.customerName || ""}>{tx.customerName || "-"}</td>
                          <td style={{ ...S.td, textAlign: "right", color: "#4ade80", fontWeight: 700, fontFamily: "monospace" }}>₩{fmtNum(tx.amount, t.locale)}</td>
                          <td style={{ ...S.td, textAlign: "right", color: "#fbbf24", fontWeight: 700, fontFamily: "monospace" }}>₩{fmtNum(txVat, t.locale)}</td>
                          <td style={{ ...S.td, textAlign: "center" }}>
                            <span style={{ background: isH1 ? "#60a5fa22" : "#a78bfa22", color: isH1 ? "#60a5fa" : "#a78bfa", borderRadius: 20, padding: "1px 10px", fontSize: 11, fontWeight: 700 }}>
                              {isH1 ? "H1" : "H2"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ borderTop: "2px solid #2a2d3a", background: "#1a1d26" }}>
                      <td style={{ ...S.td, fontWeight: 800, color: "#e8eaf0" }} colSpan={5}>{t.vat.total}</td>
                      <td style={{ ...S.td, textAlign: "right", color: "#fbbf24", fontWeight: 800, fontFamily: "monospace", fontSize: 15 }}>₩{fmtNum(txTotalVat, t.locale)}</td>
                      <td style={S.td} />
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#4a5070", textAlign: "right" }}>{t.vat.note}</div>
            </div>
          );
        })()}

        {/* INCOME TAX */}
        {tab === "income" && (() => {
          // Quarterly aggregation from monthlyRevenue
          const months = monthlyRevenue || [];
          const qRanges = { Q1: [1,3], Q2: [4,6], Q3: [7,9], Q4: [10,12] };
          const quarters = Object.entries(qRanges).map(([q, [from, to]]) => {
            const rows = months.filter(m => m.month >= from && m.month <= to);
            return {
              key: q,
              revenue: rows.reduce((s, m) => s + m.revenue, 0),
              expense: rows.reduce((s, m) => s + m.expense, 0),
              net: rows.reduce((s, m) => s + (m.revenue - m.expense), 0),
            };
          });

          const annualRevenue = quarters.reduce((s, q) => s + q.revenue, 0);
          const annualExpense = quarters.reduce((s, q) => s + q.expense, 0);
          const annualNet = quarters.reduce((s, q) => s + q.net, 0);

          // Korean income tax progressive bracket estimate (KRW) — cumulative limits
          function estimateTax(net) {
            if (net <= 0) return 0;
            const brackets = [
              [14_000_000,  0.06],
              [50_000_000,  0.15],
              [88_000_000,  0.24],
              [150_000_000, 0.35],
              [300_000_000, 0.38],
              [500_000_000, 0.40],
              [1_000_000_000, 0.42],
              [Infinity,    0.45],
            ];
            let tax = 0, prev = 0;
            for (const [limit, rate] of brackets) {
              if (net <= prev) break;
              const taxable = Math.min(net, limit) - prev;
              tax += taxable * rate;
              prev = limit;
            }
            return Math.round(tax);
          }
          const estTax = estimateTax(annualNet);
          const effectiveRate = annualNet > 0 ? ((estTax / annualNet) * 100).toFixed(1) : "0.0";
          const perPersonNet = Math.max(0, annualNet) / 2;
          const perPersonTax = estimateTax(perPersonNet);
          const perPersonRate = perPersonNet > 0 ? ((perPersonTax / perPersonNet) * 100).toFixed(1) : "0.0";

          return (
            <div style={S.section}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#e8eaf0", marginBottom: 4 }}>{t.income.title}</div>
                <div style={{ fontSize: 12, color: "#8b8fa8" }}>{t.income.subtitle(year)}</div>
              </div>

              {/* Summary cards row */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
                {/* Annual net card */}
                <div style={{ background: "#16181f", border: "1px solid #60a5fa44", borderRadius: 12, padding: "20px 24px", flex: "1 1 220px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#60a5fa", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>{t.income.annualCard}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#8b8fa8" }}>{t.income.totalRevenue}</span>
                      <span style={{ color: "#4ade80", fontWeight: 700, fontFamily: "monospace" }}>₩{fmtNum(annualRevenue, t.locale)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#8b8fa8" }}>{t.income.totalExpense}</span>
                      <span style={{ color: "#f87171", fontWeight: 700, fontFamily: "monospace" }}>₩{fmtNum(annualExpense, t.locale)}</span>
                    </div>
                    <div style={{ borderTop: "1px solid #1e2130", paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#e8eaf0", fontWeight: 700 }}>{t.income.totalNet}</span>
                      <span style={{ color: annualNet >= 0 ? "#4ade80" : "#f87171", fontWeight: 800, fontFamily: "monospace" }}>₩{fmtNum(annualNet, t.locale)}</span>
                    </div>
                  </div>
                </div>

                {/* Estimated tax card */}
                <div style={{ background: "#16181f", border: "1px solid #fbbf2444", borderRadius: 12, padding: "20px 24px", flex: "1 1 220px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>{t.income.estTax}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>₩{fmtNum(estTax, t.locale)}</div>
                  <div style={{ fontSize: 11, color: "#8b8fa8", marginBottom: 2 }}>{lang === "th" ? `อัตราภาษีที่แท้จริง: ${effectiveRate}%` : `실효세율: ${effectiveRate}%`}</div>
                  <div style={{ fontSize: 10, color: "#4a5070" }}>{t.income.estNote}</div>
                </div>

              </div>

              {/* Quarterly table */}
              <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, overflow: "auto", marginBottom: 20 }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, whiteSpace: "nowrap" }}>{t.income.cols.quarter}</th>
                      <th style={{ ...S.th, whiteSpace: "nowrap" }}>{t.income.cols.months}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.income.cols.revenue}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.income.cols.expense}</th>
                      <th style={{ ...S.th, textAlign: "right", whiteSpace: "nowrap" }}>{t.income.cols.net}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.map(q => {
                      const hasData = q.revenue > 0 || q.expense > 0;
                      return (
                        <tr key={q.key} style={{ opacity: hasData ? 1 : 0.4 }}>
                          <td style={{ ...S.td, fontWeight: 800, color: "#60a5fa" }}>{q.key}</td>
                          <td style={{ ...S.td, color: "#8b8fa8", fontSize: 12 }}>{t.income.quarters[q.key]}</td>
                          <td style={{ ...S.td, textAlign: "right", color: "#4ade80", fontFamily: "monospace" }}>{q.revenue > 0 ? `₩${fmtNum(q.revenue, t.locale)}` : "-"}</td>
                          <td style={{ ...S.td, textAlign: "right", color: "#f87171", fontFamily: "monospace" }}>{q.expense > 0 ? `₩${fmtNum(q.expense, t.locale)}` : "-"}</td>
                          <td style={{ ...S.td, textAlign: "right", color: q.net >= 0 ? "#e8eaf0" : "#f87171", fontWeight: 700, fontFamily: "monospace" }}>{hasData ? `₩${fmtNum(q.net, t.locale)}` : "-"}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ borderTop: "2px solid #2a2d3a", background: "#1a1d26" }}>
                      <td style={{ ...S.td, fontWeight: 800, color: "#e8eaf0" }} colSpan={2}>{t.income.total}</td>
                      <td style={{ ...S.td, textAlign: "right", color: "#4ade80", fontWeight: 800, fontFamily: "monospace" }}>₩{fmtNum(annualRevenue, t.locale)}</td>
                      <td style={{ ...S.td, textAlign: "right", color: "#f87171", fontWeight: 800, fontFamily: "monospace" }}>₩{fmtNum(annualExpense, t.locale)}</td>
                      <td style={{ ...S.td, textAlign: "right", color: annualNet >= 0 ? "#4ade80" : "#f87171", fontWeight: 800, fontFamily: "monospace", fontSize: 15 }}>₩{fmtNum(annualNet, t.locale)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Per-person income tax */}
              <div style={{ background: "#16181f", border: "1px solid #4ade8033", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#4ade80", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>{t.income.perPersonTitle}</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[1, 2].map(person => (
                    <div key={person} style={{ flex: "1 1 200px", background: "#1a1d26", borderRadius: 10, padding: "16px 20px", border: "1px solid #2a2d3a" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#8b8fa8", marginBottom: 12 }}>
                        👤 {lang === "th" ? `คนที่ ${person}` : `${person}인`}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "#8b8fa8" }}>{t.income.perPersonShare}</span>
                          <span style={{ color: "#4ade80", fontWeight: 700, fontFamily: "monospace" }}>₩{fmtNum(Math.round(perPersonNet), t.locale)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "#8b8fa8" }}>{t.income.perPersonRate}</span>
                          <span style={{ color: "#fbbf24", fontWeight: 700 }}>{perPersonRate}%</span>
                        </div>
                        <div style={{ borderTop: "1px solid #2a2d3a", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#e8eaf0", fontWeight: 700, fontSize: 12 }}>{t.income.perPersonTax}</span>
                          <span style={{ color: "#fbbf24", fontWeight: 800, fontFamily: "monospace", fontSize: 18 }}>₩{fmtNum(perPersonTax, t.locale)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: "#4a5070" }}>{t.income.perPersonNote}</div>
              </div>

              <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, overflow: "auto", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#4ade80", letterSpacing: 1, margin: 16, textTransform: "uppercase" }}>{t.income.profitShareTitle}</div>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>{t.income.profitShareCols.date}</th>
                      <th style={S.th}>{t.income.profitShareCols.desc}</th>
                      <th style={S.th}>{t.income.profitShareCols.customer}</th>
                      <th style={{ ...S.th, textAlign: "right" }}>{t.income.profitShareCols.amount}</th>
                      <th style={S.th}>{t.income.profitShareCols.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitShareTransactions && profitShareTransactions.length > 0 ? (
                      profitShareTransactions.map(tx => (
                        <tr key={tx.id}>
                          <td style={{ ...S.td, whiteSpace: "nowrap", fontSize: 12 }}>{new Date(tx.date).toLocaleDateString(t.locale)}</td>
                          <td style={{ ...S.td, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.description || ""}>{tx.description || "-"}</td>
                          <td style={{ ...S.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.customerName || ""}>{tx.customerName || "-"}</td>
                          <td style={{ ...S.td, textAlign: "right", color: "#4ade80", fontWeight: 700, fontFamily: "monospace" }}>₩{fmtNum(tx.amount, t.locale)}</td>
                          <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                            <span style={{ background: `${t.statusColors[tx.status] || "#6b7280"}22`, color: t.statusColors[tx.status] || "#8b8fa8", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                              {t.statuses[tx.status] || tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#8b8fa8" }}>{t.income.noProfitShare}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tax bracket reference */}
              <div style={{ background: "#16181f", border: "1px solid #1e2130", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8b8fa8", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{t.income.taxBrackets}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
                  {[
                    ["≤ 14M", "6%"],  ["14M–50M", "15%"],   ["50M–88M", "24%"],
                    ["88M–150M", "35%"], ["150M–300M", "38%"], ["300M–500M", "40%"],
                    ["500M–1B", "42%"],  ["> 1B", "45%"],
                  ].map(([range, rate]) => (
                    <div key={range} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#6b7280", fontSize: 11 }}>₩{range}</span>
                      <span style={{ background: "#fbbf2422", color: "#fbbf24", borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{rate}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 11, color: "#4a5070", textAlign: "right" }}>{t.income.note}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
