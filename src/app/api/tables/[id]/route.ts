import { PERMISSIONS } from '@/constants/permissions';
import { ConflictError, NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { noContent, ok } from '@/lib/api/response';
import { OPEN_ORDER_STATUSES, TABLE_STATUS } from '@/constants/enums';
import { Order } from '@/models/Order';
import { Table } from '@/models/Table';
import { updateTableSchema, type UpdateTableInput } from '@/validators/operations';

export const PATCH = defineRoute<UpdateTableInput, { id: string }>(
  { permissions: [PERMISSIONS.TABLE_MANAGE], bodySchema: updateTableSchema },
  async ({ params, body, branchId }) => {
    const table = await Table.findOne({ _id: params.id, branchId });
    if (!table) throw new NotFoundError('Table');

    if (body.label !== undefined) table.label = body.label;
    if (body.section !== undefined) table.section = body.section;
    if (body.capacity !== undefined) table.capacity = body.capacity;
    if (body.shape !== undefined) table.shape = body.shape;
    if (body.positionX !== undefined) table.positionX = body.positionX;
    if (body.positionY !== undefined) table.positionY = body.positionY;
    if (body.assignedWaiterId !== undefined) {
      table.assignedWaiterId = body.assignedWaiterId ? (body.assignedWaiterId as unknown as typeof table.assignedWaiterId) : null;
    }

    if (body.status !== undefined) {
      // Freeing a table that still has an open order would orphan that order.
      if (body.status === TABLE_STATUS.AVAILABLE && table.currentOrderId) {
        const openOrder = await Order.findOne({ _id: table.currentOrderId, status: { $in: OPEN_ORDER_STATUSES } });
        if (openOrder) {
          throw new ConflictError(`Table ${table.label} still has open order ${openOrder.orderNumber}. Settle or move it first.`);
        }
        table.currentOrderId = null;
        table.currentCustomerId = null;
      }
      table.status = body.status;
      if (body.status === TABLE_STATUS.AVAILABLE) table.lastCleanedAt = new Date();
    }

    await table.save();
    return ok(table);
  },
);

export const DELETE = defineRoute<undefined, { id: string }>(
  { permissions: [PERMISSIONS.TABLE_MANAGE] },
  async ({ params, branchId }) => {
    const table = await Table.findOne({ _id: params.id, branchId });
    if (!table) throw new NotFoundError('Table');
    if (table.currentOrderId) throw new ConflictError('Clear the table before deleting it.');

    table.deletedAt = new Date();
    await table.save();
    return noContent();
  },
);
