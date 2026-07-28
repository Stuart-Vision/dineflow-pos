import type { Types } from 'mongoose';

import { RESERVATION_STATUS, TABLE_STATUS, type ReservationStatus } from '@/constants/enums';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/api/errors';
import type { SessionUser } from '@/lib/auth/session';
import { sendMail } from '@/lib/notify/mail';
import { Customer } from '@/models/Customer';
import { Reservation, type ReservationDocument } from '@/models/Reservation';
import { Table } from '@/models/Table';
import type { CreateReservationInput } from '@/validators/operations';

/** Statuses that still hold a table for its slot. */
const BLOCKING_STATUSES: ReservationStatus[] = [
  RESERVATION_STATUS.PENDING,
  RESERVATION_STATUS.CONFIRMED,
  RESERVATION_STATUS.SEATED,
];

/**
 * A table can hold one party per overlapping window. Two reservations overlap
 * when each starts before the other ends, which is what the $expr below
 * expresses against the stored start time plus its duration.
 */
export async function assertNoTableConflict(
  branchId: string | Types.ObjectId,
  tableId: string,
  startsAt: Date,
  durationMinutes: number,
  excludeReservationId?: string,
): Promise<void> {
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  const conflict = await Reservation.findOne({
    branchId,
    tableId,
    status: { $in: BLOCKING_STATUSES },
    ...(excludeReservationId ? { _id: { $ne: excludeReservationId } } : {}),
    reservationDate: { $lt: endsAt },
    $expr: {
      $gt: [
        { $add: ['$reservationDate', { $multiply: ['$durationMinutes', 60000] }] },
        startsAt,
      ],
    },
  }).lean();

  if (conflict) {
    throw new ConflictError(
      `That table is already reserved for ${conflict.guestName} in an overlapping slot. Pick another table or time.`,
      { conflictingReservationId: String(conflict._id) },
    );
  }
}

export async function createReservation(
  input: CreateReservationInput,
  user: SessionUser,
  branchId: string,
): Promise<ReservationDocument> {
  if (input.tableId) {
    const table = await Table.findOne({ _id: input.tableId, branchId });
    if (!table) throw new NotFoundError('Table');
    if (table.capacity < input.partySize) {
      throw new ValidationError(`Table ${table.label} seats ${table.capacity}, which is fewer than the party of ${input.partySize}.`);
    }
    await assertNoTableConflict(branchId, input.tableId, input.reservationDate, input.durationMinutes);
  }

  const reservation = await Reservation.create({
    restaurantId: user.restaurantId,
    branchId,
    customerId: input.customerId ?? null,
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    guestEmail: input.guestEmail || undefined,
    reservationDate: input.reservationDate,
    durationMinutes: input.durationMinutes,
    partySize: input.partySize,
    tableId: input.tableId ?? null,
    status: RESERVATION_STATUS.PENDING,
    specialRequests: input.specialRequests ?? null,
    depositMinor: input.depositMinor,
    createdBy: user.id,
  });

  if (input.guestEmail) {
    // Simulated confirmation — the log driver keeps the demo self-contained.
    await sendMail({
      to: input.guestEmail,
      subject: `Your reservation at DineFlow is pending confirmation`,
      body: `Hi ${input.guestName},\n\nWe have your request for ${input.partySize} guests. We'll confirm shortly.`,
    });
  }

  return reservation;
}

export async function updateReservationStatus(
  reservationId: string,
  branchId: string,
  status: ReservationStatus,
  cancelReason: string | undefined,
): Promise<ReservationDocument> {
  const reservation = await Reservation.findOne({ _id: reservationId, branchId });
  if (!reservation) throw new NotFoundError('Reservation');

  const now = new Date();
  reservation.status = status;

  if (status === RESERVATION_STATUS.CONFIRMED) reservation.confirmedAt = now;
  if (status === RESERVATION_STATUS.SEATED) {
    reservation.seatedAt = now;
    // Seating a party takes the table out of circulation immediately.
    if (reservation.tableId) {
      await Table.updateOne(
        { _id: reservation.tableId, branchId },
        { $set: { status: TABLE_STATUS.OCCUPIED, currentCustomerId: reservation.customerId ?? null } },
      );
    }
  }
  if (status === RESERVATION_STATUS.COMPLETED) {
    reservation.completedAt = now;
    if (reservation.tableId) {
      await Table.updateOne({ _id: reservation.tableId, branchId }, { $set: { status: TABLE_STATUS.CLEANING } });
    }
  }
  if (status === RESERVATION_STATUS.CANCELLED || status === RESERVATION_STATUS.NO_SHOW) {
    reservation.cancelledAt = now;
    reservation.cancelReason = cancelReason ?? null;
    if (reservation.tableId) {
      await Table.updateOne(
        { _id: reservation.tableId, branchId, status: TABLE_STATUS.RESERVED },
        { $set: { status: TABLE_STATUS.AVAILABLE } },
      );
    }
  }

  await reservation.save();
  return reservation;
}

export interface ReservationListItem {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  reservationDate: string;
  durationMinutes: number;
  partySize: number;
  tableLabel: string | null;
  tableId: string | null;
  status: ReservationStatus;
  specialRequests: string | null;
  depositMinor: number;
  depositPaid: boolean;
  customerName: string | null;
}

export async function listReservations(
  branchId: string,
  range: { from: Date; to: Date },
): Promise<ReservationListItem[]> {
  const reservations = await Reservation.find({
    branchId,
    reservationDate: { $gte: range.from, $lte: range.to },
  })
    .sort({ reservationDate: 1 })
    .lean();

  const tableIds = reservations.map((r) => r.tableId).filter(Boolean);
  const customerIds = reservations.map((r) => r.customerId).filter(Boolean);

  const [tables, customers] = await Promise.all([
    tableIds.length ? Table.find({ _id: { $in: tableIds } }).select('label').lean() : [],
    customerIds.length ? Customer.find({ _id: { $in: customerIds } }).select('name').lean() : [],
  ]);

  const tableLabelById = new Map(tables.map((t) => [String(t._id), t.label]));
  const customerNameById = new Map(customers.map((c) => [String(c._id), c.name]));

  return reservations.map((r) => ({
    id: String(r._id),
    guestName: r.guestName,
    guestPhone: r.guestPhone,
    guestEmail: r.guestEmail,
    reservationDate: new Date(r.reservationDate).toISOString(),
    durationMinutes: r.durationMinutes,
    partySize: r.partySize,
    tableId: r.tableId ? String(r.tableId) : null,
    tableLabel: r.tableId ? (tableLabelById.get(String(r.tableId)) ?? null) : null,
    status: r.status,
    specialRequests: r.specialRequests,
    depositMinor: r.depositMinor,
    depositPaid: r.depositPaid,
    customerName: r.customerId ? (customerNameById.get(String(r.customerId)) ?? null) : null,
  }));
}

/** Tables that can seat `partySize` with no overlapping booking in the slot. */
export async function findAvailableTables(
  branchId: string,
  startsAt: Date,
  durationMinutes: number,
  partySize: number,
): Promise<Array<{ id: string; label: string; capacity: number }>> {
  const candidates = await Table.find({
    branchId,
    capacity: { $gte: partySize },
    status: { $ne: TABLE_STATUS.OUT_OF_SERVICE },
  })
    .sort({ capacity: 1 })
    .lean();

  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const clashes = await Reservation.find({
    branchId,
    status: { $in: BLOCKING_STATUSES },
    tableId: { $in: candidates.map((t) => t._id) },
    reservationDate: { $lt: endsAt },
    $expr: {
      $gt: [{ $add: ['$reservationDate', { $multiply: ['$durationMinutes', 60000] }] }, startsAt],
    },
  })
    .select('tableId')
    .lean();

  const taken = new Set(clashes.map((c) => String(c.tableId)));
  return candidates
    .filter((t) => !taken.has(String(t._id)))
    .map((t) => ({ id: String(t._id), label: t.label, capacity: t.capacity }));
}
