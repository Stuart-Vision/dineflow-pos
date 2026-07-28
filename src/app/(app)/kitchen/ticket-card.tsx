'use client';

import { Bike, Check, ChefHat, Clock, Flame, ShoppingBag, Utensils } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ORDER_ITEM_STATUS, ORDER_STATUS } from '@/constants/enums';
import { cn } from '@/lib/utils';
import type { KitchenTicket } from '@/services/kitchen-service';

const TYPE_ICON = { dine_in: Utensils, takeaway: ShoppingBag, delivery: Bike } as const;

/** Thresholds (minutes) at which a waiting ticket escalates visually. */
const WARN_AFTER = 12;
const CRITICAL_AFTER = 20;

export function TicketCard({
  ticket,
  busy,
  onAccept,
  onStart,
  onItemReady,
  onOrderReady,
  onServe,
}: {
  ticket: KitchenTicket;
  busy: boolean;
  onAccept: () => void;
  onStart: () => void;
  onItemReady: (itemId: string) => void;
  onOrderReady: () => void;
  onServe: () => void;
}) {
  const TypeIcon = TYPE_ICON[ticket.type as keyof typeof TYPE_ICON] ?? Utensils;
  const isCritical = ticket.waitingMinutes >= CRITICAL_AFTER && ticket.status !== ORDER_STATUS.READY;
  const isWarning = !isCritical && ticket.waitingMinutes >= WARN_AFTER && ticket.status !== ORDER_STATUS.READY;

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-colors',
        isCritical ? 'border-destructive/60 ring-1 ring-destructive/30' : isWarning ? 'border-warning/60' : 'border-border',
      )}
    >
      <header
        className={cn(
          'flex items-start justify-between gap-2 border-b px-3 py-2.5',
          isCritical ? 'border-destructive/30 bg-destructive/8' : isWarning ? 'border-warning/30 bg-warning/8' : 'border-border bg-muted/40',
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <TypeIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-semibold">{ticket.orderNumber}</span>
            {ticket.priority === 'rush' && (
              <Badge variant="destructive" size="sm">
                <Flame className="size-3" />
                Rush
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {ticket.tableLabel ? `Table ${ticket.tableLabel}` : ticket.type.replace(/_/g, ' ')}
            {ticket.waiterName ? ` · ${ticket.waiterName}` : ''}
          </p>
        </div>
        <span
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
            isCritical ? 'bg-destructive text-destructive-foreground' : isWarning ? 'bg-warning text-warning-foreground' : 'text-muted-foreground',
          )}
        >
          <Clock className="size-3" />
          {ticket.waitingMinutes}m
        </span>
      </header>

      <ul className="flex-1 divide-y divide-border">
        {ticket.items.map((item) => {
          const isReady = item.status === ORDER_ITEM_STATUS.READY;
          return (
            <li key={item.id} className="flex items-start gap-2 px-3 py-2">
              <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 text-xs font-semibold tabular-nums">
                {item.quantity}×
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm leading-snug', isReady && 'text-muted-foreground line-through')}>{item.name}</p>
                {item.portionName && <p className="text-xs text-muted-foreground">{item.portionName}</p>}
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-muted-foreground">+ {item.modifiers.map((m) => m.name).join(', ')}</p>
                )}
                {item.notes && <p className="text-xs font-medium text-info">Note: {item.notes}</p>}
                <span className="mt-0.5 inline-block text-[11px] text-muted-foreground/80 capitalize">{item.kitchenStation}</span>
              </div>
              {!isReady && ticket.status !== ORDER_STATUS.SUBMITTED && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  onClick={() => onItemReady(item.id)}
                  aria-label={`Mark ${item.name} ready`}
                  title="Mark item ready"
                >
                  <Check className="size-4" />
                </Button>
              )}
              {isReady && <Check className="mt-1 size-4 shrink-0 text-success" aria-label="Ready" />}
            </li>
          );
        })}
      </ul>

      <footer className="border-t border-border p-2">
        {ticket.status === ORDER_STATUS.SUBMITTED && (
          <Button size="sm" className="w-full" loading={busy} onClick={onAccept}>
            <ChefHat className="size-4" />
            Accept ticket
          </Button>
        )}
        {ticket.status === ORDER_STATUS.KITCHEN_ACCEPTED && (
          <Button size="sm" className="w-full" loading={busy} onClick={onStart}>
            Start preparing
          </Button>
        )}
        {ticket.status === ORDER_STATUS.PREPARING && (
          <Button size="sm" variant="success" className="w-full" loading={busy} onClick={onOrderReady}>
            <Check className="size-4" />
            All items ready
          </Button>
        )}
        {ticket.status === ORDER_STATUS.READY && (
          <Button size="sm" variant="outline" className="w-full" loading={busy} onClick={onServe}>
            Mark served
          </Button>
        )}
      </footer>
    </article>
  );
}
