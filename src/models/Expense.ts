import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { EXPENSE_STATUS, EXPENSE_STATUS_VALUES, RECURRENCE, RECURRENCE_VALUES, type ExpenseStatus, type Recurrence } from '@/constants/enums';
import { PAYMENT_METHOD_VALUES, type PaymentMethod } from '@/constants/enums';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Water',
  'Gas',
  'Internet',
  'Staff Meals',
  'Repairs & Maintenance',
  'Cleaning',
  'Delivery Charges',
  'Marketing',
  'Equipment',
  'Miscellaneous',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface IExpense extends SoftDelete {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  category: ExpenseCategory;
  description: string;
  amountMinor: number;
  expenseDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  attachmentUrl: string | null;
  recurrence: Recurrence;
  status: ExpenseStatus;
  requestedBy: Types.ObjectId;
  approvedBy: Types.ObjectId | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseDocument = HydratedDocument<IExpense>;

const expenseSchema = new Schema<IExpense>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    description: { type: String, required: true, maxlength: 500 },
    amountMinor: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true, index: true },
    paymentMethod: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    referenceNumber: { type: String, default: null },
    attachmentUrl: { type: String, default: null },
    recurrence: { type: String, enum: RECURRENCE_VALUES, default: RECURRENCE.NONE },
    status: { type: String, enum: EXPENSE_STATUS_VALUES, default: EXPENSE_STATUS.PENDING_APPROVAL },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

expenseSchema.index({ branchId: 1, expenseDate: -1 });
expenseSchema.index({ branchId: 1, category: 1 });
applyNotDeleted(expenseSchema);

export const Expense: Model<IExpense> =
  mongoose.models.Expense ?? mongoose.model<IExpense>('Expense', expenseSchema);
