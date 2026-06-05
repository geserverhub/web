export type EqChartLineSpec = {
  dataKey: string;
  name: string;
  stroke: string;
  width: number;
};

/** L1 red · L2 green · L3 yellow — standard 3-phase line colors. */
export const EQ_CH1_STROKE = {
  l1: '#dc2626',
  l2: '#16a34a',
  l3: '#ca8a04',
  avg: '#64748b',
} as const;

export const EQ_CH2_STROKE = {
  l1: '#1e3a8a',
  l2: '#1e40af',
  l3: '#1d4ed8',
  avg: '#1e3a8a',
} as const;

export const EQ_LINE_WIDTH = {
  l1: 1.75,
  l2: 1.5,
  l3: 1.25,
  avg: 1.75,
  metric: 1.5,
} as const;

export function buildCh1PhaseLines(
  ui: { l1: string; l2: string; l3: string },
  prefix = 'CH1',
): EqChartLineSpec[] {
  return [
    { dataKey: 'beforeL1', name: `${prefix} ${ui.l1}`, stroke: EQ_CH1_STROKE.l1, width: EQ_LINE_WIDTH.l1 },
    { dataKey: 'beforeL2', name: `${prefix} ${ui.l2}`, stroke: EQ_CH1_STROKE.l2, width: EQ_LINE_WIDTH.l2 },
    { dataKey: 'beforeL3', name: `${prefix} ${ui.l3}`, stroke: EQ_CH1_STROKE.l3, width: EQ_LINE_WIDTH.l3 },
  ];
}

export function buildCh1Ch2PhaseLines(ui: { l1: string; l2: string; l3: string }): EqChartLineSpec[] {
  return [
    { dataKey: 'afterL1', name: `CH2 ${ui.l1}`, stroke: EQ_CH2_STROKE.l1, width: EQ_LINE_WIDTH.l1 },
    { dataKey: 'afterL2', name: `CH2 ${ui.l2}`, stroke: EQ_CH2_STROKE.l2, width: EQ_LINE_WIDTH.l2 },
    { dataKey: 'afterL3', name: `CH2 ${ui.l3}`, stroke: EQ_CH2_STROKE.l3, width: EQ_LINE_WIDTH.l3 },
    ...buildCh1PhaseLines(ui),
  ];
}
