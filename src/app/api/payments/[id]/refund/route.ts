import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { refundPayment } from '@/services/order-service';
import { refundPaymentSchema, type RefundPaymentInput } from '@/validators/order';

export const POST = defineRoute<RefundPaymentInput, { id: string }>(
  { permissions: [PERMISSIONS.PAYMENT_REFUND], bodySchema: refundPaymentSchema },
  async ({ params, branchId, body, user }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const result = await refundPayment(params.id, branchId, body, user);
    return ok(result, undefined, { status: 201 });
  },
);
