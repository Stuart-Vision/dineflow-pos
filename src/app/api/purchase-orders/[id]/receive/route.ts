import { PERMISSIONS } from '@/constants/permissions';
import { ValidationError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { receivePurchaseOrder } from '@/services/purchasing-service';
import { receivePurchaseOrderSchema, type ReceivePurchaseOrderInput } from '@/validators/operations';

export const POST = defineRoute<ReceivePurchaseOrderInput, { id: string }>(
  { permissions: [PERMISSIONS.PURCHASE_RECEIVE], bodySchema: receivePurchaseOrderSchema },
  async ({ params, body, branchId, user }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const result = await receivePurchaseOrder(params.id, branchId, body, user);
    return ok(result);
  },
);
