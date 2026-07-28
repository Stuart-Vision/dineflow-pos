'use client';

import { format, parseISO } from 'date-fns';
import { LayoutGrid, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/page-header';
import { useSessionUser } from '@/components/providers/session-provider';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonChart } from '@/components/ui/skeleton';
import { TABLE_STATUS, TABLE_STATUS_VALUES, type TableStatus } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ApiRequestError, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

interface FloorTable {
  _id: string;
  label: string;
  section: string;
  capacity: number;
  shape: string;
  status: TableStatus;
  positionX: number;
  positionY: number;
  currentOrder: { id: string; orderNumber: string; status: string; grandTotalMinor: number; itemCount: number; createdAt: string } | null;
  assignedWaiterName: string | null;
}

const STATUS_STYLES: Record<TableStatus, { chip: string; card: string; label: string }> = {
  available: { chip: 'bg-success', card: 'border-success/40 bg-success/5', label: 'Available' },
  occupied: { chip: 'bg-info', card: 'border-info/50 bg-info/8', label: 'Occupied' },
  reserved: { chip: 'bg-warning', card: 'border-warning/50 bg-warning/8', label: 'Reserved' },
  cleaning: { chip: 'bg-chart-7', card: 'border-chart-7/50 bg-chart-7/8', label: 'Cleaning' },
  out_of_service: { chip: 'bg-muted-foreground', card: 'border-border bg-muted/40', label: 'Out of service' },
};

export function TablesClient() {
  const user = useSessionUser();
  const canManage = user.permissions.includes(PERMISSIONS.TABLE_MANAGE);

  const [tables, setTables] = React.useState<FloorTable[] | null>(null);
  const [sectionFilter, setSectionFilter] = React.useState('all');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<FloorTable | null>(null);
  const [form, setForm] = React.useState({ label: '', section: 'Main Floor', capacity: '4' });

  const load = React.useCallback(async () => {
    const data = await apiGet<FloorTable[]>('/api/tables?expand=orders');
    setTables(data);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(table: FloorTable, status: TableStatus) {
    setBusyId(table._id);
    try {
      await apiPatch(`/api/tables/${table._id}`, { status });
      await load();
      toast.success(`Table ${table.label} marked ${STATUS_STYLES[status].label.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not update that table.');
    } finally {
      setBusyId(null);
    }
  }

  async function createTable() {
    try {
      await apiPost('/api/tables', { label: form.label, section: form.section, capacity: Number(form.capacity) });
      setCreateOpen(false);
      setForm({ label: '', section: 'Main Floor', capacity: '4' });
      await load();
      toast.success('Table added');
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not add that table.');
    }
  }

  async function deleteTable(table: FloorTable) {
    try {
      await apiDelete(`/api/tables/${table._id}`);
      setDeleteTarget(null);
      await load();
      toast.success(`Table ${table.label} removed`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not remove that table.');
    }
  }

  if (!tables) return <SkeletonChart className="rounded-xl border border-border bg-card p-6" />;

  const sections = [...new Set(tables.map((t) => t.section))];
  const visible = sectionFilter === 'all' ? tables : tables.filter((t) => t.section === sectionFilter);
  const counts = TABLE_STATUS_VALUES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = tables.filter((t) => t.status === status).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        description="Live floor plan across your sections. Tap a table to change its state or open its order."
        actions={
          <>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" />
                Add table
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-3">
        {TABLE_STATUS_VALUES.map((status) => (
          <span key={status} className="flex items-center gap-1.5 text-xs">
            <span className={cn('size-2 rounded-full', STATUS_STYLES[status].chip)} aria-hidden="true" />
            <span className="text-muted-foreground">{STATUS_STYLES[status].label}</span>
            <span className="font-semibold tabular-nums">{counts[status] ?? 0}</span>
          </span>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={LayoutGrid} title="No tables in this section" description="Add a table to start building the floor plan." />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((table) => {
            const style = STATUS_STYLES[table.status];
            return (
              <div key={table._id} className={cn('flex flex-col rounded-xl border p-3.5 shadow-card transition-colors', style.card)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-semibold leading-none">{table.label}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      {table.capacity} seats
                    </p>
                  </div>
                  <span className={cn('mt-1 size-2.5 shrink-0 rounded-full', style.chip)} aria-label={style.label} />
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">{table.section}</p>

                {table.currentOrder ? (
                  <div className="mt-2.5 space-y-0.5 rounded-lg bg-card/70 p-2">
                    <p className="truncate text-xs font-medium">{table.currentOrder.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {table.currentOrder.itemCount} item{table.currentOrder.itemCount === 1 ? '' : 's'} ·{' '}
                      {formatMoney(table.currentOrder.grandTotalMinor)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Since {format(parseISO(String(table.currentOrder.createdAt)), 'HH:mm')}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2.5 text-xs text-muted-foreground">{style.label}</p>
                )}

                {table.assignedWaiterName && (
                  <Badge variant="muted" size="sm" className="mt-2 w-fit">
                    {table.assignedWaiterName}
                  </Badge>
                )}

                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                  {table.status === TABLE_STATUS.CLEANING && (
                    <Button size="sm" variant="outline" className="flex-1" disabled={busyId === table._id} onClick={() => changeStatus(table, TABLE_STATUS.AVAILABLE)}>
                      <Sparkles className="size-3.5" />
                      Cleaned
                    </Button>
                  )}
                  {table.status === TABLE_STATUS.AVAILABLE && (
                    <Button size="sm" variant="outline" className="flex-1" disabled={busyId === table._id} onClick={() => changeStatus(table, TABLE_STATUS.RESERVED)}>
                      Reserve
                    </Button>
                  )}
                  {(table.status === TABLE_STATUS.OCCUPIED || table.status === TABLE_STATUS.RESERVED) && (
                    <Button size="sm" variant="outline" className="flex-1" disabled={busyId === table._id} onClick={() => changeStatus(table, TABLE_STATUS.CLEANING)}>
                      Clear
                    </Button>
                  )}
                  {canManage && !table.currentOrder && (
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleteTarget(table)} aria-label={`Delete table ${table.label}`}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Add a table</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tbl-label" required>
                Label
              </Label>
              <Input id="tbl-label" placeholder="e.g. T15" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tbl-section">Section</Label>
              <Input id="tbl-section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tbl-capacity" required>
                Seating capacity
              </Label>
              <Input id="tbl-capacity" type="number" min={1} max={40} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTable} disabled={!form.label.trim()}>
              Add table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove table {deleteTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              The table is archived rather than erased, so historical orders that reference it stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep table</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteTarget && deleteTable(deleteTarget)}>
              Remove table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
