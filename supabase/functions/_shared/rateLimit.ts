/**
 * Best-effort in-memory rate limit. Per instance, so it is a speed bump
 * against abuse, not a guarantee. No IP is ever logged or stored beyond the window.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

export function rateLimit(
  key: string,
  { limit = 30, windowMs = 10 * 60 * 1000 }: RateLimitOptions = {},
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Drop expired buckets so a long-lived instance does not grow unbounded. */
export function sweep(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}
