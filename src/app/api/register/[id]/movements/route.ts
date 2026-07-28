import { PERMISSIONS } from '@/constants/permissions';
import { ConflictError, NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { CashRegister } from '@/models/CashRegister';
import { cashMovementSchema, type CashMovementInput } from '@/validators/operations';

type Params = { id: string };
export const POST = defineRoute<CashMovementInput, Params>(
  { permissions: [PERMISSIONS.REGISTER_OPEN], bodySchema: cashMovementSchema },
  async ({ params, body, user }) => {
    const register = await CashRegister.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!register) throw new NotFoundError('Cash register');
    if (register.status !== 'open') throw new ConflictError('This register is closed.');
    register.cashMovements.push({ ...body, performedBy: user.id as never, createdAt: new Date() });
    if (body.type === 'paid_in') register.paidInMinor += body.amountMinor;
    else register.paidOutMinor += body.amountMinor;
    register.expectedCashMinor = register.openingCashMinor + register.cashSalesMinor + register.paidInMinor - register.paidOutMinor - register.refundsMinor;
    await register.save();
    return ok(register);
  },
);
