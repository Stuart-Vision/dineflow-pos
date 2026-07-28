'use client';

import { Banknote, Building2, CheckCircle2, CreditCard, Smartphone } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioCard, RadioGroup } from '@/components/ui/radio-group';
import { ORDER_STATUS, PAYMENT_METHOD, type PaymentMethod } from '@/constants/enums';
import { ApiRequestError, apiPost } from '@/lib/api/client';
import { formatMoney, parseMoneyInput, toMinor } from '@/lib/money';

import { ReceiptView } from './receipt-view';
import type { ApiOrder } from './types';

const METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: PAYMENT_METHOD.CASH, label: 'Cash', icon: Banknote },
  { value: PAYMENT_METHOD.CARD, label: 'Card', icon: CreditCard },
  { value: PAYMENT_METHOD.DIGITAL_WALLET, label: 'Digital wallet', icon: Smartphone },
  { value: PAYMENT_METHOD.BANK_TRANSFER, label: 'Bank transfer', icon: Building2 },
];

export function PaymentModal({
  order: initialOrder,
  onClose,
  onSettled,
}: {
  order: ApiOrder;
  onClose: () => void;
  onSettled: () => void;
}) {
  const [order, setOrder] = React.useState(initialOrder);
  const [method, setMethod] = React.useState<PaymentMethod>(PAYMENT_METHOD.CASH);
  const [tenderedInput, setTenderedInput] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastChangeMinor, setLastChangeMinor] = React.useState<number | null>(null);

  const balanceDueMinor = Math.max(0, order.grandTotalMinor - order.paidMinor - order.refundedMinor);
  const isSettled = balanceDueMinor <= 0;
  const tenderedMinor = parseMoneyInput(tenderedInput) ?? balanceDueMinor;

  async function handleCharge() {
    setProcessing(true);
    setError(null);
    try {
      const isCash = method === PAYMENT_METHOD.CASH;
      const amountMinor = isCash ? Math.min(tenderedMinor, balanceDueMinor) : balanceDueMinor;
      const result = await apiPost<{ order: ApiOrder; changeDueMinor: number }>(`/api/orders/${order.id}/payments`, {
        method,
        amountMinor,
        tenderedMinor: isCash ? tenderedMinor : undefined,
      });
      setOrder(result.order);
      setLastChangeMinor(result.changeDueMinor);
      setTenderedInput('');
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  const quickAmounts = [balanceDueMinor, balanceDueMinor + toMinor(5), balanceDueMinor + toMinor(10), balanceDueMinor + toMinor(20)];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size={order.status === ORDER_STATUS.COMPLETED ? 'lg' : 'default'}>
        <DialogHeader>
          <DialogTitle>{order.status === ORDER_STATUS.COMPLETED ? 'Payment complete' : `Charge ${order.orderNumber}`}</DialogTitle>
        </DialogHeader>

        {order.status === ORDER_STATUS.COMPLETED ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 rounded-lg bg-success/10 py-6 text-success">
              <CheckCircle2 className="size-10" />
              <p className="text-lg font-semibold">{formatMoney(order.grandTotalMinor)} settled</p>
              {lastChangeMinor !== null && lastChangeMinor > 0 && (
                <p className="text-sm">Change due: {formatMoney(lastChangeMinor)}</p>
              )}
            </div>
            <ReceiptView order={order} />
            <Button className="w-full" onClick={onSettled}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Balance due</p>
              <p className="font-display text-3xl font-semibold">{formatMoney(balanceDueMinor)}</p>
              {order.paidMinor > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">{formatMoney(order.paidMinor)} already paid (split payment)</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METHODS.map((m) => (
                <RadioCard key={m.value} value={m.value} label={m.label} icon={<m.icon />} />
              ))}
            </RadioGroup>

            {method === PAYMENT_METHOD.CASH && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount tendered</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={formatMoney(balanceDueMinor, undefined, { showSymbol: false })}
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                />
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amount, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTenderedInput(String(amount / 100))}
                    >
                      {formatMoney(amount)}
                    </Button>
                  ))}
                </div>
                {tenderedMinor > balanceDueMinor && (
                  <p className="text-sm text-muted-foreground">Change due: {formatMoney(tenderedMinor - balanceDueMinor)}</p>
                )}
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleCharge} loading={processing} disabled={isSettled}>
              Confirm {formatMoney(method === PAYMENT_METHOD.CASH ? Math.min(tenderedMinor, balanceDueMinor) : balanceDueMinor)} payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
