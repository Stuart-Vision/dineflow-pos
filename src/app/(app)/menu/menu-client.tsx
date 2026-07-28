'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { FileUp, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/shared/data-table';
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
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KITCHEN_STATION_VALUES } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ApiRequestError, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';

interface MenuCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

interface MenuItemRow {
  _id: string;
  categoryId: string;
  name: string;
  description: string;
  priceMinor: number;
  costPriceMinor: number;
  kitchenStation: string;
  preparationTimeMinutes: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  spicyLevel: number;
  isActive: boolean;
  isAvailable: boolean;
}

interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItemRow[];
}

const EMPTY_ITEM = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  cost: '',
  kitchenStation: 'expo',
  preparationTimeMinutes: '10',
  isVegetarian: false,
  isVegan: false,
  isFeatured: false,
  spicyLevel: '0',
};

export function MenuClient() {
  const user = useSessionUser();
  const canManage = user.permissions.includes(PERMISSIONS.MENU_MANAGE);
  const canImport = user.permissions.includes(PERMISSIONS.MENU_IMPORT);

  const [menu, setMenu] = React.useState<MenuResponse | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<MenuItemRow | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_ITEM);
  const [categoryForm, setCategoryForm] = React.useState({ name: '', description: '' });
  const [csv, setCsv] = React.useState('');

  const load = React.useCallback(async () => {
    setMenu(await apiGet<MenuResponse>('/api/menu'));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function toggleAvailability(item: MenuItemRow, isAvailable: boolean) {
    try {
      await apiPatch(`/api/menu/items/${item._id}`, { isAvailable });
      setMenu((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => (i._id === item._id ? { ...i, isAvailable } : i)) } : prev,
      );
      toast.success(`${item.name} is now ${isAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not update availability.');
    }
  }

  async function saveItem() {
    setSaving(true);
    try {
      await apiPost('/api/menu/items', {
        name: form.name,
        categoryId: form.categoryId,
        description: form.description,
        priceMinor: Math.round(Number(form.price) * 100),
        costPriceMinor: Math.round(Number(form.cost || 0) * 100),
        kitchenStation: form.kitchenStation,
        preparationTimeMinutes: Number(form.preparationTimeMinutes),
        isVegetarian: form.isVegetarian,
        isVegan: form.isVegan,
        isFeatured: form.isFeatured,
        spicyLevel: Number(form.spicyLevel),
      });
      setItemDialogOpen(false);
      setForm(EMPTY_ITEM);
      await load();
      toast.success('Menu item created');
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not save that item.');
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory() {
    setSaving(true);
    try {
      await apiPost('/api/menu/categories', { name: categoryForm.name, description: categoryForm.description });
      setCategoryOpen(false);
      setCategoryForm({ name: '', description: '' });
      await load();
      toast.success('Category created');
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not create that category.');
    } finally {
      setSaving(false);
    }
  }

  async function runImport() {
    setSaving(true);
    try {
      const result = await apiPost<{ created: number; updated: number; skipped: { row: number; reason: string }[] }>(
        '/api/menu/import',
        { csv },
      );
      await load();
      setImportOpen(false);
      setCsv('');
      toast.success(`Import finished: ${result.created} created, ${result.updated} updated`, {
        description: result.skipped.length > 0 ? `${result.skipped.length} row(s) skipped — see details below.` : undefined,
      });
      if (result.skipped.length > 0) {
        for (const skip of result.skipped.slice(0, 4)) toast.warning(`Row ${skip.row}: ${skip.reason}`);
      }
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Import failed.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: MenuItemRow) {
    try {
      await apiDelete(`/api/menu/items/${item._id}`);
      setDeleteTarget(null);
      await load();
      toast.success(`${item.name} archived`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Could not archive that item.');
    }
  }

  const categoryNameById = React.useMemo(
    () => new Map((menu?.categories ?? []).map((c) => [c._id, c.name])),
    [menu],
  );

  const itemColumns = React.useMemo<ColumnDef<MenuItemRow, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Item',
        accessorFn: (row) => row.name,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">{categoryNameById.get(row.original.categoryId) ?? '—'}</p>
          </div>
        ),
      },
      {
        id: 'price',
        header: 'Price',
        accessorFn: (row) => row.priceMinor,
        cell: ({ row }) => formatMoney(row.original.priceMinor),
        meta: { numeric: true },
      },
      {
        id: 'margin',
        header: 'Margin',
        accessorFn: (row) => (row.priceMinor > 0 ? Math.round(((row.priceMinor - row.costPriceMinor) / row.priceMinor) * 100) : 0),
        cell: ({ getValue }) => `${getValue<number>()}%`,
        meta: { numeric: true },
      },
      {
        id: 'station',
        header: 'Station',
        accessorFn: (row) => row.kitchenStation,
        cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span>,
      },
      {
        id: 'prep',
        header: 'Prep',
        accessorFn: (row) => row.preparationTimeMinutes,
        cell: ({ getValue }) => `${getValue<number>()} min`,
        meta: { numeric: true },
      },
      {
        id: 'flags',
        header: 'Tags',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.isBestSeller && <Badge variant="warning" size="sm">Best seller</Badge>}
            {row.original.isFeatured && <Badge variant="info" size="sm">Featured</Badge>}
            {row.original.isVegan ? (
              <Badge variant="success" size="sm">Vegan</Badge>
            ) : row.original.isVegetarian ? (
              <Badge variant="success" size="sm">Veg</Badge>
            ) : null}
            {row.original.spicyLevel > 0 && <Badge variant="destructive" size="sm">Spicy {row.original.spicyLevel}</Badge>}
          </div>
        ),
      },
      {
        id: 'available',
        header: 'Available',
        accessorFn: (row) => row.isAvailable,
        cell: ({ row }) =>
          canManage ? (
            <Switch
              checked={row.original.isAvailable}
              onCheckedChange={(checked) => toggleAvailability(row.original, checked)}
              aria-label={`Toggle availability for ${row.original.name}`}
            />
          ) : (
            <Badge variant={row.original.isAvailable ? 'success' : 'muted'} size="sm">
              {row.original.isAvailable ? 'Yes' : 'No'}
            </Badge>
          ),
      },
      ...(canManage
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              cell: ({ row }: { row: { original: MenuItemRow } }) => (
                <div className="flex justify-end">
                  <Button size="icon-sm" variant="ghost" onClick={() => setDeleteTarget(row.original)} aria-label={`Archive ${row.original.name}`}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ),
            } as ColumnDef<MenuItemRow, unknown>,
          ]
        : []),
    ],
    [canManage, categoryNameById],
  );

  const categoryColumns = React.useMemo<ColumnDef<MenuCategory, unknown>[]>(
    () => [
      { id: 'name', header: 'Category', accessorFn: (row) => row.name },
      {
        id: 'items',
        header: 'Items',
        accessorFn: (row) => (menu?.items ?? []).filter((i) => i.categoryId === row._id).length,
        meta: { numeric: true },
      },
      {
        id: 'description',
        header: 'Description',
        accessorFn: (row) => row.description ?? '',
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>() || '—'}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.isActive,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'muted'} size="sm">
            {row.original.isActive ? 'Active' : 'Hidden'}
          </Badge>
        ),
      },
    ],
    [menu],
  );

  if (!menu) return <SkeletonTable rows={8} columns={6} />;

  return (
    <div className="space-y-5">
      <PageHeader
        description={`${menu.items.length} items across ${menu.categories.length} categories.`}
        actions={
          <>
            {canImport && (
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <FileUp className="size-3.5" />
                Import CSV
              </Button>
            )}
            {canManage && (
              <>
                <Button variant="outline" size="sm" onClick={() => setCategoryOpen(true)}>
                  <Plus className="size-3.5" />
                  Category
                </Button>
                <Button size="sm" onClick={() => setItemDialogOpen(true)}>
                  <Plus className="size-3.5" />
                  Menu item
                </Button>
              </>
            )}
          </>
        }
      />

      <Tabs defaultValue="items">
        <TabsList variant="underline">
          <TabsTrigger value="items">Menu items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <DataTable
            columns={itemColumns}
            data={menu.items}
            searchPlaceholder="Search items…"
            globalFilterFn={(row, q) => row.name.toLowerCase().includes(q) || row.description.toLowerCase().includes(q)}
            emptyIcon={UtensilsCrossed}
            emptyTitle="No menu items"
            emptyDescription="Add your first item or import a CSV."
            csvFileName="dineflow-menu-items"
            pageSize={20}
          />
        </TabsContent>

        <TabsContent value="categories">
          <DataTable
            columns={categoryColumns}
            data={menu.categories}
            searchPlaceholder="Search categories…"
            globalFilterFn={(row, q) => row.name.toLowerCase().includes(q)}
            emptyIcon={UtensilsCrossed}
            emptyTitle="No categories"
            csvFileName="dineflow-menu-categories"
          />
        </TabsContent>
      </Tabs>

      {/* New item */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>New menu item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="mi-name" required>Name</Label>
              <Input id="mi-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-category" required>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger id="mi-category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {menu.categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-station" required>Kitchen station</Label>
              <Select value={form.kitchenStation} onValueChange={(v) => setForm({ ...form, kitchenStation: v })}>
                <SelectTrigger id="mi-station">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KITCHEN_STATION_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="capitalize">{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="mi-desc" required>Description</Label>
              <Textarea id="mi-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-price" required>Selling price</Label>
              <Input id="mi-price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-cost">Cost price</Label>
              <Input id="mi-cost" type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-prep">Prep time (minutes)</Label>
              <Input id="mi-prep" type="number" min="0" value={form.preparationTimeMinutes} onChange={(e) => setForm({ ...form, preparationTimeMinutes: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-spicy">Spicy level (0–4)</Label>
              <Input id="mi-spicy" type="number" min="0" max="4" value={form.spicyLevel} onChange={(e) => setForm({ ...form, spicyLevel: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isVegetarian} onCheckedChange={(v) => setForm({ ...form, isVegetarian: v })} />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isVegan} onCheckedChange={(v) => setForm({ ...form, isVegan: v })} />
                Vegan
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                Featured
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveItem} loading={saving} disabled={!form.name.trim() || !form.categoryId || !form.price || !form.description.trim()}>
              Create item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New category */}
      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" required>Name</Label>
              <Input id="cat-name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea id="cat-desc" rows={2} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} loading={saving} disabled={!categoryForm.name.trim()}>Create category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV import */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Import menu from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Header row required. Recognised columns:{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">name, category, description, price, cost, station, prepMinutes, vegetarian, vegan, spicyLevel</code>.
              Existing items with a matching name are updated instead of duplicated.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="csv-file">Upload a file</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setCsv(await file.text());
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="csv-text">…or paste CSV content</Label>
              <Textarea
                id="csv-text"
                rows={8}
                className="font-mono text-xs"
                placeholder={'name,category,price,station\nTruffle Fries,Appetisers,8.50,fryer'}
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={runImport} loading={saving} disabled={!csv.trim()}>Run import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The item is hidden from the POS but kept on file so past orders and reports stay accurate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep item</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteTarget && deleteItem(deleteTarget)}>
              Archive item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
