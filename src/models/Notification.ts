import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { NOTIFICATION_SEVERITY, NOTIFICATION_SEVERITY_VALUES, NOTIFICATION_TYPE_VALUES, type NotificationSeverity, type NotificationType } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface INotification {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId | null;
  /** Null targets everyone with view access to the branch (e.g. a KDS ticket). */
  userId: Types.ObjectId | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link: string | null;
  relatedEntityType: string | null;
  relatedEntityId: Types.ObjectId | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<INotification>;

const notificationSchema = new Schema<INotification>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    type: { type: String, enum: NOTIFICATION_TYPE_VALUES, required: true },
    severity: {
      type: String,
      enum: NOTIFICATION_SEVERITY_VALUES,
      default: NOTIFICATION_SEVERITY.INFO,
    },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: null },
    relatedEntityType: { type: String, default: null },
    relatedEntityId: { type: Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ branchId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ?? mongoose.model<INotification>('Notification', notificationSchema);
