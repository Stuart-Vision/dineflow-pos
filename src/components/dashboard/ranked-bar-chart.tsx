'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartTooltip } from '@/components/dashboard/chart-tooltip';
import { CHART_CHROME } from '@/lib/chart-colors';

export interface RankedBarDatum {
  label: string;
  value: number;
}

/** Horizontal ranked bars for a single magnitude measure — one hue, sequential by rank. */
export function RankedBarChart({
  data,
  valueFormatter,
  height,
}: {
  data: RankedBarDatum[];
  valueFormatter: (value: number) => string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke={CHART_CHROME.grid} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tick={{ fill: CHART_CHROME.label, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltip formatter={(value) => valueFormatter(value)} />} />
        <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill="var(--primary)" fillOpacity={1 - i * 0.07} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
