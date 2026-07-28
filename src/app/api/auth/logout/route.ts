import { defineRoute } from '@/lib/api/handler';
import { noContent } from '@/lib/api/response';
import { CSRF_COOKIE, SESSION_COOKIE } from '@/lib/auth/session';
import { logout } from '@/services/auth-service';

export const POST = defineRoute({ skipCsrf: true }, async ({ user, ip }) => {
  await logout(user, ip);

  const response = noContent();
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(CSRF_COOKIE);
  return response;
});
