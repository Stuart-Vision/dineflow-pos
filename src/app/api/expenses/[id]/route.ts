import { PERMISSIONS } from '@/constants/permissions';
import { NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { noContent, ok } from '@/lib/api/response';
import { Expense } from '@/models/Expense';
import { upsertExpenseSchema, type UpsertExpenseInput } from '@/validators/operations';

type Params = { id: string };
export const PATCH = defineRoute<Partial<UpsertExpenseInput>, Params>(
  { permissions: [PERMISSIONS.EXPENSE_MANAGE], bodySchema: upsertExpenseSchema.partial() },
  async ({ params, body, user }) => {
    const expense = await Expense.findOneAndUpdate({ _id: params.id, restaurantId: user.restaurantId }, body, { new: true }).lean();
    if (!expense) throw new NotFoundError('Expense');
    return ok(expense);
  },
);
export const DELETE = defineRoute<undefined, Params>(
  { permissions: [PERMISSIONS.EXPENSE_MANAGE] },
  async ({ params, user }) => {
    const expense = await Expense.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!expense) throw new NotFoundError('Expense');
    expense.deletedAt = new Date();
    await expense.save();
    return noContent();
  },
);
