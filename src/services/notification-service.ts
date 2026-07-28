import type { FilterQuery } from 'mongoose';

import { NotFoundError } from '@/lib/api/errors';
import type { SessionUser } from '@/lib/auth/session';
import { Notification, type INotification } from '@/models/Notification';

/** Notifications a user can see: theirs personally, or broadcast to their branch/restaurant. */
function visibilityFilter(user: SessionUser): FilterQuery<INotification> {
  const scopes: FilterQuery<INotification>[] = [{ userId: user.id }];

  if (user.activeBranchId) {
    scopes.push({ userId: null, branchId: user.activeBranchId });
  }
  if (user.restaurantId) {
    scopes.push({ userId: null, branchId: null, restaurantId: user.restaurantId });
  }

  return { $or: scopes };
}

export async function listNotifications(user: SessionUser, limit = 20) {
  const filter = visibilityFilter(user);

  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  return { items, unreadCount };
}

export async function markNotificationRead(id: string, user: SessionUser) {
  const notification = await Notification.findOne({ _id: id, ...visibilityFilter(user) });
  if (!notification) throw new NotFoundError('Notification');

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  return notification;
}

export async function markAllNotificationsRead(user: SessionUser) {
  await Notification.updateMany(
    { ...visibilityFilter(user), isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
}
