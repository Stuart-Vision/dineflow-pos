import { PERMISSIONS } from '@/constants/permissions';
import { ValidationError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Supplier } from '@/models/Supplier';
import { listSuppliers } from '@/services/purchasing-service';
import { upsertSupplierSchema, type UpsertSupplierInput } from '@/validators/operations';

export const GET = defineRoute({ permissions: [PERMISSIONS.SUPPLIER_VIEW] }, async ({ user }) => {
  if (!user.restaurantId) throw new ValidationError('No restaurant scope on this account.');
  return ok(await listSuppliers(user.restaurantId));
});

export const POST = defineRoute<UpsertSupplierInput>(
  { permissions: [PERMISSIONS.SUPPLIER_MANAGE], bodySchema: upsertSupplierSchema },
  async ({ body, user }) => {
    const supplier = await Supplier.create({
      restaurantId: user.restaurantId,
      name: body.name,
      contactPerson: body.contactPerson,
      phone: body.phone,
      email: body.email || undefined,
      address: body.address,
      categories: body.categories,
      paymentTermsDays: body.paymentTermsDays,
      rating: body.rating,
      notes: body.notes,
      isActive: body.isActive,
    });
    return ok(supplier, undefined, { status: 201 });
  },
);
