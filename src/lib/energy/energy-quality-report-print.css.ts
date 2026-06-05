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
  margin: 10mm 10mm 16mm 10mm;
  @bottom-center {
    content: "${prefix}" counter(page) "${middle}" counter(pages) "${suffix}";
    font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', sans-serif;
    font-size: 8pt;
    color: var(--print-ink-soft);
  }
}
${ENERGY_QUALITY_PRINT_BASE_CSS}`;
}

/** Inline CSS for A4 print window (energy quality report). */
const ENERGY_QUALITY_PRINT_BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');

:root {
  --print-ink: #020617;
  --print-ink-muted: #1e293b;
  --print-ink-soft: #334155;
  --print-brand: #064e3b;
  --print-brand-dark: #022c22;
  --print-brand-mid: #065f46;
  --print-border: #94a3b8;
  --print-surface: #f1f5f9;
}

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
  color: var(--print-ink);
  background: #fff;
}

.doc {
  width: 100%;
  max-width: 190mm;
  margin: 0 auto;
}

.sheet {
  box-sizing: border-box;
}

.sheet--cover {
  page-break-after: always;
  break-after: page;
  min-height: 271mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 5mm;
}

.sheet--toc {
  page-break-after: always;
  break-after: page;
  min-height: 271mm;
  display: flex;
  flex-direction: column;
}

.print-logo {
  display: block;
  height: 14mm;
  width: auto;
  max-width: 42mm;
  object-fit: contain;
}

.print-logo--sm {
  height: 8mm;
  max-width: 28mm;
  margin: 0 auto 2mm;
}

.cover {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #d1fae5;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 0;
  background: #fff;
}

.cover-head {
  position: relative;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: var(--print-ink);
  padding: 9mm 8mm 7mm;
  border-bottom: 1px solid #e2e8f0;
}

.cover-head::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: linear-gradient(90deg, var(--print-brand-dark) 0%, var(--print-brand-mid) 55%, #34d399 100%);
}

.cover-brand {
  display: flex;
  align-items: center;
  gap: 5mm;
}

.cover-brand .print-logo {
  height: 16mm;
  max-width: 38mm;
  padding: 1.5mm 2mm;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: none;
}

.cover-brand-text {
  flex: 1;
  min-width: 0;
}

.cover-head h1 {
  margin: 0 0 1.5mm;
  font-size: 15pt;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--print-brand-dark);
}

.cover-head .platform {
  margin: 0;
  font-size: 10pt;
  font-weight: 600;
  color: var(--print-brand-mid);
  letter-spacing: 0.01em;
}

.cover-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3mm 6mm;
  flex: 1;
  align-content: start;
  padding: 6mm 8mm 8mm;
  background: #fafafa;
  font-size: 8.5pt;
}

.cover-meta dt {
  margin: 0;
  font-weight: 800;
  color: var(--print-ink-soft);
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cover-meta dd {
  margin: 0 0 2mm;
  font-weight: 800;
  color: var(--print-ink);
}

.evidence {
  margin: 0 0 5mm;
  padding: 4mm 5mm;
  border: 1px solid #cbd5e1;
  border-left: 4px solid var(--print-brand);
  background: #f8fafc;
  font-size: 8pt;
  page-break-inside: avoid;
}

.evidence h2 {
  margin: 0 0 2mm;
  font-size: 9pt;
  font-weight: 800;
  color: var(--print-brand);
}

.evidence ul {
  margin: 0;
  padding-left: 4mm;
}

.evidence li {
  margin-bottom: 1mm;
}

.toc {
  flex: 1;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.toc h2 {
  font-size: 11pt;
  color: var(--print-brand);
  border-bottom: 2px solid var(--print-brand-mid);
  padding-bottom: 2mm;
  margin: 0 0 3mm;
}

.toc ol {
  margin: 0;
  padding-left: 5mm;
  columns: 2;
  column-gap: 8mm;
  font-size: 9pt;
  flex: 1;
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
  color: var(--print-ink-soft);
  text-transform: uppercase;
  margin-bottom: 1mm;
}

.status-cell strong {
  font-size: 9pt;
  color: var(--print-ink);
}

.print-sec {
  margin-bottom: 4mm;
  page-break-inside: auto;
  break-inside: auto;
}

.print-sec h2 {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin: 0 0 3mm;
  padding: 2.2mm 3.5mm;
  font-size: 10pt;
  font-weight: 800;
  color: var(--print-brand-dark);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3.5px solid var(--print-brand);
  border-radius: 3px;
  break-after: avoid;
  page-break-after: avoid;
}

.print-sec h2 .num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 6.5mm;
  height: 6.5mm;
  background: var(--print-brand);
  color: #fff;
  border-radius: 50%;
  font-size: 8pt;
  flex-shrink: 0;
}

.print-sec h3 {
  margin: 3mm 0 1.5mm;
  font-size: 8.5pt;
  font-weight: 800;
  color: var(--print-brand-mid);
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
  color: var(--print-ink-soft);
  margin-bottom: 0.5mm;
  line-height: 1.2;
}

.cell strong {
  display: block;
  font-size: 9pt;
  font-weight: 800;
  color: var(--print-ink);
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
  background: #d1fae5;
  color: var(--print-brand-dark);
  font-weight: 800;
  padding: 1.5mm 2mm;
  border: 1px solid #86efac;
  text-align: left;
}

.chart-data td {
  padding: 1.5mm 2mm;
  border: 1px solid #e2e8f0;
}

.print-chart-title {
  margin: 3mm 0 1.5mm;
  font-size: 9.5pt;
  font-weight: 800;
  color: var(--print-brand);
  break-after: avoid;
  page-break-after: avoid;
}

.print-chart-wrap {
  width: 100%;
  margin: 0 0 3mm;
  page-break-inside: auto;
  break-inside: auto;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  padding: 2mm;
  background: #fff;
}

.print-chart-wrap svg {
  display: block;
  width: 100%;
  height: auto;
  min-height: 58mm;
  max-height: 78mm;
}

.print-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 3mm 5mm;
  margin-top: 1.5mm;
  padding-top: 1.5mm;
  border-top: 1px dashed #e2e8f0;
  font-size: 7.5pt;
  color: var(--print-ink-muted);
}

.print-chart-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 1.5mm;
  font-weight: 600;
}

.print-chart-legend-item i {
  display: inline-block;
  width: 10px;
  height: 3px;
  border-radius: 2px;
  font-style: normal;
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
  color: var(--print-ink);
}

.insights li p {
  margin: 0.5mm 0 0;
  color: var(--print-ink-muted);
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
  border: 1px solid #86efac;
  border-radius: 2px;
  background: #ecfdf5;
  font-size: 8.5pt;
}

.recs li strong {
  display: block;
  color: var(--print-brand);
  margin-bottom: 0.5mm;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin: 2mm 0;
  break-inside: auto;
  page-break-inside: auto;
}

.data-table thead {
  display: table-header-group;
}

.data-table tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

.data-table th {
  background: #ecfdf5;
  color: var(--print-brand-dark);
  padding: 2mm;
  text-align: left;
  font-weight: 800;
  border-bottom: 2px solid var(--print-brand-mid);
}

.data-table td {
  padding: 2mm;
  border-bottom: 1px solid #e2e8f0;
}

.data-table tr:nth-child(even) td {
  background: #f8fafc;
}

.data-table--phase .phase-val {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.data-table--phase .phase-analysis {
  font-size: 7.5pt;
  line-height: 1.45;
  color: var(--print-ink-soft);
}

.data-table--phase tr.phase-row-avg td {
  background: #f0fdf4;
  font-weight: 700;
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
  color: var(--print-brand);
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
  color: var(--print-brand);
}

.act-card ul {
  margin: 0;
  padding-left: 3mm;
}

.doc-footer {
  margin-top: 6mm;
  padding-top: 3mm;
  border-top: 2px solid var(--print-brand);
  text-align: center;
  font-size: 7.5pt;
  color: var(--print-ink-soft);
  page-break-inside: avoid;
}

.note {
  font-size: 7.5pt;
  color: var(--print-ink-soft);
  font-style: italic;
  margin: 2mm 0 4mm;
}

.standards-block {
  margin: 0 0 4mm;
  padding: 4mm 5mm;
  border: 1px solid #86efac;
  background: #ecfdf5;
  page-break-inside: auto;
  break-inside: auto;
}

.standards-block h2,
.standards-block h3 {
  break-after: avoid;
  page-break-after: avoid;
}

.standards-block h2 {
  margin: 0 0 2mm;
  font-size: 10pt;
  font-weight: 800;
  color: var(--print-brand);
}

.country-tag {
  font-size: 8pt;
  font-weight: 800;
  color: var(--print-brand-dark);
  background: #bbf7d0;
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
  color: var(--print-brand-mid);
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
  background: #ecfdf5;
  color: var(--print-brand-dark);
  padding: 1.5mm 2mm;
  text-align: left;
  font-weight: 800;
  border-bottom: 2px solid var(--print-brand-mid);
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
  color: var(--print-ink-soft);
}

.snap-cell strong {
  display: block;
  font-size: 10pt;
  color: var(--print-ink);
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
  color: var(--print-brand);
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
  color: var(--print-ink-muted);
}

.risk-badge {
  display: inline-block;
  padding: 0.5mm 2mm;
  border-radius: 2px;
  font-size: 7pt;
  font-weight: 800;
}

.risk-badge--good {
  background: #bbf7d0;
  color: #14532d;
}

.risk-badge--warning {
  background: #fde68a;
  color: #78350f;
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
  page-break-inside: auto;
  break-inside: auto;
}

.phase-card {
  margin-bottom: 2mm;
  padding: 2.5mm;
  border: 1px solid #d1fae5;
  border-radius: 2px;
  background: #f0fdf4;
  page-break-inside: avoid;
  break-inside: avoid-page;
}

.phase-card h4 {
  margin: 0 0 1mm;
  font-size: 8.5pt;
  color: var(--print-brand);
}

.phase-card ul {
  margin: 0;
  padding-left: 3.5mm;
  font-size: 8pt;
}

.technical-block h2 {
  font-size: 9pt;
  color: var(--print-brand);
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
  color: var(--print-ink-soft);
  font-weight: 700;
  margin-bottom: 0.5mm;
}

.stat-cell strong {
  font-size: 8.5pt;
  color: var(--print-ink);
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
  html,
  body {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .doc {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
  }

  .sheet--cover,
  .sheet--toc {
    min-height: 271mm;
  }

  .print-sec h3 {
    break-after: avoid;
    page-break-after: avoid;
  }

  .grid,
  .act-grid,
  .snapshot-grid,
  .chart-stats-row {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`;

