import { defineRoute } from '@/lib/api/handler';
import { noContent } from '@/lib/api/response';
import { markAllNotificationsRead } from '@/services/notification-service';

export const POST = defineRoute({}, async ({ user }) => {
  await markAllNotificationsRead(user);
  return noContent();
});
