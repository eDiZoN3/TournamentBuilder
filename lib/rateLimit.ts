import type { NextRequest } from "next/server";

export interface RateLimitOptions {
  /** Maximum number of requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
}

interface WindowState {
  count: number;
  resetAt: number;
}

const FALLBACK_IP = "unknown";

// In-memory store. This is intentionally process-local; for multi-instance
// deployments rate limiting should also be enforced at the reverse proxy.
const store = new Map<string, WindowState>();

function isDisabled(): boolean {
  return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
}

/**
 * Fixed-window in-memory rate limiter keyed by an arbitrary string (typically
 * the client IP). Returns whether the current request is allowed.
 *
 * No-op under the test environment so existing test suites are not throttled.
 */
export function rateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  if (isDisabled()) {
    return { allowed: true };
  }

  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (existing.count >= options.limit) {
    return { allowed: false };
  }

  existing.count += 1;
  return { allowed: true };
}

/**
 * Derives the client IP from the `x-forwarded-for` header (first hop), falling
 * back to a constant when unavailable.
 */
export function clientIpFromRequest(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();

    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  return FALLBACK_IP;
}
