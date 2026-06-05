import type { EqLocale } from './energy-quality-i18n';

export type ReportSectionRefKey =
  | 'sec4'
  | 'sec5'
  | 'sec6'
  | 'sec7'
  | 'sec8'
  | 'sec9'
  | 'sec10'
  | 'sec11'
  | 'sec12'
  | 'sec13'
  | 'sec14';

export type ReportStandardsPack = {
  countryName: string;
  titles: {
    block: string;
    agencies: string;
    research: string;
    criteria: string;
    criteriaMetric: string;
    criteriaThreshold: string;
    criteriaReference: string;
    sectionRef: string;
    liveSnapshot: string;
    technical: string;
  };
  introduction: string;
  agencies: { name: string; role: string }[];
  research: { citation: string; application: string }[];
  criteria: { metric: string; threshold: string; standard: string }[];
  sectionNotes: Partial<Record<ReportSectionRefKey, string>>;
};

const th: ReportStandardsPack = {
  countryName: 'ประเทศไทย',
  titles: {
    block: 'เกณฑ์การวิเคราะห์และอ้างอิงหน่วยงานราชการ',
    agencies: 'หน่วยงานกำกับดูแลและผู้ให้บริการไฟฟ้า',
    research: 'งานวิจัยและมาตรฐานที่อ้างอิง',
    criteria: 'เกณฑ์วิเคราะห์ที่ใช้ในรายงาน',
    criteriaMetric: 'ตัวชี้วัด',
    criteriaThreshold: 'เกณฑ์',
    criteriaReference: 'มาตรฐานอ้างอิง',
    sectionRef: 'อ้างอิงเกณฑ์หน่วยงาน',
    liveSnapshot: 'ค่ามิเตอร์เรียลไทม์ (CH1)',
    technical: 'คำแนะนำวิเคราะห์ทางเทคนิค (จากข้อมูลกระแสจริง)',
  },
  introduction:
    'รายงานฉบับนี้ประเมินคุณภาพพลังงานไฟฟ้าตามแนวปฏิบัติของหน่วยงานกำกับดูแลพลังงานไทย มาตรฐานสากล IEEE/IEC และหลักการวิเคราะห์ข้อมูลมิเตอร์ที่ใช้ในอุตสาหกรรม',
  agencies: [
    { name: 'สำนักงานคณะกรรมการกำกับกิจการพลังงาน (กกพ. / ERC)', role: 'กำกับคุณภาพการให้บริการไฟฟ้าและมาตรฐานผู้ใช้ไฟ' },
    { name: 'การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (กฟภ.)', role: 'เกณฑ์คุณภาพไฟฟ้า การคิดค่าไฟ และค่าปรับ Power Factor' },
    { name: 'การไฟฟ้านครหลวง (MEA) / การไฟฟ้าส่วนภูมิภาค (PEA)', role: 'ข้อกำหนด PF, Demand Charge และการบริหารจัดการโหลด' },
    { name: 'สำนักมาตรฐานระบบไฟฟ้า กฟภ.', role: 'แนวทางเทคนิคระบบจ่ายไฟ 3 相 400V อุตสาหกรรม' },
  ],
  research: [
    {
      citation: 'IEEE Std 519-2014 — Recommended Practice for Harmonic Control',
      application: 'ใช้ประเมิน THD/ฮาร์มอนิกและระดับความเสี่ยง (เตือน >8%, วิกฤต >15%)',
    },
    {
      citation: 'IEC 61000-4-30 — Power Quality Measurement Methods',
      application: 'หลักการวัดและสรุปค่า PF, กระแส 3 เฟส, และช่วงเวลาวิเคราะห์',
    },
    {
      citation: 'IEC 61000-2-2 / กฟภ. — Electromagnetic compatibility & voltage quality',
      application: 'อ้างอิงความสมดุลแรงดัน/กระแสและผลต่ออุปกรณ์',
    },
    {
      citation: 'งานวิจัย Demand Response & Load Factor (กกพ./สถาบันพลังงาน)',
      application: 'วิเคราะห์ Peak Demand, Load Factor และศักยภาพลดค่า Demand',
    },
  ],
  criteria: [
    { metric: 'Power Factor (PF)', threshold: '≥ 0.95 ดี · 0.85–0.95 เตือน · < 0.85 วิกฤต', standard: 'MEA/PEA ค่าปรับ PF, กฟภ.' },
    { metric: 'THD (กระแส)', threshold: '≤ 8% ดี · 8–15% เตือน · > 15% วิกฤต', standard: 'IEEE 519-2014' },
    { metric: 'ความไม่สมดุลกระแส 3 เฟส', threshold: '≤ 15% ดี · 15–30% เตือน · > 30% วิกฤต', standard: 'IEC / แนวปฏิบัติ กฟภ.' },
    { metric: 'ความไม่สมดุลแรงดัน', threshold: '≤ 15% ดี · 15–30% เตือน · > 30% วิกฤต', standard: 'IEC 61000-2-2' },
    { metric: 'Load Factor / Peak Ratio', threshold: '< 40% เตือน · Peak/Avg > 1.3 ควรบริหาร Peak', standard: 'กกพ. Demand Management' },
    { metric: 'ROI / คืนทุน APFC', threshold: '≤ 18 เดือน = เยี่ยม · 18–36 ยอมรับ · 36–60 ทบทวน · > 60 ช้า', standard: 'แนวทาง กฟภ./กกพ.' },
  ],
  sectionNotes: {
    sec4: 'พลังงานและ Load Profile — อ้างอิงอัตราค่าไฟ กฟภ./MEA/PEA และหลักการ kWh/Demand',
    sec5: 'Peak Demand — ตามหลัก Demand Charge ผู้ให้บริการไฟฟ้าไทย',
    sec6: 'Power Factor — เกณฑ์ PF ≥ 0.95 (MEA/PEA), ค่าปรับตามประกาศผู้ให้บริการ',
    sec7: 'สมดุล 3 เฟส — IEC 61000 และแนวทางจัดสมดุลโหลด กฟภ.',
    sec8: 'ฮาร์มอนิก — IEEE Std 519-2014',
    sec9: 'ความเสี่ยงอุปกรณ์ — แนวปฏิบัติความปลอดภัยไฟฟ้า มอก./IEC',
    sec10: 'การเงิน — อัตราค่าไฟและค่าปรับ PF ตามผู้ให้บริการไฟฟ้า',
    sec11: 'ROI — ระยะคืนทุน ≤ 18 เดือนถือว่าเยี่ยม (แนวทาง กกพ./ผู้ให้บริการ)',
    sec12: 'AI แนะนำ — สังเคราะห์จากเกณฑ์ข้างต้นและข้อมูลมิเตอร์',
    sec13: 'แผนงาน — สอดคล้องแนวปฏิบัติบำรุงรักษาไฟฟ้าอุตสาหกรรม',
    sec14: 'สรุป — อ้างอิงเกณฑ์รวมทุกหมวดข้างต้น',
  },
};

const en: ReportStandardsPack = {
  countryName: 'International (IEEE / IEC)',
  titles: {
    block: 'Analysis criteria and regulatory references',
    agencies: 'Regulatory and utility references',
    research: 'Research and cited standards',
    criteria: 'Analysis thresholds used in this report',
    criteriaMetric: 'Metric',
    criteriaThreshold: 'Threshold',
    criteriaReference: 'Reference',
    sectionRef: 'Regulatory reference',
    liveSnapshot: 'Live meter snapshot (CH1)',
    technical: 'Technical analysis (recorded current data)',
  },
  introduction:
    'This report evaluates electrical energy quality using internationally recognized IEEE/IEC practices and utility-grade meter analytics applied in industrial power studies.',
  agencies: [
    { name: 'IEEE (Institute of Electrical and Electronics Engineers)', role: 'Harmonics and power quality recommended practices' },
    { name: 'IEC (International Electrotechnical Commission)', role: 'Power quality measurement and EMC standards' },
    { name: 'NERC / grid operators (reference)', role: 'Reliability and load/demand management principles' },
    { name: 'National utility tariff frameworks', role: 'PF penalties, demand charges, and billing impact' },
  ],
  research: [
    { citation: 'IEEE Std 519-2014 — Harmonic Control', application: 'THD risk bands: good ≤8%, warning 8–15%, critical >15%' },
    { citation: 'IEC 61000-4-30 — PQ measurement methods', application: 'PF, 3-phase current, and analysis window methodology' },
    { citation: 'IEC 61000-2-2 — Voltage quality compatibility', application: 'Voltage/current imbalance impact on equipment' },
    { citation: 'Industrial demand response & load factor studies', application: 'Peak demand, load factor, and savings potential' },
  ],
  criteria: [
    { metric: 'Power Factor', threshold: '≥ 0.95 good · 0.85–0.95 warning · < 0.85 critical', standard: 'Utility PF targets / IEEE practice' },
    { metric: 'THD (current)', threshold: '≤ 8% good · 8–15% warning · > 15% critical', standard: 'IEEE 519-2014' },
    { metric: 'Current imbalance', threshold: '≤ 15% good · 15–30% warning · > 30% critical', standard: 'IEC / utility practice' },
    { metric: 'Voltage imbalance', threshold: '≤ 15% good · 15–30% warning · > 30% critical', standard: 'IEC 61000-2-2' },
    { metric: 'Load factor / peak ratio', threshold: '< 40% warning · peak/avg > 1.3 review demand', standard: 'Demand management guidance' },
    { metric: 'ROI / APFC payback', threshold: '≤ 18 mo excellent · 18–36 acceptable · 36–60 review · > 60 slow', standard: 'Engineering economics' },
  ],
  sectionNotes: {
    sec4: 'Energy & load profile — utility tariff and kWh/demand principles',
    sec5: 'Peak demand — demand charge methodology',
    sec6: 'Power factor — target PF ≥ 0.95',
    sec7: '3-phase balance — IEC imbalance limits',
    sec8: 'Harmonics — IEEE Std 519-2014',
    sec9: 'Equipment risk — electrical safety & thermal stress practice',
    sec10: 'Financial — tariff, PF penalty, savings estimate',
    sec11: 'ROI — payback ≤ 18 months rated excellent',
    sec12: 'AI recommendations — synthesized from criteria above',
    sec13: 'Action plan — maintenance and PQ improvement roadmap',
    sec14: 'Conclusion — consolidated criteria assessment',
  },
};

const ko: ReportStandardsPack = {
  countryName: '대한민국',
  titles: {
    block: '분석 기준 및 정부·공공기관 참고',
    agencies: '규제·전력 공급 기관',
    research: '연구 및 인용 표준',
    criteria: '본 보고서 적용 분석 기준',
    criteriaMetric: '지표',
    criteriaThreshold: '기준',
    criteriaReference: '참고 표준',
    sectionRef: '기관 기준 참고',
    liveSnapshot: '실시간 미터 스냅샷 (CH1)',
    technical: '기술 분석 (기록된 전류 데이터)',
  },
  introduction:
    '본 보고서는 한국전력(KEPCO) 및 에너지 공단(KESCO) 등 국내 전력 정책·요금 체계와 IEEE/IEC 국제 표준을 바탕으로 전력 품질을 분석합니다.',
  agencies: [
    { name: '한국전력공사 (KEPCO)', role: '전력 요금, 역률·피크 관리, 수용가 품질 기준' },
    { name: '한국에너지공단 (KESCO)', role: '에너지 절감·진단 및 수요 관리 정책' },
    { name: '전기안전공사 / 산업통상자원부', role: '전기설비 안전 및 기술 기준' },
    { name: '국가표준 (KS C IEC)', role: '전력품질·EMC 국내 적용 표준' },
  ],
  research: [
    { citation: 'IEEE Std 519-2014', application: 'THD 위험도: 양호 ≤8%, 주의 8–15%, 위험 >15%' },
    { citation: 'IEC 61000-4-30', application: '역률·3상 전류 측정 및 분석 구간' },
    { citation: 'KEPCO 역률 요금 규정', application: 'PF < 0.95 역률 요금·할인 적용' },
    { citation: '수요관리·피크저감 연구 (KESCO)', application: '피크 수요·부하율 분석' },
  ],
  criteria: [
    { metric: '역률 (PF)', threshold: '≥ 0.95 양호 · 0.85–0.95 주의 · < 0.85 위험', standard: 'KEPCO 역률 기준' },
    { metric: 'THD (전류)', threshold: '≤ 8% 양호 · 8–15% 주의 · > 15% 위험', standard: 'IEEE 519' },
    { metric: '전류 불균형', threshold: '≤ 15% 양호 · 15–30% 주의 · > 30% 위험', standard: 'IEC / KEPCO 관행' },
    { metric: '전압 불균형', threshold: '≤ 15% 양호 · 15–30% 주의 · > 30% 위험', standard: 'IEC 61000-2-2' },
    { metric: '부하율 / 피크비', threshold: '부하율 < 40% 주의', standard: 'KESCO 수요관리' },
    { metric: 'ROI / 투자 회수', threshold: '≤ 18개월 우수 · 18–36 허용 · 36–60 검토 · > 60 장기', standard: 'KEPCO·KESCO 정책' },
  ],
  sectionNotes: {
    sec4: '에너지·부하 — KEPCO 요금 및 kWh',
    sec5: '피크 수요 — 수요전력 요금',
    sec6: '역률 — KEPCO PF ≥ 0.95',
    sec7: '3상 균형 — IEC 불균형',
    sec8: '고조파 — IEEE 519',
    sec9: '설비 위험 — 전기안전 기준',
    sec10: '재무 — 역률 요금·절감',
    sec11: 'ROI — 투자 회수 ≤ 18개월 우수',
    sec12: 'AI 권장 — 상기 기준 종합',
    sec13: '실행 계획 — 유지보수·개선',
    sec14: '결론 — 종합 평가',
  },
};

const cn: ReportStandardsPack = {
  countryName: '中国',
  titles: {
    block: '分析标准与政府监管机构引用',
    agencies: '监管与供电机构',
    research: '研究与引用标准',
    criteria: '本报告采用的判定阈值',
    criteriaMetric: '指标',
    criteriaThreshold: '阈值',
    criteriaReference: '参考标准',
    sectionRef: '监管标准参考',
    liveSnapshot: '实时表计快照 (CH1)',
    technical: '技术分析 (历史电流数据)',
  },
  introduction:
    '本报告依据国家电网供用电规范、GB 国家标准及 IEEE/IEC 国际实践，对电能质量进行分析评估。',
  agencies: [
    { name: '国家能源局 / 国家电网', role: '供电质量、电价与功率因数考核' },
    { name: '工业和信息化部', role: '工业用电与节能政策' },
    { name: '市场监管总局 (GB 标准)', role: '电能质量国家标准' },
    { name: '地方供电公司', role: '需量电费、力调电费 (PF 考核)' },
  ],
  research: [
    { citation: 'GB/T 14549-1993 公用电网谐波', application: 'THD 谐波限值参考' },
    { citation: 'GB/T 12325 电能质量 供电电压偏差', application: '电压不平衡评估' },
    { citation: 'GB 50052 供配电系统设计规范', application: '三相负荷平衡' },
    { citation: 'IEEE Std 519 / IEC 61000-4-30', application: '国际对比与测量方法' },
  ],
  criteria: [
    { metric: '功率因数 PF', threshold: '≥ 0.95 良好 · 0.85–0.95 警告 · < 0.85 严重', standard: '力调电费 / 国网考核' },
    { metric: 'THD (电流)', threshold: '≤ 8% 良好 · 8–15% 警告 · > 15% 严重', standard: 'GB/T 14549 / IEEE 519' },
    { metric: '电流不平衡', threshold: '≤ 15% 良好 · 15–30% 警告 · > 30% 严重', standard: 'GB 50052' },
    { metric: '电压不平衡', threshold: '≤ 15% 良好 · 15–30% 警告 · > 30% 严重', standard: 'GB/T 12325' },
    { metric: '负荷率 / 峰值比', threshold: '负荷率 < 40% 需关注', standard: '需量管理' },
    { metric: 'ROI / 投资回收', threshold: '≤ 18个月优秀 · 18–36可接受 · 36–60需复核 · > 60偏慢', standard: '国网投资评估' },
  ],
  sectionNotes: {
    sec4: '能耗 — 国网电价与 kWh',
    sec5: '峰值需量 — 需量电费',
    sec6: '功率因数 — PF ≥ 0.95 考核',
    sec7: '三相平衡 — GB 50052',
    sec8: '谐波 — GB/T 14549',
    sec9: '设备风险 — 电气安全规范',
    sec10: '财务 — 力调与节电',
    sec11: 'ROI — 投资回收 ≤ 18个月为优秀',
    sec12: 'AI 建议 — 综合标准',
    sec13: '行动计划',
    sec14: '结论',
  },
};

const vn: ReportStandardsPack = {
  countryName: 'Việt Nam',
  titles: {
    block: 'Tiêu chí phân tích và tham chiếu cơ quan nhà nước',
    agencies: 'Cơ quan quản lý và điện lực',
    research: 'Nghiên cứu và tiêu chuẩn trích dẫn',
    criteria: 'Ngưỡng phân tích trong báo cáo',
    criteriaMetric: 'Chỉ số',
    criteriaThreshold: 'Ngưỡng',
    criteriaReference: 'Tiêu chuẩn',
    sectionRef: 'Tham chiếu quy định',
    liveSnapshot: 'Ảnh chụp đồng hồ thời gian thực (CH1)',
    technical: 'Phân tích kỹ thuật (dữ liệu dòng đã ghi)',
  },
  introduction:
    'Báo cáo đánh giá chất lượng điện năng theo quy định EVN, tiêu chuẩn TCVN và thực hành IEEE/IEC.',
  agencies: [
    { name: 'Tập đoàn Điện lực Việt Nam (EVN)', role: 'Giá điện, hệ số công suất, quản lý phụ tải' },
    { name: 'Bộ Công Thương', role: 'Chính sách năng lượng và tiết kiệm điện' },
    { name: 'TCVN / STAMEQ', role: 'Tiêu chuẩn quốc gia về chất lượng điện' },
    { name: 'Điện lực địa phương', role: 'Phí công suất phản kháng, phí công suất tác dụng' },
  ],
  research: [
    { citation: 'TCVN về chất lượng điện / hài điện áp', application: 'Giới hạn THD tham chiếu' },
    { citation: 'IEEE Std 519-2014', application: 'Ngưỡng THD: tốt ≤8%, cảnh báo 8–15%, nghiêm trọng >15%' },
    { citation: 'IEC 61000-4-30', application: 'Phương pháp đo PF và dòng 3 pha' },
    { citation: 'Nghiên cứu quản lý công suất tối đa (EVN)', application: 'Phân tích peak demand' },
  ],
  criteria: [
    { metric: 'Hệ số công suất (PF)', threshold: '≥ 0.95 tốt · 0.85–0.95 cảnh báo · < 0.85 nghiêm trọng', standard: 'EVN / quy định điện lực' },
    { metric: 'THD (dòng)', threshold: '≤ 8% tốt · 8–15% cảnh báo · > 15% nghiêm trọng', standard: 'IEEE 519 / TCVN' },
    { metric: 'Mất cân bằng dòng', threshold: '≤ 15% tốt · 15–30% cảnh báo · > 30% nghiêm trọng', standard: 'IEC' },
    { metric: 'Mất cân bằng áp', threshold: '≤ 15% tốt · 15–30% cảnh báo · > 30% nghiêm trọng', standard: 'IEC 61000-2-2' },
    { metric: 'Hệ số tải / tỷ số peak', threshold: 'Hệ số tải < 40% cần xem xét', standard: 'EVN' },
    { metric: 'ROI / hoàn vốn', threshold: '≤ 18 tháng xuất sắc · 18–36 chấp nhận · 36–60 xem xét · > 60 chậm', standard: 'EVN' },
  ],
  sectionNotes: {
    sec4: 'Năng lượng — biểu giá EVN',
    sec5: 'Công suất tối đa — phí demand',
    sec6: 'PF — mục tiêu ≥ 0.95',
    sec7: 'Cân bằng 3 pha — IEC',
    sec8: 'Hài sóng — IEEE 519',
    sec9: 'Rủi ro thiết bị',
    sec10: 'Tài chính — phạt PF',
    sec11: 'ROI — hoàn vốn ≤ 18 tháng xuất sắc',
    sec12: 'Khuyến nghị AI',
    sec13: 'Kế hoạch hành động',
    sec14: 'Kết luận',
  },
};

const ms: ReportStandardsPack = {
  countryName: 'Malaysia',
  titles: {
    block: 'Kriteria analisis dan rujukan agensi kerajaan',
    agencies: 'Pengawalseliaan dan utiliti',
    research: 'Penyelidikan dan piawaian dirujuk',
    criteria: 'Ambang analisis dalam laporan',
    criteriaMetric: 'Metrik',
    criteriaThreshold: 'Ambang',
    criteriaReference: 'Rujukan',
    sectionRef: 'Rujukan peraturan',
    liveSnapshot: 'Snapshot meter langsung (CH1)',
    technical: 'Analisis teknikal (data arus direkod)',
  },
  introduction:
    'Laporan ini menilai kualiti tenaga elektrik mengikut garis panduan Suruhanjaya Tenaga (ST), TNB dan piawaian MS IEC / IEEE.',
  agencies: [
    { name: 'Suruhanjaya Tenaga (Energy Commission Malaysia)', role: 'Kualiti bekalan, keselamatan dan piawaian utiliti' },
    { name: 'Tenaga Nasional Berhad (TNB)', role: 'Kadar tarif, cas permintaan, penalti faktor kuasa' },
    { name: 'Kementerian Peralihan Tenaga', role: 'Dasar kecekapan tenaga industri' },
    { name: 'MS IEC / SIRIM', role: 'Piawaian kualiti kuasa kebangsaan' },
  ],
  research: [
    { citation: 'MS IEC 61000 series', application: 'THD, ketidakseimbangan, EMC' },
    { citation: 'IEEE Std 519-2014', application: 'Ambang THD: baik ≤8%, amaran 8–15%, kritikal >15%' },
    { citation: 'Garis Panduan ST — Faktor Kuasa', application: 'Sasaran PF ≥ 0.95 industri' },
    { citation: 'Kajian Demand Side Management (TNB)', application: 'Analisis peak demand & load factor' },
  ],
  criteria: [
    { metric: 'Faktor Kuasa (PF)', threshold: '≥ 0.95 baik · 0.85–0.95 amaran · < 0.85 kritikal', standard: 'TNB / ST' },
    { metric: 'THD (arus)', threshold: '≤ 8% baik · 8–15% amaran · > 15% kritikal', standard: 'IEEE 519 / MS IEC' },
    { metric: 'Ketidakseimbangan arus', threshold: '≤ 15% baik · 15–30% amaran · > 30% kritikal', standard: 'IEC' },
    { metric: 'Ketidakseimbangan voltan', threshold: '≤ 15% baik · 15–30% amaran · > 30% kritikal', standard: 'MS IEC 61000-2-2' },
    { metric: 'Faktor beban / nisbah puncak', threshold: 'Faktor beban < 40% amaran', standard: 'TNB DSM' },
    { metric: 'ROI / pulangan modal', threshold: '≤ 18 bulan cemerlang · 18–36 boleh diterima · 36–60 semak · > 60 perlahan', standard: 'ST / TNB' },
  ],
  sectionNotes: {
    sec4: 'Tenaga — tarif TNB',
    sec5: 'Permintaan puncak — cas demand',
    sec6: 'PF — sasaran ≥ 0.95',
    sec7: 'Imbangan 3 fasa',
    sec8: 'Harmonik — IEEE 519',
    sec9: 'Risiko peralatan',
    sec10: 'Kewangan — penalti PF',
    sec11: 'ROI — pulangan modal ≤ 18 bulan cemerlang',
    sec12: 'Cadangan AI',
    sec13: 'Pelan tindakan',
    sec14: 'Kesimpulan',
  },
};

const PACKS: Record<EqLocale, ReportStandardsPack> = { th, en, ko, cn, vn, ms };

export function getReportStandards(locale: EqLocale): ReportStandardsPack {
  return PACKS[locale] ?? en;
}
