'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { EqChartLineSpec } from '@/lib/energy/eq-chart-palette';
import type { ActionPlanChartPoint } from '@/lib/energy/energy-quality-action-plan';

export default function EqReportBarChart({
  data,
  line,
  unit = '',
  height = 240,
  integerAxis = true,
}: {
  data: ActionPlanChartPoint[];
  line: EqChartLineSpec;
  unit?: string;
  height?: number;
  integerAxis?: boolean;
}) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 0);
  const yMax = integerAxis ? Math.max(4, maxVal + 1) : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 28 }}>
        <CartesianGrid stroke="#cbd5e1" strokeDasharray="4 6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
          axisLine={{ stroke: '#94a3b8' }}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
          axisLine={{ stroke: '#94a3b8' }}
          allowDecimals={!integerAxis}
          domain={integerAxis ? [0, yMax] : [0, 'auto']}
          tickCount={integerAxis ? Math.min(yMax! + 1, 6) : 5}
          tickFormatter={
            integerAxis
              ? undefined
              : (v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}k`
                      : String(Math.round(v))
          }
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontWeight: 600,
          }}
          labelFormatter={(_, payload) => {
            const row = payload?.[0]?.payload as ActionPlanChartPoint | undefined;
            return row?.fullLabel ?? row?.label ?? '';
          }}
          formatter={(v: number) => [
            `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}${unit}`,
            line.name,
          ]}
        />
        <Bar
          dataKey={line.dataKey}
          name={line.name}
          radius={[4, 4, 0, 0]}
          maxBarSize={52}
        >
          {data.map((entry, i) => (
            <Cell key={`${entry.label}-${i}`} fill={line.stroke} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
