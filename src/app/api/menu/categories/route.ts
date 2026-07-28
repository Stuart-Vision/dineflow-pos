import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Category } from '@/models/Category';
import { upsertCategorySchema, type UpsertCategoryInput } from '@/validators/operations';

export const POST = defineRoute<UpsertCategoryInput>(
  { permissions: [PERMISSIONS.MENU_MANAGE], bodySchema: upsertCategorySchema },
  async ({ body, user }) => {
    const category = await Category.create({
      restaurantId: user.restaurantId,
      name: body.name,
      slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: body.description,
      icon: body.icon,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    });
    return ok(category, undefined, { status: 201 });
  },
);
