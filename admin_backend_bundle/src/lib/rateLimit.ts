// Simple rate limiting using in-memory store
// For production, use Redis or similar distributed cache

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

/**
 * Rate limiting middleware
 * @param config Configuration for rate limiting
 * @param config.maxRequests Maximum number of requests allowed in the window
 * @param config.windowMs Time window in milliseconds
 * @param config.keyPrefix Optional prefix for the rate limit key
 * @returns Function that checks rate limit and returns true if allowed
 */
export function rateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, keyPrefix = "ratelimit" } = config;

  return function checkRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // No entry or expired - create new
    if (!entry || entry.resetAt < now) {
      const resetAt = now + windowMs;
      rateLimitStore.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  };
}

// Pre-configured rate limiters for common use cases

/**
 * Strict rate limit for sensitive operations (e.g., checkout, payments)
 * 5 requests per minute
 */
export const strictRateLimit = rateLimit({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: "strict",
});

/**
 * Standard rate limit for general API endpoints
 * 30 requests per minute
 */
export const standardRateLimit = rateLimit({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: "standard",
});

/**
 * Lenient rate limit for read-only operations
 * 100 requests per minute
 */
export const lenientRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: "lenient",
});

/**
 * Email/form submission rate limit
 * 3 requests per 5 minutes
 */
export const emailRateLimit = rateLimit({
  maxRequests: 3,
  windowMs: 5 * 60 * 1000, // 5 minutes
  keyPrefix: "email",
});

/**
 * Get identifier from request (IP address)
 * In production, consider using more robust identifier like user ID + IP
 */
export function getRequestIdentifier(req: Request): string {
  // Prefer headers that cannot be spoofed by the client:
  // cf-connecting-ip is set by Cloudflare and cannot be forged.
  // x-forwarded-for CAN be spoofed unless your infra strips/overwrites it.
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Only use the LAST entry in x-forwarded-for (added by the trusted proxy),
  // not the first (which the client controls).
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }

  return "unknown";
}

export async function distributedRateLimit(
  keyPrefix: string,
  identifier: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const fallback = rateLimit({ maxRequests, windowMs, keyPrefix: `fallback-${keyPrefix}` });
  const fallbackResult = fallback(identifier);

  try {
    const { db } = await import("@backend/firebase.server");
    const now = Date.now();
    const safeId = Buffer.from(identifier).toString("base64url").slice(0, 120);
    const ref = db.collection("rate_limits").doc(`${keyPrefix}:${safeId}`);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() as { count?: number; resetAt?: number } | undefined;
      const resetAt = typeof data?.resetAt === "number" ? data.resetAt : 0;
      const count = typeof data?.count === "number" ? data.count : 0;

      if (!snap.exists || resetAt <= now) {
        const nextResetAt = now + windowMs;
        tx.set(ref, {
          count: 1,
          resetAt: nextResetAt,
          expiresAt: new Date(nextResetAt),
          updatedAt: new Date().toISOString(),
        });
        return { allowed: true, remaining: maxRequests - 1, resetAt: nextResetAt };
      }

      if (count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt };
      }

      const nextCount = count + 1;
      tx.update(ref, {
        count: nextCount,
        expiresAt: new Date(resetAt),
        updatedAt: new Date().toISOString(),
      });
      return { allowed: true, remaining: Math.max(0, maxRequests - nextCount), resetAt };
    });

    return result;
  } catch {
    return fallbackResult;
  }
}
