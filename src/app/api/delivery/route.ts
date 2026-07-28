import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Order } from '@/models/Order';
import { Employee } from '@/models/Employee';

export const GET = defineRoute({ permissions: [PERMISSIONS.DELIVERY_VIEW] }, async ({ user, branchId }) => {
  const filter: Record<string, unknown> = { restaurantId: user.restaurantId, type: 'delivery' };
  if (branchId) filter.branchId = branchId;
  const [orders, drivers] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).limit(100).populate('customerId', 'name phone').populate('delivery.driverId', 'name phone').lean(),
    Employee.find({ restaurantId: user.restaurantId, ...(branchId ? { branchId } : {}), employmentStatus: 'active', $or: [{ jobTitle: /driver/i }, { department: /delivery/i }] }).select('name phone jobTitle').lean(),
  ]);
  return ok({ orders, drivers });
});
