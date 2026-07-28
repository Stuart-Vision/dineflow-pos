import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { buildPaginationMeta, created, ok } from '@/lib/api/response';
import { buildSort, filterValue, skipFor } from '@/lib/api/query';
import { Expense } from '@/models/Expense';
import { upsertExpenseSchema } from '@/validators/operations';

export const GET = defineRoute(
  { permissions: [PERMISSIONS.EXPENSE_VIEW], defaultSortBy: 'expenseDate' },
  async ({ user, branchId, query }) => {
    const filter: Record<string, unknown> = { restaurantId: user.restaurantId, deletedAt: null };
    if (branchId) filter.branchId = branchId;
    if (query.from || query.to) filter.expenseDate = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
    for (const key of ['category', 'status', 'paymentMethod'] as const) {
      const value = filterValue(query, key);
      if (value) filter[key] = value;
    }
    if (query.search) filter.$or = [
      { description: { $regex: query.search, $options: 'i' } },
      { referenceNumber: { $regex: query.search, $options: 'i' } },
    ];
    const [items, total, summary] = await Promise.all([
      Expense.find(filter).sort(buildSort(query, ['expenseDate', 'amountMinor', 'category'], { expenseDate: -1 }))
        .skip(skipFor(query)).limit(query.pageSize).populate('requestedBy', 'name').populate('approvedBy', 'name').lean(),
      Expense.countDocuments(filter),
      Expense.aggregate<{ _id: string; amountMinor: number; count: number }>([
        { $match: filter },
        { $group: { _id: '$status', amountMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
      ]),
    ]);
    return ok({ items, summary }, { ...buildPaginationMeta(query.page, query.pageSize, total) });
  },
);

export const POST = defineRoute(
  { permissions: [PERMISSIONS.EXPENSE_MANAGE], bodySchema: upsertExpenseSchema },
  async ({ body, user, branchId }) => created(await Expense.create({
    restaurantId: user.restaurantId,
    branchId: branchId ?? user.activeBranchId,
    ...body,
    requestedBy: user.id,
    status: 'pending_approval',
  })),
);
