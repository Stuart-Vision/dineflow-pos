'use client';

import { ChefHat, RadioTower, WifiOff } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonChart } from '@/components/ui/skeleton';
import { KITCHEN_STATION_VALUES, ORDER_STATUS } from '@/constants/enums';
import { ApiRequestError, apiPost } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { KitchenBoard, KitchenTicket } from '@/services/kitchen-service';

import { TicketCard } from './ticket-card';

const COLUMNS = [
  { status: ORDER_STATUS.SUBMITTED, label: 'New', tone: 'bg-info' },
  { status: ORDER_STATUS.KITCHEN_ACCEPTED, label: 'Accepted', tone: 'bg-chart-4' },
  { status: ORDER_STATUS.PREPARING, label: 'Preparing', tone: 'bg-warning' },
  { status: ORDER_STATUS.READY, label: 'Ready', tone: 'bg-success' },
] as const;

const SORT_OPTIONS = [
  { value: 'waiting', label: 'Longest waiting' },
  { value: 'newest', label: 'Newest first' },
] as const;

export function KitchenClient() {
  const [board, setBoard] = React.useState<KitchenBoard | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [station, setStation] = React.useState('all');
  const [sortBy, setSortBy] = React.useState<'waiting' | 'newest'>('waiting');
  const [busyTicketId, setBusyTicketId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const source = new EventSource('/api/kitchen/stream');

    source.addEventListener('open', () => setConnected(true));
    source.addEventListener('board', (event) => {
      setConnected(true);
      setBoard(JSON.parse((event as MessageEvent).data) as KitchenBoard);
    });
    source.addEventListener('error', () => setConnected(false));

    return () => source.close();
  }, []);

  async function act(ticketId: string, path: string) {
    setBusyTicketId(ticketId);
    try {
      await apiPost(path);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'That kitchen action failed.');
    } finally {
      setBusyTicketId(null);
    }
  }

  if (!board) {
    return (
      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((c) => (
          <SkeletonChart key={c.status} className="rounded-xl border border-border bg-card p-4" />
        ))}
      </div>
    );
  }

  const visible = board.tickets.filter((ticket) =>
    station === 'all' ? true : ticket.items.some((item) => item.kitchenStation === station),
  );

  function ticketsFor(status: string): KitchenTicket[] {
    const list = visible.filter((t) => t.status === status);
    return sortBy === 'waiting'
      ? [...list].sort((a, b) => b.waitingMinutes - a.waitingMinutes)
      : [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'success' : 'destructive'} size="sm">
            {connected ? <RadioTower className="size-3" /> : <WifiOff className="size-3" />}
            {connected ? 'Live' : 'Reconnecting…'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {visible.length} open ticket{visible.length === 1 ? '' : 's'} · {board.servedToday} completed today
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select value={station} onValueChange={setStation}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="All stations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stations</SelectItem>
              {KITCHEN_STATION_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="capitalize">{s}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'waiting' | 'newest')}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={ChefHat}
            size="page"
            title="The kitchen is clear"
            description="New tickets appear here the moment a cashier sends an order through."
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const tickets = ticketsFor(column.status);
            return (
              <section key={column.status} className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={cn('size-2 rounded-full', column.tone)} aria-hidden="true" />
                  <h2 className="text-sm font-semibold">{column.label}</h2>
                  <Badge variant="muted" size="sm">
                    {tickets.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      busy={busyTicketId === ticket.id}
                      onAccept={() => act(ticket.id, `/api/orders/${ticket.id}/kitchen/accept`)}
                      onStart={() => act(ticket.id, `/api/orders/${ticket.id}/kitchen/start`)}
                      onItemReady={(itemId) => act(ticket.id, `/api/orders/${ticket.id}/items/${itemId}/ready`)}
                      onOrderReady={() => act(ticket.id, `/api/orders/${ticket.id}/kitchen/ready`)}
                      onServe={() => act(ticket.id, `/api/orders/${ticket.id}/kitchen/serve`)}
                    />
                  ))}
                  {tickets.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Nothing here
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
