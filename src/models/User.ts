import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import type { Permission } from '@/constants/permissions';
import { ROLE_VALUES, type Role } from '@/constants/roles';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export const USER_STATUS = { ACTIVE: 'active', SUSPENDED: 'suspended' } as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export interface IUser extends SoftDelete {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  /** null for a Super Admin, who is platform-wide. */
  restaurantId: Types.ObjectId | null;
  branchIds: Types.ObjectId[];
  activeBranchId: Types.ObjectId | null;
  phone?: string;
  avatarUrl?: string | null;
  /** Runtime grants/revokes layered on top of the role's default set. */
  permissionOverrides: { granted: Permission[]; revoked: Permission[] };
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  mustChangePassword: boolean;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 190,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_VALUES, required: true, index: true },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', default: null, index: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    activeBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, default: null },
    permissionOverrides: {
      granted: { type: [String], default: [] },
      revoked: { type: [String], default: [] },
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null },
    mustChangePassword: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

userSchema.index({ restaurantId: 1, role: 1 });
userSchema.index({ restaurantId: 1, status: 1 });
applyNotDeleted(userSchema);

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
