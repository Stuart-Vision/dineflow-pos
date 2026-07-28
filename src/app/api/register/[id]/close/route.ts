import { PERMISSIONS } from '@/constants/permissions';
import { ConflictError, NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { CashRegister } from '@/models/CashRegister';
import { closeRegisterSchema, type CloseRegisterInput } from '@/validators/operations';

type Params = { id: string };
export const POST = defineRoute<CloseRegisterInput, Params>(
  { permissions: [PERMISSIONS.REGISTER_CLOSE], bodySchema: closeRegisterSchema },
  async ({ params, body, user }) => {
    const register = await CashRegister.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!register) throw new NotFoundError('Cash register');
    if (register.status !== 'open') throw new ConflictError('This register is already closed.');
    register.status = 'closed';
    register.closedAt = new Date();
    register.closingCashActualMinor = body.closingCashActualMinor;
    register.cashDifferenceMinor = body.closingCashActualMinor - register.expectedCashMinor;
    register.closingNotes = body.closingNotes ?? null;
    await register.save();
    return ok(register);
  },
);
