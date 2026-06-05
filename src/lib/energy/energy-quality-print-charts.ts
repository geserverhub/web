import type { DbChartPoint } from './energy-quality-current-analysis';
import type { EqChartLineSpec } from './eq-chart-palette';

const W = 720;
const H = 300;
const PAD = { top: 18, right: 16, bottom: 36, left: 48 };

function sampleRows<T>(rows: T[], max = 96): T[] {
  if (rows.length <= max) return rows;
  const out: T[] = [];
  for (let i = 0; i < max; i++) {
    out.push(rows[Math.floor((i * rows.length) / max)]);
  }
  return out;
}

function fmtNum(n: number, digits = 1): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function plotW() {
  return W - PAD.left - PAD.right;
}

function plotH() {
  return H - PAD.top - PAD.bottom;
}

function yScale(min: number, max: number, val: number): number {
  if (max === min) return PAD.top + plotH() / 2;
  return PAD.top + plotH() - ((val - min) / (max - min)) * plotH();
}

function xScale(count: number, index: number): number {
  if (count <= 1) return PAD.left + plotW() / 2;
  return PAD.left + (index / (count - 1)) * plotW();
}

function gridLines(yMin: number, yMax: number): string {
  const ticks = 4;
  let out = '';
  for (let i = 0; i <= ticks; i++) {
    const y = PAD.top + (i / ticks) * plotH();
    out += `<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    const val = yMax - (i / ticks) * (yMax - yMin);
    out += `<text x="${PAD.left - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#334155" font-weight="600">${fmtNum(val)}</text>`;
  }
  return out;
}

function xTickLabels(labels: string[], count: number): string {
  const maxTicks = 8;
  const step = Math.max(1, Math.floor(count / maxTicks));
  let out = '';
  for (let i = 0; i < count; i += step) {
    const x = xScale(count, i);
    const lbl = labels[i] ?? '';
    const short = lbl.length > 5 ? lbl.slice(0, 5) : lbl;
    out += `<text x="${x}" y="${H - 10}" text-anchor="middle" font-size="8" fill="#334155" font-weight="600">${short}</text>`;
  }
  return out;
}

function legendHtml(lines: { name: string; stroke: string }[]): string {
  if (lines.length <= 1) return '';
  const items = lines
    .map(
      (l) =>
        `<span class="print-chart-legend-item"><i style="background:${l.stroke}"></i>${l.name}</span>`,
    )
    .join('');
  return `<div class="print-chart-legend">${items}</div>`;
}

export function svgMultiLineChart(input: {
  data: Record<string, unknown>[];
  lines: EqChartLineSpec[];
  xKey?: string;
  unit?: string;
}): string {
  const { lines, unit = '' } = input;
  const xKey = input.xKey ?? (input.data[0]?.time != null ? 'time' : 'label');
  const rows = sampleRows(input.data);
  if (!rows.length || !lines.length) return '';

  const labels = rows.map((r) => String(r[xKey] ?? ''));
  const series = lines.map((line) => ({
    ...line,
    values: rows.map((r) => {
      const v = r[line.dataKey];
      return typeof v === 'number' && Number.isFinite(v) ? v : null;
    }),
  }));

  const allVals = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  if (!allVals.length) return '';

  let yMin = Math.min(...allVals);
  let yMax = Math.max(...allVals);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  } else {
    const pad = (yMax - yMin) * 0.08;
    yMin -= pad;
    yMax += pad;
  }

  const paths = series
    .map((s) => {
      const pts: { x: number; y: number }[] = [];
      s.values.forEach((v, i) => {
        if (v == null) return;
        pts.push({ x: xScale(rows.length, i), y: yScale(yMin, yMax, v) });
      });
      if (pts.length < 2) return '';
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      return `<path d="${d}" fill="none" stroke="${s.stroke}" stroke-width="${s.width ?? 1.75}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');

  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    ${gridLines(yMin, yMax)}
    <line x1="${PAD.left}" y1="${PAD.top + plotH()}" x2="${W - PAD.right}" y2="${PAD.top + plotH()}" stroke="#94a3b8" stroke-width="1"/>
    ${paths}
    ${xTickLabels(labels, rows.length)}
    <text x="${PAD.left}" y="12" font-size="8" fill="#334155" font-weight="700">${unit ? `(${unit.trim()})` : ''}</text>
  </svg>`;

  return `<div class="print-chart-wrap">${svg}${legendHtml(series.map((s) => ({ name: s.name, stroke: s.stroke })))}</div>`;
}

export function svgBarChart(input: {
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
}): string {
  const { color = '#064e3b', unit = '' } = input;
  const rows = input.data.filter((d) => Number.isFinite(d.value));
  if (!rows.length) return '';

  const yMax = Math.max(...rows.map((d) => d.value), 1) * 1.12;
  const yMin = 0;
  const barGap = 4;
  const barW = Math.max(8, (plotW() - barGap * (rows.length + 1)) / rows.length);

  let bars = '';
  rows.forEach((row, i) => {
    const x = PAD.left + barGap + i * (barW + barGap);
    const h = ((row.value - yMin) / (yMax - yMin)) * plotH();
    const y = PAD.top + plotH() - h;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" rx="2"/>`;
    const lbl = row.label.length > 6 ? row.label.slice(0, 6) : row.label;
    bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="8" fill="#64748b">${lbl}</text>`;
  });

  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    ${gridLines(yMin, yMax)}
    <line x1="${PAD.left}" y1="${PAD.top + plotH()}" x2="${W - PAD.right}" y2="${PAD.top + plotH()}" stroke="#94a3b8" stroke-width="1"/>
    ${bars}
    <text x="${PAD.left}" y="12" font-size="8" fill="#334155" font-weight="700">${unit ? `(${unit.trim()})` : ''}</text>
  </svg>`;

  return `<div class="print-chart-wrap">${svg}</div>`;
}

export function svgHistoryChart(input: {
  data: DbChartPoint[];
  lines: EqChartLineSpec[];
  ch1Only?: boolean;
}): string {
  return svgMultiLineChart({
    data: sampleRows(input.data) as Record<string, unknown>[],
    lines: input.lines,
    xKey: 'time',
    unit: ' A',
  });
}
