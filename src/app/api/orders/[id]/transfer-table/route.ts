import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { transferOrderTable } from '@/services/order-service';
import { transferTableSchema, type TransferTableInput } from '@/validators/order';

export const POST = defineRoute<TransferTableInput, { id: string }>(
  { permissions: [PERMISSIONS.ORDER_TRANSFER], bodySchema: transferTableSchema },
  async ({ params, branchId, body }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const order = await transferOrderTable(params.id, branchId, body.tableId);
    return ok(order);
  },
);
