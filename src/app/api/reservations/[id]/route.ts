import { PERMISSIONS } from '@/constants/permissions';
import { ValidationError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { updateReservationStatus } from '@/services/reservation-service';
import { updateReservationStatusSchema, type UpdateReservationStatusInput } from '@/validators/operations';

export const PATCH = defineRoute<UpdateReservationStatusInput, { id: string }>(
  { permissions: [PERMISSIONS.RESERVATION_MANAGE], bodySchema: updateReservationStatusSchema },
  async ({ params, body, branchId }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');
    const reservation = await updateReservationStatus(params.id, branchId, body.status, body.cancelReason);
    return ok(reservation);
  },
);
