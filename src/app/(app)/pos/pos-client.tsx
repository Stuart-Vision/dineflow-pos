'use client';

import { History } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { SkeletonChart } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api/client';
import { usePosCartStore } from '@/store/pos-cart-store';

import { CartPanel } from './cart-panel';
import { HeldOrdersSheet } from './held-orders-sheet';
import { ItemCustomizeDialog } from './item-customize-dialog';
import { PaymentModal } from './payment-modal';
import { ProductBrowser } from './product-browser';
import type { ApiCategory, ApiMenuItem, ApiModifierGroup, ApiOrder, ApiTable } from './types';

interface MenuResponse {
  categories: ApiCategory[];
  items: ApiMenuItem[];
  modifierGroups: ApiModifierGroup[];
  pricing: {
    taxMode: 'exclusive' | 'inclusive';
    taxRatePercent: number;
    serviceChargePercent: number;
    serviceChargeTaxable: boolean;
    cashRoundingIncrementMinor: number;
  };
}

export function PosClient() {
  const cart = usePosCartStore();
  const [menu, setMenu] = React.useState<MenuResponse | null>(null);
  const [tables, setTables] = React.useState<ApiTable[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [customizeItem, setCustomizeItem] = React.useState<ApiMenuItem | null>(null);
  const [paymentOrder, setPaymentOrder] = React.useState<ApiOrder | null>(null);
  const [showHeldOrders, setShowHeldOrders] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const [menuRes, tablesRes] = await Promise.all([
        apiGet<MenuResponse>('/api/menu'),
        apiGet<ApiTable[]>('/api/tables').catch(() => []),
      ]);
      setMenu(menuRes);
      setTables(tablesRes);
      setLoading(false);
    })();
  }, []);

  if (loading || !menu) {
    return (
      <div className="grid h-[calc(100dvh-9rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_26rem]">
        <SkeletonChart className="rounded-xl border border-border bg-card p-6" />
        <SkeletonChart className="rounded-xl border border-border bg-card p-6" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowHeldOrders(true)}>
          <History className="size-3.5" />
          Held orders
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_26rem]">
        <ProductBrowser
          categories={menu.categories}
          items={menu.items}
          onSelectItem={(item) => {
            if (item.modifierGroupIds.length > 0 || item.portionSizes.length > 0) {
              setCustomizeItem(item);
            } else {
              cart.addLine({
                menuItemId: item._id,
                name: item.name,
                imageUrl: item.imageUrl,
                portionName: null,
                unitPriceMinor: item.priceMinor,
                quantity: 1,
                modifiers: [],
                notes: null,
                discount: null,
              });
            }
          }}
        />
        <CartPanel tables={tables} pricing={menu.pricing} onOpenPayment={setPaymentOrder} />
      </div>

      {customizeItem && (
        <ItemCustomizeDialog
          item={customizeItem}
          modifierGroups={menu.modifierGroups.filter((g) => customizeItem.modifierGroupIds.includes(g._id))}
          onClose={() => setCustomizeItem(null)}
        />
      )}

      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onSettled={() => {
            setPaymentOrder(null);
            cart.reset();
          }}
        />
      )}

      {showHeldOrders && (
        <HeldOrdersSheet
          onClose={() => setShowHeldOrders(false)}
          onResume={(order) => {
            cart.loadOrder({
              id: order.id,
              orderNumber: order.orderNumber,
              type: order.type,
              tableId: order.tableId,
              tableLabel: tables.find((t) => t._id === order.tableId)?.label ?? null,
              customerId: order.customerId,
              customerLabel: null,
              delivery: null,
              notes: order.notes,
              orderDiscount: order.orderDiscount,
              lines: order.items.map((item) => ({
                key: item._id,
                menuItemId: item.menuItemId,
                name: item.name,
                imageUrl: null,
                portionName: item.portionName,
                unitPriceMinor: item.unitPriceMinor,
                quantity: item.quantity,
                modifiers: item.modifiers,
                notes: item.notes,
                discount: item.discount,
              })),
            });
            setShowHeldOrders(false);
          }}
        />
      )}
    </div>
  );
}
