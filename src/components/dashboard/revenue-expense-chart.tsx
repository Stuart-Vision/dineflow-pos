'use client';

import { format, parseISO } from 'date-fns';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartTooltip } from '@/components/dashboard/chart-tooltip';
import { CHART_CHROME, CHART_SERIES } from '@/lib/chart-colors';
import { formatMoneyCompact } from '@/lib/money';

export interface RevenueExpensePoint {
  date: string;
  revenueMinor: number;
  expenseMinor: number;
}

export function RevenueExpenseChart({ data, currency }: { data: RevenueExpensePoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_CHROME.grid} />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => format(parseISO(value), 'MMM d')}
          tick={{ fill: CHART_CHROME.label, fontSize: 11 }}
          axisLine={{ stroke: CHART_CHROME.axis }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={(value: number) => formatMoneyCompact(value, currency)}
          tick={{ fill: CHART_CHROME.label, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={(label) => format(parseISO(String(label)), 'EEE, MMM d')}
              formatter={(value) => formatMoneyCompact(value, currency)}
            />
          }
        />
        <Legend
          verticalAlign="top"
          height={32}
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
        <Line type="monotone" dataKey="revenueMinor" name="Revenue" stroke={CHART_SERIES[0]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }} />
        <Line type="monotone" dataKey="expenseMinor" name="Expenses" stroke={CHART_SERIES[1]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
