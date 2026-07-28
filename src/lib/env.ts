import { z } from 'zod';

/**
 * Server-side environment contract.
 *
 * Parsed lazily (not at module load) so that `next build` — which imports
 * modules without a populated runtime environment — never fails on a missing
 * secret. Anything reading `serverEnv()` is doing so inside a request.
 */
const serverSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),

  AUTH_SESSION_TTL: z.coerce.number().int().positive().default(43_200),
  AUTH_REMEMBER_ME_TTL: z.coerce.number().int().positive().default(2_592_000),
  AUTH_BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  AUTH_MAX_LOGIN_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
  AUTH_LOCKOUT_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_AUTH_MAX_REQUESTS: z.coerce.number().int().positive().default(10),

  PAYMENT_DRIVER: z.enum(['demo', 'stripe']).default('demo'),
  STRIPE_SECRET_KEY: z.string().optional(),

  MAIL_DRIVER: z.enum(['log', 'smtp']).default('log'),
  MAIL_FROM: z.string().default('no-reply@dineflow.example'),
  SMS_DRIVER: z.enum(['log']).default('log'),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(
      `Invalid server environment. Copy .env.example to .env.local and fill it in.\n${detail}`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Public values are inlined at build time and safe to read anywhere. */
export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'DineFlow POS',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  showDemoCredentials: process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS !== 'false',
} as const;
