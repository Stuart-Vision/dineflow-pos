import { PERMISSIONS } from '@/constants/permissions';
import { ConflictError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { created, ok } from '@/lib/api/response';
import { CashRegister } from '@/models/CashRegister';
import { openRegisterSchema } from '@/validators/operations';

export const GET = defineRoute(
  { permissions: [PERMISSIONS.REGISTER_VIEW] },
  async ({ user, branchId }) => {
    const filter: Record<string, unknown> = { restaurantId: user.restaurantId };
    if (branchId) filter.branchId = branchId;
    if (!user.permissions.includes(PERMISSIONS.REGISTER_VIEW_ALL)) filter.cashierId = user.id;
    const registers = await CashRegister.find(filter).sort({ openedAt: -1 }).limit(25).populate('cashierId', 'name email').lean();
    return ok({ current: registers.find((r) => r.status === 'open') ?? null, history: registers.filter((r) => r.status === 'closed') });
  },
);

export const POST = defineRoute(
  { permissions: [PERMISSIONS.REGISTER_OPEN], bodySchema: openRegisterSchema },
  async ({ body, user, branchId }) => {
    const existing = await CashRegister.exists({ cashierId: user.id, status: 'open' });
    if (existing) throw new ConflictError('You already have an open register.');
    return created(await CashRegister.create({
      restaurantId: user.restaurantId,
      branchId: branchId ?? user.activeBranchId,
      cashierId: user.id,
      openingCashMinor: body.openingCashMinor,
      expectedCashMinor: body.openingCashMinor,
      status: 'open',
    }));
  },
);
