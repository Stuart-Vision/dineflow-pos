import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** `inline` sits inside a card; `page` fills a route body. */
  size?: 'inline' | 'page';
}

/**
 * Every list, table and board renders this instead of a blank area, so an
 * empty result always explains itself and offers the next action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'inline',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'page' ? 'min-h-[26rem] px-6 py-16' : 'px-6 py-12',
        className,
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-6.5" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-balance text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
