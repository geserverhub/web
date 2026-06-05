import type { EqLocale } from './energy-quality-i18n';
import { mergeReportLocale } from './energy-quality-report-locales';

export type ReportStrings = {
  companyName: string;
  platformTitle: string;
  liveBadge: string;
  reportStatus: string;
  statusDraft: string;
  sec1: string;
  sec2: string;
  sec3: string;
  sec4: string;
  sec5: string;
  sec6: string;
  sec7: string;
  sec8: string;
  sec9: string;
  sec10: string;
  sec11: string;
  sec12: string;
  sec13: string;
  sec14: string;
  f_customerName: string;
  f_siteName: string;
  f_location: string;
  f_businessType: string;
  f_contact: string;
  f_period: string;
  f_reportDate: string;
  f_preparedBy: string;
  f_meterId: string;
  f_gatewayId: string;
  f_measurementPoint: string;
  f_voltageSystem: string;
  f_resolution: string;
  f_totalRecords: string;
  f_startDate: string;
  f_endDate: string;
  f_totalEnergy: string;
  f_avgLoad: string;
  f_maxDemand: string;
  f_loadFactor: string;
  f_avgPf: string;
  f_currentImbalance: string;
  f_voltageImbalance: string;
  f_thdi: string;
  f_thdv: string;
  f_riskLevel: string;
  f_l1Current: string;
  f_l2Current: string;
  f_l3Current: string;
  f_l1Share: string;
  f_l2Share: string;
  f_l3Share: string;
  f_thdiL1: string;
  f_thdiL2: string;
  f_thdiL3: string;
  f_thdiAvg: string;
  f_thdvL1: string;
  f_thdvL2: string;
  f_thdvL3: string;
  f_thdvAvg: string;
  f_harmonicRisk: string;
  f_peakDemand: string;
  f_peakTime: string;
  f_peakRatio: string;
  f_monthlyCost: string;
  f_penaltyCost: string;
  f_potentialSaving: string;
  f_solution: string;
  f_investment: string;
  f_payback: string;
  paybackMonthsUnit: string;
  paybackYearsUnit: string;
  f_roi: string;
  f_currentProblem: string;
  f_technicalRisk: string;
  f_financialImpact: string;
  f_recommendedSolution: string;
  f_expectedSaving: string;
  f_nextStep: string;
  statusGood: string;
  statusWarning: string;
  statusCritical: string;
  riskAcceptable: string;
  riskCaution: string;
  riskHigh: string;
  priority: string;
  immediate: string;
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
  aiNote: string;
  noData: string;
  ch1Label: string;
  ch2Label: string;
  threePhase400V: string;
  realtimeResolution: string;
  reportTocTitle: string;
  statusPanelTitle: string;
  statusOverall: string;
  statusMetricPf: string;
  statusMetricThd: string;
  statusMetricCurImb: string;
  statusMetricVoltImb: string;
  statusNoData: string;
  statusPending: string;
  waitingLive: string;
  selectMeterHint: string;
  phaseCol: string;
  secCharts: string;
  secChartsSource: string;
  secTechnical: string;
  chartCaption: string;
  chartStatRecords: string;
  chartStatPeriod: string;
  chartStatPeak: string;
  chartStatAvg: string;
  chartStatImbalance: string;
  insightNoDbData: string;
  insightNoDbDataDetail: string;
  insightDbRecords: string;
  insightRecordsUnit: string;
  insightPeakLoad: string;
  insightAvg: string;
  insightPeakSpike: string;
  insightPeakRatio: string;
  insightPeakSpikeAction: string;
  insightLoadFactor: string;
  insightLowLoadFactor: string;
  insightPhaseImbalance: string;
  insightMaxImbalance: string;
  insightPhaseImbalanceAction: string;
  insightSinglePhase: string;
  insightSinglePhaseDetail: string;
  insightChCompare: string;
  insightL23Idle: string;
  insightL23IdleDetail: string;
  insightStable: string;
  insightStableDetail: string;
  f_reportId: string;
  businessTypeDefault: string;
  periodLiveSession: string;
  preparedByDefault: string;
  f_dailyAvgKwh: string;
  f_monthlyEstKwh: string;
  f_annualEstKwh: string;
  f_demandChargeImpact: string;
  f_minPf: string;
  f_timeBelow095: string;
  f_apfcRecommendation: string;
  apfcRecommended: string;
  withinTarget: string;
  f_annualSaving: string;
  f_motorCompressor: string;
  f_mainBreaker: string;
  f_transformer: string;
  f_maintenance: string;
  maintenanceNote: string;
  solutionApfc: string;
  investmentDefault: string;
  recApfcTitle: string;
  recApfcDesc: string;
  recRedistributeTitle: string;
  recRedistributeDesc: string;
  recPeakTitle: string;
  recPeakDesc: string;
  recMonitorTitle: string;
  recMonitorDesc: string;
  continueMonitoring: string;
  actVerifyPhase: string;
  actReviewPeak: string;
  actInstallApfc: string;
  actRebalance: string;
  actHarmonic: string;
  actDemand: string;
  actIotMonitor: string;
  actAnnualAudit: string;
  nextStepReview: string;
  phaseL1: string;
  phaseL2: string;
  phaseL3: string;
  phaseAvg: string;
};

const th: ReportStrings = {
  companyName: 'GE ENERGY TECH CO.,LTD',
  platformTitle: 'Customer Energy Analysis Report Platform',
  liveBadge: 'รายงานเรียลไทม์',
  reportStatus: 'สถานะรายงาน',
  statusDraft: 'Draft · วิเคราะห์สด',
  sec1: 'ข้อมูลลูกค้า',
  sec2: 'ข้อมูลการตรวจวัด',
  sec3: 'สรุปผู้บริหาร + ตาราง CH1/CH2 รายเฟส',
  sec4: 'การใช้พลังงาน',
  sec5: 'Peak Demand',
  sec6: 'Power Factor',
  sec7: 'สมดุล 3 เฟส',
  sec8: 'Harmonic',
  sec9: 'ความเสี่ยงอุปกรณ์',
  sec10: 'ผลกระทบทางการเงิน',
  sec11: 'ROI',
  sec12: 'คำแนะนำ AI',
  sec13: 'แผนดำเนินการ',
  sec14: 'สรุปผล',
  f_customerName: 'ชื่อลูกค้า',
  f_siteName: 'ชื่อไซต์',
  f_location: 'โลเคชั่น',
  f_businessType: 'ประเภทธุรกิจ',
  f_contact: 'ผู้ติดต่อ',
  f_period: 'ช่วงการวัด',
  f_reportDate: 'วันที่จัดทำรายงาน',
  f_preparedBy: 'ผู้จัดทำ',
  f_meterId: 'Meter ID',
  f_gatewayId: 'Gateway ID',
  f_measurementPoint: 'จุดตรวจวัด',
  f_voltageSystem: 'ระบบแรงดัน',
  f_resolution: 'ความละเอียดข้อมูล',
  f_totalRecords: 'จำนวนบันทึก',
  f_startDate: 'เริ่มวัด',
  f_endDate: 'สิ้นสุดวัด',
  f_totalEnergy: 'พลังงานรวม (kWh)',
  f_avgLoad: 'กระแสเฉลี่ย (A)',
  f_maxDemand: 'Peak Demand (A)',
  f_loadFactor: 'Load Factor',
  f_avgPf: 'Power Factor เฉลี่ย',
  f_currentImbalance: 'Current Imbalance %',
  f_voltageImbalance: 'Voltage Imbalance %',
  f_thdi: 'THDI เฉลี่ย',
  f_thdv: 'THDV เฉลี่ย',
  f_riskLevel: 'ระดับความเสี่ยงรวม',
  f_l1Current: 'กระแส L1',
  f_l2Current: 'กระแส L2',
  f_l3Current: 'กระแส L3',
  f_l1Share: 'สัดส่วนกำลัง L1',
  f_l2Share: 'สัดส่วนกำลัง L2',
  f_l3Share: 'สัดส่วนกำลัง L3',
  f_thdiL1: 'THDI L1',
  f_thdiL2: 'THDI L2',
  f_thdiL3: 'THDI L3',
  f_thdiAvg: 'THDI เฉลี่ย',
  f_thdvL1: 'THDV L1',
  f_thdvL2: 'THDV L2',
  f_thdvL3: 'THDV L3',
  f_thdvAvg: 'THDV เฉลี่ย',
  f_harmonicRisk: 'ระดับความเสี่ยง Harmonic',
  f_peakDemand: 'Peak Demand 15 นาที',
  f_peakTime: 'เวลา Peak',
  f_peakRatio: 'Peak / Average',
  f_monthlyCost: 'ค่าไฟโดยประมาณ/เดือน',
  f_penaltyCost: 'ค่าปรับ PF (ประมาณ)',
  f_potentialSaving: 'ประหยัดได้/เดือน',
  f_solution: 'แนวทางแก้ไข',
  f_investment: 'เงินลงทุน',
  f_payback: 'ระยะคืนทุน',
  paybackMonthsUnit: 'เดือน',
  paybackYearsUnit: 'ปี',
  f_roi: 'ROI %',
  f_currentProblem: 'ปัญหาปัจจุบัน',
  f_technicalRisk: 'ความเสี่ยงทางเทคนิค',
  f_financialImpact: 'ผลกระทบทางการเงิน',
  f_recommendedSolution: 'แนวทางแนะนำ',
  f_expectedSaving: 'ประหยัดที่คาดหวัง',
  f_nextStep: 'ขั้นตอนถัดไป',
  statusGood: 'ดี (Good)',
  statusWarning: 'เตือน (Warning)',
  statusCritical: 'วิกฤต (Critical)',
  riskAcceptable: 'ยอมรับได้',
  riskCaution: 'ระวัง',
  riskHigh: 'ความเสี่ยงสูง',
  priority: 'ลำดับ',
  immediate: 'ทันที (0–30 วัน)',
  shortTerm: 'ระยะสั้น (1–3 เดือน)',
  mediumTerm: 'ระยะกลาง (3–12 เดือน)',
  longTerm: 'ระยะยาว (1–3 ปี)',
  aiNote: 'วิเคราะห์อัตโนมัติจากข้อมูลมิเตอร์เรียลไทม์ — ค่าบางรายการเป็นการประมาณเมื่อไม่มีข้อมูลครบ',
  noData: '—',
  ch1Label: 'CH1 (ก่อนติดตั้ง)',
  ch2Label: 'CH2 (หลังติดตั้ง)',
  threePhase400V: '3-Phase 400V',
  realtimeResolution: 'เรียลไทม์ / 5 นาที',
  reportTocTitle: 'สารบัญรายงาน (14 หมวด)',
  statusPanelTitle: 'สถานะระบบ — คำนวณจาก PF · THD · ความไม่สมดุลเฟส',
  statusOverall: 'สถานะรวม',
  statusMetricPf: 'Power Factor',
  statusMetricThd: 'THDI',
  statusMetricCurImb: 'Current Imbalance',
  statusMetricVoltImb: 'Voltage Imbalance',
  statusNoData: 'ไม่มีข้อมูล',
  statusPending: 'รอข้อมูล',
  waitingLive: 'รอรับค่าเรียลไทม์จากมิเตอร์…',
  selectMeterHint: 'เลือกมิเตอร์ด้านบนเพื่อเริ่มรับค่าสด',
  phaseCol: 'เฟส',
  secCharts: 'กราฟกระแสไฟจากฐานข้อมูล',
  secChartsSource: 'ข้อมูลจาก power_records / power_records_preinstall — อัปเดตตามช่วงเวลาที่เลือก',
  secTechnical: 'คำแนะนำวิเคราะห์ทางเทคนิค (จากข้อมูลกระแสจริง)',
  chartCaption: 'แนวโน้มกระแส CH1 (ก่อน) / CH2 (หลัง) รายเฟส',
  chartStatRecords: 'จำนวนบันทึก',
  chartStatPeriod: 'ช่วงข้อมูล',
  chartStatPeak: 'Peak CH1',
  chartStatAvg: 'เฉลี่ย CH1',
  chartStatImbalance: 'Imbalance สูงสุด',
  insightNoDbData: 'ยังไม่มีข้อมูลกระแสในฐานข้อมูล',
  insightNoDbDataDetail: 'รอการบันทึกจากมิเตอร์หรือขยายช่วงเวลาย้อนหลัง',
  insightDbRecords: 'ข้อมูลจากฐานข้อมูล',
  insightRecordsUnit: 'จุดบันทึก',
  insightPeakLoad: 'Peak Demand จากประวัติ',
  insightAvg: 'เฉลี่ย',
  insightPeakSpike: 'จุด Peak สูงกว่าค่าเฉลี่ยมาก',
  insightPeakRatio: 'อัตราส่วน Peak/Avg',
  insightPeakSpikeAction: 'พิจารณาจัดการ Peak / เลื่อนโหลด',
  insightLoadFactor: 'Load Factor (จากประวัติกระแส)',
  insightLowLoadFactor: 'โหลดพุ่งสูงเป็นช่วงๆ — ตรวจสอบช่วงเวลาใช้ไฟ',
  insightPhaseImbalance: 'ความไม่สมดุลกระแส 3 เฟส',
  insightMaxImbalance: 'สูงสุด',
  insightPhaseImbalanceAction: 'แนะนำกระจายโหลด L1/L2/L3',
  insightSinglePhase: 'โหลดอยู่เฟสเดียว',
  insightSinglePhaseDetail: 'L2/L3 ต่ำมาก — เสี่ยงโอเวอร์โหลดเฟสที่มีกระแส',
  insightChCompare: 'เปรียบเทียบ CH1 / CH2',
  insightL23Idle: 'L2/L3 ไม่มีโหลดต่อเนื่อง',
  insightL23IdleDetail: 'ตรวจสอบการต่อสาย 3 เฟสและการกระจายโหลด',
  insightStable: 'แนวโน้มกระแสค่อนข้างสม่ำเสมอ',
  insightStableDetail: 'ไม่พบ spike หรือ imbalance รุนแรงในช่วงที่วิเคราะห์',
  f_reportId: 'รหัสรายงาน',
  businessTypeDefault: 'อุตสาหกรรม / พาณิชย์',
  periodLiveSession: 'เซสชันสด',
  preparedByDefault: 'GE Energy Tech',
  f_dailyAvgKwh: 'พลังงานเฉลี่ยรายวัน (kWh)',
  f_monthlyEstKwh: 'ประมาณการรายเดือน (kWh)',
  f_annualEstKwh: 'ประมาณการรายปี (kWh)',
  f_demandChargeImpact: 'ผลกระทบ Demand Charge',
  f_minPf: 'PF ต่ำสุด',
  f_timeBelow095: 'เวลาที่ PF ต่ำกว่า 0.95',
  f_apfcRecommendation: 'แนะนำ APFC',
  apfcRecommended: 'แนะนำ De-tuned APFC',
  withinTarget: 'อยู่ในเป้าหมาย',
  f_annualSaving: 'ประหยัดรายปี',
  f_motorCompressor: 'มอเตอร์ / คอมเพรสเซอร์',
  f_mainBreaker: 'เมนเบรกเกอร์ / สายเคเบิล',
  f_transformer: 'หม้อแปลง',
  f_maintenance: 'การบำรุงรักษา',
  maintenanceNote: 'ตรวจ Thermographic หาก imbalance > 20%',
  solutionApfc: 'De-tuned APFC',
  investmentDefault: '200,000 บาท',
  recApfcTitle: 'ติดตั้ง De-tuned APFC',
  recApfcDesc: 'ปรับปรุง Power Factor และลดค่าปรับ',
  recRedistributeTitle: 'กระจายโหลด 3 เฟส',
  recRedistributeDesc: 'สมดุล L1/L2/L3 ลดความเครียดสายและเบรกเกอร์',
  recPeakTitle: 'จัดการ Peak Demand',
  recPeakDesc: 'Peak ที่ {time} — พิจารณาเลื่อนโหลด',
  recMonitorTitle: 'ติดตามอย่างต่อเนื่อง',
  recMonitorDesc: 'ใช้ระบบ GE IoT ติดตามแนวโน้ม',
  continueMonitoring: 'ดำเนินการติดตามต่อ',
  actVerifyPhase: 'ตรวจการโหลดแต่ละเฟส',
  actReviewPeak: 'ทบทวนโปรไฟล์ Peak',
  actInstallApfc: 'ติดตั้ง / ปรับ APFC หาก PF < 0.95',
  actRebalance: 'กระจายโหลดเฟสเดียว',
  actHarmonic: 'ประเมิน Harmonic filter',
  actDemand: 'แผนจัดการ Demand',
  actIotMonitor: 'ติดตาม IoT ต่อเนื่อง',
  actAnnualAudit: 'ตรวจพลังงานประจำปี',
  nextStepReview: 'ทบทวนกับลูกค้าและอนุมัติแผน',
  phaseL1: 'L1',
  phaseL2: 'L2',
  phaseL3: 'L3',
  phaseAvg: 'เฉลี่ย',
};

const en: ReportStrings = {
  companyName: 'GE ENERGY TECH CO.,LTD',
  platformTitle: 'Customer Energy Analysis Report Platform',
  liveBadge: 'Live report',
  reportStatus: 'Report status',
  statusDraft: 'Draft · Live analysis',
  sec1: 'Customer Information',
  sec2: 'Measurement Overview',
  sec3: 'Executive Summary + CH1/CH2 Phase Table',
  sec4: 'Energy Consumption',
  sec5: 'Peak Demand',
  sec6: 'Power Factor',
  sec7: 'Three-Phase Balance',
  sec8: 'Harmonic',
  sec9: 'Equipment Risk',
  sec10: 'Financial Impact',
  sec11: 'ROI',
  sec12: 'AI Recommendations',
  sec13: 'Action Plan',
  sec14: 'Conclusion',
  f_customerName: 'Customer Name',
  f_siteName: 'Site Name',
  f_location: 'Location',
  f_businessType: 'Business Type',
  f_contact: 'Contact Person',
  f_period: 'Measurement Period',
  f_reportDate: 'Report Date',
  f_preparedBy: 'Prepared By',
  f_meterId: 'Meter ID',
  f_gatewayId: 'Gateway ID',
  f_measurementPoint: 'Measurement Point',
  f_voltageSystem: 'Voltage System',
  f_resolution: 'Data Resolution',
  f_totalRecords: 'Total Records',
  f_startDate: 'Measurement Start',
  f_endDate: 'Measurement End',
  f_totalEnergy: 'Total Energy (kWh)',
  f_avgLoad: 'Average Load (A)',
  f_maxDemand: 'Peak Demand (A)',
  f_loadFactor: 'Load Factor',
  f_avgPf: 'Average Power Factor',
  f_currentImbalance: 'Current Imbalance %',
  f_voltageImbalance: 'Voltage Imbalance %',
  f_thdi: 'Average THDI',
  f_thdv: 'Average THDV',
  f_riskLevel: 'Overall Risk Level',
  f_l1Current: 'L1 Current',
  f_l2Current: 'L2 Current',
  f_l3Current: 'L3 Current',
  f_l1Share: 'L1 Power Share',
  f_l2Share: 'L2 Power Share',
  f_l3Share: 'L3 Power Share',
  f_thdiL1: 'THDI L1',
  f_thdiL2: 'THDI L2',
  f_thdiL3: 'THDI L3',
  f_thdiAvg: 'THDI Average',
  f_thdvL1: 'THDV L1',
  f_thdvL2: 'THDV L2',
  f_thdvL3: 'THDV L3',
  f_thdvAvg: 'THDV Average',
  f_harmonicRisk: 'Harmonic Risk Level',
  f_peakDemand: '15-min Peak Demand',
  f_peakTime: 'Peak Time',
  f_peakRatio: 'Peak / Average',
  f_monthlyCost: 'Est. Monthly Cost',
  f_penaltyCost: 'Est. PF Penalty',
  f_potentialSaving: 'Potential Monthly Saving',
  f_solution: 'Recommended Solution',
  f_investment: 'Investment Cost',
  f_payback: 'Payback Period',
  paybackMonthsUnit: 'months',
  paybackYearsUnit: 'years',
  f_roi: 'ROI %',
  f_currentProblem: 'Current Problem',
  f_technicalRisk: 'Technical Risk',
  f_financialImpact: 'Financial Impact',
  f_recommendedSolution: 'Recommended Solution',
  f_expectedSaving: 'Expected Saving',
  f_nextStep: 'Next Step',
  priority: 'Priority',
  immediate: 'Immediate (0–30 days)',
  shortTerm: 'Short-term (1–3 months)',
  mediumTerm: 'Medium-term (3–12 months)',
  longTerm: 'Long-term (1–3 years)',
  aiNote: 'Auto-analysis from live meter data — some values are estimated when data is incomplete.',
  noData: '—',
  ch1Label: 'CH1 (before install)',
  ch2Label: 'CH2 (after install)',
  threePhase400V: '3-Phase 400V',
  realtimeResolution: 'Real-time / 5 min',
  reportTocTitle: 'Report contents (14 sections)',
  statusPanelTitle: 'System status — from PF · THD · phase imbalance',
  statusOverall: 'Overall status',
  statusMetricPf: 'Power Factor',
  statusMetricThd: 'THDI',
  statusMetricCurImb: 'Current Imbalance',
  statusMetricVoltImb: 'Voltage Imbalance',
  statusNoData: 'No data',
  statusPending: 'Awaiting data',
  waitingLive: 'Waiting for live meter readings…',
  selectMeterHint: 'Select a meter above to start live updates',
  phaseCol: 'Phase',
  secCharts: 'Current trend chart (database)',
  secChartsSource: 'From power_records / power_records_preinstall for the selected period',
  secTechnical: 'Technical analysis (recorded current data)',
  chartCaption: 'CH1 (before) / CH2 (after) phase current trend',
  chartStatRecords: 'Records',
  chartStatPeriod: 'Period',
  chartStatPeak: 'CH1 peak',
  chartStatAvg: 'CH1 average',
  chartStatImbalance: 'Max imbalance',
  insightNoDbData: 'No current history in database',
  insightNoDbDataDetail: 'Wait for meter logging or widen the look-back window',
  insightDbRecords: 'Database records',
  insightRecordsUnit: 'data points',
  insightPeakLoad: 'Peak demand from history',
  insightAvg: 'avg',
  insightPeakSpike: 'Peak spike vs average',
  insightPeakRatio: 'Peak/Avg ratio',
  insightPeakSpikeAction: 'Consider peak shaving / load shifting',
  insightLoadFactor: 'Load factor (from current history)',
  insightLowLoadFactor: 'bursty load — review time-of-use profile',
  insightPhaseImbalance: 'Three-phase current imbalance',
  insightMaxImbalance: 'max',
  insightPhaseImbalanceAction: 'Rebalance loads across L1/L2/L3',
  insightSinglePhase: 'Single-phase dominated load',
  insightSinglePhaseDetail: 'L2/L3 very low — risk on the loaded phase',
  insightChCompare: 'CH1 vs CH2 comparison',
  insightL23Idle: 'L2/L3 idle for most records',
  insightL23IdleDetail: 'Verify 3-phase wiring and load distribution',
  insightStable: 'Current trend relatively stable',
  insightStableDetail: 'No severe spikes or imbalance in the analyzed window',
  statusGood: 'Good',
  statusWarning: 'Warning',
  statusCritical: 'Critical',
  riskAcceptable: 'Acceptable',
  riskCaution: 'Caution',
  riskHigh: 'High Risk',
  f_reportId: 'Report ID',
  businessTypeDefault: 'Industrial / Commercial',
  periodLiveSession: 'Live session',
  preparedByDefault: 'GE Energy Tech',
  f_dailyAvgKwh: 'Daily Average kWh',
  f_monthlyEstKwh: 'Monthly Estimated kWh',
  f_annualEstKwh: 'Annual Estimated kWh',
  f_demandChargeImpact: 'Demand Charge Impact',
  f_minPf: 'Minimum PF',
  f_timeBelow095: 'Time Below 0.95',
  f_apfcRecommendation: 'APFC Recommendation',
  apfcRecommended: 'De-tuned APFC recommended',
  withinTarget: 'Within target',
  f_annualSaving: 'Annual Saving',
  f_motorCompressor: 'Motor / Compressor',
  f_mainBreaker: 'Main Breaker / Cable',
  f_transformer: 'Transformer',
  f_maintenance: 'Maintenance',
  maintenanceNote: 'Thermographic inspection if imbalance > 20%',
  solutionApfc: 'De-tuned APFC',
  investmentDefault: '200,000 THB',
  recApfcTitle: 'Install De-tuned APFC',
  recApfcDesc: 'Improve power factor and reduce penalty charges.',
  recRedistributeTitle: 'Redistribute Three-Phase Load',
  recRedistributeDesc: 'Balance L1/L2/L3 loading to reduce cable and breaker stress.',
  recPeakTitle: 'Peak Demand Management',
  recPeakDesc: 'Peak at {time} — consider load shifting.',
  recMonitorTitle: 'Continuous Monitoring',
  recMonitorDesc: 'Maintain GE IoT real-time monitoring for trend validation.',
  continueMonitoring: 'Continue monitoring',
  actVerifyPhase: 'Verify phase loading',
  actReviewPeak: 'Review peak time profile',
  actInstallApfc: 'Install / tune APFC if PF < 0.95',
  actRebalance: 'Rebalance single-phase loads',
  actHarmonic: 'Harmonic filter assessment',
  actDemand: 'Demand management plan',
  actIotMonitor: 'Continuous IoT monitoring',
  actAnnualAudit: 'Annual energy audit',
  nextStepReview: 'Review with customer and approve action plan',
  phaseL1: 'L1',
  phaseL2: 'L2',
  phaseL3: 'L3',
  phaseAvg: 'Avg',
};

const catalog: Record<EqLocale, ReportStrings> = {
  th,
  en,
  ko: mergeReportLocale('ko', en),
  cn: mergeReportLocale('cn', en),
  vn: mergeReportLocale('vn', en),
  ms: mergeReportLocale('ms', en),
};

export function reportT(locale: EqLocale): ReportStrings {
  return catalog[locale] ?? en;
}
