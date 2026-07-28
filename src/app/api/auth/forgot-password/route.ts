import { definePublicRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { requestPasswordReset } from '@/services/auth-service';
import { forgotPasswordSchema } from '@/validators/auth';

export const POST = definePublicRoute(
  { bodySchema: forgotPasswordSchema, rateLimit: { limit: 5, windowMs: 60_000 } },
  async ({ body }) => {
    await requestPasswordReset(body.email);
    // Always the same response — confirming or denying an account's
    // existence to an unauthenticated caller is its own vulnerability.
    return ok({
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  },
);
