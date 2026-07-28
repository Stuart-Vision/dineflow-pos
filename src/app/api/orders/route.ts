import type { FilterQuery } from 'mongoose';

import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { buildPaginationMeta, ok } from '@/lib/api/response';
import { filterValue, skipFor } from '@/lib/api/query';
import { ForbiddenError, ValidationError } from '@/lib/api/errors';
import type { IOrder } from '@/models/Order';
import { Order } from '@/models/Order';
import { createOrder } from '@/services/order-service';
import { createOrderSchema } from '@/validators/order';

export const GET = defineRoute({ permissions: [PERMISSIONS.ORDER_VIEW] }, async ({ user, query, branchId }) => {
  const filter: FilterQuery<IOrder> = {};
  if (user.restaurantId) filter.restaurantId = user.restaurantId;
  if (branchId) filter.branchId = branchId;
  else if (!user.permissions.includes(PERMISSIONS.ORDER_VIEW_ALL)) filter.branchId = { $in: user.branchIds };

  const status = filterValue(query, 'status');
  if (status) filter.status = status;
  const type = filterValue(query, 'type');
  if (type) filter.type = type;
  if (query.search) filter.orderNumber = { $regex: query.search, $options: 'i' };
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = query.from;
    if (query.to) filter.createdAt.$lte = query.to;
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skipFor(query)).limit(query.pageSize),
    Order.countDocuments(filter),
  ]);

  return ok(items, { ...buildPaginationMeta(query.page, query.pageSize, total) });
});

export const POST = defineRoute(
  { permissions: [PERMISSIONS.POS_ACCESS, PERMISSIONS.ORDER_CREATE], bodySchema: createOrderSchema },
  async ({ body, user, branchId }) => {
    if (!branchId) throw new ValidationError('Select an active branch before creating an order.');
    if (body.orderDiscount && !user.permissions.includes(PERMISSIONS.POS_APPLY_DISCOUNT)) {
      throw new ForbiddenError('You do not have permission to apply discounts.');
    }
    const order = await createOrder(body, user, branchId);
    return ok(order, undefined, { status: 201 });
  },
);
