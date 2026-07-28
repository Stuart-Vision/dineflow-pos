import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { CASH_MOVEMENT_TYPE_VALUES, REGISTER_STATUS, REGISTER_STATUS_VALUES, type CashMovementType, type RegisterStatus } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface ICashMovement {
  type: CashMovementType;
  amountMinor: number;
  reason: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
}

export interface ICashRegister {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  cashierId: Types.ObjectId;
  status: RegisterStatus;
  openedAt: Date;
  closedAt: Date | null;
  openingCashMinor: number;
  closingCashActualMinor: number | null;
  expectedCashMinor: number;
  cashSalesMinor: number;
  cardSalesMinor: number;
  digitalWalletSalesMinor: number;
  bankTransferSalesMinor: number;
  refundsMinor: number;
  paidInMinor: number;
  paidOutMinor: number;
  cashDifferenceMinor: number | null;
  cashMovements: ICashMovement[];
  closingNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CashRegisterDocument = HydratedDocument<ICashRegister>;

const cashMovementSchema = new Schema<ICashMovement>(
  {
    type: { type: String, enum: CASH_MOVEMENT_TYPE_VALUES, required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const cashRegisterSchema = new Schema<ICashRegister>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: REGISTER_STATUS_VALUES, default: REGISTER_STATUS.OPEN, index: true },
    openedAt: { type: Date, required: true, default: () => new Date() },
    closedAt: { type: Date, default: null },
    openingCashMinor: { type: Number, required: true, default: 0 },
    closingCashActualMinor: { type: Number, default: null },
    expectedCashMinor: { type: Number, default: 0 },
    cashSalesMinor: { type: Number, default: 0 },
    cardSalesMinor: { type: Number, default: 0 },
    digitalWalletSalesMinor: { type: Number, default: 0 },
    bankTransferSalesMinor: { type: Number, default: 0 },
    refundsMinor: { type: Number, default: 0 },
    paidInMinor: { type: Number, default: 0 },
    paidOutMinor: { type: Number, default: 0 },
    cashDifferenceMinor: { type: Number, default: null },
    cashMovements: { type: [cashMovementSchema], default: [] },
    closingNotes: { type: String, default: null, maxlength: 500 },
  },
  baseSchemaOptions,
);

cashRegisterSchema.index({ branchId: 1, status: 1 });
cashRegisterSchema.index({ cashierId: 1, openedAt: -1 });

export const CashRegister: Model<ICashRegister> =
  mongoose.models.CashRegister ?? mongoose.model<ICashRegister>('CashRegister', cashRegisterSchema);
