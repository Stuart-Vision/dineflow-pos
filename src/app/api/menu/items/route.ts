import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { MenuItem } from '@/models/MenuItem';
import { upsertMenuItemSchema, type UpsertMenuItemInput } from '@/validators/operations';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const POST = defineRoute<UpsertMenuItemInput>(
  { permissions: [PERMISSIONS.MENU_MANAGE], bodySchema: upsertMenuItemSchema },
  async ({ body, user }) => {
    const slug = slugify(body.name);
    const item = await MenuItem.create({
      restaurantId: user.restaurantId,
      categoryId: body.categoryId,
      name: body.name,
      slug,
      sku: slug.toUpperCase().replace(/-/g, '_').slice(0, 24),
      description: body.description,
      imageUrl: body.imageUrl || null,
      priceMinor: body.priceMinor,
      costPriceMinor: body.costPriceMinor,
      kitchenStation: body.kitchenStation,
      preparationTimeMinutes: body.preparationTimeMinutes,
      isVegetarian: body.isVegetarian,
      isVegan: body.isVegan,
      isFeatured: body.isFeatured,
      isBestSeller: body.isBestSeller,
      spicyLevel: body.spicyLevel,
      isActive: body.isActive,
      isAvailable: body.isAvailable,
    });
    return ok(item, undefined, { status: 201 });
  },
);
