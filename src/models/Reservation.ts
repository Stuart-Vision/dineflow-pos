import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { RESERVATION_STATUS, RESERVATION_STATUS_VALUES, type ReservationStatus } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface IReservation {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  customerId: Types.ObjectId | null;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  reservationDate: Date;
  durationMinutes: number;
  partySize: number;
  tableId: Types.ObjectId | null;
  status: ReservationStatus;
  specialRequests: string | null;
  depositMinor: number;
  depositPaid: boolean;
  notes: string | null;
  reminderSentAt: Date | null;
  confirmedAt: Date | null;
  seatedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ReservationDocument = HydratedDocument<IReservation>;

const reservationSchema = new Schema<IReservation>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    guestName: { type: String, required: true, trim: true },
    guestPhone: { type: String, required: true, trim: true },
    guestEmail: { type: String, trim: true, lowercase: true },
    reservationDate: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 90 },
    partySize: { type: Number, required: true, min: 1 },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', default: null },
    status: {
      type: String,
      enum: RESERVATION_STATUS_VALUES,
      default: RESERVATION_STATUS.PENDING,
      index: true,
    },
    specialRequests: { type: String, default: null, maxlength: 500 },
    depositMinor: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
    notes: { type: String, default: null, maxlength: 500 },
    reminderSentAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    seatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions,
);

reservationSchema.index({ branchId: 1, reservationDate: 1 });
reservationSchema.index({ branchId: 1, tableId: 1, reservationDate: 1 });

export const Reservation: Model<IReservation> =
  mongoose.models.Reservation ?? mongoose.model<IReservation>('Reservation', reservationSchema);
