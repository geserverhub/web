/** Formal ISO 14064-2 print stylesheet — matches official GHG project report layout */
export function buildCarbonPrintCss(): string {
  return `
@page { size: A4; margin: 14mm 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  font-family: 'Sarabun', 'Noto Sans KR', 'Malgun Gothic', 'Segoe UI', Arial, sans-serif;
  font-size: 10pt;
  color: #1a1a1a;
  line-height: 1.55;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Header ── */
.rpt-hdr {
  background: linear-gradient(135deg, #047857 0%, #059669 35%, #10b981 70%, #34d399 100%);
  color: #fff;
  padding: 20px 24px 16px;
  border-radius: 10px;
  margin-bottom: 18px;
  box-shadow: 0 4px 16px rgba(5,150,105,.28);
}
.rpt-hdr-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.rpt-co { font-size: 8pt; opacity: .78; letter-spacing: .5px; margin-bottom: 5px; }
.rpt-hdr h1 { font-size: 16pt; font-weight: 900; letter-spacing: -.3px; margin-bottom: 4px; line-height: 1.25; }
.rpt-hdr h2 { font-size: 9.5pt; font-weight: 500; opacity: .92; }
.rpt-badge {
  display: inline-block; font-size: 7.5pt; font-weight: 700;
  background: rgba(255,255,255,.22); padding: 2px 9px;
  border-radius: 4px; margin-left: 6px;
}
.rpt-id-box {
  text-align: right; flex-shrink: 0;
  background: rgba(0,0,0,.2); border-radius: 8px;
  padding: 10px 14px; min-width: 160px;
}
.rpt-id-box label { opacity: .72; font-size: 7pt; letter-spacing: 1px; display: block; margin-bottom: 3px; }
.rpt-id-box strong { font-size: 11.5pt; font-weight: 900; letter-spacing: 1.5px; font-family: ui-monospace, monospace; }
.rpt-meta {
  margin-top: 14px;
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
}
.rpt-meta div { background: rgba(255,255,255,.13); border-radius: 6px; padding: 7px 10px; }
.rpt-meta label { opacity: .72; font-size: 7pt; display: block; margin-bottom: 2px; font-weight: 600; }
.rpt-meta strong { font-size: 9pt; font-weight: 800; }
.scope-tag {
  display: inline-block; margin-top: 8px; font-size: 8pt; font-weight: 700;
  background: rgba(0,0,0,.15); padding: 3px 10px; border-radius: 999px;
}

/* ── Section titles ── */
.sec {
  font-size: 11.5pt; font-weight: 900; color: #047857;
  border-left: 4px solid #10b981;
  padding: 5px 12px; margin: 18px 0 12px;
  background: linear-gradient(90deg, #f0fdf4, #fff);
  border-radius: 0 6px 6px 0;
}

/* ── KPI row (Section 1) ── */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
.kpi {
  border: 1.5px solid #a7f3d0; border-radius: 8px;
  padding: 14px 10px; text-align: center;
  background: linear-gradient(180deg, #fff 0%, #f0fdf4 100%);
  box-shadow: 0 1px 4px rgba(16,185,129,.1);
}
.kpi-val { font-size: 16pt; font-weight: 900; color: #047857; line-height: 1.15; font-variant-numeric: tabular-nums; }
.kpi-sub { font-size: 8.5pt; color: #065f46; font-weight: 700; margin-top: 2px; }
.kpi-lbl { font-size: 7.5pt; color: #374151; font-weight: 800; margin-top: 5px; text-transform: uppercase; letter-spacing: .4px; }
.kpi-unit { font-size: 7pt; color: #6b7280; font-weight: 600; margin-top: 2px; }

/* ── Parameter table ── */
.param-tbl { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 12px; }
.param-tbl th {
  background: linear-gradient(135deg, #047857, #059669);
  color: #fff; padding: 8px 10px; text-align: left;
  font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: .3px;
  border: 1px solid #047857;
}
.param-tbl td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
.param-tbl tr:nth-child(even) td { background: #f9fafb; }
.param-tbl td strong { color: #047857; font-weight: 800; }

/* ── Info boxes ── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.info-box {
  border: 1.5px solid #93c5fd; border-radius: 8px;
  padding: 12px 14px; background: #eff6ff; break-inside: avoid;
}
.info-box h4 { color: #1d4ed8; font-size: 9pt; font-weight: 900; margin-bottom: 7px; }
.info-box ul { padding-left: 16px; font-size: 8.5pt; color: #111; line-height: 1.65; }
.info-box li { margin-bottom: 3px; }

/* ── Methodology steps (Section 2) ── */
.step {
  display: flex; gap: 12px; padding: 10px 12px;
  border: 1px solid #d1fae5; border-radius: 8px;
  margin-bottom: 8px; background: #fff; break-inside: avoid;
}
.step-num {
  background: linear-gradient(135deg, #10b981, #047857);
  color: #fff; min-width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 10pt; flex-shrink: 0; margin-top: 2px;
}
.step-ttl { font-weight: 800; color: #047857; font-size: 9.5pt; margin-bottom: 3px; }
.step-desc { font-size: 8.5pt; color: #111; margin-bottom: 5px; line-height: 1.5; }
.step-fml {
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 5px; padding: 4px 9px;
  font-family: ui-monospace, monospace; font-size: 8pt;
  color: #1d4ed8; display: inline-block; margin: 3px 0;
}
.step-ex {
  font-size: 8pt; color: #92400e;
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 5px; padding: 4px 9px; margin: 4px 0;
}
.step-ref { font-size: 7.5pt; color: #6b7280; margin-top: 4px; font-style: italic; }

/* ── Data table (meters) ── */
.data-tbl { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 10px; }
.data-tbl th {
  background: linear-gradient(135deg, #047857, #059669);
  color: #fff; padding: 7px 6px; text-align: left;
  font-size: 7pt; font-weight: 800; text-transform: uppercase;
  border: 1px solid #047857;
}
.data-tbl td { padding: 6px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
.data-tbl tr:nth-child(even) td { background: #f9fafb; }
.data-tbl tfoot td { background: #ecfdf5 !important; font-weight: 800; border-top: 2px solid #10b981; color: #065f46; }
.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; }
.center { text-align: center; }
.mono { font-family: ui-monospace, monospace; font-size: 7.5pt; }
.bold { font-weight: 800; }
.ch1 { color: #c2410c !important; }
.ch2 { color: #4338ca !important; }
.saved { color: #1d4ed8 !important; }
.credit { color: #047857 !important; font-weight: 900 !important; }
.krw { color: #7c3aed !important; }
.thb { color: #b45309 !important; }

/* ── Device cards ── */
.dev-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 12px; }
.dev-card {
  border: 1.5px solid #bbf7d0; border-radius: 10px;
  padding: 12px 14px; background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  break-inside: avoid;
}
.dev-hdr { border-bottom: 2px solid #d1fae5; padding-bottom: 7px; margin-bottom: 9px; }
.dev-hdr strong { display: block; font-size: 10pt; font-weight: 900; color: #14532d; }
.dev-id { font-family: ui-monospace, monospace; font-size: 8pt; color: #047857; font-weight: 700; }
.dev-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.dev-stats label { display: block; font-size: 6.5pt; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 1px; }
.dev-stats strong { font-size: 9.5pt; font-weight: 900; color: #111; font-variant-numeric: tabular-nums; }

/* ── Checklist / cert ── */
.checklist {
  border: 1.5px solid #d1fae5; border-radius: 8px;
  padding: 12px 14px; background: #f0fdf4; break-inside: avoid;
}
.checklist h4 { color: #047857; font-size: 9pt; font-weight: 900; margin-bottom: 7px; }
.check-item { display: flex; align-items: flex-start; gap: 7px; font-size: 8.5pt; margin-bottom: 5px; color: #111; }
.check-box {
  min-width: 14px; height: 14px; border: 1.5px solid #10b981;
  border-radius: 3px; display: inline-flex; align-items: center; justify-content: center;
  font-size: 9pt; color: #10b981; font-weight: 900; flex-shrink: 0;
}
.monitor-box {
  border: 1.5px solid #c7d2fe; border-radius: 8px;
  padding: 12px 14px; background: #eef2ff; margin-top: 10px; break-inside: avoid;
}
.monitor-box h4 { color: #4338ca; font-size: 9pt; font-weight: 900; margin-bottom: 7px; }
.monitor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 8.5pt; }
.monitor-grid ul { padding-left: 14px; margin-top: 3px; }

.decl {
  background: #f0fdf4; border: 1.5px solid #a7f3d0;
  border-radius: 8px; padding: 14px; font-size: 8.5pt;
  line-height: 1.85; margin-bottom: 14px; font-weight: 600; color: #111;
}
.sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 12px; }
.sig { border-top: 1.5px solid #374151; padding-top: 7px; }
.sig-lbl { font-size: 8.5pt; font-weight: 800; margin-bottom: 5px; color: #111; }
.sig-line { font-size: 8.5pt; margin-top: 6px; border-bottom: 1px dashed #9ca3af; padding-bottom: 3px; color: #374151; }

.footnote { font-size: 7.5pt; color: #6b7280; text-align: right; margin-top: -4px; margin-bottom: 8px; }
.rpt-footer {
  border-top: 1.5px solid #d1fae5; padding-top: 8px; margin-top: 18px;
  font-size: 7.5pt; color: #374151; font-weight: 600;
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: 5px;
}
.pb { page-break-before: always; }
.warn { border: 1.5px solid #fde68a; border-radius: 8px; padding: 10px 14px; background: #fffbeb; font-size: 8.5pt; color: #92400e; font-weight: 600; margin-bottom: 10px; }
`;

}
