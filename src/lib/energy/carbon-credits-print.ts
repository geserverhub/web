import { GOLD_STANDARD_URLS, ISO14064MethodologySteps } from '@/lib/carbon-calculations';
import { buildCarbonPrintCss } from './carbon-credits-print-css';

export type CarbonSummarySlice = {
  totalEnergySavedKwh: number;
  totalCo2Kg: number;
  carbonCreditsTonnes: number;
  estimatedValue: number;
  currency: string;
  creditPricePerTonne: number;
};

export type PerDeviceCard = {
  deviceId: number;
  deviceName: string;
  GEsaveID: string;
  energySavedKwh: number;
  co2Kg: number;
  carbonCreditsTonnes: number;
};

export type MeterRowLike = {
  rank: number;
  deviceId: number;
  deviceName: string;
  GEsaveID: string;
  ch1Before: string;
  ch2After: string;
  totalKwhCh1Before: number;
  totalKwhCh2After: number;
  energySavedKwh: number;
  co2Kg: number;
  carbonCreditsTonnes: number;
  estimatedValueKRW: number;
  estimatedValueTHB: number;
  recordCount?: number;
};

export type MeterTotalsLike = {
  energySavedKwh: number;
  co2Kg: number;
  carbonCreditsTonnes: number;
  estimatedValueKRW: number;
  estimatedValueTHB: number;
  totalKwhCh1Before: number;
  totalKwhCh2After: number;
};

export type DailyTrendPoint = {
  date: string;
  energySavedKwh: number;
  co2Kg: number;
  carbonCreditsTonnes: number;
};

export function fmtReport(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtCurrency(value: number, currency: string): string {
  if (currency === 'THB') return `฿${value.toLocaleString()}`;
  if (currency === 'KRW') return `₩${value.toLocaleString()}`;
  return value.toLocaleString();
}

export function sumMeterTotals(meters: MeterRowLike[]): MeterTotalsLike | null {
  if (!meters.length) return null;
  return meters.reduce(
    (acc, m) => ({
      energySavedKwh: Math.round((acc.energySavedKwh + m.energySavedKwh) * 100) / 100,
      co2Kg: Math.round((acc.co2Kg + m.co2Kg) * 100) / 100,
      carbonCreditsTonnes: Math.round((acc.carbonCreditsTonnes + m.carbonCreditsTonnes) * 10000) / 10000,
      estimatedValueKRW: acc.estimatedValueKRW + m.estimatedValueKRW,
      estimatedValueTHB: acc.estimatedValueTHB + m.estimatedValueTHB,
      totalKwhCh1Before: Math.round((acc.totalKwhCh1Before + m.totalKwhCh1Before) * 100) / 100,
      totalKwhCh2After: Math.round((acc.totalKwhCh2After + m.totalKwhCh2After) * 100) / 100,
    }),
    {
      energySavedKwh: 0,
      co2Kg: 0,
      carbonCreditsTonnes: 0,
      estimatedValueKRW: 0,
      estimatedValueTHB: 0,
      totalKwhCh1Before: 0,
      totalKwhCh2After: 0,
    },
  );
}

export function buildCarbonReportScope(input: {
  summary: CarbonSummarySlice;
  topDevices: PerDeviceCard[];
  meters: MeterRowLike[];
  meterTotals: MeterTotalsLike | null;
  activeScopeIds: number[] | null;
  pickedIds: Set<number>;
  selectedDeviceId: number | null;
}) {
  const displayScopeSet =
    input.activeScopeIds && input.activeScopeIds.length > 0
      ? new Set(input.activeScopeIds)
      : input.pickedIds.size > 0
        ? input.pickedIds
        : null;

  const analysisMeters = input.meters.filter(
    (m) => !displayScopeSet || displayScopeSet.has(m.deviceId),
  );

  const perDeviceCards: PerDeviceCard[] =
    analysisMeters.length > 0
      ? analysisMeters.map((m) => ({
          deviceId: m.deviceId,
          deviceName: m.deviceName,
          GEsaveID: m.GEsaveID,
          energySavedKwh: m.energySavedKwh,
          co2Kg: m.co2Kg,
          carbonCreditsTonnes: m.carbonCreditsTonnes,
        }))
      : input.topDevices
          .filter((d) => !displayScopeSet || displayScopeSet.has(d.deviceId))
          .map((d) => ({ ...d, deviceId: Number(d.deviceId) }));

  const creditsDenominator =
    perDeviceCards.reduce((sum, d) => sum + d.carbonCreditsTonnes, 0) || 1;

  const focusedMeter =
    input.selectedDeviceId != null
      ? perDeviceCards.find((d) => d.deviceId === input.selectedDeviceId)
      : null;

  const scopedTotals = sumMeterTotals(analysisMeters) ?? input.meterTotals;

  const displaySummary: CarbonSummarySlice = focusedMeter
    ? {
        carbonCreditsTonnes: focusedMeter.carbonCreditsTonnes,
        totalCo2Kg: focusedMeter.co2Kg,
        totalEnergySavedKwh: focusedMeter.energySavedKwh,
        estimatedValue: Math.round(
          focusedMeter.carbonCreditsTonnes * input.summary.creditPricePerTonne,
        ),
        currency: input.summary.currency,
        creditPricePerTonne: input.summary.creditPricePerTonne,
      }
    : input.activeScopeIds && input.activeScopeIds.length > 0 && input.meterTotals
      ? {
          carbonCreditsTonnes: input.meterTotals.carbonCreditsTonnes,
          totalCo2Kg: input.meterTotals.co2Kg,
          totalEnergySavedKwh: input.meterTotals.energySavedKwh,
          estimatedValue:
            input.summary.currency === 'KRW'
              ? input.meterTotals.estimatedValueKRW
              : input.meterTotals.estimatedValueTHB,
          currency: input.summary.currency,
          creditPricePerTonne: input.summary.creditPricePerTonne,
        }
      : input.summary;

  return {
    displayScopeSet,
    analysisMeters,
    perDeviceCards,
    creditsDenominator,
    displaySummary,
    scopedTotals,
  };
}

type PrintLocale = 'th' | 'en' | 'ko';

function tr(locale: PrintLocale, th: string, en: string, ko: string): string {
  if (locale === 'th') return th;
  if (locale === 'ko') return ko;
  return en;
}

export function buildCarbonPrintHtml(options: {
  reportId: string;
  printLocale: PrintLocale;
  period: number;
  selectedSite: string;
  summary: CarbonSummarySlice;
  creditPricePerTonne: number;
  analysisMeters: MeterRowLike[];
  perDeviceCards: PerDeviceCard[];
  creditsDenominator: number;
  scopedTotals: MeterTotalsLike | null;
  meterTotals: MeterTotalsLike | null;
  scopeLabel: string | null;
  pickedCount: number;
  selectedDeviceId: number | null;
  fxKrwToThb: number | null;
  fxLastUpdated: string | null;
  dailyTrend: DailyTrendPoint[];
}): string {
  const {
    reportId,
    printLocale,
    period,
    selectedSite,
    summary,
    creditPricePerTonne,
    analysisMeters,
    perDeviceCards,
    creditsDenominator,
    scopedTotals,
    meterTotals,
    scopeLabel,
    pickedCount,
    selectedDeviceId,
    fxKrwToThb,
    fxLastUpdated,
    dailyTrend,
  } = options;

  const t = (th: string, en: string, ko: string) => tr(printLocale, th, en, ko);
  const htmlLang = printLocale === 'ko' ? 'ko' : printLocale === 'th' ? 'th' : 'en';
  const dateLocale = printLocale === 'ko' ? 'ko-KR' : printLocale === 'th' ? 'th-TH' : 'en-US';
  const now = new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });

  const krwPrice =
    summary.currency === 'KRW'
      ? creditPricePerTonne
      : fxKrwToThb
        ? Math.round(creditPricePerTonne / fxKrwToThb)
        : 32000;
  const thbPrice =
    summary.currency === 'THB'
      ? creditPricePerTonne
      : fxKrwToThb
        ? Math.round(creditPricePerTonne * fxKrwToThb)
        : 250;
  const krwValue =
    summary.currency === 'KRW'
      ? summary.estimatedValue
      : fxKrwToThb
        ? Math.round(summary.estimatedValue / fxKrwToThb)
        : 0;
  const thbValue =
    summary.currency === 'THB'
      ? summary.estimatedValue
      : fxKrwToThb
        ? Math.round(summary.estimatedValue * fxKrwToThb)
        : 0;

  const declText =
    printLocale === 'ko'
      ? `본인은 이 보고서의 데이터가 ISO 14064-2:2019 표준에 따라 정확하고 완전하게 작성되었음을 인증합니다. 태국 국가 전력망 배출 계수(TGO/DEDE 2023: 0.5135 kgCO₂/kWh)를 사용하였으며, 본 보고서는 T-VER(TGO 태국), K-ETS(KRX 한국) 또는 동등한 자발적/의무적 프로그램의 탄소 크레딧 인증 신청을 위한 지원 문서로 활용될 수 있습니다.`
      : printLocale === 'th'
        ? `ข้าพเจ้าขอรับรองว่าข้อมูลในรายงานฉบับนี้ถูกต้องและครบถ้วนตามความเป็นจริง จัดทำตามมาตรฐาน ISO 14064-2:2019 ด้วยค่าแฟกเตอร์การปล่อยก๊าซเรือนกระจกจาก TGO/DEDE ปี 2566 (0.5135 kgCO₂/kWh) ข้อมูลนี้สามารถใช้เป็นหลักฐานประกอบการยื่นขอรับรองคาร์บอนเครดิตในโปรแกรม T-VER ของ TGO, K-ETS (KRX เกาหลี) หรือโปรแกรมที่เกี่ยวข้อง`
        : `I hereby certify that the data in this report is accurate and complete, prepared in accordance with ISO 14064-2:2019 using the Thailand national grid emission factor (TGO/DEDE 2023: 0.5135 kgCO₂/kWh). This report may serve as supporting documentation for carbon credit certification under T-VER (TGO Thailand), K-ETS (KRX Korea), or equivalent voluntary/mandatory programs.`;

  const showGrandTotal =
    selectedDeviceId === null && meterTotals && perDeviceCards.length !== 1;
  const totals = showGrandTotal ? meterTotals : null;

  const meterRowsHtml = analysisMeters
    .map((m) => {
      const thbVal = fxKrwToThb ? Math.round(m.estimatedValueKRW * fxKrwToThb) : m.estimatedValueTHB;
      return `<tr>
        <td class="mono">${m.rank}</td>
        <td class="bold">${esc(m.deviceName)}</td>
        <td class="mono">${esc(m.GEsaveID)}</td>
        <td class="mono center ch1">${esc(m.ch1Before)}</td>
        <td class="mono center ch2">${esc(m.ch2After)}</td>
        <td class="num ch1">${fmtReport(m.totalKwhCh1Before)}</td>
        <td class="num ch2">${fmtReport(m.totalKwhCh2After)}</td>
        <td class="num saved">${fmtReport(m.energySavedKwh)}</td>
        <td class="num co2">${fmtReport(m.co2Kg)}</td>
        <td class="num credit">${fmtReport(m.carbonCreditsTonnes)}</td>
        <td class="num krw">₩${m.estimatedValueKRW.toLocaleString()}</td>
        <td class="num thb">฿${thbVal.toLocaleString()}</td>
      </tr>`;
    })
    .join('');

  const totalsFootHtml = totals
    ? `<tfoot><tr>
        <td colspan="3" class="bold">${t('✓ รวมทั้งหมด', '✓ Grand Total', '✓ 합계')}</td>
        <td class="center">—</td><td class="center">—</td>
        <td class="num ch1">${fmtReport(totals.totalKwhCh1Before)}</td>
        <td class="num ch2">${fmtReport(totals.totalKwhCh2After)}</td>
        <td class="num saved">${fmtReport(totals.energySavedKwh)}</td>
        <td class="num co2">${fmtReport(totals.co2Kg)}</td>
        <td class="num credit">${fmtReport(totals.carbonCreditsTonnes)}</td>
        <td class="num krw">₩${totals.estimatedValueKRW.toLocaleString()}</td>
        <td class="num thb">฿${(fxKrwToThb ? Math.round(totals.estimatedValueKRW * fxKrwToThb) : totals.estimatedValueTHB).toLocaleString()}</td>
      </tr></tfoot>`
    : '';

  const deviceCardsHtml = perDeviceCards
    .map((device) => {
      const share =
        creditsDenominator > 0 ? (device.carbonCreditsTonnes / creditsDenominator) * 100 : 0;
      return `<div class="dev-card">
        <div class="dev-hdr">
          <strong>${esc(device.deviceName)}</strong>
          <span class="dev-id">${esc(device.GEsaveID || '—')}</span>
        </div>
        <div class="dev-stats">
          <div><label>${t('ไฟประหยัด', 'Energy Saved', '에너지 절감')}</label><strong>${fmtReport(device.energySavedKwh)} kWh</strong></div>
          <div><label>CO₂</label><strong>${fmtReport(device.co2Kg)} kg</strong></div>
          <div><label>${t('คาร์บอนเครดิต', 'Carbon Credits', '탄소 크레딧')}</label><strong>${fmtReport(device.carbonCreditsTonnes)} tCO₂e</strong></div>
          <div><label>${t('สัดส่วน', 'Share', '비율')}</label><strong>${fmtReport(share)}%</strong></div>
        </div>
      </div>`;
    })
    .join('');

  const methodologyHtml = ISO14064MethodologySteps.map((step) => {
    const title =
      printLocale === 'ko' ? step.titleKo : printLocale === 'th' ? step.titleTh : step.titleEn;
    const desc =
      printLocale === 'ko'
        ? step.descriptionKo
        : printLocale === 'th'
          ? step.descriptionTh
          : step.descriptionEn;
    const ex =
      printLocale === 'ko' ? step.exampleKo : printLocale === 'th' ? step.exampleTh : step.exampleEn;
    return `<div class="step">
      <div class="step-num">${step.step}</div>
      <div>
        <div class="step-ttl">${esc(title)}</div>
        <div class="step-desc">${esc(desc)}</div>
        <span class="step-fml">Formula: ${esc(step.formula)} → ${esc(step.unit)}</span>
        <div class="step-ex">📐 ${esc(ex)}</div>
        <div class="step-ref">📄 ${esc(step.reference)}</div>
      </div>
    </div>`;
  }).join('');

  const fxRow = fxKrwToThb
    ? `<tr><td>${t('อัตราแลกเปลี่ยน KRW/THB (เรียลไทม์)', 'KRW/THB Exchange Rate (live)', 'KRW/THB 환율 (실시간)')}</td><td><strong>${fxKrwToThb.toFixed(6)}</strong></td><td>THB / 1 KRW</td><td>open.er-api.com</td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="UTF-8">
<title>${t('รายงานโครงการลดการปล่อยก๊าซเรือนกระจก', 'GHG Emission Reduction Project Report', '온실가스 감축 프로젝트 보고서')} — ${esc(reportId)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;900&family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${buildCarbonPrintCss()}</style>
</head>
<body>

<!-- ═══ HEADER ═══ -->
<div class="rpt-hdr">
  <div class="rpt-hdr-top">
    <div>
      <div class="rpt-co">GE ENERGY TECHNOLOGY CO., LTD.</div>
      <h1>${t('รายงานโครงการลดการปล่อยก๊าซเรือนกระจก', 'GHG Emission Reduction Project Report', '온실가스 감축 프로젝트 보고서')}</h1>
      <h2>ISO 14064-2:2019 <span class="rpt-badge">T-VER / K-ETS ${t('มีสิทธิ์ยื่นขอ', 'Eligible', '신청 가능')}</span></h2>
      ${scopeLabel ? `<div class="scope-tag">📋 ${esc(scopeLabel)}</div>` : ''}
    </div>
    <div class="rpt-id-box">
      <label>REPORT ID</label>
      <strong>${esc(reportId)}</strong>
    </div>
  </div>
  <div class="rpt-meta">
    <div><label>${t('วันที่ออกรายงาน', 'Issue Date', '발행일')}</label><strong>${now}</strong></div>
    <div><label>${t('ช่วงเวลา', 'Reporting Period', '보고 기간')}</label><strong>${period} ${t('วัน', 'days', '일')}</strong></div>
    <div><label>Site</label><strong>${esc(selectedSite.toUpperCase())}</strong></div>
    <div><label>${t('มาตรฐาน', 'Standard', '표준')}</label><strong>ISO 14064-2:2019</strong></div>
    <div><label>${t('โปรแกรม', 'Program', '프로그램')}</label><strong>T-VER · K-ETS · GHG Protocol</strong></div>
  </div>
</div>

<!-- ═══ 1. EXECUTIVE SUMMARY ═══ -->
<div class="sec">1. ${t('สรุปผลโครงการ', 'Executive Summary', '프로젝트 요약')}</div>
<div class="kpi-row">
  <div class="kpi">
    <div class="kpi-val">${fmtReport(summary.totalEnergySavedKwh)}</div>
    <div class="kpi-lbl">${t('พลังงานที่ประหยัด', 'Energy Saved', '절감 에너지')}</div>
    <div class="kpi-unit">kWh</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">${fmtReport(summary.totalCo2Kg)}</div>
    <div class="kpi-lbl">${t('CO₂ ที่ลดลง', 'CO₂ Avoided', 'CO₂ 회피')}</div>
    <div class="kpi-unit">kg CO₂</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">${fmtReport(summary.carbonCreditsTonnes)}</div>
    <div class="kpi-lbl">${t('คาร์บอนเครดิต', 'Carbon Credits', '탄소 크레딧')}</div>
    <div class="kpi-unit">tCO₂e</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">₩${krwValue.toLocaleString()}</div>
    <div class="kpi-sub">≈ ฿${thbValue.toLocaleString()}</div>
    <div class="kpi-lbl">${t('มูลค่าตลาด', 'Market Value', '시장 가치')}</div>
    <div class="kpi-unit">KRW / THB</div>
  </div>
</div>

<table class="param-tbl">
  <tr><th>${t('พารามิเตอร์', 'Parameter', '파라미터')}</th><th>${t('ค่า', 'Value', '값')}</th><th>${t('หน่วย', 'Unit', '단위')}</th><th>${t('แหล่งอ้างอิง', 'Source', '출처')}</th></tr>
  <tr><td>${t('ค่าแฟกเตอร์ปล่อยก๊าซ Thailand Grid', 'Thailand Grid Emission Factor', '태국 그리드 배출 계수')}</td><td><strong>0.5135</strong></td><td>kg CO₂/kWh</td><td>TGO / DEDE 2023</td></tr>
  <tr><td>${t('ราคาอ้างอิง Korea K-ETS', 'Korea K-ETS Reference Price', '한국 K-ETS 참고 가격')}</td><td><strong>₩${krwPrice.toLocaleString()}</strong></td><td>KRW / tCO₂e</td><td>KRX Carbon Market 2024</td></tr>
  <tr><td>${t('ราคาอ้างอิง Thailand T-VER', 'Thailand T-VER Reference Price', '태국 T-VER 참고 가격')}</td><td><strong>฿${thbPrice.toLocaleString()}</strong></td><td>THB / tCO₂e</td><td>TGO Carbon Market 2024</td></tr>
  ${fxRow}
  <tr><td>${t('จำนวนมิเตอร์ที่รายงาน', 'Meters Reported', '보고 미터 수')}</td><td><strong>${perDeviceCards.length}</strong></td><td>${t('เครื่อง', 'devices', '대')}</td><td>GE IoT / power_records</td></tr>
</table>

<div class="two-col">
  <div class="info-box">
    <h4>📍 ${t('ขอบเขตโครงการ (Project Boundary)', 'Project Boundary (ISO 14064-2 §5.3)', '프로젝트 경계 (ISO 14064-2 §5.3)')}</h4>
    <ul>
      <li>${t('ประเภทโครงการ: ประสิทธิภาพพลังงาน', 'Project type: Energy Efficiency', '프로젝트 유형: 에너지 효율')}</li>
      <li>${t('ขอบเขต: Scope 2 — การปล่อยก๊าซทางอ้อมจากไฟฟ้า', 'Scope: Scope 2 — Indirect emissions from electricity', '범위: Scope 2 — 전력 간접 배출')}</li>
      <li>${t('พื้นที่โครงการ: ', 'Project site: ', '프로젝트 위치: ')}${esc(selectedSite.toUpperCase())}</li>
      <li>${t('ช่วงเวลารายงาน: ', 'Reporting period: ', '보고 기간: ')}${period} ${t('วัน', 'days', '일')}</li>
    </ul>
  </div>
  <div class="info-box">
    <h4>✅ ${t('การพิสูจน์ความเพิ่มเติม (Additionality)', 'Additionality Assessment (ISO 14064-2 §5.5)', '추가성 평가 (ISO 14064-2 §5.5)')}</h4>
    <ul>
      <li>${t('อุปกรณ์ประหยัดพลังงาน GE ไม่ใช่กรณีปกติ (BAU)', 'GE energy-saving devices are not BAU', 'GE 절감 장치는 BAU가 아님')}</li>
      <li>${t('การลดลงของ CO₂ เกินกว่าที่กฎหมายกำหนด', 'CO₂ reduction exceeds regulatory requirements', 'CO₂ 감축이 규제 요건 초과')}</li>
      <li>${t('มีอุปสรรคด้านการลงทุน (Investment barrier)', 'Investment barrier exists', '투자 장벽 존재')}</li>
    </ul>
  </div>
</div>

<!-- ═══ 2. METHODOLOGY ═══ -->
<div class="sec">2. ${t('วิธีการคำนวณตามมาตรฐาน ISO 14064-2:2019', 'Calculation Methodology — ISO 14064-2:2019', '계산 방법론 — ISO 14064-2:2019')}</div>
${methodologyHtml}

<div class="monitor-box">
  <h4>📋 ${t('แผนการติดตามตรวจสอบ (Monitoring Plan) — ISO 14064-2:2019 §6.3', 'Monitoring Plan — ISO 14064-2:2019 §6.3', '모니터링 계획 — ISO 14064-2:2019 §6.3')}</h4>
  <div class="monitor-grid">
    <div>
      <strong>${t('พารามิเตอร์ที่ตรวจวัด:', 'Monitored Parameters:', '모니터링 파라미터:')}</strong>
      <ul>
        <li>${t('การใช้พลังงานไฟฟ้าจริง (kWh) — อ่านจากมิเตอร์', 'Actual electricity consumption (kWh) — meter readings', '실제 전력 소비 (kWh) — 미터 수치')}</li>
        <li>${t('ค่าฐาน (Baseline) — ก่อนติดตั้งอุปกรณ์', 'Baseline consumption — pre-installation', '기준선 소비 — 설치 전')}</li>
        <li>${t('ค่าแฟกเตอร์ปล่อยก๊าซเรือนกระจก (EF) — TGO/DEDE', 'Emission Factor (EF) — TGO/DEDE', '배출 계수 (EF) — TGO/DEDE')}</li>
      </ul>
    </div>
    <div>
      <strong>${t('ความถี่ในการตรวจวัด:', 'Monitoring Frequency:', '모니터링 주기:')}</strong>
      <ul>
        <li>${t('บันทึกแบบ Real-time ผ่านระบบ GE IoT', 'Real-time via GE IoT metering system', 'GE IoT 미터링 시스템으로 실시간')}</li>
        <li>${t('รายงานรายเดือน / รายปี', 'Monthly / Annual reports', '월간 / 연간 보고서')}</li>
        <li>${t('สอบเทียบมิเตอร์ทุก 12 เดือน', 'Meter calibration every 12 months', '12개월마다 미터 교정')}</li>
      </ul>
    </div>
  </div>
</div>

<!-- ═══ 3. PER-METER DATA ═══ -->
<div class="pb"></div>
<div class="sec">3. ${t('ข้อมูลรายมิเตอร์', 'Per-Meter Device Data', '미터별 장치 데이터')}${pickedCount > 0 ? ` (${pickedCount} ${t('มิเตอร์', 'meters', '미터')})` : ''}</div>
${
  analysisMeters.length
    ? `<table class="data-tbl">
  <thead><tr>
    <th>#</th><th>${t('อุปกรณ์', 'Device', '장치')}</th><th>Meter ID</th>
    <th class="center">${t('CH1 ก่อน', 'CH1 Before', 'CH1 설치 전')}</th>
    <th class="center">${t('CH2 หลัง', 'CH2 After', 'CH2 설치 후')}</th>
    <th class="num">${t('kWh CH1', 'kWh CH1', 'kWh CH1')}</th>
    <th class="num">${t('kWh CH2', 'kWh CH2', 'kWh CH2')}</th>
    <th class="num">${t('ไฟประหยัด', 'Saved', '절감')}</th>
    <th class="num">CO₂</th>
    <th class="num">${t('เครดิต', 'Credits', '크레딧')}</th>
    <th class="num">KRW</th>
    <th class="num">THB</th>
  </tr></thead>
  <tbody>${meterRowsHtml}</tbody>
  ${totalsFootHtml}
</table>
${fxKrwToThb ? `<p class="footnote">* THB ${t('คำนวณจากอัตราแลกเปลี่ยนสด', 'calculated from live rate', '실시간 환율 적용')}: 1 KRW = ${fxKrwToThb.toFixed(6)} THB</p>` : ''}`
    : `<div class="warn">⚠️ ${t('ไม่มีข้อมูลมิเตอร์ — กด "คำนวณ" ก่อนพิมพ์', 'No meter data — press Calculate before printing', '미터 데이터 없음 — 인쇄 전 계산')}</div>`
}

<!-- ═══ 4. PER-DEVICE ANALYSIS ═══ -->
${
  perDeviceCards.length
    ? `<div class="sec">4. ${t('การวิเคราะห์ต่อตัวมิเตอร์', 'Per-Meter Analysis', '미터별 분석')} (${perDeviceCards.length})</div>
<div class="dev-grid">${deviceCardsHtml}</div>`
    : ''
}

<!-- ═══ 5. CERTIFICATION ═══ -->
<div class="pb"></div>
<div class="sec">5. ${t('ข้อกำหนดการขอรับรองคาร์บอนเครดิต', 'Carbon Credit Certification Requirements', '탄소 크레딧 인증 요건')}</div>
<div class="two-col">
  <div class="checklist">
    <h4>🇹🇭 T-VER (TGO Thailand)</h4>
    <div class="check-item"><span class="check-box">✓</span><span>PDD / Monitoring Report</span></div>
    <div class="check-item"><span class="check-box">✓</span><span>${t('รายงาน ISO 14064-2 ฉบับนี้', 'This ISO 14064-2 report', '이 ISO 14064-2 보고서')}</span></div>
    <div class="check-item"><span class="check-box">✓</span><span>TGO/DEDE 2023 EF (0.5135)</span></div>
    <div class="check-item"><span class="check-box" style="border-color:#9ca3af;color:#9ca3af">□</span><span style="color:#6b7280">${t('การตรวจสอบโดย DOE/VVB', '3rd party DOE/VVB verification', 'DOE/VVB 제3자 검증')}</span></div>
  </div>
  <div class="checklist">
    <h4>🇰🇷 K-ETS (KRX Korea)</h4>
    <div class="check-item"><span class="check-box">✓</span><span>GHG Reduction Plan</span></div>
    <div class="check-item"><span class="check-box">✓</span><span>${t('รายงาน ISO 14064-2 ฉบับนี้', 'This ISO 14064-2 report', '이 ISO 14064-2 보고서')}</span></div>
    <div class="check-item"><span class="check-box">✓</span><span>${t('ผลการตรวจวัด Baseline & Actual', 'Baseline and actual measurement results', '기준선 및 실제 측정 결과')}</span></div>
    <div class="check-item"><span class="check-box" style="border-color:#9ca3af;color:#9ca3af">□</span><span style="color:#6b7280">${t('ยื่นผ่าน KRX ETS', 'Register on KRX ETS', 'KRX ETS 등록')}</span></div>
  </div>
</div>

<!-- ═══ 6. DECLARATION ═══ -->
<div class="sec">6. ${t('คำรับรองและลายมือชื่อ', 'Declaration & Authorized Signatures', '선언 및 서명')}</div>
<div class="decl">${declText}</div>
<div class="sig-grid">
  <div class="sig">
    <div class="sig-lbl">${t('ผู้จัดทำรายงาน', 'Report Preparer', '보고서 작성자')}</div>
    <div style="height:38px"></div>
    <div class="sig-line">${t('ชื่อ', 'Name', '성명')}: ________________________________</div>
    <div class="sig-line">${t('ตำแหน่ง', 'Title', '직책')}: ______________________________</div>
    <div class="sig-line">${t('วันที่', 'Date', '날짜')}: ${now}</div>
  </div>
  <div class="sig">
    <div class="sig-lbl">${t('ผู้ตรวจสอบอิสระ', 'Independent Verifier (DOE/VVB)', '독립 검증인 (DOE/VVB)')}</div>
    <div style="height:38px"></div>
    <div class="sig-line">${t('ชื่อ', 'Name', '성명')}: ________________________________</div>
    <div class="sig-line">${t('องค์กร', 'Organization', '기관')}: _____________________________</div>
    <div class="sig-line">${t('วันที่', 'Date', '날짜')}: ________________________________</div>
  </div>
  <div class="sig">
    <div class="sig-lbl">${t('ผู้มีอำนาจลงนาม', 'Authorized Signatory', '승인 서명자')}</div>
    <div style="height:38px"></div>
    <div class="sig-line">${t('ชื่อ', 'Name', '성명')}: ________________________________</div>
    <div class="sig-line">${t('ตำแหน่ง', 'Title', '직책')}: ______________________________</div>
    <div class="sig-line">${t('วันที่', 'Date', '날짜')}: ________________________________</div>
  </div>
</div>

<div class="rpt-footer">
  <span>Report ID: <strong>${esc(reportId)}</strong> · ${esc(now)} · GE Energy Technology Co., Ltd.</span>
  <span>ISO 14064-2:2019 · T-VER · K-ETS · GHG Protocol · Gold Standard · ${esc(GOLD_STANDARD_URLS.standardHost)}</span>
</div>
</body></html>`;
}
