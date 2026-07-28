import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import {
  EMPLOYMENT_STATUS,
  EMPLOYMENT_STATUS_VALUES,
  EMPLOYMENT_TYPE,
  EMPLOYMENT_TYPE_VALUES,
  type EmploymentStatus,
  type EmploymentType,
} from '@/constants/enums';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface IEmployee extends SoftDelete {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  /** Linked User account, when this employee also signs in to the system. */
  userId: Types.ObjectId | null;
  employeeCode: string;
  name: string;
  jobTitle: string;
  department: string;
  phone: string;
  email?: string;
  address?: string;
  hireDate: Date;
  terminationDate: Date | null;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  salaryType: 'monthly' | 'hourly';
  monthlySalaryMinor: number;
  hourlyRateMinor: number;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type EmployeeDocument = HydratedDocument<IEmployee>;

const employeeSchema = new Schema<IEmployee>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    employeeCode: { type: String, required: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    jobTitle: { type: String, required: true, trim: true },
    department: { type: String, default: 'Operations', trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    hireDate: { type: Date, required: true },
    terminationDate: { type: Date, default: null },
    employmentType: { type: String, enum: EMPLOYMENT_TYPE_VALUES, default: EMPLOYMENT_TYPE.FULL_TIME },
    employmentStatus: {
      type: String,
      enum: EMPLOYMENT_STATUS_VALUES,
      default: EMPLOYMENT_STATUS.ACTIVE,
    },
    salaryType: { type: String, enum: ['monthly', 'hourly'], default: 'monthly' },
    monthlySalaryMinor: { type: Number, default: 0, select: false },
    hourlyRateMinor: { type: Number, default: 0, select: false },
    emergencyContactName: { type: String, default: null },
    emergencyContactPhone: { type: String, default: null },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

employeeSchema.index({ restaurantId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ branchId: 1, employmentStatus: 1 });
applyNotDeleted(employeeSchema);

export const Employee: Model<IEmployee> =
  mongoose.models.Employee ?? mongoose.model<IEmployee>('Employee', employeeSchema);
