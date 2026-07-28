import type { LucideIcon } from 'lucide-react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  deltaPercent?: number | null;
  /** Whether an increase in this metric is a good thing (sales) or bad (expenses). */
  deltaDirection?: 'up-is-good' | 'up-is-bad';
  tone?: 'default' | 'warning' | 'destructive';
  subtitle?: string;
}

export function StatTile({ label, value, icon: Icon, deltaPercent, deltaDirection = 'up-is-good', tone = 'default', subtitle }: StatTileProps) {
  const hasDelta = deltaPercent !== null && deltaPercent !== undefined;
  const isPositive = hasDelta && deltaPercent > 0;
  const isNegative = hasDelta && deltaPercent < 0;
  const isGood = isPositive ? deltaDirection === 'up-is-good' : isNegative ? deltaDirection === 'up-is-bad' : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            tone === 'destructive' && 'bg-destructive/10 text-destructive',
            tone === 'warning' && 'bg-warning/12 text-warning',
            tone === 'default' && 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-4.5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <div className="mt-1.5 flex items-center gap-1 text-xs">
        {hasDelta ? (
          <>
            {isPositive && <TrendingUp className={cn('size-3.5', isGood ? 'text-success' : 'text-destructive')} />}
            {isNegative && <TrendingDown className={cn('size-3.5', isGood ? 'text-success' : 'text-destructive')} />}
            {!isPositive && !isNegative && <Minus className="size-3.5 text-muted-foreground" />}
            <span className={cn('font-medium', hasDelta && (isGood ? 'text-success' : isPositive || isNegative ? 'text-destructive' : 'text-muted-foreground'))}>
              {deltaPercent > 0 ? '+' : ''}
              {deltaPercent}%
            </span>
            <span className="text-muted-foreground">vs yesterday</span>
          </>
        ) : (
          subtitle && <span className="text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
