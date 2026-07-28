import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { markOrderReady } from '@/services/order-service';

export const POST = defineRoute<undefined, { id: string }>(
  { permissions: [PERMISSIONS.KITCHEN_UPDATE] },
  async ({ params, branchId }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const order = await markOrderReady(params.id, branchId);
    return ok(order);
  },
);
