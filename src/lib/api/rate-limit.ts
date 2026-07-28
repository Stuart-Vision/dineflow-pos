/**
 * Fixed-window rate limiter backed by an in-process map.
 *
 * Deliberately dependency-free: the project has to run with no paid services,
 * so there is no Redis. That means limits are per server instance — fine for a
 * single container or a single Node process, and the `RateLimiter` interface is
 * the seam where a shared store would be swapped in for a multi-instance
 * deployment.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Unix ms at which the current window resets. */
  resetAt: number;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Sweeping on write keeps the map from growing without bound without needing a
// timer that would hold the process open.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);

  return {
    allowed: existing.count <= limit,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Clears a bucket — used after a successful sign-in so a user is not punished. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Test hook. */
export function clearAllRateLimits(): void {
  buckets.clear();
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.allowed) headers['Retry-After'] = String(result.retryAfterSeconds);
  return headers;
}

/**
 * Best-effort client identity for rate limiting. Behind a proxy the first
 * `x-forwarded-for` hop is the client; direct connections fall back to the
 * platform-provided address.
 */
export function clientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}
