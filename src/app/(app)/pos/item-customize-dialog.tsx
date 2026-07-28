'use client';

import { Minus, Plus } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/input';
import { formatMoney } from '@/lib/money';
import { usePosCartStore } from '@/store/pos-cart-store';

import type { ApiMenuItem, ApiModifierGroup } from './types';

export function ItemCustomizeDialog({
  item,
  modifierGroups,
  onClose,
}: {
  item: ApiMenuItem;
  modifierGroups: ApiModifierGroup[];
  onClose: () => void;
}) {
  const addLine = usePosCartStore((s) => s.addLine);

  const defaultPortion = item.portionSizes.find((p) => p.isDefault) ?? item.portionSizes[0] ?? null;
  const [portionName, setPortionName] = React.useState<string | null>(defaultPortion?.name ?? null);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState('');
  const [selections, setSelections] = React.useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      modifierGroups
        .map((group) => [group._id, group.options.filter((o) => o.isDefault).map((o) => o._id)] as const)
        .filter(([, defaults]) => defaults.length > 0),
    ),
  );

  const unitPriceMinor = portionName ? (item.portionSizes.find((p) => p.name === portionName)?.priceMinor ?? item.priceMinor) : item.priceMinor;

  const selectedModifiers = modifierGroups.flatMap((group) =>
    (selections[group._id] ?? [])
      .map((optionId) => group.options.find((o) => o._id === optionId))
      .filter((o): o is NonNullable<typeof o> => Boolean(o))
      .map((o) => ({ name: `${o.name}`, priceMinor: o.priceMinor, quantity: 1 })),
  );

  const modifierTotal = selectedModifiers.reduce((sum, m) => sum + m.priceMinor, 0);
  const lineTotal = (unitPriceMinor + modifierTotal) * quantity;

  const missingRequired = modifierGroups.filter((g) => g.isRequired && (selections[g._id] ?? []).length < g.minSelect);

  function toggleSingle(groupId: string, optionId: string) {
    setSelections((prev) => ({ ...prev, [groupId]: [optionId] }));
  }

  function toggleMultiple(groupId: string, optionId: string, max: number) {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  function handleAdd() {
    addLine({
      menuItemId: item._id,
      name: item.name,
      imageUrl: item.imageUrl,
      portionName,
      unitPriceMinor,
      quantity,
      modifiers: selectedModifiers,
      notes: notes.trim() || null,
      discount: null,
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1 scrollbar-slim">
          <p className="text-sm text-muted-foreground">{item.description}</p>

          {item.portionSizes.length > 0 && (
            <div className="space-y-2">
              <Label>Size</Label>
              <RadioGroup value={portionName ?? undefined} onValueChange={setPortionName} className="grid-cols-2 sm:grid-cols-3">
                {item.portionSizes.map((portion) => (
                  <label
                    key={portion.name}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <RadioGroupItem value={portion.name} />
                      {portion.name}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatMoney(portion.priceMinor)}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {modifierGroups.map((group) => (
            <div key={group._id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {group.name}
                  {group.isRequired && <span className="ml-1 text-destructive">*</span>}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {group.selectionType === 'single' ? 'Choose one' : `Choose up to ${group.maxSelect}`}
                </span>
              </div>
              <div className="space-y-1.5">
                {group.options
                  .filter((o) => o.isActive)
                  .map((option) => {
                    const checked = (selections[group._id] ?? []).includes(option._id);
                    return (
                      <label
                        key={option._id}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border p-2.5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          {group.selectionType === 'single' ? (
                            <input
                              type="radio"
                              className="size-4 accent-primary"
                              checked={checked}
                              onChange={() => toggleSingle(group._id, option._id)}
                            />
                          ) : (
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleMultiple(group._id, option._id, group.maxSelect)}
                            />
                          )}
                          {option.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.priceMinor > 0 ? `+${formatMoney(option.priceMinor)}` : 'Free'}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="item-notes">Notes for the kitchen</Label>
            <Textarea
              id="item-notes"
              placeholder="e.g. no onions, extra spicy…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <Label className="mb-0">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon-sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                <Minus className="size-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
              <Button variant="outline" size="icon-sm" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={missingRequired.length > 0} className="flex-1 sm:flex-none">
            Add to order — {formatMoney(lineTotal)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
