import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { AUDIT_ACTION_VALUES, type AuditAction } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface IAuditLog {
  restaurantId: Types.ObjectId | null;
  branchId: Types.ObjectId | null;
  userId: Types.ObjectId | null;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: Types.ObjectId | null;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AuditLogDocument = HydratedDocument<IAuditLog>;

const auditLogSchema = new Schema<IAuditLog>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', default: null, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    userName: { type: String, required: true },
    action: { type: String, enum: AUDIT_ACTION_VALUES, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    description: { type: String, required: true, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  baseSchemaOptions,
);

auditLogSchema.index({ restaurantId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
