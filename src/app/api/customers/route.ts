import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { buildPaginationMeta, ok } from '@/lib/api/response';
import { skipFor } from '@/lib/api/query';
import { Customer } from '@/models/Customer';
import { upsertCustomerSchema } from '@/validators/operations';

export const GET = defineRoute({ permissions: [PERMISSIONS.CUSTOMER_VIEW] }, async ({ user, query }) => {
  const filter: Record<string, unknown> = { restaurantId: user.restaurantId, deletedAt: null };
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ name: 1 }).skip(skipFor(query)).limit(query.pageSize).lean(),
    Customer.countDocuments(filter),
  ]);

  return ok(items, { ...buildPaginationMeta(query.page, query.pageSize, total) });
});

export const POST = defineRoute(
  { permissions: [PERMISSIONS.CUSTOMER_MANAGE], bodySchema: upsertCustomerSchema },
  async ({ body, user }) => {
    const customer = await Customer.create({
      restaurantId: user.restaurantId,
      ...body,
      email: body.email || undefined,
    });
    return ok(customer, undefined, { status: 201 });
  },
);
