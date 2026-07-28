import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title?: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {title && <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>}
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
