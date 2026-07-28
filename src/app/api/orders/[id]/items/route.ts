import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ForbiddenError, ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { updateOrderItems } from '@/services/order-service';
import { updateOrderItemsSchema, type UpdateOrderItemsInput } from '@/validators/order';

export const PATCH = defineRoute<UpdateOrderItemsInput, { id: string }>(
  { permissions: [PERMISSIONS.ORDER_UPDATE], bodySchema: updateOrderItemsSchema },
  async ({ body, params, branchId, user }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    if (body.orderDiscount && !user.permissions.includes(PERMISSIONS.POS_APPLY_DISCOUNT)) {
      throw new ForbiddenError('You do not have permission to apply discounts.');
    }
    const order = await updateOrderItems(params.id, body, branchId);
    return ok(order);
  },
);
