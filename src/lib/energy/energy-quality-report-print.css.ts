import type { ReportStrings } from './energy-quality-report-i18n';

function escCssContent(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Build full print CSS including localized page numbers (หน้า X จาก Y). */
export function buildEnergyQualityPrintCss(
  rt: ReportStrings,
  meta?: { reportId?: string },
): string {
  const prefix = escCssContent(rt.printPagePrefix);
  const middle = escCssContent(rt.printPageMiddle);
  const suffix = escCssContent(rt.printPageSuffix);
  const company = escCssContent(rt.companyName);
  const reportId = escCssContent(meta?.reportId ?? '');
  const runningHead = reportId ? `${company} · ${reportId}` : company;
  return `
@page {
  size: A4 portrait;
  margin: 14mm 11mm 18mm 11mm;
  @top-center {
    content: "${runningHead}";
    font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', sans-serif;
    font-size: 7pt;
    font-weight: 600;
    color: #64748b;
    border-bottom: 0.4pt solid #e2e8f0;
    padding-bottom: 1.5mm;
  }
  @bottom-center {
    content: "${prefix}" counter(page) "${middle}" counter(pages) "${suffix}";
    font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', sans-serif;
    font-size: 7.5pt;
    color: var(--print-ink-soft);
  }
}
@page :first {
  margin-top: 11mm;
  @top-center { content: none; border: none; padding: 0; }
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
  font-size: 9.25pt;
  line-height: 1.42;
  color: var(--print-ink);
  background: #fff;
  orphans: 3;
  widows: 3;
}

.doc {
  width: 100%;
  max-width: 188mm;
  margin: 0 auto;
}

.doc-body {
  margin: 0;
  padding: 0;
}

.sheet {
  box-sizing: border-box;
}

.sheet--cover {
  page-break-after: always;
  break-after: page;
  margin-bottom: 0;
  /* Fill most of the first printable page (≈268mm) but keep a safety buffer so
     the bordered card never spills past the bottom edge (browser print margins
     vary), which would push it onto a blank page. */
  min-height: 248mm;
  display: flex;
  flex-direction: column;
}

.sheet--toc {
  page-break-after: always;
  break-after: page;
  margin-bottom: 0;
  /* Printable height ≈265mm; keep a buffer to avoid bottom overflow. */
  min-height: 246mm;
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
  border: 1px solid #cbd5e1;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0;
  background: #fff;
  box-shadow: 0 0.5mm 2mm rgba(2, 44, 34, 0.06);
  /* Grow the cover card to fill the page; meta details settle at the bottom. */
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.cover-band {
  height: 5mm;
  background: linear-gradient(90deg, var(--print-brand-dark) 0%, var(--print-brand-mid) 62%, #0d9488 100%);
}

.cover-head {
  position: relative;
  background: #fff;
  color: var(--print-ink);
  padding: 7mm 8mm 5mm;
  border-bottom: 1px solid #e2e8f0;
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
  margin: 0 0 1mm;
  font-size: 13.5pt;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--print-brand-dark);
}

.cover-head .platform {
  margin: 0;
  font-size: 9.5pt;
  font-weight: 600;
  color: var(--print-brand-mid);
}

.cover-title-block {
  padding: 5mm 8mm 4mm;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
  border-bottom: 1px solid #e2e8f0;
  text-align: center;
}

.cover-doc-type {
  margin: 0 0 1.5mm;
  font-size: 16pt;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--print-brand-dark);
}

.cover-doc-sub {
  margin: 0;
  font-size: 9pt;
  color: var(--print-ink-soft);
  font-weight: 600;
}

.cover-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5mm 7mm;
  padding: 5mm 8mm 6mm;
  background: #fafafa;
  font-size: 8.25pt;
  /* Push the detail block to the bottom of the grown cover card. */
  margin-top: auto;
  align-content: end;
}

.cover-meta dt {
  margin: 0;
  font-weight: 700;
  color: var(--print-ink-soft);
  font-size: 7pt;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cover-meta dd {
  margin: 0 0 1.5mm;
  font-weight: 700;
  color: var(--print-ink);
}

.evidence {
  margin: 4mm 0 0;
  padding: 3.5mm 4.5mm;
  border: 1px solid #cbd5e1;
  border-left: 3px solid var(--print-brand);
  background: #f8fafc;
  font-size: 7.75pt;
  page-break-inside: avoid;
  break-inside: avoid-page;
}

.evidence--toc {
  margin-top: 5mm;
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
  font-weight: 800;
  color: var(--print-brand-dark);
  border-bottom: 1.5pt solid var(--print-brand);
  padding-bottom: 2mm;
  margin: 0 0 4mm;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.toc ol {
  margin: 0;
  padding: 0;
  list-style: none;
  columns: 2;
  column-gap: 10mm;
  font-size: 8.75pt;
}

.toc li {
  display: flex;
  align-items: baseline;
  gap: 2mm;
  margin-bottom: 2mm;
  break-inside: avoid;
  color: var(--print-ink-muted);
}

.toc-label {
  flex: 0 1 auto;
  font-weight: 600;
  color: var(--print-ink);
}

.toc-dots {
  flex: 1 1 auto;
  border-bottom: 1px dotted #cbd5e1;
  min-width: 4mm;
  margin-bottom: 1mm;
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
  margin-bottom: 3.5mm;
  padding-bottom: 2mm;
  border-bottom: 0.5pt solid #e2e8f0;
  page-break-inside: auto;
  break-inside: auto;
}

.print-sec:last-of-type {
  border-bottom: none;
}

.print-sec h2 {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin: 0 0 2.5mm;
  padding: 2mm 0 2mm 3.5mm;
  font-size: 10.5pt;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(90deg, var(--print-brand-dark) 0%, var(--print-brand-mid) 100%);
  border: none;
  border-radius: 1px;
  break-after: avoid;
  page-break-after: avoid;
  letter-spacing: 0.02em;
}

.print-sec h2 .num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 7mm;
  height: 7mm;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border: 1pt solid rgba(255, 255, 255, 0.35);
  border-radius: 1px;
  font-size: 8.5pt;
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
  max-height: 62mm;
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
  background: var(--print-brand-dark);
  color: #fff;
  padding: 2mm;
  text-align: left;
  font-weight: 700;
  font-size: 8pt;
  border-bottom: none;
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

.data-table--imb-exceed th:last-child,
.data-table--imb-exceed td:last-child {
  text-align: right;
  white-space: nowrap;
}

.data-table--imb-exceed .live-status--good {
  color: #047857;
  font-weight: 700;
}

.data-table--imb-exceed .live-status--warning {
  color: #b45309;
  font-weight: 700;
}

.data-table--imb-exceed .live-status--critical {
  color: #b91c1c;
  font-weight: 700;
}

.data-table--imb-exceed .live-status--neutral {
  color: #64748b;
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
  margin-top: 5mm;
  padding: 4mm 3mm 2mm;
  border-top: 1.5pt solid var(--print-brand);
  text-align: center;
  font-size: 7.5pt;
  color: var(--print-ink-soft);
  page-break-inside: avoid;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
}

.doc-footer p {
  margin: 0.5mm 0;
}

.note {
  font-size: 7.5pt;
  color: var(--print-ink-soft);
  font-style: italic;
  margin: 2mm 0 4mm;
}

.standards-block {
  margin: 4mm 0 3mm;
  padding: 4mm 5mm;
  border: 1px solid #cbd5e1;
  border-top: 2pt solid var(--print-brand);
  background: #f8fafc;
  page-break-inside: auto;
  break-inside: auto;
}

.standards-block--appendix {
  page-break-before: auto;
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
  margin-bottom: 3.5mm;
  padding-bottom: 2mm;
  border-bottom: 0.5pt solid #e2e8f0;
  page-break-inside: avoid;
  break-inside: avoid-page;
}

.status-panel h2 {
  font-size: 10pt;
  font-weight: 800;
  color: var(--print-brand-dark);
  margin: 0 0 2.5mm;
  padding-bottom: 1.5mm;
  border-bottom: 1pt solid var(--print-brand-mid);
  letter-spacing: 0.02em;
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

.phase-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2.5mm;
  margin-bottom: 2mm;
}

.phase-card {
  margin: 0;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 1px;
  background: #fff;
  page-break-inside: avoid;
  break-inside: avoid-page;
  overflow: hidden;
}

.phase-card-head {
  padding: 2mm 2.5mm;
  background: linear-gradient(180deg, #ecfdf5 0%, #f8fafc 100%);
  border-bottom: 1px solid #d1fae5;
}

.phase-card h4 {
  margin: 0 0 0.5mm;
  font-size: 8.25pt;
  font-weight: 800;
  color: var(--print-brand-dark);
}

.phase-priority {
  margin: 0;
  font-size: 7pt;
  font-weight: 700;
  color: var(--print-brand-mid);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.phase-card-body {
  padding: 2mm 2.5mm 2.5mm;
  font-size: 8pt;
}

.phase-card-body ul {
  margin: 0 0 1.5mm;
  padding-left: 3.5mm;
}

.phase-outcome {
  margin: 0;
  padding-top: 1.5mm;
  border-top: 1px dashed #e2e8f0;
  font-size: 7.5pt;
  color: var(--print-ink-muted);
}

.phase-outcome strong {
  color: var(--print-brand);
  font-size: 7pt;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.pro-block {
  margin: 2mm 0 3mm;
  padding: 2.5mm 3mm;
  border: 1px solid #e2e8f0;
  background: #fafafa;
}

.pro-block h3 {
  margin-top: 0 !important;
}

.pro-model-line {
  margin: 0 0 2.5mm;
  padding: 2mm 2.5mm;
  background: #ecfdf5;
  border: 1px solid #86efac;
  font-size: 8.25pt;
  font-weight: 600;
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

  .phase-grid {
    grid-template-columns: repeat(2, 1fr);
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

