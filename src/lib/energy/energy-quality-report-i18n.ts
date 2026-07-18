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
  f_breakerSize: string;
  f_recommendedInstallSize: string;
  measurementSizingHint: string;
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
  f_peakPeriod: string;
  f_peakWindows: string;
  f_onPeakAvg: string;
  f_offPeakAvg: string;
  f_peakRatio: string;
  f_monthlyCost: string;
  f_penaltyCost: string;
  f_potentialSaving: string;
  f_solution: string;
  f_investment: string;
  f_payback: string;
  paybackMonthsUnit: string;
  paybackYearsUnit: string;
  paybackRatingExcellent: string;
  paybackRatingAcceptable: string;
  paybackRatingCaution: string;
  paybackRatingPoor: string;
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
  insightPeakPeriod: string;
  insightPeakWindows: string;
  insightOnPeakLoad: string;
  insightOnPeakDetail: string;
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
  geSolutionCapabilities: string;
  geCompareExecutiveTitle: string;
  geCompareExecutiveDetail: string;
  geComparePfTitle: string;
  geComparePfDetail: string;
  geComparePeakTitle: string;
  geComparePeakDetail: string;
  geCompareBalanceTitle: string;
  geCompareBalanceDetail: string;
  geCompareHarmonicTitle: string;
  geCompareHarmonicDetail: string;
  geCompareVoltageTitle: string;
  geCompareVoltageDetail: string;
  geCompareEnergyTitle: string;
  geCompareEnergyDetail: string;
  geCompareFinancialTitle: string;
  geCompareFinancialDetail: string;
  geCompareEquipmentTitle: string;
  geCompareEquipmentDetail: string;
  geCompareRoiTitle: string;
  geCompareRoiDetail: string;
  geCompareConclusionTitle: string;
  geCompareConclusionDetail: string;
  investmentDefault: string;
  recApfcTitle: string;
  recApfcInvestTitle: string;
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
  phaseAvgN: string;
  phaseAnalysisCol: string;
  phaseAnalysisAboveAvg: string;
  phaseAnalysisBelowAvg: string;
  phaseAnalysisNearAvg: string;
  phaseAnalysisValueOnly: string;
  phaseAnalysisHeaviest: string;
  phaseAnalysisLightest: string;
  phaseAnalysisOverallN: string;
  phaseAnalysisNoData: string;
  execSummaryTitle: string;
  execChartTitle: string;
  execPhaseTableTitle: string;
  execLineEnergy: string;
  execLineAvgCurrent: string;
  execLinePeakDemand: string;
  execLineLoadFactor: string;
  execLinePowerFactor: string;
  execLineImbalance: string;
  execLineOverallRisk: string;
  execLineGeSolution: string;
  execSourceHistory: string;
  secAnalysisTitle: string;
  secRecommendTitle: string;
  secEnergyChartCaption: string;
  secPeakChartCaption: string;
  secPeakHourlyChartCaption: string;
  secPfChartCaption: string;
  secBalanceChartCaption: string;
  secHarmonicChartCaption: string;
  secEnergyInsightTotal: string;
  secEnergyInsightTotalDetail: string;
  secEnergyInsightMonthly: string;
  secEnergyInsightMonthlyDetail: string;
  secEnergyInsightLoad: string;
  secEnergyInsightLoadDetail: string;
  secEnergyRecMonitor: string;
  secEnergyRecMonitorDesc: string;
  secEnergyRecTou: string;
  secEnergyRecTouDesc: string;
  secEnergyBarDaily: string;
  secEnergyBarMonthly: string;
  secEnergyBarAnnual: string;
  secEnergyEstSeries: string;
  secPfInsightStatus: string;
  secPfInsightStatusDetail: string;
  secPfInsightNoData: string;
  secPfInsightNoDataDetail: string;
  secPfRecMaintain: string;
  secPfTarget: string;
  secPfIdeal: string;
  secBalanceInsightOk: string;
  secBalanceInsightOkDetail: string;
  secBalanceRecOk: string;
  secBalanceRecOkDesc: string;
  secHarmonicInsightThd: string;
  secHarmonicInsightThdDetail: string;
  secHarmonicInsightNoData: string;
  secHarmonicInsightNoDataDetail: string;
  secHarmonicRecFilter: string;
  secHarmonicRecOk: string;
  secHarmonicRecOkDesc: string;
  secEquipmentChartCaption: string;
  secEquipmentRiskAxis: string;
  secEquipmentInsightMotor: string;
  secEquipmentInsightBreaker: string;
  secEquipmentInsightTransformer: string;
  secEquipmentRecInspect: string;
  secEquipmentRecInspectDesc: string;
  secFinancialChartCaption: string;
  secFinancialInsightCost: string;
  secFinancialInsightCostDetail: string;
  secFinancialInsightPenaltyDetail: string;
  secFinancialInsightNoPenalty: string;
  secFinancialInsightSaving: string;
  secFinancialInsightSavingDetail: string;
  secFinancialRecReview: string;
  secFinancialRecReviewDesc: string;
  secFinancialRecApfcDesc: string;
  secRoiChartCaption: string;
  secRoiInsightSolution: string;
  secRoiInsightSolutionDetail: string;
  secRoiInsightPayback: string;
  secRoiInsightPaybackDetail: string;
  secRoiPaybackBenchmark: string;
  secRoiPaybackBenchmarkDetail: string;
  secRoiRecOptimize: string;
  secRoiRecOptimizeDesc: string;
  secRoiInsightReturn: string;
  secRoiInsightReturnDetail: string;
  secRoiInsightPending: string;
  secRoiInsightPendingDetail: string;
  secRoiRecApprove: string;
  secRoiRecApproveDesc: string;
  secAiChartCaption: string;
  secAiFieldCount: string;
  secAiInsightOverview: string;
  secAiInsightOverviewDetail: string;
  secAiInsightItem: string;
  secAiInsightEmpty: string;
  secAiInsightEmptyDetail: string;
  secAiRecReviewDesc: string;
  secActionChartCaption: string;
  secActionFieldHorizons: string;
  secActionFieldTasks: string;
  secActionOutcomeAxis: string;
  secActionInsightOverview: string;
  secActionInsightOverviewDetail: string;
  secActionRecAssign: string;
  secActionRecAssignDesc: string;
  secActionRecTrack: string;
  secActionRecTrackDesc: string;
  secConclusionChartCaption: string;
  secConclusionScoreAxis: string;
  secConclusionInsightProblem: string;
  secConclusionInsightTech: string;
  secConclusionInsightFinancial: string;
  secConclusionInsightDecision: string;
  secConclusionInsightDecisionDetail: string;
  secConclusionRecSignoff: string;
  secConclusionRecSignoffDesc: string;
  printEvidenceTitle: string;
  printMethodology: string;
  printSourceMeter: string;
  printSourcePeriod: string;
  printSourceRecords: string;
  printSourcePeak: string;
  printFooterLegal: string;
  printPagePrefix: string;
  printPageMiddle: string;
  printPageSuffix: string;
  printTableItem: string;
  printTableValue: string;
  printColTime: string;
  assessExcellent: string;
  assessAcceptable: string;
  assessCaution: string;
  assessWarning: string;
  assessNeutral: string;
  stdLoadFactor: string;
  stdPf: string;
  stdVoltImb: string;
  stdCurImb: string;
  stdThdi: string;
  stdThdv: string;
  stdSiteSpecific: string;
  pfLagging: string;
  exceedWarn10: string;
  exceedHigh20: string;
  exceedSevere50: string;
  exceedLiveNormal: string;
  exceedLiveSevere: string;
  proTableExceedShare: string;
  proTableLiveStatus: string;
  proReportSubtitle: string;
  proKeyFindingsIntro: string;
  proKeyFindingsTableTitle: string;
  proTableParameter: string;
  proTableMeasured: string;
  proTableStandard: string;
  proTableAssessment: string;
  proNarrativeIntro: string;
  proNarrativePfThd: string;
  proNarrativeImbalance: string;
  proNarrativePeak: string;
  proNarrativeVoltage: string;
  proInterpretationTitle: string;
  proInterpPeakDelta: string;
  proInterpImbalance: string;
  proInterpPfRoi: string;
  proInterpApfcSafe: string;
  proInterpVoltageOk: string;
  proInterpStable: string;
  proPhasedTitle: string;
  proPhase1: string;
  proPhase2: string;
  proPhase3: string;
  proPhase4: string;
  proPriorityHighest: string;
  proPriorityHigh: string;
  proPriorityMedium: string;
  proPhaseApfcTitle: string;
  proPhaseApfcBullet1: string;
  proPhaseApfcBullet2: string;
  proPhaseApfcOutcome: string;
  proPhaseBalanceTitle: string;
  proPhaseBalanceBullet1: string;
  proPhaseBalanceBullet2: string;
  proPhaseBalanceOutcome: string;
  proPhaseDemandTitle: string;
  proPhaseDemandBullet1: string;
  proPhaseDemandBullet2: string;
  proPhaseDemandOutcome: string;
  proPhaseMonitorTitle: string;
  proPhaseMonitorBullet1: string;
  proPhaseMonitorBullet2: string;
  proPhaseMonitorOutcome: string;
  proPeakPercentileCaption: string;
  pctHintP50: string;
  pctHintP75: string;
  pctHintP90: string;
  pctHintP95: string;
  pctHintP99: string;
  proImbalanceExceedCaption: string;
  proLoadProfileNarrative: string;
  overallRiskCritical: string;
  overallRiskCaution: string;
  overallRiskGood: string;
  proRecommendedModel: string;
  proExpectedOutcome: string;
};

const th: ReportStrings = {
  companyName: 'GE ENERGY TECH CO.,LTD',
  platformTitle: 'Customer Energy Analysis Report Platform',
  liveBadge: 'รายงานเรียลไทม์',
  reportStatus: 'สถานะรายงาน',
  statusDraft: 'Draft · วิเคราะห์สด',
  sec1: 'ข้อมูลลูกค้า',
  sec2: 'ข้อมูลการตรวจวัด',
  sec3: 'สรุปผู้บริหาร',
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
  f_breakerSize: 'ขนาดเบรกเกอร์',
  f_recommendedInstallSize: 'ขนาดเครื่องที่แนะนำติดตั้ง',
  measurementSizingHint: 'ประเมินจากกระแส Peak และโหลดจริง — สำหรับ GE Energy Tech Smart Saving',
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
  f_peakPeriod: 'ช่วงเวลา Peak',
  f_peakWindows: 'ช่วงโหลดสูง',
  f_onPeakAvg: 'On-peak เฉลี่ย',
  f_offPeakAvg: 'Off-peak เฉลี่ย',
  f_peakRatio: 'Peak / Average',
  f_monthlyCost: 'ค่าไฟโดยประมาณ/เดือน',
  f_penaltyCost: 'ค่าปรับ PF (ประมาณ)',
  f_potentialSaving: 'ประหยัดได้/เดือน',
  f_solution: 'แนวทางแก้ไข',
  f_investment: 'เงินลงทุน',
  f_payback: 'ระยะคืนทุน',
  paybackMonthsUnit: 'เดือน',
  paybackYearsUnit: 'ปี',
  paybackRatingExcellent: 'เยี่ยม',
  paybackRatingAcceptable: 'ยอมรับได้',
  paybackRatingCaution: 'ควรทบทวน',
  paybackRatingPoor: 'คืนทุนช้า',
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
  ch1Label: 'CH1 (ไม่ผ่านอุปกรณ์)',
  ch2Label: '—',
  threePhase400V: '3-Phase 400V',
  realtimeResolution: 'เรียลไทม์ / 1 นาที',
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
  secChartsSource: 'ข้อมูลจากระบบบันทึกมิเตอร์ — อัปเดตตามช่วงเวลาที่เลือก',
  secTechnical: 'คำแนะนำวิเคราะห์ทางเทคนิค (จากข้อมูลกระแสจริง)',
  chartCaption: 'แนวโน้มกระแส CH1 รายเฟส',
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
  insightPeakPeriod: 'ช่วงเวลา Peak',
  insightPeakWindows: 'ช่วงที่โหลดสูงกว่าค่าเฉลี่ย',
  insightOnPeakLoad: 'On-peak vs Off-peak (จ–ศ 09:00–22:00)',
  insightOnPeakDetail: 'ช่วง On-peak {onPeak} A · ช่วง Off-peak {offPeak} A',
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
  insightChCompare: 'แนวโน้มกระแส CH1',
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
  apfcRecommended: 'แนะนำระบบ GE Energy Tech (ปรับแรงดัน·กระแส·เสถียร·เก็บพลังงาน)',
  withinTarget: 'อยู่ในเป้าหมาย',
  f_annualSaving: 'ประหยัดรายปี',
  f_motorCompressor: 'มอเตอร์ / คอมเพรสเซอร์',
  f_mainBreaker: 'เมนเบรกเกอร์ / สายเคเบิล',
  f_transformer: 'หม้อแปลง',
  f_maintenance: 'การบำรุงรักษา',
  maintenanceNote: 'ตรวจ Thermographic หาก imbalance > 20%',
  solutionApfc: 'GE Energy Tech Smart Saving System',
  geSolutionCapabilities: 'ปรับแรงดัน · ปรับกระแส · ปรับเสถียร · เก็บกระแสไว้ใช้ภายหลัง',
  geCompareExecutiveTitle: 'เปรียบเทียบค่าที่วัดจาก CH1 — ระบบ GE Energy Tech',
  geCompareExecutiveDetail:
    'ค่าที่วัดจาก CH1: PF {pf} · ไม่สมดุลกระแส {imb} · Peak {peak} · THD {thd} — ระบบ GE Energy Tech ({capabilities}) แก้ปัญหาข้างต้นแบบครบวงจร',
  geComparePfTitle: 'เปรียบเทียบ Power Factor — CH1',
  geComparePfDetail:
    'PF ที่วัดจาก CH1 {pf} (< 0.95) — ระบบ GE ปรับกระแสและปรับแรงดันแบบเรียลไทม์ ยก PF ใกล้ 0.95–1.0 ลดค่าปรับ ({capabilities})',
  geComparePeakTitle: 'เปรียบเทียบ Peak Demand — CH1',
  geComparePeakDetail:
    'Peak {peak} (เฉลี่ย {avg}) — ระบบ GE เก็บกระแสไฟใช้ตอน Peak ลด Demand Charge และกระจายโหลดอัตโนมัติ',
  geCompareBalanceTitle: 'เปรียบเทียบความสมดุล 3 เฟส — CH1',
  geCompareBalanceDetail:
    'ไม่สมดุล 3 เฟส {imb} — ระบบ GE ปรับกระแสเฟสอัตโนมัติ ลดความร้อนและความเสี่ยงต่อเบรกเกอร์/สายเคเบิล',
  geCompareHarmonicTitle: 'เปรียบเทียบฮาร์มอนิก — CH1',
  geCompareHarmonicDetail:
    'THD {thd} — ระบบ GE ปรับเสถียรลดฮาร์มอนิก ปกป้องมอเตอร์ หม้อแปลง และอุปกรณ์อิเล็กทรอนิกส์',
  geCompareVoltageTitle: 'เปรียบเทียบแรงดัน — CH1',
  geCompareVoltageDetail:
    'ไม่สมดุลแรงดัน {volt} — ระบบ GE ปรับแรงดันรักษาเสถียร 400V 3 เฟส ลดความเสียหายอุปกรณ์',
  geCompareEnergyTitle: 'เปรียบเทียบการใช้พลังงาน — CH1',
  geCompareEnergyDetail:
    'โหลดเฉลี่ย {avg} — ระบบ GE เก็บพลังงานช่วง Off-peak คืนกระแสช่วง Peak ช่วยลด kWh และค่าไฟ',
  geCompareFinancialTitle: 'เปรียบเทียบผลทางการเงิน — ก่อน/หลังติดตั้ง GE',
  geCompareFinancialDetail:
    'ประหยัดได้ประมาณ {saving}/เดือน — เปรียบเทียบก่อน/หลังติดตั้ง: ลดค่าปรับ PF + Peak + ใช้พลังงานสะสม ({capabilities})',
  geCompareEquipmentTitle: 'เปรียบเทียบความเสี่ยงอุปกรณ์ — CH1',
  geCompareEquipmentDetail:
    'สถานะอุปกรณ์ {status} — ระบบ GE ปรับเสถียรและปรับแรงดัน ยืดอายุมอเตอร์ หม้อแปลง เบรกเกอร์',
  geCompareRoiTitle: 'เปรียบเทียบ ROI — ลงทุนระบบ GE Energy Tech',
  geCompareRoiDetail:
    'แนวทาง {solution} — คืนทุนเร็วขึ้นจากลดค่าปรับ PF·Peak และพลังงานสะสมช่วง Off-peak ({capabilities})',
  geCompareConclusionTitle: 'สรุปเปรียบเทียบก่อน/หลังติดตั้ง GE Energy Tech',
  geCompareConclusionDetail:
    'ค่าที่วัดจาก CH1: {problem} — แนะนำ {solution} ({capabilities}) ประหยัด {saving}',
  investmentDefault: '200,000 บาท',
  recApfcTitle: 'ติดตั้งระบบ GE Energy Tech Smart Saving',
  recApfcInvestTitle: 'ลงทุนระบบ GE Energy Tech Smart Saving',
  recApfcDesc:
    'เปรียบเทียบค่าที่วัดจาก CH1 — ระบบปรับแรงดัน ปรับกระแส 3 เฟส ปรับเสถียรลดฮาร์มอนิก และเก็บกระแสไฟใช้ช่วง Peak/Off-peak',
  recRedistributeTitle: 'กระจายโหลด 3 เฟส',
  recRedistributeDesc: 'สมดุล L1/L2/L3 ลดความเครียดสายและเบรกเกอร์',
  recPeakTitle: 'จัดการ Peak Demand',
  recPeakDesc: 'Peak ที่ {time} — พิจารณาเลื่อนโหลด',
  recMonitorTitle: 'ติดตามอย่างต่อเนื่อง',
  recMonitorDesc: 'ใช้ระบบ GE IoT ติดตามแนวโน้ม',
  continueMonitoring: 'ดำเนินการติดตามต่อ',
  actVerifyPhase: 'ตรวจการโหลดแต่ละเฟส',
  actReviewPeak: 'ทบทวนโปรไฟล์ Peak',
  actInstallApfc: 'ติดตั้งระบบ GE Energy Tech หาก PF < 0.95 หรือมี Peak/ไม่สมดุล',
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
  phaseAvgN: 'เฉลี่ย N',
  phaseAnalysisCol: 'การวิเคราะห์',
  phaseAnalysisAboveAvg:
    'เฟส {phase} เฉลี่ย {value} — สูงกว่าค่าเฉลี่ยรวม N ({avgN}) {delta}%',
  phaseAnalysisBelowAvg:
    'เฟส {phase} เฉลี่ย {value} — ต่ำกว่าค่าเฉลี่ยรวม N ({avgN}) {delta}%',
  phaseAnalysisNearAvg: 'เฟส {phase} เฉลี่ย {value} — ใกล้ค่าเฉลี่ยรวม N ({avgN})',
  phaseAnalysisValueOnly: 'เฟส {phase} เฉลี่ย {value}',
  phaseAnalysisHeaviest: '· รับโหลดมากที่สุดใน 3 เฟส',
  phaseAnalysisLightest: '· โหลดเบาที่สุดใน 3 เฟส',
  phaseAnalysisOverallN:
    'ค่าเฉลี่ยรวม N {value} — ความไม่สมดุลกระแส {imb}% · เฟสสูงสุด {maxPhase} {maxVal} · เฟสต่ำสุด {minPhase} {minVal}',
  phaseAnalysisNoData: 'ไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์',
  execSummaryTitle: 'สรุปผู้บริหาร',
  execChartTitle: 'กราฟกระแสรายเฟส (CH1)',
  execPhaseTableTitle: 'วิเคราะห์กระแส CH1 รายเฟส',
  execLineEnergy: 'พลังงานสะสม {value} จากมิเตอร์',
  execLineAvgCurrent: 'กระแสเฉลี่ย CH1: {value}',
  execLinePeakDemand: 'Peak Demand สูงสุด: {value}',
  execLineLoadFactor: 'Load Factor: {value}',
  execLinePowerFactor: 'Power Factor เฉลี่ย: {value}',
  execLineImbalance: 'ความไม่สมดุลกระแส: {value}',
  execLineOverallRisk: 'ระดับความเสี่ยงรวม: {status}',
  execLineGeSolution:
    'แนวทาง GE Energy Tech: ปรับแรงดัน · ปรับกระแส · ปรับเสถียร · เก็บกระแสไว้ใช้ภายหลัง',
  execSourceHistory: 'จากประวัติ 24 ชม.',
  secAnalysisTitle: 'การวิเคราะห์',
  secRecommendTitle: 'คำแนะนำ',
  secEnergyChartCaption: 'กราฟการใช้พลังงาน (ประมาณการ)',
  secPeakChartCaption: 'กราฟ Peak Demand จากประวัติกระแส',
  secPeakHourlyChartCaption: 'โปรไฟล์กระแสเฉลี่ยรายชั่วโมง — วิเคราะห์ช่วงเวลา Peak',
  secPfChartCaption: 'กราฟ Power Factor เทียบเป้าหมาย',
  secBalanceChartCaption: 'กราฟกระแสรายเฟส L1 / L2 / L3',
  secHarmonicChartCaption: 'กราฟ THDI รายเฟส',
  secEnergyInsightTotal: 'พลังงานสะสม',
  secEnergyInsightTotalDetail: 'มิเตอร์บันทึกพลังงานรวม {value}',
  secEnergyInsightMonthly: 'ประมาณการรายเดือน',
  secEnergyInsightMonthlyDetail: '{kwh} · ค่าไฟโดยประมาณ {cost}',
  secEnergyInsightLoad: 'โหลดจากประวัติกระแส',
  secEnergyInsightLoadDetail: 'กระแสเฉลี่ย {avg} ในช่วง {period}',
  secEnergyRecMonitor: 'ติดตามการใช้พลังงาน',
  secEnergyRecMonitorDesc: 'ใช้ GE IoT ติดตามแนวโน้ม kWh และค่าไฟรายเดือน',
  secEnergyRecTou: 'จัดการช่วงเวลาใช้ไฟ',
  secEnergyRecTouDesc: 'Load Factor ต่ำ — พิจารณาเลื่อนโหลดหนักออกจากช่วง Peak',
  secEnergyBarDaily: 'รายวัน',
  secEnergyBarMonthly: 'รายเดือน',
  secEnergyBarAnnual: 'รายปี',
  secEnergyEstSeries: 'โหลดโดยประมาณ (kWh)',
  secPfInsightStatus: 'สถานะ Power Factor',
  secPfInsightStatusDetail: 'PF ปัจจุบัน {value} (เป้าหมาย ≥ 0.95)',
  secPfInsightNoData: 'ยังไม่มีค่า PF',
  secPfInsightNoDataDetail: 'รอข้อมูลเรียลไทม์จากมิเตอร์',
  secPfRecMaintain: 'รักษา PF ในเป้าหมายและตรวจสอบรายเดือน',
  secPfTarget: 'เป้าหมาย 0.95',
  secPfIdeal: 'ค่าอ้างอิง 1.00',
  secBalanceInsightOk: 'สมดุลเฟส',
  secBalanceInsightOkDetail: 'กระแส 3 เฟสอยู่ในเกณฑ์ที่ยอมรับได้',
  secBalanceRecOk: 'รักษาสมดุลเฟส',
  secBalanceRecOkDesc: 'ตรวจสอบการกระจายโหลดเป็นประจำ',
  secHarmonicInsightThd: 'THDI',
  secHarmonicInsightThdDetail: 'THDI เฉลี่ย {value}',
  secHarmonicInsightNoData: 'ยังไม่มีค่า THD',
  secHarmonicInsightNoDataDetail: 'รอข้อมูลฮาร์มอนิกจากมิเตอร์',
  secHarmonicRecFilter: 'ประเมินตัวกรองฮาร์มอนิกเมื่อ THDI > 8%',
  secHarmonicRecOk: 'ระดับฮาร์มอนิกยอมรับได้',
  secHarmonicRecOkDesc: 'ติดตาม THDI ต่อเนื่อง',
  secEquipmentChartCaption: 'กราฟระดับความเสี่ยงอุปกรณ์ (1=ต่ำ · 3=สูง)',
  secEquipmentRiskAxis: 'ระดับความเสี่ยง',
  secEquipmentInsightMotor: 'มอเตอร์/คอมเพรสเซอร์: {status}',
  secEquipmentInsightBreaker: 'เมนเบรกเกอร์/สายเคเบิล: {status}',
  secEquipmentInsightTransformer: 'หม้อแปลง: {status}',
  secEquipmentRecInspect: 'ตรวจสอบอุปกรณ์ตามรอบ',
  secEquipmentRecInspectDesc: 'ทำ Thermographic และตรวจสาย-เบรกเกอร์เมื่อ imbalance สูง',
  secFinancialChartCaption: 'กราฟผลกระทบทางการเงิน ({currency})',
  secFinancialInsightCost: 'ค่าไฟรายเดือน',
  secFinancialInsightCostDetail: 'ประมาณ {value}/เดือนจากการใช้พลังงานปัจจุบัน',
  secFinancialInsightPenaltyDetail: 'ค่าปรับ PF ประมาณ {value}/เดือน — ควรปรับปรุง PF',
  secFinancialInsightNoPenalty: 'ยังไม่พบค่าปรับ PF ชัดเจน — รักษา PF ≥ 0.95',
  secFinancialInsightSaving: 'ศักยภาพประหยัด',
  secFinancialInsightSavingDetail: 'ประหยัดได้ประมาณ {monthly}/เดือน · รวม {annual}/ปี',
  secFinancialRecReview: 'ทบทวนค่าไฟกับลูกค้า',
  secFinancialRecReviewDesc: 'นำเสนอตัวเลขค่าไฟ ค่าปรับ และแผนประหยัด',
  secFinancialRecApfcDesc:
    'ลงทุนระบบ GE Energy Tech ปรับแรงดัน·กระแส·เสถียร·เก็บพลังงาน ลดค่าปรับและเพิ่มประหยัด',
  secRoiChartCaption: 'กราฟเงินลงทุนเทียบผลตอบแทนรายปี',
  secRoiInsightSolution: 'แนวทางลงทุน',
  secRoiInsightSolutionDetail: 'แนะนำ: {solution}',
  secRoiInsightPayback: 'ระยะคืนทุน',
  secRoiInsightPaybackDetail: '{payback} · เกณฑ์ ≤ {benchmark} เดือน = เยี่ยม · ROI {roi}',
  secRoiPaybackBenchmark: 'เกณฑ์ประเมินคืนทุน',
  secRoiPaybackBenchmarkDetail:
    'ระยะคืนทุนไม่เกิน 18 เดือน ถือว่าเยี่ยม · 18–36 เดือน ยอมรับได้ · 36–60 เดือน ควรทบทวน · เกิน 60 เดือน คืนทุนช้า',
  secRoiRecOptimize: 'ปรับแผนเพิ่มประหยัด',
  secRoiRecOptimizeDesc: 'เพิ่มประหยัดรายเดือนหรือลดงบลงทุนเพื่อให้คืนทุนภายใน 18 เดือน',
  secRoiInsightReturn: 'ผลตอบแทนจากการประหยัด',
  secRoiInsightReturnDetail: 'ประหยัด {monthly}/เดือน · รวม {annual}/ปี',
  secRoiInsightPending: 'รอข้อมูลประหยัด',
  secRoiInsightPendingDetail: 'ต้องมีค่าประหยัดรายเดือนเพื่อคำนวณ ROI ที่แม่นยำ',
  secRoiRecApprove: 'อนุมัติงบลงทุน',
  secRoiRecApproveDesc: 'ลูกค้าพิจารณาอนุมัติแผนและกำหนดระยะติดตั้ง',
  secAiChartCaption: 'ลำดับความสำคัญคำแนะนำ AI',
  secAiFieldCount: 'จำนวนคำแนะนำ',
  secAiInsightOverview: 'ภาพรวมคำแนะนำ AI',
  secAiInsightOverviewDetail: 'ระบบสรุป {count} ข้อจากข้อมูลมิเตอร์และประวัติกระแส',
  secAiInsightItem: 'ลำดับ {priority}: {title}',
  secAiInsightEmpty: 'ยังไม่มีคำแนะนำ',
  secAiInsightEmptyDetail: 'รอข้อมูลมิเตอร์เพื่อสร้างคำแนะนำอัตโนมัติ',
  secAiRecReviewDesc: 'นำคำแนะนำไปทบทวนกับทีมลูกค้าและจัดลำดับดำเนินการ',
  secActionChartCaption: 'คาดการณ์ผลลัพธ์ต่อช่วงเวลาในแผน',
  secActionFieldHorizons: 'ช่วงเวลาในแผน',
  secActionFieldTasks: 'งานทั้งหมด',
  secActionOutcomeAxis: 'ประมาณการประหยัด',
  secActionInsightOverview: 'ภาพรวมแผนดำเนินการ',
  secActionInsightOverviewDetail: 'แบ่ง {count} งานตามระยะทันที/สั้น/กลาง/ยาว',
  secActionRecAssign: 'มอบหมายผู้รับผิดชอบ',
  secActionRecAssignDesc: 'ระบุผู้รับผิดชอบแต่ละงานและกำหนดวันเป้าหมาย',
  secActionRecTrack: 'ติดตามความคืบหน้า',
  secActionRecTrackDesc: 'อัปเดตสถานะใน GE IoT / รายงานรายสัปดาห์',
  secConclusionChartCaption: 'สรุปคะแนนความเสี่ยงตามหัวข้อสรุปผล',
  secConclusionScoreAxis: 'คะแนน',
  secConclusionInsightProblem: 'ปัญหาหลัก: {value}',
  secConclusionInsightTech: 'ความเสี่ยงทางเทคนิค: {value}',
  secConclusionInsightFinancial: 'ผลกระทบทางการเงิน: {value}',
  secConclusionInsightDecision: 'ข้อเสนอตัดสินใจ',
  secConclusionInsightDecisionDetail: 'แนวทาง {solution} · ประหยัด {saving} · คืนทุน {payback}',
  secConclusionRecSignoff: 'ลงนามอนุมัติแผน',
  secConclusionRecSignoffDesc: 'ลูกค้าและ GE Energy Tech ลงนามรับทราบแผนดำเนินการ',
  printEvidenceTitle: 'หลักฐานอ้างอิงและแหล่งข้อมูล',
  printMethodology:
    'ค่าที่แสดงคำนวณจากข้อมูลมิเตอร์เรียลไทม์ ประวัติกระแสในฐานข้อมูล และสูตรวิเคราะห์ตามเกณฑ์หน่วยงานราชการและมาตรฐาน IEEE/IEC ที่อ้างอิงในรายงาน (PF, THD, Imbalance, Load Factor, ROI) — ค่าที่ไม่มีข้อมูลแสดงเป็น —',
  printSourceMeter: 'มิเตอร์ / อุปกรณ์',
  printSourcePeriod: 'ช่วงวิเคราะห์',
  printSourceRecords: 'จำนวนบันทึก',
  printSourcePeak: 'Peak จากประวัติ',
  printFooterLegal: 'เอกสารสร้างอัตโนมัติจากระบบ GE IoT · ใช้สำหรับอ้างอิงการตัดสินใจเท่านั้น',
  printPagePrefix: 'หน้า ',
  printPageMiddle: ' จาก ',
  printPageSuffix: '',
  printTableItem: 'รายการ',
  printTableValue: 'ค่า',
  printColTime: 'เวลา',
  assessExcellent: '✓ ดีเยี่ยม',
  assessAcceptable: '✓ ยอมรับได้',
  assessCaution: '△ ควรระวัง',
  assessWarning: '⚠ เตือน',
  assessNeutral: '—',
  stdLoadFactor: '≥ 60% แนะนำ',
  stdPf: '≥ 0.95',
  stdVoltImb: '< 2% IEC',
  stdCurImb: '< 5% IEC',
  stdThdi: '< 5% IEC 61000',
  stdThdv: '< 5% IEC',
  stdSiteSpecific: 'ตามไซต์',
  pfLagging: 'Lagging',
  exceedWarn10: '> 10% (เตือน)',
  exceedHigh20: '> 20% (เสี่ยงสูง)',
  exceedSevere50: '> 50% (รุนแรง)',
  exceedLiveNormal: '✓ ปกติ',
  exceedLiveSevere: 'รุนแรง',
  proTableExceedShare: '% เวลาเกินเกณฑ์',
  proTableLiveStatus: 'สถานะ (กระแสจริง)',
  proReportSubtitle:
    'รายงานวิเคราะห์คุณภาพไฟฟ้าและประสิทธิภาพพลังงาน · {period} · {records} บันทึก @ {resolution}',
  proKeyFindingsIntro:
    'สรุปผลวิเคราะห์หลัก — ระดับความเสี่ยงทางเทคนิค: {risk} · ประหยัดได้โดยประมาณ {saving}/เดือน',
  proKeyFindingsTableTitle: 'ตารางสรุปผลวัด (Key Findings Summary)',
  proTableParameter: 'พารามิเตอร์',
  proTableMeasured: 'ค่าที่วัดได้',
  proTableStandard: 'เกณฑ์ / มาตรฐาน',
  proTableAssessment: 'การประเมิน',
  proNarrativeIntro:
    'รายงานนี้วิเคราะห์คุณภาพไฟฟ้าและประสิทธิภาพพลังงานจากข้อมูล {records} บันทึก ({resolution}) ในช่วง {period}',
  proNarrativePfThd:
    'Power Factor เฉลี่ย {pf} — {pfPenalty}% ของเวลาอยู่ต่ำกว่าเกณฑ์ค่าปรับ MEA (0.85) · THDI เฉลี่ย {thd}% — เหมาะสำหรับ APFC แบบ de-tuned',
  proNarrativeImbalance:
    'Current Imbalance เฉลี่ย {imb}% — สูงกว่าเกณฑ์ IEC · L1 รับโหลด {l1}% (เกินค่า ideal 33.3%)',
  proNarrativePeak:
    'Peak Demand 15 นาที {peak} ที่ {time} — สูงกว่าเฉลี่ย ~{ratio}× · ข้อมูลความละเอียด 1 นาทีต่างจาก hourly ~{delta}%',
  proNarrativeVoltage:
    'คุณภาพแรงดันไฟฟ้าดี — Voltage Imbalance {vi}% · THDV {thdv}% · ปัญหาหลักอยู่ฝั่ง Demand',
  proInterpretationTitle: 'การตีความ (Interpretation)',
  proInterpPeakDelta:
    'Peak จริงจากข้อมูล 1 นาที ({fine}) สูงกว่า hourly ({coarse}) ~{delta}% — มีผลต่อ Demand Charge · ควรบริหารช่วง {window}',
  proInterpImbalance:
    'Current Imbalance {imb}% — L1 รับโหลด {l1}% · ควรกระจายโหลด 3 เฟสเพื่อลดความเครียด thermal',
  proInterpPfRoi:
    'PF {pf} ที่สเกลพลังงาน ~{annual} kWh/ปี — ปรับ PF ให้ ≥ 0.95 คืนทุน {payback}',
  proInterpApfcSafe: 'THDI {thd}% — ติดตั้ง de-tuned APFC (5.7% reactor) ปลอดภัย ไม่เสี่ยง resonance',
  proInterpVoltageOk: 'Voltage Imbalance {vi}% — คุณภาพแรงดันดี ปัญหาอยู่ที่โหลดและการบริหาร Demand',
  proInterpStable: 'คุณภาพไฟฟ้าอยู่ในเกณฑ์ที่ยอมรับได้ — ควรติดตามแนวโน้มอย่างต่อเนื่อง',
  proPhasedTitle: 'คำแนะนำเชิงปฏิบัติ (Phased Recommendations)',
  proPhase1: 'Phase 1',
  proPhase2: 'Phase 2',
  proPhase3: 'Phase 3',
  proPhase4: 'Phase 4',
  proPriorityHighest: 'ลำดับความสำคัญสูงสุด',
  proPriorityHigh: 'ลำดับความสำคัญสูง',
  proPriorityMedium: 'ลำดับความสำคัญปานกลาง',
  proPhaseApfcTitle: 'ติดตั้ง De-tuned APFC — ROI สูงสุด',
  proPhaseApfcBullet1: 'THDI {thd}% — ติดตั้ง APFC + reactor de-tuning 5.7% ปลอดภัย',
  proPhaseApfcBullet2: 'จัดอ ratings จาก Peak {peak} · กระแสเฉลี่ย L1 {avgI} A',
  proPhaseApfcOutcome: 'PF {pf} → ≥ 0.95 · ลดค่าปรับ MEA · คืนทุน {payback}',
  proPhaseBalanceTitle: 'กระจายโหลด 3 เฟส',
  proPhaseBalanceBullet1: 'ย้ายวงจร AC/ครัวจาก L1 ไป L3 ให้ L1 ≤ 35%, L3 ≥ 32%',
  proPhaseBalanceBullet2: 'ลด transient imbalance ตอน compressor cycle on',
  proPhaseBalanceOutcome: 'CI {imb}% → < 10% · ลด thermal stress มอเตอร์และสาย',
  proPhaseDemandTitle: 'บริหาร Peak ช่วงบริการ',
  proPhaseDemandBullet1: 'Peak {peak} ที่ {time} — เป็น billing benchmark ของ Demand Charge',
  proPhaseDemandBullet2: 'Pre-cool ก่อนช่วงบริการ · สลับเปิดเครื่องครัวทีละ 2–3 นาที',
  proPhaseDemandOutcome: 'ลด Peak ~15–20% · ลด Demand Charge',
  proPhaseMonitorTitle: 'ตรวจสอบและแจ้งเตือนประจำปี',
  proPhaseMonitorBullet1: 'Thermographic inspection ที่ main panel L1 เป็นประจำ',
  proPhaseMonitorBullet2: 'ตั้ง alarm: PF < 0.85 · CI > 15%',
  proPhaseMonitorOutcome: 'ป้องกันความเสียหายจาก overload และ imbalance สะสม',
  proPeakPercentileCaption: 'สถิติ Peak Demand (Percentile)',
  pctHintP50: 'ค่ามัธยฐาน — 50% ของเวลาโหลดต่ำกว่านี้',
  pctHintP75: 'โหลดสูงกว่าปกติ — 25% ของเวลาสูงกว่านี้',
  pctHintP90: 'โหลดสูง — เกินค่านี้แค่ 10% ของเวลา',
  pctHintP95: 'โหลดสูงมาก — เกินค่านี้แค่ 5% ของเวลา',
  pctHintP99: 'ใกล้ Peak สูงสุด — เกินค่านี้แค่ 1% ของเวลา',
  proImbalanceExceedCaption: 'สัดส่วนเวลาที่ Current Imbalance เกินเกณฑ์',
  proLoadProfileNarrative:
    'โปรไฟล์โหลดแสดงช่วงโหลดสูงที่ {windows} — ควรเลื่อนโหลดหนักออกจากช่วง Peak billing',
  overallRiskCritical: 'CRITICAL',
  overallRiskCaution: 'CAUTION',
  overallRiskGood: 'GOOD',
  proRecommendedModel: 'GE Energy Saver ที่แนะนำ',
  proExpectedOutcome: 'ผลลัพธ์ที่คาดหวัง',
};

const en: ReportStrings = {
  companyName: 'GE ENERGY TECH CO.,LTD',
  platformTitle: 'Customer Energy Analysis Report Platform',
  liveBadge: 'Live report',
  reportStatus: 'Report status',
  statusDraft: 'Draft · Live analysis',
  sec1: 'Customer Information',
  sec2: 'Measurement Overview',
  sec3: 'Executive Summary',
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
  f_breakerSize: 'Breaker size',
  f_recommendedInstallSize: 'Recommended install capacity',
  measurementSizingHint: 'Estimated from peak current and measured load — for GE Energy Tech Smart Saving',
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
  f_peakPeriod: 'Peak Window',
  f_peakWindows: 'High-Load Windows',
  f_onPeakAvg: 'On-peak Average',
  f_offPeakAvg: 'Off-peak Average',
  f_peakRatio: 'Peak / Average',
  f_monthlyCost: 'Est. Monthly Cost',
  f_penaltyCost: 'Est. PF Penalty',
  f_potentialSaving: 'Potential Monthly Saving',
  f_solution: 'Recommended Solution',
  f_investment: 'Investment Cost',
  f_payback: 'Payback Period',
  paybackMonthsUnit: 'months',
  paybackYearsUnit: 'years',
  paybackRatingExcellent: 'Excellent',
  paybackRatingAcceptable: 'Acceptable',
  paybackRatingCaution: 'Review needed',
  paybackRatingPoor: 'Slow payback',
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
  ch1Label: 'CH1 (without device)',
  ch2Label: '—',
  threePhase400V: '3-Phase 400V',
  realtimeResolution: 'Real-time / 1 min',
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
  secChartsSource: 'From meter logging for the selected period',
  secTechnical: 'Technical analysis (recorded current data)',
  chartCaption: 'CH1 phase current trend',
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
  insightPeakPeriod: 'Peak time window',
  insightPeakWindows: 'Hours above average load',
  insightOnPeakLoad: 'On-peak vs off-peak (Mon–Fri 09:00–22:00)',
  insightOnPeakDetail: 'On-peak {onPeak} A · Off-peak {offPeak} A',
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
  insightChCompare: 'CH1 current trend',
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
  apfcRecommended: 'GE Energy Tech system recommended (voltage · current · stability · storage)',
  withinTarget: 'Within target',
  f_annualSaving: 'Annual Saving',
  f_motorCompressor: 'Motor / Compressor',
  f_mainBreaker: 'Main Breaker / Cable',
  f_transformer: 'Transformer',
  f_maintenance: 'Maintenance',
  maintenanceNote: 'Thermographic inspection if imbalance > 20%',
  solutionApfc: 'GE Energy Tech Smart Saving System',
  geSolutionCapabilities: 'voltage · current · stability · stored energy',
  geCompareExecutiveTitle: 'Comparison from CH1 readings — GE Energy Tech system',
  geCompareExecutiveDetail:
    'CH1 readings: PF {pf} · current imbalance {imb} · peak {peak} · THD {thd} — GE Energy Tech ({capabilities}) addresses these holistically',
  geComparePfTitle: 'PF comparison — CH1',
  geComparePfDetail:
    'CH1 PF {pf} (< 0.95) — GE system adjusts current and voltage in real time to raise PF toward 0.95–1.0 ({capabilities})',
  geComparePeakTitle: 'Peak demand comparison — CH1',
  geComparePeakDetail:
    'Peak {peak} (avg {avg}) — GE stored energy discharges at peak to cut demand charges and smooth load',
  geCompareBalanceTitle: '3-phase balance comparison — CH1',
  geCompareBalanceDetail:
    'Imbalance {imb} — GE auto phase-current balancing reduces heat and breaker/cable stress',
  geCompareHarmonicTitle: 'Harmonic comparison — CH1',
  geCompareHarmonicDetail:
    'THD {thd} — GE stability control reduces harmonics and protects motors, transformers, and electronics',
  geCompareVoltageTitle: 'Voltage comparison — CH1',
  geCompareVoltageDetail:
    'Voltage imbalance {volt} — GE voltage regulation maintains stable 400V 3-phase supply',
  geCompareEnergyTitle: 'Energy use comparison — CH1',
  geCompareEnergyDetail:
    'Average load {avg} — GE stores energy off-peak and returns current at peak to lower kWh and bills',
  geCompareFinancialTitle: 'Financial comparison — before/after GE install',
  geCompareFinancialDetail:
    'Estimated savings {saving}/month — before/after: lower PF penalties, peak charges, and stored-energy use ({capabilities})',
  geCompareEquipmentTitle: 'Equipment risk comparison — CH1',
  geCompareEquipmentDetail:
    'Equipment status {status} — GE stability and voltage control extends motor, transformer, and breaker life',
  geCompareRoiTitle: 'ROI comparison — GE Energy Tech investment',
  geCompareRoiDetail:
    '{solution} — faster payback from PF/peak savings and off-peak stored energy ({capabilities})',
  geCompareConclusionTitle: 'GE Energy Tech before/after summary',
  geCompareConclusionDetail:
    'CH1 readings: {problem} — recommend {solution} ({capabilities}) · save {saving}',
  investmentDefault: '200,000 THB',
  recApfcTitle: 'Install GE Energy Tech Smart Saving System',
  recApfcInvestTitle: 'Invest in GE Energy Tech Smart Saving',
  recApfcDesc:
    'Comparison from CH1 readings — voltage regulation, 3-phase current balancing, stability/harmonic control, and stored energy for peak/off-peak use',
  recRedistributeTitle: 'Redistribute Three-Phase Load',
  recRedistributeDesc: 'Balance L1/L2/L3 loading to reduce cable and breaker stress.',
  recPeakTitle: 'Peak Demand Management',
  recPeakDesc: 'Peak at {time} — consider load shifting.',
  recMonitorTitle: 'Continuous Monitoring',
  recMonitorDesc: 'Maintain GE IoT real-time monitoring for trend validation.',
  continueMonitoring: 'Continue monitoring',
  actVerifyPhase: 'Verify phase loading',
  actReviewPeak: 'Review peak time profile',
  actInstallApfc: 'Install GE Energy Tech if PF < 0.95 or peak/imbalance issues',
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
  phaseAvgN: 'Avg N',
  phaseAnalysisCol: 'Analysis',
  phaseAnalysisAboveAvg:
    'Phase {phase} avg {value} — above overall N ({avgN}) by {delta}%',
  phaseAnalysisBelowAvg:
    'Phase {phase} avg {value} — below overall N ({avgN}) by {delta}%',
  phaseAnalysisNearAvg: 'Phase {phase} avg {value} — close to overall N ({avgN})',
  phaseAnalysisValueOnly: 'Phase {phase} avg {value}',
  phaseAnalysisHeaviest: '· heaviest load among 3 phases',
  phaseAnalysisLightest: '· lightest load among 3 phases',
  phaseAnalysisOverallN:
    'Overall N avg {value} — current imbalance {imb}% · highest {maxPhase} {maxVal} · lowest {minPhase} {minVal}',
  phaseAnalysisNoData: 'Insufficient data for analysis',
  execSummaryTitle: 'Executive summary',
  execChartTitle: 'Phase current trend (CH1)',
  execPhaseTableTitle: 'CH1 phase current analysis',
  execLineEnergy: 'Cumulative energy {value} from meter',
  execLineAvgCurrent: 'CH1 average current: {value}',
  execLinePeakDemand: 'Peak demand: {value}',
  execLineLoadFactor: 'Load factor: {value}',
  execLinePowerFactor: 'Average power factor: {value}',
  execLineImbalance: 'Current imbalance: {value}',
  execLineOverallRisk: 'Overall risk level: {status}',
  execLineGeSolution:
    'GE Energy Tech approach: voltage · current · stability · stored energy for later use',
  execSourceHistory: 'from 24h history',
  secAnalysisTitle: 'Analysis',
  secRecommendTitle: 'Recommendations',
  secEnergyChartCaption: 'Energy consumption (estimated)',
  secPeakChartCaption: 'Peak demand from current history',
  secPeakHourlyChartCaption: 'Hourly average current — peak time analysis',
  secPfChartCaption: 'Power factor vs target',
  secBalanceChartCaption: 'L1 / L2 / L3 phase currents',
  secHarmonicChartCaption: 'THDI by phase',
  secEnergyInsightTotal: 'Cumulative energy',
  secEnergyInsightTotalDetail: 'Meter total {value}',
  secEnergyInsightMonthly: 'Monthly estimate',
  secEnergyInsightMonthlyDetail: '{kwh} · est. cost {cost}',
  secEnergyInsightLoad: 'Load from current history',
  secEnergyInsightLoadDetail: 'Average {avg} over {period}',
  secEnergyRecMonitor: 'Monitor consumption',
  secEnergyRecMonitorDesc: 'Use GE IoT to track kWh and monthly cost trends',
  secEnergyRecTou: 'Time-of-use management',
  secEnergyRecTouDesc: 'Low load factor — shift heavy loads away from peak windows',
  secEnergyBarDaily: 'Daily',
  secEnergyBarMonthly: 'Monthly',
  secEnergyBarAnnual: 'Annual',
  secEnergyEstSeries: 'Est. load (kWh)',
  secPfInsightStatus: 'Power factor status',
  secPfInsightStatusDetail: 'Current PF {value} (target ≥ 0.95)',
  secPfInsightNoData: 'No PF data yet',
  secPfInsightNoDataDetail: 'Waiting for live meter PF readings',
  secPfRecMaintain: 'Maintain PF within target and review monthly',
  secPfTarget: 'Target 0.95',
  secPfIdeal: 'Reference 1.00',
  secBalanceInsightOk: 'Phase balance',
  secBalanceInsightOkDetail: 'Three-phase currents within acceptable range',
  secBalanceRecOk: 'Maintain phase balance',
  secBalanceRecOkDesc: 'Review load distribution periodically',
  secHarmonicInsightThd: 'THDI',
  secHarmonicInsightThdDetail: 'Average THDI {value}',
  secHarmonicInsightNoData: 'No THD data yet',
  secHarmonicInsightNoDataDetail: 'Waiting for harmonic data from meter',
  secHarmonicRecFilter: 'Assess harmonic filters when THDI > 8%',
  secHarmonicRecOk: 'Harmonic level acceptable',
  secHarmonicRecOkDesc: 'Continue THDI monitoring',
  secEquipmentChartCaption: 'Equipment risk levels (1=low · 3=high)',
  secEquipmentRiskAxis: 'Risk level',
  secEquipmentInsightMotor: 'Motor/compressor: {status}',
  secEquipmentInsightBreaker: 'Main breaker/cable: {status}',
  secEquipmentInsightTransformer: 'Transformer: {status}',
  secEquipmentRecInspect: 'Scheduled equipment inspection',
  secEquipmentRecInspectDesc: 'Thermography and breaker checks when imbalance is high',
  secFinancialChartCaption: 'Financial impact ({currency})',
  secFinancialInsightCost: 'Monthly electricity cost',
  secFinancialInsightCostDetail: 'Estimated {value}/month from current usage',
  secFinancialInsightPenaltyDetail: 'Estimated PF penalty {value}/month — improve PF',
  secFinancialInsightNoPenalty: 'No clear PF penalty — maintain PF ≥ 0.95',
  secFinancialInsightSaving: 'Savings potential',
  secFinancialInsightSavingDetail: 'About {monthly}/month · {annual}/year total',
  secFinancialRecReview: 'Review bill with customer',
  secFinancialRecReviewDesc: 'Present cost, penalties, and savings plan',
  secFinancialRecApfcDesc:
    'GE Energy Tech (voltage · current · stability · storage) reduces penalties and increases savings',
  secRoiChartCaption: 'Investment vs annual savings',
  secRoiInsightSolution: 'Proposed solution',
  secRoiInsightSolutionDetail: 'Recommended: {solution}',
  secRoiInsightPayback: 'Payback period',
  secRoiInsightPaybackDetail: '{payback} · benchmark ≤ {benchmark} mo = excellent · ROI {roi}',
  secRoiPaybackBenchmark: 'Payback benchmark',
  secRoiPaybackBenchmarkDetail:
    'Payback ≤ 18 months = excellent · 18–36 acceptable · 36–60 review · > 60 slow',
  secRoiRecOptimize: 'Improve payback plan',
  secRoiRecOptimizeDesc: 'Increase monthly savings or reduce investment to target ≤ 18 months',
  secRoiInsightReturn: 'Return from savings',
  secRoiInsightReturnDetail: '{monthly}/month · {annual}/year',
  secRoiInsightPending: 'Awaiting savings data',
  secRoiInsightPendingDetail: 'Monthly savings required for accurate ROI',
  secRoiRecApprove: 'Approve investment',
  secRoiRecApproveDesc: 'Customer reviews budget and installation timeline',
  secAiChartCaption: 'AI recommendation priority',
  secAiFieldCount: 'Recommendation count',
  secAiInsightOverview: 'AI recommendations overview',
  secAiInsightOverviewDetail: '{count} items from meter data and current history',
  secAiInsightItem: 'Priority {priority}: {title}',
  secAiInsightEmpty: 'No recommendations yet',
  secAiInsightEmptyDetail: 'Waiting for meter data to generate suggestions',
  secAiRecReviewDesc: 'Review priorities with the customer team',
  secActionChartCaption: 'Estimated outcome by plan horizon',
  secActionFieldHorizons: 'Plan horizons',
  secActionFieldTasks: 'Total tasks',
  secActionOutcomeAxis: 'Est. savings',
  secActionInsightOverview: 'Action plan overview',
  secActionInsightOverviewDetail: '{count} tasks across immediate/short/medium/long term',
  secActionRecAssign: 'Assign owners',
  secActionRecAssignDesc: 'Name owners and target dates for each task',
  secActionRecTrack: 'Track progress',
  secActionRecTrackDesc: 'Update status in GE IoT or weekly reports',
  secConclusionChartCaption: 'Conclusion risk scores by topic',
  secConclusionScoreAxis: 'Score',
  secConclusionInsightProblem: 'Main issue: {value}',
  secConclusionInsightTech: 'Technical risk: {value}',
  secConclusionInsightFinancial: 'Financial impact: {value}',
  secConclusionInsightDecision: 'Decision summary',
  secConclusionInsightDecisionDetail: '{solution} · save {saving} · payback {payback}',
  secConclusionRecSignoff: 'Sign off plan',
  secConclusionRecSignoffDesc: 'Customer and GE Energy Tech acknowledge the action plan',
  printEvidenceTitle: 'Evidence and data sources',
  printMethodology:
    'Values are derived from live meter data, database current history, and analysis formulas aligned with cited government/regulatory and IEEE/IEC standards (PF, THD, imbalance, load factor, ROI). Missing data is shown as —.',
  printSourceMeter: 'Meter / device',
  printSourcePeriod: 'Analysis period',
  printSourceRecords: 'Record count',
  printSourcePeak: 'Historical peak',
  printFooterLegal: 'Auto-generated by GE IoT · For decision support only',
  printPagePrefix: 'Page ',
  printPageMiddle: ' of ',
  printPageSuffix: '',
  printTableItem: 'Item',
  printTableValue: 'Value',
  printColTime: 'Time',
  assessExcellent: '✓ Excellent',
  assessAcceptable: '✓ Acceptable',
  assessCaution: '△ Caution',
  assessWarning: '⚠ Warning',
  assessNeutral: '—',
  stdLoadFactor: '≥ 60% recommended',
  stdPf: '≥ 0.95',
  stdVoltImb: '< 2% IEC',
  stdCurImb: '< 5% IEC',
  stdThdi: '< 5% IEC 61000',
  stdThdv: '< 5% IEC',
  stdSiteSpecific: 'Site-specific',
  pfLagging: 'Lagging',
  exceedWarn10: '> 10% (warning)',
  exceedHigh20: '> 20% (high risk)',
  exceedSevere50: '> 50% (severe)',
  exceedLiveNormal: 'Normal',
  exceedLiveSevere: 'Severe',
  proTableExceedShare: '% time exceeded',
  proTableLiveStatus: 'Status (live current)',
  proReportSubtitle:
    'Power Quality & Energy Efficiency Analysis · {period} · {records} records @ {resolution}',
  proKeyFindingsIntro:
    'Key findings summary — overall technical risk: {risk} · estimated savings {saving}/month',
  proKeyFindingsTableTitle: 'Key Findings Summary',
  proTableParameter: 'Parameter',
  proTableMeasured: 'Measured Value',
  proTableStandard: 'Standard / Guideline',
  proTableAssessment: 'Assessment',
  proNarrativeIntro:
    'This report analyzes power quality and energy efficiency from {records} records ({resolution}) over {period}',
  proNarrativePfThd:
    'Average PF {pf} — {pfPenalty}% of minutes below MEA penalty threshold (0.85) · average THDI {thd}% — suitable for de-tuned APFC',
  proNarrativeImbalance:
    'Average current imbalance {imb}% — above IEC guidance · L1 carries {l1}% (above ideal 33.3%)',
  proNarrativePeak:
    '15-min peak demand {peak} at {time} — ~{ratio}× average · 1-min data differs from hourly by ~{delta}%',
  proNarrativeVoltage:
    'Voltage quality is strong — VI {vi}% · THDV {thdv}% · issues are demand-side',
  proInterpretationTitle: 'Interpretation',
  proInterpPeakDelta:
    'True 1-min peak ({fine}) is ~{delta}% above hourly ({coarse}) — affects demand charges · target window {window}',
  proInterpImbalance:
    'Current imbalance {imb}% — L1 share {l1}% · redistribute loads to reduce thermal stress',
  proInterpPfRoi:
    'PF {pf} at ~{annual} kWh/year scale — improving to ≥ 0.95 payback {payback}',
  proInterpApfcSafe: 'THDI {thd}% — de-tuned APFC (5.7% reactor) is safe without resonance risk',
  proInterpVoltageOk: 'Voltage imbalance {vi}% — grid-side quality is good; focus on load management',
  proInterpStable: 'Power quality is within acceptable limits — continue trend monitoring',
  proPhasedTitle: 'Phased Recommendations',
  proPhase1: 'Phase 1',
  proPhase2: 'Phase 2',
  proPhase3: 'Phase 3',
  proPhase4: 'Phase 4',
  proPriorityHighest: 'Highest priority',
  proPriorityHigh: 'High priority',
  proPriorityMedium: 'Medium priority',
  proPhaseApfcTitle: 'Install de-tuned APFC — best ROI',
  proPhaseApfcBullet1: 'THDI {thd}% — install APFC with 5.7% de-tuning reactor safely',
  proPhaseApfcBullet2: 'Size from peak {peak} · average L1 current {avgI} A',
  proPhaseApfcOutcome: 'PF {pf} → ≥ 0.95 · eliminate MEA penalty · payback {payback}',
  proPhaseBalanceTitle: 'Redistribute three-phase load',
  proPhaseBalanceBullet1: 'Move 1–2 L1 circuits to L3 — target L1 ≤ 35%, L3 ≥ 32%',
  proPhaseBalanceBullet2: 'Reduce transient imbalance during compressor cycling',
  proPhaseBalanceOutcome: 'CI {imb}% → < 10% · lower motor and conductor thermal stress',
  proPhaseDemandTitle: 'Evening peak demand management',
  proPhaseDemandBullet1: 'Peak {peak} at {time} — billing benchmark for demand charge',
  proPhaseDemandBullet2: 'Pre-cool before service · stagger kitchen equipment 2–3 min apart',
  proPhaseDemandOutcome: 'Reduce peak ~15–20% · lower demand charge',
  proPhaseMonitorTitle: 'Annual inspection & alarms',
  proPhaseMonitorBullet1: 'Annual thermographic inspection of main panel L1 connections',
  proPhaseMonitorBullet2: 'Set alarms: PF < 0.85 · CI > 15%',
  proPhaseMonitorOutcome: 'Prevent damage from sustained overload and imbalance',
  proPeakPercentileCaption: 'Peak demand statistics (percentiles)',
  pctHintP50: 'Median — 50% of readings are below this',
  pctHintP75: 'Above-normal load — exceeded 25% of the time',
  pctHintP90: 'High load — exceeded only 10% of the time',
  pctHintP95: 'Very high load — exceeded only 5% of the time',
  pctHintP99: 'Near peak — exceeded only 1% of the time',
  proImbalanceExceedCaption: 'Time exceeding current imbalance thresholds',
  proLoadProfileNarrative:
    'Load profile shows high-load windows at {windows} — shift heavy loads away from billing peaks',
  overallRiskCritical: 'CRITICAL',
  overallRiskCaution: 'CAUTION',
  overallRiskGood: 'GOOD',
  proRecommendedModel: 'Recommended GE Energy Saver',
  proExpectedOutcome: 'Expected outcome',
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
