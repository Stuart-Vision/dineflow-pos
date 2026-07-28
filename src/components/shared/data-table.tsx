'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  /** Enables the client-side search box and tells it which text to match. */
  searchPlaceholder?: string;
  globalFilterFn?: (row: TData, query: string) => boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Extra controls rendered in the toolbar, left of search. */
  toolbar?: React.ReactNode;
  pageSize?: number;
  /** Provides rows for CSV export; omit to hide the export button. */
  csvFileName?: string;
  onRowClick?: (row: TData) => void;
}

function toCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function DataTable<TData>({
  columns,
  data,
  loading,
  searchPlaceholder,
  globalFilterFn,
  emptyIcon = SlidersHorizontal,
  emptyTitle = 'Nothing to show yet',
  emptyDescription,
  toolbar,
  pageSize = 15,
  csvFileName,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!query.trim() || !globalFilterFn) return data;
    return data.filter((row) => globalFilterFn(row, query.trim().toLowerCase()));
  }, [data, query, globalFilterFn]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  function exportCsv() {
    const visibleColumns = table.getAllLeafColumns().filter((c) => c.id !== 'actions');
    const header = visibleColumns.map((c) => toCsvValue(typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));
    const rows = table.getSortedRowModel().rows.map((row) =>
      visibleColumns.map((column) => toCsvValue(row.getValue(column.id))),
    );
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${csvFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <SkeletonTable rows={8} columns={Math.min(columns.length, 6)} />;

  return (
    <div className="space-y-3">
      {(searchPlaceholder || toolbar || csvFileName) && (
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {searchPlaceholder && globalFilterFn && (
            <Input
              startIcon={<Search className="size-4" />}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:max-w-xs"
            />
          )}
          {csvFileName && (
            <Button variant="outline" size="sm" onClick={exportCsv} className="ml-auto">
              <Download className="size-3.5" />
              Export CSV
            </Button>
          )}
        </div>
      )}

      {table.getRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortDir = header.column.getIsSorted();
                      return (
                        <TableHead
                          key={header.id}
                          numeric={header.column.columnDef.meta?.numeric}
                          className={cn(header.column.getCanSort() && 'cursor-pointer select-none')}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="inline-flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortDir === 'asc' && <ArrowUp className="size-3" />}
                            {sortDir === 'desc' && <ArrowDown className="size-3" />}
                          </span>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    clickable={Boolean(onRowClick)}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} numeric={cell.column.columnDef.meta?.numeric}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ·{' '}
                {table.getFilteredRowModel().rows.length} record
                {table.getFilteredRowModel().rows.length === 1 ? '' : 's'}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="size-3.5" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
