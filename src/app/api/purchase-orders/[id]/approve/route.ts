import { PERMISSIONS } from '@/constants/permissions';
import { ValidationError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { approvePurchaseOrder } from '@/services/purchasing-service';

export const POST = defineRoute<undefined, { id: string }>(
  { permissions: [PERMISSIONS.PURCHASE_APPROVE] },
  async ({ params, branchId, user }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const order = await approvePurchaseOrder(params.id, branchId, user);
    return ok(order);
  },
);
