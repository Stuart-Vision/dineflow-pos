'use client';

import { Flame, ImageOff, Star } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

import type { ApiMenuItem } from './types';

export function ProductCard({ item, onSelect }: { item: ApiMenuItem; onSelect: () => void }) {
  const disabled = !item.isAvailable;

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left shadow-card transition-all',
        !disabled && 'hover:-translate-y-0.5 hover:shadow-raised',
        disabled && 'opacity-50',
      )}
    >
      <div className="relative aspect-4/3 w-full bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
        {(item.isBestSeller || item.isFeatured) && (
          <Badge variant="warning" size="sm" className="absolute top-1.5 left-1.5">
            <Star className="size-3" />
            {item.isBestSeller ? 'Best seller' : 'Featured'}
          </Badge>
        )}
        {item.spicyLevel > 0 && (
          <Badge variant="destructive" size="sm" className="absolute top-1.5 right-1.5">
            <Flame className="size-3" />
          </Badge>
        )}
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80">
            <Badge variant="muted">Unavailable</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <p className="line-clamp-1 text-sm font-medium text-foreground">{item.name}</p>
        <p className="text-sm font-semibold text-primary">{formatMoney(item.priceMinor)}</p>
      </div>
    </button>
  );
}
