import * as React from 'react';

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton rounded-md', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Placeholder matching the KPI tile footprint used across the dashboard. */
function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-7 w-32" />
      <Skeleton className="mt-2.5 h-3 w-20" />
    </div>
  );
}

function SkeletonTable({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b border-border px-4 py-3.5 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn('h-4 flex-1', colIndex === 0 && 'max-w-40')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ className }: { className?: string }) {
  // Bars of varying height read as "a chart is loading" rather than "a box".
  const heights = [52, 74, 41, 88, 63, 79, 46, 92, 58, 70, 49, 84];
  return (
    <div className={cn('flex h-56 items-end gap-2 px-1', className)} aria-hidden="true">
      {heights.map((height, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonStatCard, SkeletonTable, SkeletonChart };
