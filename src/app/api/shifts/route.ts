import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { created } from '@/lib/api/response';
import { Shift } from '@/models/Shift';
import { upsertShiftSchema } from '@/validators/operations';

export const POST = defineRoute(
  { permissions: [PERMISSIONS.ATTENDANCE_MANAGE], bodySchema: upsertShiftSchema },
  async ({ body, user, branchId }) => created(await Shift.create({
    restaurantId: user.restaurantId,
    branchId: branchId ?? user.activeBranchId,
    ...body,
    leaveStatus: body.entryType === 'leave' ? body.leaveStatus ?? 'pending' : null,
  })),
);
