import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { markNotificationRead } from '@/services/notification-service';

export const POST = defineRoute<undefined, { id: string }>({}, async ({ user, params }) => {
  const notification = await markNotificationRead(params.id, user);
  return ok({ notification });
});
