'use client';

import {
  AlertTriangle,
  ChefHat,
  CircleUserRound,
  Loader2,
  Minus,
  PauseCircle,
  Percent,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioCard, RadioGroup } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSessionUser } from '@/components/providers/session-provider';
import { ORDER_TYPE, type OrderType } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ApiRequestError, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { calculateOrderTotals } from '@/lib/pricing/order-totals';
import { formatMoney } from '@/lib/money';
import { usePosCartStore } from '@/store/pos-cart-store';

import type { ApiCustomer, ApiOrder, ApiTable } from './types';

interface PricingConfig {
  taxMode: 'exclusive' | 'inclusive';
  taxRatePercent: number;
  serviceChargePercent: number;
  serviceChargeTaxable: boolean;
  cashRoundingIncrementMinor: number;
}

const ORDER_TYPE_OPTIONS: { value: OrderType; label: string }[] = [
  { value: ORDER_TYPE.DINE_IN, label: 'Dine-in' },
  { value: ORDER_TYPE.TAKEAWAY, label: 'Takeaway' },
  { value: ORDER_TYPE.DELIVERY, label: 'Delivery' },
];

export function CartPanel({
  tables,
  pricing,
  onOpenPayment,
}: {
  tables: ApiTable[];
  pricing: PricingConfig;
  onOpenPayment: (order: ApiOrder) => void;
}) {
  const user = useSessionUser();
  const cart = usePosCartStore();
  const [busy, setBusy] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [customerQuery, setCustomerQuery] = React.useState('');
  const [customerResults, setCustomerResults] = React.useState<ApiCustomer[]>([]);
  const [customerPopoverOpen, setCustomerPopoverOpen] = React.useState(false);
  const [discountOpen, setDiscountOpen] = React.useState(false);
  const [discountValue, setDiscountValue] = React.useState('10');

  const canDiscount = user.permissions.includes(PERMISSIONS.POS_APPLY_DISCOUNT);

  const totals = calculateOrderTotals(
    cart.lines.map((line, i) => ({
      id: String(i),
      unitPriceMinor: line.unitPriceMinor,
      quantity: line.quantity,
      modifiers: line.modifiers,
      discount: line.discount,
      taxRatePercent: pricing.taxRatePercent,
    })),
    {
      taxMode: pricing.taxMode,
      serviceChargePercent: cart.orderType === ORDER_TYPE.DINE_IN ? pricing.serviceChargePercent : 0,
      serviceChargeTaxable: pricing.serviceChargeTaxable,
      serviceChargeTaxRatePercent: pricing.taxRatePercent,
      orderDiscount: cart.orderDiscount,
      deliveryFeeMinor: cart.orderType === ORDER_TYPE.DELIVERY ? 350 : 0,
      cashRoundingIncrementMinor: pricing.cashRoundingIncrementMinor,
    },
  );

  React.useEffect(() => {
    if (!customerPopoverOpen) return;
    const handle = setTimeout(async () => {
      const result = await apiGet<ApiCustomer[]>(`/api/customers?search=${encodeURIComponent(customerQuery)}&pageSize=8`).catch(() => []);
      setCustomerResults(result);
    }, 250);
    return () => clearTimeout(handle);
  }, [customerQuery, customerPopoverOpen]);

  function buildCartPayload() {
    return cart.lines.map((line) => ({
      menuItemId: line.menuItemId,
      portionName: line.portionName,
      quantity: line.quantity,
      modifiers: line.modifiers,
      notes: line.notes,
      discount: line.discount,
    }));
  }

  async function ensureOrderExists(submit: boolean): Promise<ApiOrder> {
    if (cart.orderId) {
      await apiPatch(`/api/orders/${cart.orderId}/items`, {
        items: buildCartPayload(),
        orderDiscount: cart.orderDiscount,
        notes: cart.notes,
        tableId: cart.tableId,
        customerId: cart.customerId,
      });
      if (submit) {
        const { order } = await apiPost<{ order: ApiOrder; warnings: unknown[] }>(`/api/orders/${cart.orderId}/submit`);
        return order;
      }
      return await apiGet<ApiOrder>(`/api/orders/${cart.orderId}`);
    }

    return apiPost<ApiOrder>('/api/orders', {
      type: cart.orderType,
      tableId: cart.tableId,
      customerId: cart.customerId,
      items: buildCartPayload(),
      orderDiscount: cart.orderDiscount,
      notes: cart.notes,
      delivery: cart.orderType === ORDER_TYPE.DELIVERY ? cart.delivery : undefined,
      submit,
    });
  }

  async function handleHold() {
    if (cart.lines.length === 0) return;
    setBusy(true);
    try {
      const order = cart.orderId ? await ensureOrderExists(false) : await apiPost<ApiOrder>('/api/orders', {
        type: cart.orderType,
        tableId: cart.tableId,
        customerId: cart.customerId,
        items: buildCartPayload(),
        orderDiscount: cart.orderDiscount,
        notes: cart.notes,
        delivery: cart.orderType === ORDER_TYPE.DELIVERY ? cart.delivery : undefined,
        submit: false,
      });
      await apiPost(`/api/orders/${order.id}/hold`, {});
      toast.success(`Order ${order.orderNumber} held`, { description: 'Resume it any time from Held Orders.' });
      cart.reset();
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not hold this order.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSendToKitchen() {
    if (cart.lines.length === 0) return;
    setBusy(true);
    try {
      const order = await ensureOrderExists(true);
      toast.success(`Order ${order.orderNumber} sent to the kitchen`);
      cart.reset();
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not send this order to the kitchen.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    if (cart.lines.length === 0) return;
    setBusy(true);
    try {
      const order = await ensureOrderExists(true);
      onOpenPayment(order);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not start payment for this order.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
      <div className="space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold">
            {cart.orderNumber ? `Editing ${cart.orderNumber}` : 'New order'}
          </h2>
          {cart.orderId && (
            <Button variant="ghost" size="sm" onClick={() => cart.reset()}>
              <X className="size-3.5" />
              Discard
            </Button>
          )}
        </div>

        <RadioGroup
          value={cart.orderType}
          onValueChange={(v) => cart.setOrderType(v as OrderType)}
          className="grid grid-cols-3 gap-2"
        >
          {ORDER_TYPE_OPTIONS.map((opt) => (
            <RadioCard key={opt.value} value={opt.value} label={opt.label} />
          ))}
        </RadioGroup>

        <div className="grid grid-cols-2 gap-2">
          {cart.orderType === ORDER_TYPE.DINE_IN && (
            <Select value={cart.tableId ?? undefined} onValueChange={(id) => cart.setTable(id, tables.find((t) => t._id === id)?.label ?? null)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                {tables
                  .filter((t) => t.status === 'available' || t._id === cart.tableId)
                  .map((table) => (
                    <SelectItem key={table._id} value={table._id}>
                      {table.label} · seats {table.capacity}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cart.orderType === ORDER_TYPE.DINE_IN ? '' : 'col-span-2'}>
                <CircleUserRound className="size-3.5" />
                <span className="truncate">{cart.customerLabel ?? 'Walk-in customer'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <div className="space-y-2">
                <Input
                  autoFocus
                  startIcon={<Search className="size-4" />}
                  placeholder="Search name or phone…"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
                <button
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    cart.setCustomer(null, null);
                    setCustomerPopoverOpen(false);
                  }}
                >
                  <UserPlus className="size-4 text-muted-foreground" />
                  Walk-in customer
                </button>
                <ScrollArea className="max-h-48">
                  {customerResults.map((customer) => (
                    <button
                      key={customer._id}
                      className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left hover:bg-muted"
                      onClick={() => {
                        cart.setCustomer(customer._id, customer.name);
                        setCustomerPopoverOpen(false);
                      }}
                    >
                      <span className="text-sm font-medium">{customer.name}</span>
                      <span className="text-xs text-muted-foreground">{customer.phone}</span>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {cart.lines.length === 0 ? (
          <EmptyState icon={ChefHat} title="No items yet" description="Tap a menu item to add it to this order." />
        ) : (
          <ul className="divide-y divide-border">
            {cart.lines.map((line) => (
              <li key={line.key} className="flex gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.name}</p>
                  {line.portionName && <p className="text-xs text-muted-foreground">{line.portionName}</p>}
                  {line.modifiers.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">{line.modifiers.map((m) => m.name).join(', ')}</p>
                  )}
                  {line.notes && <p className="truncate text-xs text-info">Note: {line.notes}</p>}
                  <div className="mt-1.5 flex items-center gap-2">
                    <Button variant="outline" size="icon-sm" onClick={() => cart.updateQuantity(line.key, line.quantity - 1)}>
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-5 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
                    <Button variant="outline" size="icon-sm" onClick={() => cart.updateQuantity(line.key, line.quantity + 1)}>
                      <Plus className="size-3" />
                    </Button>
                    <button
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => cart.removeLine(line.key)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatMoney((line.unitPriceMinor + line.modifiers.reduce((s, m) => s + m.priceMinor, 0)) * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="space-y-2 border-t border-border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatMoney(totals.subtotalMinor)}</span>
        </div>
        {totals.discountTotalMinor > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="tabular-nums text-destructive">-{formatMoney(totals.discountTotalMinor)}</span>
          </div>
        )}
        {totals.serviceChargeMinor > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Service charge</span>
            <span className="tabular-nums">{formatMoney(totals.serviceChargeMinor)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span className="tabular-nums">{formatMoney(totals.taxMinor)}</span>
        </div>
        {totals.deliveryFeeMinor > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery fee</span>
            <span className="tabular-nums">{formatMoney(totals.deliveryFeeMinor)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(totals.grandTotalMinor)}</span>
        </div>

        {canDiscount && (
          <Popover open={discountOpen} onOpenChange={setDiscountOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                <Percent className="size-3.5" />
                {cart.orderDiscount ? `${cart.orderDiscount.value}% order discount applied` : 'Apply order discount'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 space-y-2">
              <Input type="number" min={0} max={100} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    cart.setOrderDiscount({ type: 'percentage', value: Number(discountValue), reason: 'Manager discount' });
                    setDiscountOpen(false);
                  }}
                >
                  Apply
                </Button>
                {cart.orderDiscount && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      cart.setOrderDiscount(null);
                      setDiscountOpen(false);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" onClick={handleHold} disabled={busy || cart.lines.length === 0}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <PauseCircle className="size-4" />}
            Hold
          </Button>
          <Button variant="outline" onClick={() => setConfirmClear(true)} disabled={cart.lines.length === 0}>
            <Trash2 className="size-4" />
            Clear
          </Button>
          <Button variant="secondary" onClick={handleSendToKitchen} disabled={busy || cart.lines.length === 0}>
            <ChefHat className="size-4" />
            Send to kitchen
          </Button>
          <Button onClick={handlePay} disabled={busy || cart.lines.length === 0}>
            <Wallet className="size-4" />
            Charge {formatMoney(totals.grandTotalMinor)}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning" />
              Clear this order?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes every item from the current order. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                cart.reset();
                setConfirmClear(false);
              }}
            >
              Clear order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
