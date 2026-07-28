import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { listNotifications } from '@/services/notification-service';

export const GET = defineRoute({}, async ({ user }) => {
  const { items, unreadCount } = await listNotifications(user);
  return ok({ items, unreadCount });
});
