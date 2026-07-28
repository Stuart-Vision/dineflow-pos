import { cn } from '@/lib/utils';

export interface ChartTooltipPayloadEntry {
  name: string;
  value: number;
  color?: string;
}

interface RechartsTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string | number }>;
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string | number) => string;
}

/** Custom tooltip content matching the app surface — Recharts' default is an unstyled white box. */
export function ChartTooltip({ active, label, payload, formatter, labelFormatter }: RechartsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-overlay">
      {label !== undefined && (
        <p className="mb-1.5 font-medium text-foreground">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className={cn('size-2 rounded-full')} style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {formatter ? formatter(Number(entry.value), String(entry.name)) : String(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
