import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { holdOrder } from '@/services/order-service';
import { z } from 'zod';

const bodySchema = z.object({ reason: z.string().max(200).optional() });

export const POST = defineRoute<{ reason?: string }, { id: string }>(
  { permissions: [PERMISSIONS.ORDER_UPDATE], bodySchema },
  async ({ params, branchId, body }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const order = await holdOrder(params.id, branchId, body?.reason);
    return ok(order);
  },
);
