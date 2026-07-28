import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { voidPayment } from '@/services/order-service';
import { reasonSchema, type ReasonInput } from '@/validators/order';

export const POST = defineRoute<ReasonInput, { id: string }>(
  { permissions: [PERMISSIONS.PAYMENT_VOID], bodySchema: reasonSchema },
  async ({ params, branchId, body, user }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const payment = await voidPayment(params.id, branchId, body.reason, user);
    return ok(payment);
  },
);
