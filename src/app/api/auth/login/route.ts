import { definePublicRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { CSRF_COOKIE, SESSION_COOKIE, csrfCookieOptions, generateCsrfToken, sessionCookieOptions } from '@/lib/auth/session';
import { login } from '@/services/auth-service';
import { loginSchema } from '@/validators/auth';

const configuredAuthLimit = Number.parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS ?? '10', 10);
const authRateLimit = Number.isFinite(configuredAuthLimit) && configuredAuthLimit > 0 ? configuredAuthLimit : 10;

export const POST = definePublicRoute(
  {
    bodySchema: loginSchema,
    rateLimit: { limit: authRateLimit },
  },
  async ({ body, ip }) => {
    const result = await login(body.email, body.password, body.rememberMe, ip);

    const response = ok({ user: result.sessionUser });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.ttlSeconds));
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), csrfCookieOptions(result.ttlSeconds));
    return response;
  },
);
