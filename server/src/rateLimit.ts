import type { MiddlewareHandler } from 'hono';

import { HttpError } from './http.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(c: { req: { header: (name: string) => string | undefined } }): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return c.req.header('x-real-ip') ?? 'local';
}

/** Sliding fixed-window limiter: `limit` requests per `windowMs` per IP (+ optional suffix). */
export function rateLimit(options: {
  limit: number;
  windowMs: number;
  keySuffix?: string;
}): MiddlewareHandler {
  const { limit, windowMs, keySuffix = '' } = options;
  return async (c, next) => {
    const key = `${clientKey(c)}:${keySuffix || c.req.path}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      c.header('Retry-After', String(retryAfter));
      throw new HttpError(429, 'Too many requests. Try again shortly.');
    }
    await next();
  };
}
