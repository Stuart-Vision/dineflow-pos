import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { markOrderServed } from '@/services/order-service';

export const POST = defineRoute<undefined, { id: string }>(
  { anyPermission: [PERMISSIONS.ORDER_UPDATE, PERMISSIONS.KITCHEN_UPDATE] },
  async ({ params, branchId }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const order = await markOrderServed(params.id, branchId);
    return ok(order);
  },
);
