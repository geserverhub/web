import type { ReportStrings } from './energy-quality-report-i18n';

function escCssContent(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Build full print CSS including localized page numbers (หน้า X จาก Y). */
export function buildEnergyQualityPrintCss(rt: ReportStrings): string {
  const prefix = escCssContent(rt.printPagePrefix);
  const middle = escCssContent(rt.printPageMiddle);
  const suffix = escCssContent(rt.printPageSuffix);
  return `
@page {
  size: A4 portrait;
  margin: 14mm 12mm 20mm 12mm;
  @bottom-center {
    content: "${prefix}" counter(page) "${middle}" counter(pages) "${suffix}";
    font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', sans-serif;
    font-size: 8pt;
    color: #64748b;
  }
}
${ENERGY_QUALITY_PRINT_BASE_CSS}`;
}

/** Inline CSS for A4 print window (energy quality report). */
const ENERGY_QUALITY_PRINT_BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', sans-serif;
  font-size: 9.5pt;
  line-height: 1.45;
  color: #0f172a;
  background: #fff;
}

.doc {
  max-width: 186mm;
  margin: 0 auto;
}

.cover {
  page-break-after: always;
  border: 2px solid #047857;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0;
}

.cover-head {
  background: linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%);
  color: #fff;
  padding: 10mm 8mm 8mm;
}

.cover-head h1 {
  margin: 0 0 2mm;
  font-size: 17pt;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.cover-head .platform {
  margin: 0;
  font-size: 11pt;
  font-weight: 600;
  opacity: 0.95;
}

.cover-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3mm 6mm;
  padding: 6mm 8mm;
  background: #f8fafc;
  font-size: 8.5pt;
}

.cover-meta dt {
  margin: 0;
  font-weight: 700;
  color: #64748b;
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cover-meta dd {
  margin: 0 0 2mm;
  font-weight: 700;
  color: #0f172a;
}

.evidence {
  margin: 0 0 5mm;
  padding: 4mm 5mm;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #047857;
  background: #f8fafc;
  font-size: 8pt;
  page-break-inside: avoid;
}

.evidence h2 {
  margin: 0 0 2mm;
  font-size: 9pt;
  font-weight: 800;
  color: #047857;
}

.evidence ul {
  margin: 0;
  padding-left: 4mm;
}

.evidence li {
  margin-bottom: 1mm;
}

.toc {
  page-break-after: always;
  margin-bottom: 4mm;
}

.toc h2 {
  font-size: 11pt;
  color: #047857;
  border-bottom: 2px solid #10b981;
  padding-bottom: 2mm;
  margin: 0 0 3mm;
}

.toc ol {
  margin: 0;
  padding-left: 5mm;
  columns: 2;
  column-gap: 8mm;
  font-size: 8.5pt;
}

.toc li {
  margin-bottom: 1.5mm;
  break-inside: avoid;
}

.status-box {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2mm;
  margin-bottom: 5mm;
  page-break-inside: avoid;
}

.status-cell {
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  padding: 2.5mm;
  text-align: center;
  background: #fff;
}

.status-cell label {
  display: block;
  font-size: 6.5pt;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 1mm;
}

.status-cell strong {
  font-size: 9pt;
  color: #0f172a;
}

.print-sec {
  margin-bottom: 5mm;
  page-break-inside: avoid;
}

.print-sec h2 {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin: 0 0 3mm;
  padding: 2mm 3mm;
  font-size: 10.5pt;
  font-weight: 800;
  color: #fff;
  background: #047857;
  border-radius: 2px;
}

.print-sec h2 .num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 7mm;
  height: 7mm;
  background: #fff;
  color: #047857;
  border-radius: 2px;
  font-size: 9pt;
}

.print-sec h3 {
  margin: 3mm 0 1.5mm;
  font-size: 8.5pt;
  font-weight: 800;
  color: #065f46;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2mm;
  margin-bottom: 2mm;
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.cell {
  border: 1px solid #e2e8f0;
  border-radius: 2px;
  padding: 2mm 2.5mm;
  background: #fafafa;
  min-height: 10mm;
}

.cell label {
  display: block;
  font-size: 6.5pt;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.5mm;
  line-height: 1.2;
}

.cell strong {
  display: block;
  font-size: 9pt;
  font-weight: 800;
  color: #0f172a;
  word-break: break-word;
}

.bullets {
  margin: 0 0 2mm;
  padding-left: 4mm;
  font-size: 8.5pt;
}

.bullets li {
  margin-bottom: 1mm;
}

.chart-data {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
  margin-bottom: 2mm;
}

.chart-data th {
  background: #ecfdf5;
  color: #047857;
  font-weight: 800;
  padding: 1.5mm 2mm;
  border: 1px solid #d1fae5;
  text-align: left;
}

.chart-data td {
  padding: 1.5mm 2mm;
  border: 1px solid #e2e8f0;
}

.insights {
  list-style: none;
  margin: 0 0 2mm;
  padding: 0;
}

.insights li {
  margin-bottom: 1.5mm;
  padding: 2mm 2.5mm;
  border-left: 3px solid #94a3b8;
  background: #f8fafc;
  font-size: 8.5pt;
}

.insights li.warn {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.insights li.crit {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.insights li strong {
  display: block;
  font-size: 8.5pt;
  color: #0f172a;
}

.insights li p {
  margin: 0.5mm 0 0;
  color: #475569;
  font-size: 8pt;
}

.recs {
  margin: 0;
  padding: 0;
  list-style: none;
}

.recs li {
  margin-bottom: 1.5mm;
  padding: 2mm 2.5mm;
  border: 1px solid #d1fae5;
  border-radius: 2px;
  background: #f0fdf4;
  font-size: 8.5pt;
}

.recs li strong {
  display: block;
  color: #047857;
  margin-bottom: 0.5mm;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin: 2mm 0;
}

.data-table th {
  background: #047857;
  color: #fff;
  padding: 2mm;
  text-align: left;
  font-weight: 700;
}

.data-table td {
  padding: 2mm;
  border-bottom: 1px solid #e2e8f0;
}

.data-table tr:nth-child(even) td {
  background: #f8fafc;
}

.ai-rec {
  margin: 0 0 2mm;
  padding: 0;
  list-style: none;
}

.ai-rec li {
  margin-bottom: 2mm;
  padding: 2.5mm;
  border: 1px solid #bbf7d0;
  border-radius: 2px;
}

.ai-rec .pri {
  font-size: 7pt;
  font-weight: 800;
  color: #047857;
  text-transform: uppercase;
}

.act-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2mm;
  margin-bottom: 2mm;
}

.act-card {
  border: 1px solid #d1fae5;
  border-radius: 2px;
  padding: 2.5mm;
  background: #f0fdf4;
  font-size: 8pt;
}

.act-card h4 {
  margin: 0 0 1mm;
  font-size: 8.5pt;
  color: #047857;
}

.act-card ul {
  margin: 0;
  padding-left: 3mm;
}

.doc-footer {
  margin-top: 6mm;
  padding-top: 3mm;
  border-top: 2px solid #047857;
  text-align: center;
  font-size: 7.5pt;
  color: #64748b;
  page-break-inside: avoid;
}

.note {
  font-size: 7.5pt;
  color: #64748b;
  font-style: italic;
  margin: 2mm 0 4mm;
}

.standards-block {
  margin: 0 0 5mm;
  padding: 4mm 5mm;
  border: 1px solid #a7f3d0;
  background: #ecfdf5;
  page-break-inside: avoid;
}

.standards-block h2 {
  margin: 0 0 2mm;
  font-size: 10pt;
  font-weight: 800;
  color: #047857;
}

.country-tag {
  font-size: 8pt;
  font-weight: 700;
  color: #065f46;
  background: #d1fae5;
  padding: 0.5mm 2mm;
  border-radius: 2px;
  margin-left: 2mm;
}

.standards-intro {
  margin-bottom: 2mm;
}

.standards-block h3 {
  margin: 2.5mm 0 1mm;
  font-size: 8.5pt;
  font-weight: 800;
  color: #065f46;
}

.std-list, .std-research {
  margin: 0 0 2mm;
  padding-left: 4mm;
  font-size: 8pt;
}

.std-research li {
  margin-bottom: 1.5mm;
}

.criteria-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7.5pt;
  margin-bottom: 2mm;
}

.criteria-table th {
  background: #047857;
  color: #fff;
  padding: 1.5mm 2mm;
  text-align: left;
}

.criteria-table td {
  padding: 1.5mm 2mm;
  border: 1px solid #d1fae5;
  vertical-align: top;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2mm;
}

.snap-cell {
  border: 1px solid #e2e8f0;
  border-radius: 2px;
  padding: 2mm;
  text-align: center;
  background: #fff;
}

.snap-cell label {
  display: block;
  font-size: 6.5pt;
  font-weight: 700;
  color: #64748b;
}

.snap-cell strong {
  display: block;
  font-size: 10pt;
  color: #0f172a;
}

.snap-cell .unit {
  font-size: 7pt;
  color: #94a3b8;
}

.status-panel {
  margin-bottom: 4mm;
  page-break-inside: avoid;
}

.status-panel h2 {
  font-size: 9pt;
  color: #047857;
  margin: 0 0 2mm;
}

.status-overall {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3mm;
  margin-bottom: 2mm;
  font-size: 8.5pt;
}

.status-harmonic {
  color: #475569;
}

.risk-badge {
  display: inline-block;
  padding: 0.5mm 2mm;
  border-radius: 2px;
  font-size: 7pt;
  font-weight: 800;
}

.risk-badge--good {
  background: #dcfce7;
  color: #166534;
}

.risk-badge--warning {
  background: #fef3c7;
  color: #92400e;
}

.risk-badge--critical {
  background: #fee2e2;
  color: #991b1b;
}

.status-cell--good {
  border-color: #86efac;
}

.status-cell--warning {
  border-color: #fcd34d;
  background: #fffbeb;
}

.status-cell--critical {
  border-color: #fca5a5;
  background: #fef2f2;
}

.technical-block {
  margin-bottom: 4mm;
  page-break-inside: avoid;
}

.technical-block h2 {
  font-size: 9pt;
  color: #047857;
  margin: 0 0 2mm;
}

.chart-stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2mm;
  margin-bottom: 2mm;
}

.stat-cell {
  border: 1px solid #e2e8f0;
  padding: 2mm;
  text-align: center;
  font-size: 7.5pt;
  background: #f8fafc;
}

.stat-cell label {
  display: block;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 0.5mm;
}

.stat-cell strong {
  font-size: 8.5pt;
  color: #0f172a;
}

.sec-ref {
  margin-top: 2mm;
  padding: 2mm 2.5mm;
  border-left: 3px solid #10b981;
  background: #f0fdf4;
  font-size: 7.5pt;
  color: #334155;
}

@media print {
  .print-sec {
    break-inside: avoid-page;
  }
  .cover {
    break-after: page;
  }
  .toc {
    break-after: page;
  }
}
`;

