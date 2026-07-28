'use client';

import { format, parseISO } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartTooltip } from '@/components/dashboard/chart-tooltip';
import { CHART_CHROME } from '@/lib/chart-colors';
import { formatMoneyCompact } from '@/lib/money';

export interface SalesTrendPoint {
  date: string;
  revenueMinor: number;
  orders: number;
}

export function SalesTrendChart({ data, currency }: { data: SalesTrendPoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey="revenueMinor"
          name="Revenue"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#salesTrendFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
