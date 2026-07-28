'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartTooltip } from '@/components/dashboard/chart-tooltip';
import { CHART_CHROME } from '@/lib/chart-colors';

export interface PeakHourPoint {
  hour: number;
  orders: number;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}${period}`;
}

export function PeakHoursChart({ data }: { data: PeakHourPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={4}>
        <CartesianGrid vertical={false} stroke={CHART_CHROME.grid} />
        <XAxis
          dataKey="hour"
          tickFormatter={formatHour}
          tick={{ fill: CHART_CHROME.label, fontSize: 11 }}
          axisLine={{ stroke: CHART_CHROME.axis }}
          tickLine={false}
          interval={1}
        />
        <YAxis tick={{ fill: CHART_CHROME.label, fontSize: 11 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'var(--muted)' }}
          content={<ChartTooltip labelFormatter={(label) => formatHour(Number(label))} formatter={(value) => `${value} order${value === 1 ? '' : 's'}`} />}
        />
        <Bar dataKey="orders" name="Orders" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
