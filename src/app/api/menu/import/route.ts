import { z } from 'zod';

import { KITCHEN_STATION_VALUES } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Category } from '@/models/Category';
import { MenuItem } from '@/models/MenuItem';

const importSchema = z.object({
  /** Raw CSV text with a header row. */
  csv: z.string().min(1, 'Paste or upload CSV content first.'),
});

interface ImportOutcome {
  created: number;
  updated: number;
  skipped: Array<{ row: number; reason: string }>;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      // A doubled quote inside a quoted cell is a literal quote.
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * CSV menu import. Expected header (order-independent, extra columns ignored):
 *   name,category,description,price,cost,station,prepMinutes,vegetarian,vegan,spicyLevel
 * Prices are read as major units (12.50) and stored as minor units.
 * Existing items are matched by slug and updated rather than duplicated.
 */
export const POST = defineRoute(
  { permissions: [PERMISSIONS.MENU_IMPORT], bodySchema: importSchema },
  async ({ body, user }) => {
    const lines = body.csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const outcome: ImportOutcome = { created: 0, updated: 0, skipped: [] };

    if (lines.length < 2) {
      return ok({ ...outcome, skipped: [{ row: 1, reason: 'The file needs a header row and at least one data row.' }] });
    }

    const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
    const col = (name: string) => header.indexOf(name);

    const categories = await Category.find({ restaurantId: user.restaurantId }).lean();
    const categoryIdByName = new Map(categories.map((c) => [c.name.toLowerCase(), c._id]));

    for (let i = 1; i < lines.length; i += 1) {
      const cells = splitCsvLine(lines[i]!);
      const rowNumber = i + 1;

      const name = cells[col('name')] ?? '';
      const categoryName = cells[col('category')] ?? '';
      const priceRaw = cells[col('price')] ?? '';

      if (!name) {
        outcome.skipped.push({ row: rowNumber, reason: 'Missing name' });
        continue;
      }
      const categoryId = categoryIdByName.get(categoryName.toLowerCase());
      if (!categoryId) {
        outcome.skipped.push({ row: rowNumber, reason: `Unknown category "${categoryName}"` });
        continue;
      }
      const price = Number(priceRaw);
      if (!Number.isFinite(price) || price < 0) {
        outcome.skipped.push({ row: rowNumber, reason: `Invalid price "${priceRaw}"` });
        continue;
      }

      const stationRaw = (cells[col('station')] ?? 'expo').toLowerCase();
      const station = (KITCHEN_STATION_VALUES as readonly string[]).includes(stationRaw) ? stationRaw : 'expo';
      const cost = Number(cells[col('cost')] ?? 0);
      const prep = Number(cells[col('prepminutes')] ?? 10);
      const slug = slugify(name);

      const payload = {
        categoryId,
        name,
        description: cells[col('description')] || `${name} — imported from CSV.`,
        priceMinor: Math.round(price * 100),
        costPriceMinor: Number.isFinite(cost) ? Math.round(cost * 100) : 0,
        kitchenStation: station,
        preparationTimeMinutes: Number.isFinite(prep) ? prep : 10,
        isVegetarian: /^(true|yes|1)$/i.test(cells[col('vegetarian')] ?? ''),
        isVegan: /^(true|yes|1)$/i.test(cells[col('vegan')] ?? ''),
        spicyLevel: Math.min(4, Math.max(0, Number(cells[col('spicylevel')] ?? 0) || 0)),
      };

      const existing = await MenuItem.findOne({ restaurantId: user.restaurantId, slug });
      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        outcome.updated += 1;
      } else {
        await MenuItem.create({
          ...payload,
          restaurantId: user.restaurantId,
          slug,
          sku: slug.toUpperCase().replace(/-/g, '_').slice(0, 24),
          isActive: true,
          isAvailable: true,
        });
        outcome.created += 1;
      }
    }

    return ok(outcome);
  },
);
