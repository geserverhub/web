// ISO 14064-2 Greenhouse Gas Accounting Methodology

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
