import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { TABLE_SHAPE_VALUES, TABLE_STATUS, TABLE_STATUS_VALUES, type TableShape, type TableStatus } from '@/constants/enums';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface ITable extends SoftDelete {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  label: string;
  section: string;
  capacity: number;
  shape: TableShape;
  status: TableStatus;
  positionX: number;
  positionY: number;
  currentOrderId: Types.ObjectId | null;
  currentCustomerId: Types.ObjectId | null;
  assignedWaiterId: Types.ObjectId | null;
  combinedWithTableIds: Types.ObjectId[];
  lastCleanedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TableDocument = HydratedDocument<ITable>;

const tableSchema = new Schema<ITable>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 20 },
    section: { type: String, default: 'Main Floor', trim: true },
    capacity: { type: Number, required: true, min: 1, max: 40 },
    shape: { type: String, enum: TABLE_SHAPE_VALUES, default: 'square' },
    status: { type: String, enum: TABLE_STATUS_VALUES, default: TABLE_STATUS.AVAILABLE, index: true },
    positionX: { type: Number, default: 0 },
    positionY: { type: Number, default: 0 },
    currentOrderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    currentCustomerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    assignedWaiterId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    combinedWithTableIds: [{ type: Schema.Types.ObjectId, ref: 'Table' }],
    lastCleanedAt: { type: Date, default: null },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

tableSchema.index({ branchId: 1, label: 1 }, { unique: true });
applyNotDeleted(tableSchema);

export const Table: Model<ITable> =
  mongoose.models.Table ?? mongoose.model<ITable>('Table', tableSchema);
