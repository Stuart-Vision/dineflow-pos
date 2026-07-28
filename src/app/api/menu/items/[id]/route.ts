import { PERMISSIONS } from '@/constants/permissions';
import { NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { noContent, ok } from '@/lib/api/response';
import { MenuItem } from '@/models/MenuItem';
import { upsertMenuItemSchema, type UpsertMenuItemInput } from '@/validators/operations';

const patchSchema = upsertMenuItemSchema.partial();

export const PATCH = defineRoute<Partial<UpsertMenuItemInput>, { id: string }>(
  { permissions: [PERMISSIONS.MENU_MANAGE], bodySchema: patchSchema },
  async ({ params, body, user }) => {
    const item = await MenuItem.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!item) throw new NotFoundError('Menu item');

    // Only assign what the caller actually sent, so a partial update from the
    // availability toggle cannot blank out unrelated fields.
    for (const [key, value] of Object.entries(body) as [keyof UpsertMenuItemInput, unknown][]) {
      if (value === undefined) continue;
      if (key === 'imageUrl') {
        item.imageUrl = (value as string) || null;
        continue;
      }
      (item as unknown as Record<string, unknown>)[key] = value;
    }

    await item.save();
    return ok(item);
  },
);

export const DELETE = defineRoute<undefined, { id: string }>(
  { permissions: [PERMISSIONS.MENU_MANAGE] },
  async ({ params, user }) => {
    const item = await MenuItem.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!item) throw new NotFoundError('Menu item');
    // Soft delete keeps historical order lines pointing at a real document.
    item.deletedAt = new Date();
    item.isActive = false;
    await item.save();
    return noContent();
  },
);
