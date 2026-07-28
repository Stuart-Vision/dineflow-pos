'use client';

import { format, parseISO } from 'date-fns';
import { Download, Printer } from 'lucide-react';
import * as React from 'react';
import QRCode from 'react-qr-code';

import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';

import type { ApiOrder } from './types';

interface ReceiptPayment {
  method: string;
  amountMinor: number;
  tenderedMinor: number;
  changeMinor: number;
  createdAt: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  digital_wallet: 'Digital wallet',
  bank_transfer: 'Bank transfer',
  store_credit: 'Store credit',
  loyalty_points: 'Loyalty points',
};

const ORDER_TYPE_LABELS: Record<string, string> = { dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };

async function downloadReceiptPdf(order: ApiOrder, payments: ReceiptPayment[]): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
  await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'pt', format: [227, 500 + order.items.length * 20] });
  let y = 24;
  doc.setFontSize(13);
  doc.text('DineFlow POS', 113.5, y, { align: 'center' });
  y += 16;
  doc.setFontSize(9);
  doc.text(`Order ${order.orderNumber}`, 113.5, y, { align: 'center' });
  y += 12;
  doc.text(format(parseISO(order.createdAt), 'MMM d, yyyy HH:mm'), 113.5, y, { align: 'center' });
  y += 16;

  const rows = order.items.map((item) => [
    `${item.quantity}x ${item.name}${item.portionName ? ` (${item.portionName})` : ''}`,
    formatMoney(item.unitPriceMinor * item.quantity),
  ]);

  const autoTable = (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable;
  autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    head: [],
    body: rows,
    columnStyles: { 1: { halign: 'right' } },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text(`Subtotal: ${formatMoney(order.subtotalMinor)}`, 213, finalY, { align: 'right' });
  doc.text(`Tax: ${formatMoney(order.taxMinor)}`, 213, finalY + 12, { align: 'right' });
  doc.setFontSize(11);
  doc.text(`Total: ${formatMoney(order.grandTotalMinor)}`, 213, finalY + 28, { align: 'right' });

  let py = finalY + 46;
  doc.setFontSize(8);
  for (const payment of payments) {
    doc.text(`${PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}: ${formatMoney(payment.amountMinor)}`, 213, py, { align: 'right' });
    py += 11;
  }

  doc.setFontSize(9);
  doc.text('Thank you for dining with us!', 113.5, py + 14, { align: 'center' });

  doc.save(`${order.orderNumber}.pdf`);
}

export function ReceiptView({ order }: { order: ApiOrder }) {
  const [payments, setPayments] = React.useState<ReceiptPayment[]>([]);

  React.useEffect(() => {
    void apiGet<ReceiptPayment[]>(`/api/orders/${order.id}/payments`).then(setPayments).catch(() => setPayments([]));
  }, [order.id]);

  return (
    <div className="space-y-3">
      <div
        id={`receipt-${order.id}`}
        className="mx-auto max-w-xs rounded-lg border border-dashed border-border bg-card p-5 font-mono text-xs text-foreground print:border-none"
      >
        <div className="text-center">
          <p className="font-display text-sm font-semibold">DineFlow POS</p>
          <p className="text-muted-foreground">123 Market Street</p>
          <p className="text-muted-foreground">Tax Reg. No. DF-000-1234</p>
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <div className="flex justify-between">
          <span>Order</span>
          <span>{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Type</span>
          <span>{ORDER_TYPE_LABELS[order.type] ?? order.type}</span>
        </div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{format(parseISO(order.createdAt), 'MMM d, yyyy HH:mm')}</span>
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <div className="space-y-1.5">
          {order.items.map((item) => (
            <div key={item._id} className="flex justify-between gap-2">
              <span className="min-w-0 flex-1">
                {item.quantity}x {item.name}
                {item.portionName ? ` (${item.portionName})` : ''}
              </span>
              <span className="shrink-0 tabular-nums">{formatMoney(item.unitPriceMinor * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMoney(order.subtotalMinor)}</span>
          </div>
          {order.discountTotalMinor > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="tabular-nums">-{formatMoney(order.discountTotalMinor)}</span>
            </div>
          )}
          {order.serviceChargeMinor > 0 && (
            <div className="flex justify-between">
              <span>Service charge</span>
              <span className="tabular-nums">{formatMoney(order.serviceChargeMinor)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span className="tabular-nums">{formatMoney(order.taxMinor)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(order.grandTotalMinor)}</span>
          </div>
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <div className="space-y-1">
          {payments.map((payment, i) => (
            <div key={i} className="flex justify-between">
              <span>{PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</span>
              <span className="tabular-nums">{formatMoney(payment.amountMinor)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}/orders/${order.id}`} size={72} />
          <p className="text-center text-muted-foreground">Thank you for dining with us!</p>
        </div>
      </div>

      <div className="flex gap-2 print:hidden">
        <Button variant="outline" className="flex-1" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => downloadReceiptPdf(order, payments)}>
          <Download className="size-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
