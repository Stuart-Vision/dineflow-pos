'use client';

import { format, parseISO } from 'date-fns';
import { PauseCircle } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SkeletonTable } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';

import type { ApiOrder } from './types';

export function HeldOrdersSheet({ onClose, onResume }: { onClose: () => void; onResume: (order: ApiOrder) => void }) {
  const [orders, setOrders] = React.useState<ApiOrder[] | null>(null);

  React.useEffect(() => {
    void apiGet<ApiOrder[]>('/api/orders?status=held&pageSize=50').then(setOrders);
  }, []);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Held orders</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-slim">
          {!orders ? (
            <SkeletonTable rows={4} columns={2} />
          ) : orders.length === 0 ? (
            <EmptyState icon={PauseCircle} title="No held orders" description="Orders you put on hold will show up here." />
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => (
                <li key={order.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="text-sm font-semibold">{formatMoney(order.grandTotalMinor)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {order.items.length} item{order.items.length === 1 ? '' : 's'} · {format(parseISO(order.createdAt), 'MMM d, HH:mm')}
                  </p>
                  <Button size="sm" className="mt-2 w-full" onClick={() => onResume(order)}>
                    Resume order
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
