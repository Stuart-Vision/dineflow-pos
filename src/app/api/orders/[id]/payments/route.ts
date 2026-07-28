import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { Payment } from '@/models/Payment';
import { addPayment } from '@/services/order-service';
import { createPaymentSchema, type CreatePaymentInput } from '@/validators/order';

export const GET = defineRoute<undefined, { id: string }>(
  { permissions: [PERMISSIONS.PAYMENT_VIEW] },
  async ({ params }) => {
    const payments = await Payment.find({ orderId: params.id }).sort({ createdAt: 1 }).lean();
    return ok(payments);
  },
);

export const POST = defineRoute<CreatePaymentInput, { id: string }>(
  { permissions: [PERMISSIONS.PAYMENT_CREATE], bodySchema: createPaymentSchema },
  async ({ params, branchId, body, user }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const result = await addPayment(params.id, branchId, body, user);
    return ok(result, undefined, { status: 201 });
  },
);
