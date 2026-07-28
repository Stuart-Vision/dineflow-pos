import { PERMISSIONS } from '@/constants/permissions';
import { NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { noContent, ok } from '@/lib/api/response';
import { Supplier } from '@/models/Supplier';
import { upsertSupplierSchema, type UpsertSupplierInput } from '@/validators/operations';

const patchSchema = upsertSupplierSchema.partial();

export const PATCH = defineRoute<Partial<UpsertSupplierInput>, { id: string }>(
  { permissions: [PERMISSIONS.SUPPLIER_MANAGE], bodySchema: patchSchema },
  async ({ params, body, user }) => {
    const supplier = await Supplier.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!supplier) throw new NotFoundError('Supplier');

    for (const [key, value] of Object.entries(body) as [keyof UpsertSupplierInput, unknown][]) {
      if (value === undefined) continue;
      if (key === 'email') {
        supplier.email = (value as string) || undefined;
        continue;
      }
      (supplier as unknown as Record<string, unknown>)[key] = value;
    }

    await supplier.save();
    return ok(supplier);
  },
);

export const DELETE = defineRoute<undefined, { id: string }>(
  { permissions: [PERMISSIONS.SUPPLIER_MANAGE] },
  async ({ params, user }) => {
    const supplier = await Supplier.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!supplier) throw new NotFoundError('Supplier');
    // Soft delete so historical purchase orders keep resolving their supplier.
    supplier.deletedAt = new Date();
    supplier.isActive = false;
    await supplier.save();
    return noContent();
  },
);
