import {
  buildEnergyQualityReportIdWithSeq,
  formatReportDateStamp,
  nextReportNumberFromExisting,
} from './energy-quality-report-id';

/** Daily base: GE-CC-20260605 */
export function buildCarbonReportIdBase(at: Date = new Date()): string {
  return `GE-CC-${formatReportDateStamp(at)}`;
}

/** Preview / default: GE-CC-20260605-001 */
export function buildCarbonReportIdPreview(at: Date = new Date()): string {
  return buildEnergyQualityReportIdWithSeq(buildCarbonReportIdBase(at), 1);
}

export function nextCarbonReportNumberFromExisting(existing: string[], at: Date = new Date()): string {
  const base = buildCarbonReportIdBase(at);
  return nextReportNumberFromExisting(existing, base);
}
