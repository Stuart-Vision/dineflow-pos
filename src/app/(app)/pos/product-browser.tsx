'use client';

import { Search } from 'lucide-react';
import * as React from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { ProductCard } from './product-card';
import type { ApiCategory, ApiMenuItem } from './types';

export function ProductBrowser({
  categories,
  items,
  onSelectItem,
}: {
  categories: ApiCategory[];
  items: ApiMenuItem[];
  onSelectItem: (item: ApiMenuItem) => void;
}) {
  const [activeCategoryId, setActiveCategoryId] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');

  const filtered = items.filter((item) => {
    if (!item.isActive) return false;
    if (search.trim()) {
      return item.name.toLowerCase().includes(search.trim().toLowerCase());
    }
    if (activeCategoryId === 'all') return true;
    if (activeCategoryId === 'featured') return item.isFeatured || item.isBestSeller;
    return item.categoryId === activeCategoryId;
  });

  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border p-3">
        <Input
          startIcon={<Search className="size-4" />}
          placeholder="Search menu items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ScrollArea className="border-b border-border">
        <div className="flex gap-1.5 p-3">
          <button
            onClick={() => setActiveCategoryId('all')}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              activeCategoryId === 'all' && !search
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            All items
          </button>
          <button
            onClick={() => setActiveCategoryId('featured')}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              activeCategoryId === 'featured' && !search
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            Featured
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => setActiveCategoryId(category._id)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                activeCategoryId === category._id && !search
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </ScrollArea>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <EmptyState icon={Search} title="No items found" description="Try a different search term or category." />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <ProductCard key={item._id} item={item} onSelect={() => onSelectItem(item)} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
