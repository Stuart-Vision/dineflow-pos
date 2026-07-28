import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import {
  INVENTORY_TRANSACTION_TYPE_VALUES,
  WASTAGE_REASON_VALUES,
  type InventoryTransactionType,
  type WastageReason,
} from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export type InventoryReferenceType = 'purchase' | 'order' | 'adjustment' | 'physical_count' | 'transfer';

export interface IInventoryTransaction {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  ingredientId: Types.ObjectId;
  type: InventoryTransactionType;
  quantityBase: number;
  unitCostMinor: number;
  balanceAfterBase: number;
  referenceType: InventoryReferenceType | null;
  referenceId: Types.ObjectId | null;
  batchNumber: string | null;
  expiryDate: Date | null;
  wastageReason: WastageReason | null;
  notes: string | null;
  performedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type InventoryTransactionDocument = HydratedDocument<IInventoryTransaction>;

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true, index: true },
    type: { type: String, enum: INVENTORY_TRANSACTION_TYPE_VALUES, required: true },
    quantityBase: { type: Number, required: true, min: 0 },
    unitCostMinor: { type: Number, required: true, default: 0 },
    balanceAfterBase: { type: Number, required: true },
    referenceType: {
      type: String,
      enum: ['purchase', 'order', 'adjustment', 'physical_count', 'transfer'],
      default: null,
    },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    batchNumber: { type: String, default: null },
    expiryDate: { type: Date, default: null },
    wastageReason: { type: String, enum: WASTAGE_REASON_VALUES, default: null },
    notes: { type: String, default: null, maxlength: 500 },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions,
);

inventoryTransactionSchema.index({ branchId: 1, ingredientId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ branchId: 1, type: 1, createdAt: -1 });
inventoryTransactionSchema.index({ expiryDate: 1 }, { sparse: true });

export const InventoryTransaction: Model<IInventoryTransaction> =
  mongoose.models.InventoryTransaction ??
  mongoose.model<IInventoryTransaction>('InventoryTransaction', inventoryTransactionSchema);
