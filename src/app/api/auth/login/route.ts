import { definePublicRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { CSRF_COOKIE, SESSION_COOKIE, csrfCookieOptions, generateCsrfToken, sessionCookieOptions } from '@/lib/auth/session';
import { serverEnv } from '@/lib/env';
import { login } from '@/services/auth-service';
import { loginSchema } from '@/validators/auth';

export const POST = definePublicRoute(
  {
    bodySchema: loginSchema,
    rateLimit: { limit: serverEnv().RATE_LIMIT_AUTH_MAX_REQUESTS },
  },
  async ({ body, ip }) => {
    const result = await login(body.email, body.password, body.rememberMe, ip);

    const response = ok({ user: result.sessionUser });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.ttlSeconds));
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), csrfCookieOptions(result.ttlSeconds));
    return response;
  },
);
