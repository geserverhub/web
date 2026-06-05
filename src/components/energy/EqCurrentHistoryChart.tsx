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

export type EqChartLineSpec = {
  dataKey: string;
  name: string;
  stroke: string;
  width: number;
};

function formatTimeLabel(val: string) {
  if (!val) return '';
  const space = val.indexOf(' ');
  return space > 0 ? val.slice(space + 1, space + 6) : val;
}

export default function EqCurrentHistoryChart({
  data,
  lines,
  height = 320,
}: {
  data: Record<string, unknown>[];
  lines: EqChartLineSpec[];
  height?: number;
}) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 14, right: 18, left: 6, bottom: 10 }}>
        <defs>
          {lines.map((line) => (
            <filter
              key={line.dataKey}
              id={`eq-glow-${line.dataKey}`}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={line.stroke} floodOpacity="0.55" />
            </filter>
          ))}
        </defs>
        <CartesianGrid stroke="#cbd5e1" strokeDasharray="4 6" strokeOpacity={0.7} vertical={false} />
        <XAxis
          dataKey="time"
          tickFormatter={formatTimeLabel}
          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
          axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
          tickLine={{ stroke: '#94a3b8' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
          unit=" A"
          axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
          tickLine={{ stroke: '#94a3b8' }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.08)',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            fontWeight: 600,
          }}
          labelStyle={{ color: '#0f172a', fontWeight: 700 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }}
          iconType="plainline"
          iconSize={14}
        />
        {lines.map((line) => (
          <Line
            key={`${line.dataKey}-halo`}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={line.width + 6}
            strokeOpacity={0.16}
            strokeLinecap="round"
            dot={false}
            legendType="none"
            isAnimationActive={false}
            activeDot={false}
          />
        ))}
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
            style={{ filter: `url(#eq-glow-${line.dataKey})` }}
            activeDot={{
              r: 6,
              stroke: '#fff',
              strokeWidth: 2.5,
              fill: line.stroke,
              style: { filter: `url(#eq-glow-${line.dataKey})` },
            }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function buildEqCurrentChartLines(
  ui: { l1: string; l2: string; l3: string },
  ch1Only = true,
): EqChartLineSpec[] {
  const before: EqChartLineSpec[] = [
    { dataKey: 'beforeL1', name: `CH1 ${ui.l1}`, stroke: '#c2410c', width: 3.5 },
    { dataKey: 'beforeL2', name: `CH1 ${ui.l2}`, stroke: '#ea580c', width: 3 },
    { dataKey: 'beforeL3', name: `CH1 ${ui.l3}`, stroke: '#f97316', width: 2.75 },
  ];
  if (ch1Only) return before;
  return [
    { dataKey: 'afterL1', name: `CH2 ${ui.l1}`, stroke: '#1d4ed8', width: 3.5 },
    { dataKey: 'afterL2', name: `CH2 ${ui.l2}`, stroke: '#2563eb', width: 3 },
    { dataKey: 'afterL3', name: `CH2 ${ui.l3}`, stroke: '#3b82f6', width: 2.75 },
    ...before,
  ];
}
