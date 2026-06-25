// lib/rate-limit.ts
/**
 * Simple in-memory sliding-window rate limiter.
 * Works per Vercel function instance (warm invocations share state).
 * Not globally consistent across instances — good enough for Hobby plan abuse prevention.
 */

const _store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = _store.get(key);

  if (!entry || now > entry.resetAt) {
    _store.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed — first request in window
  }

  if (entry.count >= maxRequests) {
    return false; // blocked — over limit
  }

  entry.count++;
  return true; // allowed
}
