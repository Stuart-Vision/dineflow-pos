import { PERMISSIONS } from '@/constants/permissions';
import { ValidationError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { createPurchaseOrder, listPurchaseOrders } from '@/services/purchasing-service';
import { createPurchaseOrderSchema, type CreatePurchaseOrderInput } from '@/validators/operations';

export const GET = defineRoute({ permissions: [PERMISSIONS.PURCHASE_VIEW] }, async ({ branchId }) => {
  if (!branchId) throw new ValidationError('Select an active branch to view purchase orders.');
  return ok(await listPurchaseOrders(branchId));
});

export const POST = defineRoute<CreatePurchaseOrderInput>(
  { permissions: [PERMISSIONS.PURCHASE_MANAGE], bodySchema: createPurchaseOrderSchema },
  async ({ body, user, branchId }) => {
    if (!branchId) throw new ValidationError('Select an active branch first.');
    const order = await createPurchaseOrder(body, user, branchId);
    return ok(order, undefined, { status: 201 });
  },
);
