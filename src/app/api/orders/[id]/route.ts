import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { NotFoundError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { Order } from '@/models/Order';

export const GET = defineRoute<undefined, { id: string }>(
  { permissions: [PERMISSIONS.ORDER_VIEW] },
  async ({ params }) => {
    const order = await Order.findById(params.id);
    if (!order) throw new NotFoundError('Order');
    return ok(order);
  },
);
