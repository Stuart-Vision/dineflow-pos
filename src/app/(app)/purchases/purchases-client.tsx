'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, PackageCheck, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { useSessionUser } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { PURCHASE_ORDER_STATUS, type PurchaseOrderStatus } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ApiRequestError, apiGet, apiPost } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';
import type { IngredientRow } from '@/services/inventory-service';
import type { PurchaseOrderRow, SupplierRow } from '@/services/purchasing-service';

const STATUS_BADGE: Record<PurchaseOrderStatus, 'success' | 'warning' | 'destructive' | 'info' | 'muted'> = {
  draft: 'muted',
  pending_approval: 'warning',
  approved: 'info',
  ordered: 'info',
  partially_received: 'warning',
  received: 'success',
  cancelled: 'destructive',
};

interface DraftLine {
  ingredientId: string;
  quantityOrdered: string;
  unitCost: string;
}

export function PurchasesClient() {
  const user = useSessionUser();
  const canManage = user.permissions.includes(PERMISSIONS.PURCHASE_MANAGE);
  const canApprove = user.permissions.includes(PERMISSIONS.PURCHASE_APPROVE);
  const canReceive = user.permissions.includes(PERMISSIONS.PURCHASE_RECEIVE);

  const [orders, setOrders] = React.useState<PurchaseOrderRow[] | null>(null);
  const [suppliers, setSuppliers] = React.useState<SupplierRow[]>([]);
  const [ingredients, setIngredients] = React.useState<IngredientRow[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [receiveTarget, setReceiveTarget] = React.useState<PurchaseOrderRow | null>(null);
  const [receiveQuantities, setReceiveQuantities] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({ supplierId: '', expectedDeliveryDate: '', notes: '' });
  const [lines, setLines] = React.useState<DraftLine[]>([{ ingredientId: '', quantityOrdered: '', unitCost: '' }]);

  const load = React.useCallback(async () => {
    const [ordersRes, suppliersRes, inventoryRes] = await Promise.all([
      apiGet<PurchaseOrderRow[]>('/api/purchase-orders'),
      apiGet<SupplierRow[]>('/api/suppliers').catch(() => []),
      apiGet<{ ingredients: IngredientRow[] }>('/api/inventory').catch(() => ({ ingredients: [] })),
    ]);
    setOrders(ordersRes);
    setSuppliers(suppliersRes);
    setIngredients(inventoryRes.ingredients);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function approve(order: PurchaseOrderRow) {
    setBusyId(order.id);
    try {
      await apiPost(`/api/purchase-orders/${order.id}/approve`);
      await load();
      toast.success(`${order.poNumber} approved`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not approve that order.');
    } finally {
      setBusyId(null);
    }
  }

  function openReceive(order: PurchaseOrderRow) {
    setReceiveTarget(order);
    // Default each line to its full outstanding quantity — the common case.
    setReceiveQuantities(
      Object.fromEntries(
        order.items.map((item) => [item.ingredientId, String(Math.max(0, item.quantityOrdered - item.quantityReceived))]),
      ),
    );
  }

  async function submitReceive() {
    if (!receiveTarget) return;
    setSaving(true);
    try {
      const result = await apiPost<{ stockedLines: { ingredientName: string; quantityBase: number; unit: string }[] }>(
        `/api/purchase-orders/${receiveTarget.id}/receive`,
        {
          items: receiveTarget.items.map((item) => ({
            ingredientId: item.ingredientId,
            quantityReceived: Number(receiveQuantities[item.ingredientId] ?? 0),
          })),
        },
      );
      setReceiveTarget(null);
      await load();
      toast.success(`${result.stockedLines.length} line(s) stocked in`, {
        description: result.stockedLines
          .slice(0, 3)
          .map((l) => `${l.ingredientName} +${l.quantityBase} ${l.unit}`)
          .join(', '),
      });
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not receive that delivery.');
    } finally {
      setSaving(false);
    }
  }

  async function createOrder() {
    setSaving(true);
    try {
      const validLines = lines.filter((l) => l.ingredientId && Number(l.quantityOrdered) > 0);
      await apiPost('/api/purchase-orders', {
        supplierId: form.supplierId,
        expectedDeliveryDate: form.expectedDeliveryDate ? new Date(form.expectedDeliveryDate).toISOString() : null,
        notes: form.notes || undefined,
        items: validLines.map((line) => {
          const ingredient = ingredients.find((i) => i.id === line.ingredientId);
          return {
            ingredientId: line.ingredientId,
            quantityOrdered: Number(line.quantityOrdered),
            unit: ingredient?.purchaseUnit ?? 'pc',
            unitCostMinor: Math.round(Number(line.unitCost || 0) * 100),
          };
        }),
      });
      setCreateOpen(false);
      setForm({ supplierId: '', expectedDeliveryDate: '', notes: '' });
      setLines([{ ingredientId: '', quantityOrdered: '', unitCost: '' }]);
      await load();
      toast.success('Purchase order raised for approval');
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not create that purchase order.');
    } finally {
      setSaving(false);
    }
  }

  const columns = React.useMemo<ColumnDef<PurchaseOrderRow, unknown>[]>(
    () => [
      {
        id: 'poNumber',
        header: 'PO',
        accessorFn: (row) => row.poNumber,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">{row.original.poNumber}</p>
            <p className="text-xs text-muted-foreground">{format(parseISO(row.original.createdAt), 'MMM d, yyyy')}</p>
          </div>
        ),
      },
      { id: 'supplierName', header: 'Supplier', accessorFn: (row) => row.supplierName },
      {
        id: 'items',
        header: 'Lines',
        accessorFn: (row) => row.itemCount,
        meta: { numeric: true },
      },
      {
        id: 'progress',
        header: 'Received',
        enableSorting: false,
        cell: ({ row }) => {
          const ordered = row.original.items.reduce((s, i) => s + i.quantityOrdered, 0);
          const received = row.original.items.reduce((s, i) => s + i.quantityReceived, 0);
          const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
          return (
            <div className="min-w-24">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">{pct}%</p>
            </div>
          );
        },
      },
      {
        id: 'total',
        header: 'Value',
        accessorFn: (row) => row.totalMinor,
        cell: ({ getValue }) => formatMoney(getValue<number>()),
        meta: { numeric: true },
      },
      {
        id: 'expected',
        header: 'Expected',
        accessorFn: (row) => row.expectedDeliveryDate ?? '',
        cell: ({ row }) =>
          row.original.expectedDeliveryDate ? (
            format(parseISO(row.original.expectedDeliveryDate), 'MMM d')
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <Badge variant={STATUS_BADGE[row.original.status]} size="sm">
            {row.original.status.replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex justify-end gap-1.5">
              {canApprove && order.status === PURCHASE_ORDER_STATUS.PENDING_APPROVAL && (
                <Button size="sm" variant="outline" loading={busyId === order.id} onClick={() => approve(order)}>
                  <CheckCircle2 className="size-3.5" />
                  Approve
                </Button>
              )}
              {canReceive &&
                [PURCHASE_ORDER_STATUS.APPROVED, PURCHASE_ORDER_STATUS.ORDERED, PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED].includes(
                  order.status as never,
                ) && (
                  <Button size="sm" onClick={() => openReceive(order)}>
                    <PackageCheck className="size-3.5" />
                    Receive
                  </Button>
                )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canApprove, canReceive, busyId],
  );

  if (!orders) return <SkeletonTable rows={8} columns={7} />;

  const pendingApproval = orders.filter((o) => o.status === PURCHASE_ORDER_STATUS.PENDING_APPROVAL).length;

  return (
    <div className="space-y-5">
      <PageHeader
        description={`${orders.length} purchase orders · ${pendingApproval} awaiting approval. Receiving a delivery stocks it in automatically.`}
        actions={
          canManage && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              New purchase order
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search PO number or supplier…"
        globalFilterFn={(row, q) => row.poNumber.toLowerCase().includes(q) || row.supplierName.toLowerCase().includes(q)}
        emptyIcon={ShoppingBag}
        emptyTitle="No purchase orders"
        emptyDescription="Raise one to restock from a supplier."
        csvFileName="dineflow-purchase-orders"
      />

      {/* Create PO */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>New purchase order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="po-supplier" required>Supplier</Label>
                <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                  <SelectTrigger id="po-supplier">
                    <SelectValue placeholder="Choose a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter((s) => s.isActive).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="po-expected">Expected delivery</Label>
                <Input
                  id="po-expected"
                  type="date"
                  value={form.expectedDeliveryDate}
                  onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Order lines</Label>
              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]">
                    <Select
                      value={line.ingredientId}
                      onValueChange={(v) => {
                        const ingredient = ingredients.find((i) => i.id === v);
                        setLines(
                          lines.map((l, i) =>
                            i === index
                              ? {
                                  ...l,
                                  ingredientId: v,
                                  unitCost: l.unitCost || ((ingredient?.costPerPurchaseUnitMinor ?? 0) / 100).toFixed(2),
                                  quantityOrdered: l.quantityOrdered || String(ingredient?.reorderQuantityBase ?? ''),
                                }
                              : l,
                          ),
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ({i.purchaseUnit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Qty"
                      value={line.quantityOrdered}
                      onChange={(e) => setLines(lines.map((l, i) => (i === index ? { ...l, quantityOrdered: e.target.value } : l)))}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit cost"
                      value={line.unitCost}
                      onChange={(e) => setLines(lines.map((l, i) => (i === index ? { ...l, unitCost: e.target.value } : l)))}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLines(lines.length === 1 ? [{ ingredientId: '', quantityOrdered: '', unitCost: '' }] : lines.filter((_, i) => i !== index))}
                      aria-label="Remove line"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLines([...lines, { ingredientId: '', quantityOrdered: '', unitCost: '' }])}
              >
                <Plus className="size-3.5" />
                Add line
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Order total</span>
              <span className="font-semibold tabular-nums">
                {formatMoney(
                  Math.round(
                    lines.reduce((sum, l) => sum + (Number(l.unitCost) || 0) * (Number(l.quantityOrdered) || 0) * 100, 0),
                  ),
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="po-notes">Notes</Label>
              <Textarea id="po-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={createOrder}
              loading={saving}
              disabled={!form.supplierId || !lines.some((l) => l.ingredientId && Number(l.quantityOrdered) > 0)}
            >
              Raise purchase order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive delivery */}
      <Dialog open={Boolean(receiveTarget)} onOpenChange={(open) => !open && setReceiveTarget(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Receive delivery — {receiveTarget?.poNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter what actually arrived. Quantities are added to branch stock and logged as stock-in movements.
            </p>
            <div className="space-y-2">
              {receiveTarget?.items.map((item) => {
                const outstanding = item.quantityOrdered - item.quantityReceived;
                return (
                  <div key={item.ingredientId} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_8rem]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.ingredientName}</p>
                      <p className="text-xs text-muted-foreground">
                        Ordered {item.quantityOrdered} {item.unit} · received {item.quantityReceived} · outstanding{' '}
                        <span className="font-medium text-foreground">{outstanding}</span>
                      </p>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={outstanding}
                      disabled={outstanding <= 0}
                      value={receiveQuantities[item.ingredientId] ?? ''}
                      onChange={(e) => setReceiveQuantities({ ...receiveQuantities, [item.ingredientId]: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveTarget(null)}>Cancel</Button>
            <Button onClick={submitReceive} loading={saving}>
              <PackageCheck className="size-4" />
              Confirm receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
