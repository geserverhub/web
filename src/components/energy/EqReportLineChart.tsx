'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { EqChartLineSpec } from '@/lib/energy/eq-chart-palette';

function formatTimeLabel(val: string) {
  if (!val) return '';
  const space = val.indexOf(' ');
  return space > 0 ? val.slice(space + 1, space + 6) : val;
}

export default function EqReportLineChart({
  data,
  lines,
  xAxisKey = 'label',
  unit = '',
  height = 220,
}: {
  data: Record<string, unknown>[];
  lines: EqChartLineSpec[];
  xAxisKey?: 'label' | 'time';
  unit?: string;
  height?: number;
}) {
  if (!data.length || !lines.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
        <defs>
          {lines.map((line) => (
            <filter
              key={line.dataKey}
              id={`eq-metric-glow-${line.dataKey}`}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={line.stroke} floodOpacity="0.28" />
            </filter>
          ))}
        </defs>
        <CartesianGrid stroke="#cbd5e1" strokeDasharray="4 6" vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={xAxisKey === 'time' ? formatTimeLabel : undefined}
          tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
          axisLine={{ stroke: '#94a3b8' }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
          unit={unit}
          axisLine={{ stroke: '#94a3b8' }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontWeight: 600,
          }}
          formatter={(v: number) => [`${v}${unit}`, '']}
        />
        {lines.length > 1 ? (
          <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} iconType="plainline" iconSize={12} />
        ) : null}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.stroke}
            strokeWidth={line.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: line.stroke }}
            style={{ filter: `url(#eq-metric-glow-${line.dataKey})` }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
