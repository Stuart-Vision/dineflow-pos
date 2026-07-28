import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import type { Permission } from '@/constants/permissions';
import { ROLE_VALUES, type Role as RoleName } from '@/constants/roles';

import { baseSchemaOptions } from './shared';

/**
 * Per-restaurant editable permission set for a role. Seeded from
 * `ROLE_PERMISSIONS` in `constants/roles.ts` and then editable from
 * Settings → Permissions; the effective grant always reads from here,
 * falling back to the static default when no override document exists yet.
 */
export interface IRole {
  restaurantId: Types.ObjectId;
  role: RoleName;
  permissions: Permission[];
  isEditable: boolean;
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RoleDocument = HydratedDocument<IRole>;

const roleSchema = new Schema<IRole>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    role: { type: String, enum: ROLE_VALUES, required: true },
    permissions: { type: [String], default: [] },
    isEditable: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  baseSchemaOptions,
);

roleSchema.index({ restaurantId: 1, role: 1 }, { unique: true });

export const RoleModel: Model<IRole> = mongoose.models.Role ?? mongoose.model<IRole>('Role', roleSchema);
