import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { LEAVE_STATUS_VALUES, type LeaveStatus } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

/** An employee's scheduled work shift, or a leave request occupying the same calendar. */
export interface IShift {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  employeeId: Types.ObjectId;
  entryType: 'shift' | 'leave';
  date: Date;
  startTime: string;
  endTime: string;
  station: string | null;
  shiftStatus: 'scheduled' | 'completed' | 'missed';
  leaveStatus: LeaveStatus | null;
  leaveReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ShiftDocument = HydratedDocument<IShift>;

const shiftSchema = new Schema<IShift>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    entryType: { type: String, enum: ['shift', 'leave'], default: 'shift' },
    date: { type: Date, required: true },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },
    station: { type: String, default: null },
    shiftStatus: { type: String, enum: ['scheduled', 'completed', 'missed'], default: 'scheduled' },
    leaveStatus: { type: String, enum: LEAVE_STATUS_VALUES, default: null },
    leaveReason: { type: String, default: null },
    notes: { type: String, default: null, maxlength: 300 },
  },
  baseSchemaOptions,
);

shiftSchema.index({ branchId: 1, date: 1 });
shiftSchema.index({ employeeId: 1, date: 1 });

export const Shift: Model<IShift> = mongoose.models.Shift ?? mongoose.model<IShift>('Shift', shiftSchema);
