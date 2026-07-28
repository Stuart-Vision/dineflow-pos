import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_VALUES, type AttendanceStatus } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface IAttendance {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  employeeId: Types.ObjectId;
  date: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  breakMinutes: number;
  hoursWorked: number;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceDocument = HydratedDocument<IAttendance>;

const attendanceSchema = new Schema<IAttendance>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: Date, required: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    breakMinutes: { type: Number, default: 0 },
    hoursWorked: { type: Number, default: 0 },
    status: { type: String, enum: ATTENDANCE_STATUS_VALUES, default: ATTENDANCE_STATUS.PRESENT },
    notes: { type: String, default: null, maxlength: 300 },
  },
  baseSchemaOptions,
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ branchId: 1, date: 1 });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ?? mongoose.model<IAttendance>('Attendance', attendanceSchema);
