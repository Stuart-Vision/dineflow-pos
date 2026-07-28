import { CHART_SERIES } from '@/lib/chart-colors';
import { cn } from '@/lib/utils';

export interface BreakdownSegment {
  label: string;
  value: number;
}

/**
 * A single horizontal stacked bar for a part-to-whole breakdown of ≤4
 * categories (payment methods, order types). Direct labels are mandatory
 * at this series count, so each segment's share is always printed —
 * never left to color alone.
 */
export function StackedBreakdownBar({ segments, formatter }: { segments: BreakdownSegment[]; formatter: (value: number) => string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No activity in this period yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((segment, i) => {
          const pct = (segment.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={segment.label}
              className={cn('h-full first:rounded-l-full last:rounded-r-full', i > 0 && 'ml-0.5')}
              style={{ width: `${pct}%`, backgroundColor: CHART_SERIES[i % CHART_SERIES.length] }}
              title={`${segment.label}: ${formatter(segment.value)}`}
            />
          );
        })}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {segments.map((segment, i) => (
          <li key={segment.label} className="flex items-center gap-1.5 text-xs">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_SERIES[i % CHART_SERIES.length] }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{segment.label}</span>
            <span className="font-medium tabular-nums text-foreground">{formatter(segment.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
