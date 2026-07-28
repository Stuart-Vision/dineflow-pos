import { OPEN_ORDER_STATUSES } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { Order } from '@/models/Order';
import { Table } from '@/models/Table';
import { User } from '@/models/User';
import { createTableSchema, type CreateTableInput } from '@/validators/operations';

export const GET = defineRoute({ permissions: [PERMISSIONS.TABLE_VIEW] }, async ({ branchId, url }) => {
  if (!branchId) throw new ValidationError('Select an active branch to view tables.');

  const tables = await Table.find({ branchId }).sort({ label: 1 }).lean();

  // The floor plan needs each occupied table's live order and its waiter; the
  // POS only needs the bare list, so this is opt-in via ?expand=orders.
  if (url.searchParams.get('expand') !== 'orders') return ok(tables);

  const orderIds = tables.map((t) => t.currentOrderId).filter(Boolean);
  const waiterIds = tables.map((t) => t.assignedWaiterId).filter(Boolean);

  const [orders, waiters] = await Promise.all([
    orderIds.length
      ? Order.find({ _id: { $in: orderIds }, status: { $in: OPEN_ORDER_STATUSES } })
          .select('orderNumber status grandTotalMinor items createdAt')
          .lean()
      : [],
    waiterIds.length ? User.find({ _id: { $in: waiterIds } }).select('name').lean() : [],
  ]);

  const orderById = new Map(orders.map((o) => [String(o._id), o]));
  const waiterById = new Map(waiters.map((w) => [String(w._id), w.name]));

  return ok(
    tables.map((table) => {
      const order = table.currentOrderId ? orderById.get(String(table.currentOrderId)) : undefined;
      return {
        ...table,
        currentOrder: order
          ? {
              id: String(order._id),
              orderNumber: order.orderNumber,
              status: order.status,
              grandTotalMinor: order.grandTotalMinor,
              itemCount: order.items.length,
              createdAt: order.createdAt,
            }
          : null,
        assignedWaiterName: table.assignedWaiterId ? (waiterById.get(String(table.assignedWaiterId)) ?? null) : null,
      };
    }),
  );
});

export const POST = defineRoute<CreateTableInput>(
  { permissions: [PERMISSIONS.TABLE_MANAGE], bodySchema: createTableSchema },
  async ({ body, branchId, user }) => {
    if (!branchId) throw new ValidationError('Select an active branch first.');
    const table = await Table.create({
      restaurantId: user.restaurantId,
      branchId,
      label: body.label,
      section: body.section,
      capacity: body.capacity,
      shape: body.shape,
      positionX: body.positionX,
      positionY: body.positionY,
    });
    return ok(table, undefined, { status: 201 });
  },
);
