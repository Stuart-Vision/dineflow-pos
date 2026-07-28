import { endOfDay, startOfDay, addDays, subDays } from 'date-fns';

import { PERMISSIONS } from '@/constants/permissions';
import { ValidationError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { createReservation, findAvailableTables, listReservations } from '@/services/reservation-service';
import { createReservationSchema, type CreateReservationInput } from '@/validators/operations';

export const GET = defineRoute({ permissions: [PERMISSIONS.RESERVATION_VIEW] }, async ({ branchId, query, url }) => {
  if (!branchId) throw new ValidationError('Select an active branch to view reservations.');

  // Availability probe used by the booking form's table picker.
  const availabilityFor = url.searchParams.get('availableAt');
  if (availabilityFor) {
    const startsAt = new Date(availabilityFor);
    if (Number.isNaN(startsAt.getTime())) throw new ValidationError('That date and time could not be read.');
    const duration = Number(url.searchParams.get('durationMinutes') ?? 90);
    const partySize = Number(url.searchParams.get('partySize') ?? 2);
    const tables = await findAvailableTables(branchId, startsAt, duration, partySize);
    return ok({ tables });
  }

  const from = query.from ? startOfDay(query.from) : startOfDay(subDays(new Date(), 7));
  const to = query.to ? endOfDay(query.to) : endOfDay(addDays(new Date(), 30));

  const reservations = await listReservations(branchId, { from, to });
  return ok(reservations);
});

export const POST = defineRoute<CreateReservationInput>(
  { permissions: [PERMISSIONS.RESERVATION_MANAGE], bodySchema: createReservationSchema },
  async ({ body, user, branchId }) => {
    if (!branchId) throw new ValidationError('Select an active branch first.');
    const reservation = await createReservation(body, user, branchId);
    return ok(reservation, undefined, { status: 201 });
  },
);
