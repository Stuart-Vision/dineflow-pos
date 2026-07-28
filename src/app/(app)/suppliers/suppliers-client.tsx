'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Star, Trash2, Truck } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatTile } from '@/components/dashboard/stat-tile';
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
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SkeletonStatCard, SkeletonTable } from '@/components/ui/skeleton';
import { PERMISSIONS } from '@/constants/permissions';
import { ApiRequestError, apiDelete, apiGet, apiPost } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';
import type { SupplierRow } from '@/services/purchasing-service';

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  categories: '',
  paymentTermsDays: '15',
  notes: '',
};

export function SuppliersClient() {
  const user = useSessionUser();
  const canManage = user.permissions.includes(PERMISSIONS.SUPPLIER_MANAGE);

  const [suppliers, setSuppliers] = React.useState<SupplierRow[] | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SupplierRow | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const load = React.useCallback(async () => {
    setSuppliers(await apiGet<SupplierRow[]>('/api/suppliers'));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      await apiPost('/api/suppliers', {
        name: form.name,
        contactPerson: form.contactPerson,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address || undefined,
        categories: form.categories
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        paymentTermsDays: Number(form.paymentTermsDays),
        notes: form.notes || undefined,
      });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await load();
      toast.success('Supplier added');
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not save that supplier.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(supplier: SupplierRow) {
    try {
      await apiDelete(`/api/suppliers/${supplier.id}`);
      setDeleteTarget(null);
      await load();
      toast.success(`${supplier.name} archived`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not archive that supplier.');
    }
  }

  const columns = React.useMemo<ColumnDef<SupplierRow, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Supplier',
        accessorFn: (row) => row.name,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.contactPerson} · {row.original.phone}
            </p>
          </div>
        ),
      },
      {
        id: 'categories',
        header: 'Supplies',
        accessorFn: (row) => row.categories.join(', '),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.categories.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              row.original.categories.map((c) => (
                <Badge key={c} variant="muted" size="sm">
                  {c}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        id: 'terms',
        header: 'Terms',
        accessorFn: (row) => row.paymentTermsDays,
        cell: ({ getValue }) => `${getValue<number>()} days`,
        meta: { numeric: true },
      },
      {
        id: 'orders',
        header: 'POs',
        accessorFn: (row) => row.purchaseOrderCount,
        meta: { numeric: true },
      },
      {
        id: 'purchased',
        header: 'Total purchased',
        accessorFn: (row) => row.totalPurchasedMinor,
        cell: ({ getValue }) => formatMoney(getValue<number>()),
        meta: { numeric: true },
      },
      {
        id: 'outstanding',
        header: 'Outstanding',
        accessorFn: (row) => row.outstandingBalanceMinor,
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <span className={value > 0 ? 'font-medium text-warning' : 'text-muted-foreground'}>
              {formatMoney(value)}
            </span>
          );
        },
        meta: { numeric: true },
      },
      {
        id: 'rating',
        header: 'Rating',
        accessorFn: (row) => row.rating,
        cell: ({ getValue }) => (
          <span className="flex items-center justify-end gap-1 tabular-nums">
            <Star className="size-3.5 fill-warning text-warning" />
            {getValue<number>().toFixed(1)}
          </span>
        ),
        meta: { numeric: true },
      },
      ...(canManage
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              cell: ({ row }: { row: { original: SupplierRow } }) => (
                <div className="flex justify-end">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(row.original)}
                    aria-label={`Archive ${row.original.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ),
            } as ColumnDef<SupplierRow, unknown>,
          ]
        : []),
    ],
    [canManage],
  );

  if (!suppliers) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.outstandingBalanceMinor, 0);
  const totalPurchased = suppliers.reduce((sum, s) => sum + s.totalPurchasedMinor, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        description="Supplier directory with payment terms, purchase history and outstanding balances."
        actions={
          canManage && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              Add supplier
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Active suppliers" value={String(suppliers.filter((s) => s.isActive).length)} icon={Truck} subtitle="on the approved list" />
        <StatTile label="Total purchased" value={formatMoney(totalPurchased)} icon={Truck} subtitle="across all purchase orders" />
        <StatTile
          label="Outstanding payable"
          value={formatMoney(totalOutstanding)}
          icon={Truck}
          tone={totalOutstanding > 0 ? 'warning' : 'default'}
          subtitle="unpaid supplier invoices"
        />
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        searchPlaceholder="Search suppliers…"
        globalFilterFn={(row, q) =>
          row.name.toLowerCase().includes(q) ||
          row.contactPerson.toLowerCase().includes(q) ||
          row.categories.join(' ').toLowerCase().includes(q)
        }
        emptyIcon={Truck}
        emptyTitle="No suppliers yet"
        emptyDescription="Add the vendors you buy stock from."
        csvFileName="dineflow-suppliers"
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Add a supplier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sup-name" required>Supplier name</Label>
              <Input id="sup-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-contact" required>Contact person</Label>
              <Input id="sup-contact" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-phone" required>Phone</Label>
              <Input id="sup-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-email">Email</Label>
              <Input id="sup-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-terms">Payment terms (days)</Label>
              <Input id="sup-terms" type="number" min="0" max="180" value={form.paymentTermsDays} onChange={(e) => setForm({ ...form, paymentTermsDays: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sup-cats">Supply categories</Label>
              <Input id="sup-cats" placeholder="Meat, Produce, Dairy" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
              <p className="text-xs text-muted-foreground">Comma-separated. Used to match ingredients to their default supplier.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sup-address">Address</Label>
              <Input id="sup-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sup-notes">Notes</Label>
              <Textarea id="sup-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving} disabled={!form.name.trim() || !form.contactPerson.trim() || !form.phone.trim()}>
              Add supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They stop appearing in new purchase orders, but past orders and invoices keep referencing them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep supplier</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteTarget && remove(deleteTarget)}>
              Archive supplier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
