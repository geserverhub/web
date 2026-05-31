// ISO 14064-2 Greenhouse Gas Accounting Methodology

/** Official Gold Standard URLs (do not use legacy /our-work/innovations-consultations/gs4gg). */
export const GOLD_STANDARD_URLS = {
  standard: 'https://www.goldstandard.org/gold-standard-for-the-global-goals',
  registry: 'https://registry.goldstandard.org/',
  registryHost: 'registry.goldstandard.org',
  standardHost: 'www.goldstandard.org',
} as const;

interface ISO14064Step {
  step: number;
  titleTh: string;
  titleEn: string;
  titleKo: string;
  descriptionTh: string;
  descriptionEn: string;
  descriptionKo: string;
  formula: string;
  unit: string;
  exampleTh: string;
  exampleEn: string;
  exampleKo: string;
  reference: string;
  certifications: { body: string; standard: string; url: string }[];
}

export const ISO14064MethodologySteps: ISO14064Step[] = [
  {
    step: 1,
    titleTh: "กำหนดค่าฐาน (Baseline)",
    titleEn: "Establish Baseline Energy Consumption",
    titleKo: "기준선 에너지 소비 설정",
    descriptionTh: "รวบรวมข้อมูลการใช้พลังงานไฟฟ้า ก่อนการติดตั้งอุปกรณ์ประหยัด",
    descriptionEn: "Collect electricity consumption data before installing energy-saving equipment",
    descriptionKo: "에너지 절감 장비 설치 전 전력 소비 데이터 수집",
    formula: "Σ monthly_consumption_before",
    unit: "kWh",
    exampleTh: "อาคารใช้ไฟฟ้า 3 เดือนก่อนติดตั้ง: 5,000 + 4,800 + 5,200 = 15,000 kWh (ค่าฐานรวม)",
    exampleEn: "Building consumed 5,000 + 4,800 + 5,200 kWh over 3 months before installation → Baseline = 15,000 kWh",
    exampleKo: "설치 전 3개월 소비: 5,000 + 4,800 + 5,200 = 15,000 kWh (기준선 합계)",
    reference: "ISO 14064-2:2019 §5.4 — Project baseline scenario; IPCC Guidelines for National GHG Inventories (2006)",
    certifications: [
      { body: "ISO (International Organization for Standardization)", standard: "ISO 14064-2:2019", url: "https://www.iso.org/standard/66454.html" },
      { body: "IPCC", standard: "2006 IPCC Guidelines for National GHG Inventories", url: "https://www.ipcc-nggip.iges.or.jp/public/2006gl/" },
    ],
  },
  {
    step: 2,
    titleTh: "วัดการใช้พลังงานจริง (Actual)",
    titleEn: "Measure Actual Energy Consumption",
    titleKo: "실제 에너지 소비 측정",
    descriptionTh: "วัดการใช้พลังงานไฟฟ้า หลังการติดตั้งอุปกรณ์ประหยัด",
    descriptionEn: "Measure electricity consumption after installing energy-saving equipment",
    descriptionKo: "에너지 절감 장비 설치 후 전력 소비 측정",
    formula: "Σ monthly_consumption_after",
    unit: "kWh",
    exampleTh: "หลังติดตั้งอุปกรณ์วัดได้: 3,500 + 3,200 + 3,800 = 10,500 kWh (การใช้จริงรวม)",
    exampleEn: "After installation measured: 3,500 + 3,200 + 3,800 = 10,500 kWh (total actual consumption)",
    exampleKo: "설치 후 측정: 3,500 + 3,200 + 3,800 = 10,500 kWh (실제 소비 합계)",
    reference: "ISO 14064-2:2019 §6.3 — Monitoring, measurement and metering; TGO Monitoring Report Guidelines",
    certifications: [
      { body: "ISO", standard: "ISO 14064-2:2019 §6.3", url: "https://www.iso.org/standard/66454.html" },
      { body: "TGO (Thailand Greenhouse Gas Management Organization)", standard: "T-VER Monitoring Report Guidelines", url: "https://www.tgo.or.th/2020/index.php/th/tver-standard" },
    ],
  },
  {
    step: 3,
    titleTh: "คำนวณพลังงานที่ประหยัด",
    titleEn: "Calculate Energy Saved",
    titleKo: "절감된 에너지 계산",
    descriptionTh: "ความแตกต่างระหว่างค่าฐานและการใช้จริง แสดงถึงพลังงานที่ประหยัด",
    descriptionEn: "The difference between baseline and actual consumption represents energy saved",
    descriptionKo: "기준선과 실제 소비의 차이는 절감된 에너지를 나타냅니다",
    formula: "baseline_energy - actual_energy",
    unit: "kWh",
    exampleTh: "15,000 − 10,500 = 4,500 kWh ประหยัดได้ (ลดลง 30%)",
    exampleEn: "15,000 − 10,500 = 4,500 kWh saved (30% reduction)",
    exampleKo: "15,000 − 10,500 = 4,500 kWh 절감 (30% 감소)",
    reference: "ISO 14064-2:2019 §6.4 — GHG emission reductions and removal enhancements",
    certifications: [
      { body: "ISO", standard: "ISO 14064-2:2019 §6.4", url: "https://www.iso.org/standard/66454.html" },
      { body: "UNFCCC", standard: "CDM Additionality Tool (EB 39)", url: "https://cdm.unfccc.int/methodologies/PAmethodologies/tools/am-tool-01-v7.pdf" },
    ],
  },
  {
    step: 4,
    titleTh: "ใช้ค่าแฟกเตอร์ปล่อยก๊าซเรือนกระจก",
    titleEn: "Apply CO₂ Emission Factor",
    titleKo: "CO₂ 배출 계수 적용",
    descriptionTh: "ใช้ค่าแฟกเตอร์ปล่อยก๊าซเรือนกระจกของประเทศ (Thailand: 0.5135 kg CO₂/kWh)",
    descriptionEn: "Use the GHG emission factor for the region (Thailand: 0.5135 kg CO₂/kWh)",
    descriptionKo: "해당 지역의 GHG 배출 계수 사용 (태국: 0.5135 kg CO₂/kWh)",
    formula: "0.5135 kg CO₂/kWh (Thailand grid average)",
    unit: "kg CO₂/kWh",
    exampleTh: "ค่าแฟกเตอร์ไทย: 0.5135 kg CO₂/kWh (ค่าเฉลี่ยระบบไฟฟ้าแห่งชาติ ปี 2566) | เกาหลี: 0.4557 kg CO₂/kWh",
    exampleEn: "Thailand factor: 0.5135 kg CO₂/kWh (national grid average 2023) | Korea: 0.4557 kg CO₂/kWh",
    exampleKo: "태국 계수: 0.5135 kg CO₂/kWh (2023 국가 전력망 평균) | 한국: 0.4557 kg CO₂/kWh",
    reference: "Thailand: TGO Emission Factor 2023 (DEDE/กรมพัฒนาพลังงานทดแทน); Korea: KEEI 2023; IEA CO₂ Emissions from Fuel Combustion",
    certifications: [
      { body: "TGO / DEDE (Thailand)", standard: "Grid Emission Factor 2023 — 0.5135 kgCO₂/kWh", url: "https://www.tgo.or.th/2020/index.php/th/ghg-factor" },
      { body: "KEEI (Korea Energy Economics Institute)", standard: "Korea Grid Emission Factor 2023 — 0.4557 kgCO₂/kWh", url: "https://www.keei.re.kr" },
      { body: "IEA", standard: "CO₂ Emissions from Fuel Combustion 2023", url: "https://www.iea.org/data-and-statistics/data-product/co2-emissions-from-fuel-combustion" },
    ],
  },
  {
    step: 5,
    titleTh: "คำนวณคาร์บอนไดออกไซด์ที่ลดลง",
    titleEn: "Calculate CO₂ Avoided",
    titleKo: "회피된 CO₂ 계산",
    descriptionTh: "คูณพลังงานที่ประหยัด ด้วย ค่าแฟกเตอร์ปล่อยก๊าซเรือนกระจก",
    descriptionEn: "Multiply energy saved by the CO₂ emission factor to get avoided CO₂",
    descriptionKo: "절감된 에너지에 CO₂ 배출 계수를 곱하여 회피된 CO₂ 계산",
    formula: "energy_saved × emission_factor",
    unit: "kg CO₂",
    exampleTh: "4,500 kWh × 0.5135 kg CO₂/kWh = 2,310.75 kg CO₂ ที่ลดลง",
    exampleEn: "4,500 kWh × 0.5135 kg CO₂/kWh = 2,310.75 kg CO₂ avoided",
    exampleKo: "4,500 kWh × 0.5135 kg CO₂/kWh = 2,310.75 kg CO₂ 회피",
    reference: "ISO 14064-2:2019 §6.5; IPCC 2006 Guidelines Vol.2 Energy — Stationary Combustion",
    certifications: [
      { body: "ISO", standard: "ISO 14064-2:2019 §6.5", url: "https://www.iso.org/standard/66454.html" },
      { body: "IPCC", standard: "2006 Guidelines Vol.2 Ch.2 — Stationary Combustion", url: "https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html" },
      { body: "GHG Protocol", standard: "GHG Protocol Corporate Standard", url: "https://ghgprotocol.org/corporate-standard" },
    ],
  },
  {
    step: 6,
    titleTh: "แปลงเป็นคาร์บอนเครดิต",
    titleEn: "Convert to Carbon Credits",
    titleKo: "탄소 크레딧으로 변환",
    descriptionTh: "แปลง CO₂ ที่ลดลง (kg) เป็นคาร์บอนเครดิต (1 tonnes CO₂e = 1 credit)",
    descriptionEn: "Convert avoided CO₂ (kg) to carbon credits (1 tonne CO₂e = 1 credit)",
    descriptionKo: "회피된 CO₂ (kg)를 탄소 크레딧으로 변환 (1 tonne CO₂e = 1 credit)",
    formula: "co2_avoided_kg ÷ 1000",
    unit: "tCO₂e (tonnes CO₂ equivalent)",
    exampleTh: "2,310.75 kg ÷ 1,000 = 2.311 tCO₂e → 2.311 คาร์บอนเครดิต (1 เครดิต = 1 tCO₂e)",
    exampleEn: "2,310.75 kg ÷ 1,000 = 2.311 tCO₂e → 2.311 carbon credits (1 credit = 1 tCO₂e)",
    exampleKo: "2,310.75 kg ÷ 1,000 = 2.311 tCO₂e → 2.311 탄소 크레딧 (1 크레딧 = 1 tCO₂e)",
    reference: "UNFCCC CDM Methodology; Gold Standard for the Global Goals; T-VER (Thailand Voluntary Emission Reduction) Program — TGO",
    certifications: [
      { body: "UNFCCC", standard: "CDM Methodology — AMS-II.C / AMS-II.E (Energy Efficiency)", url: "https://cdm.unfccc.int/methodologies/SSCmethodologies/approved" },
      { body: "Gold Standard", standard: "Gold Standard for the Global Goals (GS4GG)", url: GOLD_STANDARD_URLS.standard },
      { body: "Gold Standard Registry", standard: "Impact Registry — verified GS credits", url: GOLD_STANDARD_URLS.registry },
      { body: "TGO (Thailand)", standard: "T-VER Standard v3.0", url: "https://www.tgo.or.th/2020/index.php/th/tver-standard" },
    ],
  },
  {
    step: 7,
    titleTh: "คำนวณมูลค่าตลาดของคาร์บอนเครดิต",
    titleEn: "Estimate Market Value",
    titleKo: "탄소 크레딧의 시장 가치 추정",
    descriptionTh: "คูณคาร์บอนเครดิต ด้วย ราคาตลาดต่อตันเพื่อให้ได้มูลค่าตลาดโดยประมาณ",
    descriptionEn: "Multiply carbon credits by market price per tonne to estimate market value",
    descriptionKo: "탄소 크레딧에 톤당 시장 가격을 곱하여 시장 가치 추정",
    formula: "carbon_credits × price_per_tonne",
    unit: "THB | KRW",
    exampleTh: "2.311 tCO₂e × ฿300/tonne = ฿693.30 (ตลาดคาร์บอนภาคสมัครใจไทย) หรือ × ₩8,000/tonne = ₩18,488 (ตลาดเกาหลี)",
    exampleEn: "2.311 tCO₂e × ฿300/tonne = ฿693.30 (Thailand voluntary market) or × ₩8,000/tonne = ₩18,488 (Korea ETS)",
    exampleKo: "2.311 tCO₂e × ₩8,000/tonne = ₩18,488 (한국 ETS) 또는 × ฿300/tonne = ฿693.30 (태국 자발적 시장)",
    reference: "Thailand T-VER Price: TGO Carbon Market (2024 avg ฿250–400/tCO₂e); Korea ETS: KRX Carbon Market (2024 avg ₩7,000–9,000/tCO₂e); World Bank Carbon Pricing Dashboard",
    certifications: [
      { body: "TGO — Thailand Carbon Market", standard: "T-VER Market Price 2024 (฿250–400/tCO₂e)", url: "https://carbonmarket.tgo.or.th" },
      { body: "KRX — Korea Exchange", standard: "Korea ETS (K-ETS) Carbon Market 2024", url: "https://ets.krx.co.kr" },
      { body: "World Bank", standard: "Carbon Pricing Dashboard", url: "https://carbonpricingdashboard.worldbank.org" },
      { body: "Gold Standard Registry", standard: "Verified GS credits (USD market ref.)", url: GOLD_STANDARD_URLS.registry },
      { body: "Gold Standard", standard: "GS4GG standard documentation", url: GOLD_STANDARD_URLS.standard },
    ],
  },
];

export const getMethodologyStep = (
  stepNumber: number,
  locale: string
): ISO14064Step | undefined => {
  const step = ISO14064MethodologySteps.find((s) => s.step === stepNumber);
  if (!step) return undefined;

  const lang = locale === "th" ? "th" : locale === "ko" ? "ko" : "en";
  return {
    ...step,
    title:
      lang === "th"
        ? step.titleTh
        : lang === "ko"
          ? step.titleKo
          : step.titleEn,
    description:
      lang === "th"
        ? step.descriptionTh
        : lang === "ko"
          ? step.descriptionKo
          : step.descriptionEn,
  } as any;
};

export const getLocaleLabel = (
  locale: string,
  th: string,
  en: string,
  ko: string
): string => {
  if (locale === "th") return th;
  if (locale === "ko") return ko;
  return en;
};
