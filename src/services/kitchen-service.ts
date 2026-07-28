import type { FilterQuery, Types } from 'mongoose';

import { ORDER_ITEM_STATUS, ORDER_STATUS, type OrderStatus } from '@/constants/enums';
import { Branch } from '@/models/Branch';
import { Order, type IOrder } from '@/models/Order';
import { Table } from '@/models/Table';
import { User } from '@/models/User';

/** Statuses a ticket passes through while it is the kitchen's problem. */
export const KITCHEN_STATUSES: OrderStatus[] = [
  ORDER_STATUS.SUBMITTED,
  ORDER_STATUS.KITCHEN_ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
];

export interface KitchenTicketItem {
  id: string;
  name: string;
  portionName: string | null;
  quantity: number;
  modifiers: { name: string; quantity: number }[];
  notes: string | null;
  kitchenStation: string;
  status: string;
}

export interface KitchenTicket {
  id: string;
  orderNumber: string;
  type: string;
  status: OrderStatus;
  priority: string;
  tableLabel: string | null;
  waiterName: string | null;
  items: KitchenTicketItem[];
  /** Minutes since the ticket was sent to the kitchen. */
  waitingMinutes: number;
  submittedAt: string | null;
  createdAt: string;
}

export interface KitchenBoard {
  tickets: KitchenTicket[];
  servedToday: number;
  /** Signature used by the SSE stream to detect a real change cheaply. */
  revision: string;
}

export async function getKitchenBoard(branchIds: Types.ObjectId[] | string[]): Promise<KitchenBoard> {
  const filter: FilterQuery<IOrder> = {
    branchId: { $in: branchIds },
    status: { $in: KITCHEN_STATUSES },
  };

  const orders = await Order.find(filter).sort({ createdAt: 1 }).lean();

  const tableIds = orders.map((o) => o.tableId).filter((id): id is Types.ObjectId => Boolean(id));
  const waiterIds = orders.map((o) => o.waiterId).filter((id): id is Types.ObjectId => Boolean(id));

  const [tables, waiters, servedToday] = await Promise.all([
    tableIds.length ? Table.find({ _id: { $in: tableIds } }).select('label').lean() : [],
    waiterIds.length ? User.find({ _id: { $in: waiterIds } }).select('name').lean() : [],
    Order.countDocuments({
      branchId: { $in: branchIds },
      readyAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  const tableLabelById = new Map(tables.map((t) => [String(t._id), t.label]));
  const waiterNameById = new Map(waiters.map((w) => [String(w._id), w.name]));
  const now = Date.now();

  const tickets: KitchenTicket[] = orders.map((order) => {
    const since = order.submittedAt ?? order.createdAt;
    return {
      id: String(order._id),
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      priority: order.priority,
      tableLabel: order.tableId ? (tableLabelById.get(String(order.tableId)) ?? null) : null,
      waiterName: order.waiterId ? (waiterNameById.get(String(order.waiterId)) ?? null) : null,
      items: order.items
        .filter((item) => item.status !== ORDER_ITEM_STATUS.CANCELLED)
        .map((item) => ({
          id: String(item._id),
          name: item.name,
          portionName: item.portionName,
          quantity: item.quantity,
          modifiers: item.modifiers.map((m) => ({ name: m.name, quantity: m.quantity })),
          notes: item.notes,
          kitchenStation: item.kitchenStation,
          status: item.status,
        })),
      waitingMinutes: Math.max(0, Math.floor((now - new Date(since).getTime()) / 60_000)),
      submittedAt: order.submittedAt ? new Date(order.submittedAt).toISOString() : null,
      createdAt: new Date(order.createdAt).toISOString(),
    };
  });

  // Cheap change signature: id + status + per-item status. Anything the board
  // renders that can change is folded in, so the stream never pushes a no-op.
  const revision = tickets
    .map((t) => `${t.id}:${t.status}:${t.items.map((i) => i.status).join(',')}`)
    .join('|');

  return { tickets, servedToday, revision };
}

export async function resolveKitchenBranchIds(
  restaurantId: string | null,
  branchIds: string[],
  requestedBranchId: string | null,
): Promise<string[]> {
  if (requestedBranchId) return [requestedBranchId];
  if (branchIds.length > 0) return branchIds;
  if (!restaurantId) return [];
  const branches = await Branch.find({ restaurantId }).select('_id').lean();
  return branches.map((b) => String(b._id));
}
