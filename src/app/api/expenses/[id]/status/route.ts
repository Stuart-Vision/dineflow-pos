import { PERMISSIONS } from '@/constants/permissions';
import { NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Expense } from '@/models/Expense';
import { expenseStatusSchema, type ExpenseStatusInput } from '@/validators/operations';

type Params = { id: string };
export const PATCH = defineRoute<ExpenseStatusInput, Params>(
  { permissions: [PERMISSIONS.EXPENSE_APPROVE], bodySchema: expenseStatusSchema },
  async ({ params, body, user }) => {
    const expense = await Expense.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!expense) throw new NotFoundError('Expense');
    expense.status = body.status;
    expense.approvedBy = body.status === 'approved' ? user.id as never : null;
    expense.approvedAt = body.status === 'approved' ? new Date() : null;
    expense.rejectionReason = body.status === 'rejected' ? body.rejectionReason ?? null : null;
    await expense.save();
    return ok(expense);
  },
);
