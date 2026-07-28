import { definePublicRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { resetPassword } from '@/services/auth-service';
import { resetPasswordSchema } from '@/validators/auth';

export const POST = definePublicRoute(
  { bodySchema: resetPasswordSchema, rateLimit: { limit: 5, windowMs: 60_000 } },
  async ({ body }) => {
    await resetPassword(body.email, body.token, body.password);
    return ok({ message: 'Your password has been reset. You can now sign in.' });
  },
);
