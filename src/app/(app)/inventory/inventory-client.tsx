'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Boxes, ClipboardCheck, PackageX, Plus, Trash, TrendingDown } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatTile } from '@/components/dashboard/stat-tile';
import { useSessionUser } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonStatCard, SkeletonTable } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INVENTORY_TRANSACTION_TYPE, WASTAGE_REASON_VALUES } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ApiRequestError, apiGet, apiPost } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';
import type { IngredientRow, InventorySummary, MovementRow } from '@/services/inventory-service';

interface InventoryResponse {
  ingredients: IngredientRow[];
  movements: MovementRow[];
  summary: InventorySummary;
}

const STOCK_BADGE = { out: 'destructive', low: 'warning', ok: 'success' } as const;
const STOCK_LABEL = { out: 'Out of stock', low: 'Low', ok: 'In stock' } as const;

const MOVEMENT_LABELS: Record<string, string> = {
  stock_in: 'Stock in',
  stock_out: 'Stock out',
  sale_deduction: 'Sold',
  adjustment: 'Adjustment',
  wastage: 'Wastage',
  return: 'Return',
  transfer_in: 'Transfer in',
  transfer_out: 'Transfer out',
  physical_count: 'Physical count',
  opening_balance: 'Opening balance',
};

const ADJUSTABLE_TYPES = [
  INVENTORY_TRANSACTION_TYPE.STOCK_IN,
  INVENTORY_TRANSACTION_TYPE.STOCK_OUT,
  INVENTORY_TRANSACTION_TYPE.WASTAGE,
  INVENTORY_TRANSACTION_TYPE.ADJUSTMENT,
] as const;

export function InventoryClient() {
  const user = useSessionUser();
  const canAdjust = user.permissions.includes(PERMISSIONS.INVENTORY_ADJUST);
  const canCount = user.permissions.includes(PERMISSIONS.INVENTORY_COUNT);

  const [data, setData] = React.useState<InventoryResponse | null>(null);
  const [movementOpen, setMovementOpen] = React.useState(false);
  const [countOpen, setCountOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [stockFilter, setStockFilter] = React.useState('all');

  const [movementForm, setMovementForm] = React.useState({
    ingredientId: '',
    type: INVENTORY_TRANSACTION_TYPE.STOCK_IN as string,
    quantityBase: '',
    unitCostMinor: '',
    wastageReason: 'other',
    notes: '',
  });
  const [countForm, setCountForm] = React.useState({ ingredientId: '', countedQuantityBase: '', notes: '' });

  const load = React.useCallback(async () => {
    setData(await apiGet<InventoryResponse>('/api/inventory'));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function submitMovement() {
    setSaving(true);
    try {
      await apiPost('/api/inventory/movements', {
        mode: 'movement',
        ingredientId: movementForm.ingredientId,
        type: movementForm.type,
        quantityBase: Number(movementForm.quantityBase),
        unitCostMinor: movementForm.unitCostMinor ? Math.round(Number(movementForm.unitCostMinor) * 100) : 0,
        wastageReason: movementForm.type === INVENTORY_TRANSACTION_TYPE.WASTAGE ? movementForm.wastageReason : null,
        notes: movementForm.notes || null,
      });
      setMovementOpen(false);
      setMovementForm({ ...movementForm, ingredientId: '', quantityBase: '', unitCostMinor: '', notes: '' });
      await load();
      toast.success('Stock movement recorded');
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not record that movement.');
    } finally {
      setSaving(false);
    }
  }

  async function submitCount() {
    setSaving(true);
    try {
      const result = await apiPost<{ ingredientName: string; varianceBase: number }>('/api/inventory/movements', {
        mode: 'count',
        ingredientId: countForm.ingredientId,
        countedQuantityBase: Number(countForm.countedQuantityBase),
        notes: countForm.notes || null,
      });
      setCountOpen(false);
      setCountForm({ ingredientId: '', countedQuantityBase: '', notes: '' });
      await load();
      toast.success(`${result.ingredientName} counted`, {
        description: `Variance ${result.varianceBase >= 0 ? '+' : ''}${result.varianceBase}`,
      });
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not save that count.');
    } finally {
      setSaving(false);
    }
  }

  const ingredientColumns = React.useMemo<ColumnDef<IngredientRow, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Ingredient',
        accessorFn: (row) => row.name,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.sku} · {row.original.category}
            </p>
          </div>
        ),
      },
      {
        id: 'stock',
        header: 'On hand',
        accessorFn: (row) => row.currentStockBase,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.currentStockBase} {row.original.consumptionUnit}
          </span>
        ),
        meta: { numeric: true },
      },
      {
        id: 'reorder',
        header: 'Reorder at',
        accessorFn: (row) => row.reorderLevelBase,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.reorderLevelBase} {row.original.consumptionUnit}
          </span>
        ),
        meta: { numeric: true },
      },
      {
        id: 'state',
        header: 'Status',
        accessorFn: (row) => row.stockState,
        cell: ({ row }) => (
          <Badge variant={STOCK_BADGE[row.original.stockState]} size="sm">
            {STOCK_LABEL[row.original.stockState]}
          </Badge>
        ),
      },
      {
        id: 'value',
        header: 'Stock value',
        accessorFn: (row) => row.stockValueMinor,
        cell: ({ row }) => formatMoney(row.original.stockValueMinor),
        meta: { numeric: true },
      },
      {
        id: 'supplier',
        header: 'Supplier',
        accessorFn: (row) => row.supplierName ?? '—',
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
      },
    ],
    [],
  );

  const movementColumns = React.useMemo<ColumnDef<MovementRow, unknown>[]>(
    () => [
      {
        id: 'createdAt',
        header: 'When',
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{format(parseISO(row.original.createdAt), 'MMM d, HH:mm')}</span>
        ),
      },
      { id: 'ingredientName', header: 'Ingredient', accessorFn: (row) => row.ingredientName },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) => row.type,
        cell: ({ row }) => (
          <Badge
            variant={row.original.type === 'wastage' ? 'destructive' : row.original.type === 'stock_in' ? 'success' : 'muted'}
            size="sm"
          >
            {MOVEMENT_LABELS[row.original.type] ?? row.original.type}
          </Badge>
        ),
      },
      {
        id: 'quantity',
        header: 'Quantity',
        accessorFn: (row) => row.quantityBase,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.quantityBase} {row.original.unit}
          </span>
        ),
        meta: { numeric: true },
      },
      {
        id: 'balance',
        header: 'Balance after',
        accessorFn: (row) => row.balanceAfterBase,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.balanceAfterBase} {row.original.unit}
          </span>
        ),
        meta: { numeric: true },
      },
      {
        id: 'by',
        header: 'By',
        accessorFn: (row) => row.performedByName ?? '—',
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
      },
      {
        id: 'notes',
        header: 'Notes',
        accessorFn: (row) => row.notes ?? row.wastageReason ?? '',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.wastageReason ? `${row.original.wastageReason.replace(/_/g, ' ')}${row.original.notes ? ' · ' : ''}` : ''}
            {row.original.notes ?? ''}
          </span>
        ),
      },
    ],
    [],
  );

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  const visibleIngredients =
    stockFilter === 'all' ? data.ingredients : data.ingredients.filter((i) => i.stockState === stockFilter);

  return (
    <div className="space-y-5">
      <PageHeader
        description="Recipe-linked stock. Selling an item deducts its ingredients automatically."
        actions={
          <>
            {canCount && (
              <Button variant="outline" size="sm" onClick={() => setCountOpen(true)}>
                <ClipboardCheck className="size-3.5" />
                Physical count
              </Button>
            )}
            {canAdjust && (
              <Button size="sm" onClick={() => setMovementOpen(true)}>
                <Plus className="size-3.5" />
                Record movement
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Tracked ingredients" value={String(data.summary.totalItems)} icon={Boxes} subtitle="active stock lines" />
        <StatTile
          label="Low stock"
          value={String(data.summary.lowStockCount)}
          icon={AlertTriangle}
          tone={data.summary.lowStockCount > 0 ? 'warning' : 'default'}
          subtitle="at or below reorder level"
        />
        <StatTile
          label="Out of stock"
          value={String(data.summary.outOfStockCount)}
          icon={PackageX}
          tone={data.summary.outOfStockCount > 0 ? 'destructive' : 'default'}
          subtitle="needs reordering now"
        />
        <StatTile
          label="Wastage this month"
          value={formatMoney(data.summary.wastageThisMonthMinor)}
          icon={TrendingDown}
          subtitle="recorded write-offs"
        />
      </div>

      <Tabs defaultValue="stock">
        <TabsList variant="underline">
          <TabsTrigger value="stock">Stock levels</TabsTrigger>
          <TabsTrigger value="movements">Movement history</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <DataTable
            columns={ingredientColumns}
            data={visibleIngredients}
            searchPlaceholder="Search ingredients…"
            globalFilterFn={(row, q) => row.name.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q)}
            emptyIcon={Boxes}
            emptyTitle="No ingredients match"
            emptyDescription="Adjust the filter or add an ingredient."
            csvFileName="dineflow-inventory"
            pageSize={20}
            toolbar={
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stock</SelectItem>
                  <SelectItem value="low">Low stock only</SelectItem>
                  <SelectItem value="out">Out of stock only</SelectItem>
                  <SelectItem value="ok">Healthy only</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </TabsContent>

        <TabsContent value="movements">
          <DataTable
            columns={movementColumns}
            data={data.movements}
            searchPlaceholder="Search movements…"
            globalFilterFn={(row, q) => row.ingredientName.toLowerCase().includes(q) || row.type.includes(q)}
            emptyIcon={Trash}
            emptyTitle="No stock movements yet"
            csvFileName="dineflow-stock-movements"
            pageSize={20}
          />
        </TabsContent>
      </Tabs>

      {/* Record movement */}
      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a stock movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="mv-ingredient" required>Ingredient</Label>
              <Select value={movementForm.ingredientId} onValueChange={(v) => setMovementForm({ ...movementForm, ingredientId: v })}>
                <SelectTrigger id="mv-ingredient">
                  <SelectValue placeholder="Choose an ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {data.ingredients.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} ({i.currentStockBase} {i.consumptionUnit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-type" required>Movement type</Label>
              <Select value={movementForm.type} onValueChange={(v) => setMovementForm({ ...movementForm, type: v })}>
                <SelectTrigger id="mv-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTABLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {MOVEMENT_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-qty" required>Quantity (consumption units)</Label>
              <Input
                id="mv-qty"
                type="number"
                step="0.01"
                min="0"
                value={movementForm.quantityBase}
                onChange={(e) => setMovementForm({ ...movementForm, quantityBase: e.target.value })}
              />
            </div>
            {movementForm.type === INVENTORY_TRANSACTION_TYPE.STOCK_IN && (
              <div className="space-y-1.5">
                <Label htmlFor="mv-cost">Unit cost paid (per purchase unit)</Label>
                <Input
                  id="mv-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={movementForm.unitCostMinor}
                  onChange={(e) => setMovementForm({ ...movementForm, unitCostMinor: e.target.value })}
                />
              </div>
            )}
            {movementForm.type === INVENTORY_TRANSACTION_TYPE.WASTAGE && (
              <div className="space-y-1.5">
                <Label htmlFor="mv-reason" required>Wastage reason</Label>
                <Select value={movementForm.wastageReason} onValueChange={(v) => setMovementForm({ ...movementForm, wastageReason: v })}>
                  <SelectTrigger id="mv-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WASTAGE_REASON_VALUES.map((r) => (
                      <SelectItem key={r} value={r}>
                        <span className="capitalize">{r.replace(/_/g, ' ')}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="mv-notes">Notes</Label>
              <Textarea id="mv-notes" rows={2} value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementOpen(false)}>Cancel</Button>
            <Button onClick={submitMovement} loading={saving} disabled={!movementForm.ingredientId || !movementForm.quantityBase}>
              Record movement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Physical count */}
      <Dialog open={countOpen} onOpenChange={setCountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Physical stock count</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter what you actually counted. The variance against book stock is written to the movement history.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="ct-ingredient" required>Ingredient</Label>
              <Select value={countForm.ingredientId} onValueChange={(v) => setCountForm({ ...countForm, ingredientId: v })}>
                <SelectTrigger id="ct-ingredient">
                  <SelectValue placeholder="Choose an ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {data.ingredients.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} (book: {i.currentStockBase} {i.consumptionUnit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-qty" required>Counted quantity</Label>
              <Input
                id="ct-qty"
                type="number"
                step="0.01"
                min="0"
                value={countForm.countedQuantityBase}
                onChange={(e) => setCountForm({ ...countForm, countedQuantityBase: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-notes">Notes</Label>
              <Textarea id="ct-notes" rows={2} value={countForm.notes} onChange={(e) => setCountForm({ ...countForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCountOpen(false)}>Cancel</Button>
            <Button onClick={submitCount} loading={saving} disabled={!countForm.ingredientId || countForm.countedQuantityBase === ''}>
              Save count
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
