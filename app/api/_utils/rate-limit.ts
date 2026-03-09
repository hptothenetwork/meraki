import { NextRequest } from "next/server"

type Bucket = {
  count: number
  resetAt: number
}

type Options = {
  key: string
  windowMs: number
  max: number
}

type FailureEntry = {
  count: number
  windowStart: number
  lockedUntil: number
}

declare global {
  var __merakiRateLimitStore: Map<string, Bucket> | undefined
  var __merakiFailureStore: Map<string, FailureEntry> | undefined
}

const store = globalThis.__merakiRateLimitStore ?? new Map<string, Bucket>()
globalThis.__merakiRateLimitStore = store

const failureStore = globalThis.__merakiFailureStore ?? new Map<string, FailureEntry>()
globalThis.__merakiFailureStore = failureStore

// After FAILURE_MAX bad attempts within FAILURE_WINDOW_MS, the IP is locked out for LOCKOUT_MS.
const FAILURE_WINDOW_MS = 10 * 60_000 // 10 minutes
const FAILURE_MAX = 5
const LOCKOUT_MS = 15 * 60_000 // 15 minutes

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return "unknown"
}

function pruneExpired(now: number) {
  if (store.size < 5000) return
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key)
  }
}

export function checkRateLimit(
  req: NextRequest,
  options: Options,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  pruneExpired(now)

  const ip = getClientIp(req)
  const bucketKey = `${options.key}:${ip}`
  const current = store.get(bucketKey)

  if (!current || current.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= options.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  store.set(bucketKey, current)
  return { allowed: true, retryAfterSeconds: 0 }
}

/**
 * Call this after a failed code attempt. After FAILURE_MAX failures within
 * FAILURE_WINDOW_MS, the IP is locked out for LOCKOUT_MS.
 */
export function trackFailure(req: NextRequest, namespace: string): void {
  const ip = getClientIp(req)
  const key = `${namespace}:fail:${ip}`
  const now = Date.now()
  const entry = failureStore.get(key)

  if (!entry || entry.windowStart + FAILURE_WINDOW_MS < now) {
    failureStore.set(key, { count: 1, windowStart: now, lockedUntil: 0 })
    return
  }

  entry.count += 1
  if (entry.count >= FAILURE_MAX) {
    entry.lockedUntil = now + LOCKOUT_MS
  }
  failureStore.set(key, entry)
}

/**
 * Returns true (with retryAfterSeconds) if the IP is in the failure lockout period.
 */
export function isLockedOut(req: NextRequest, namespace: string): { locked: boolean; retryAfterSeconds: number } {
  const ip = getClientIp(req)
  const key = `${namespace}:fail:${ip}`
  const now = Date.now()
  const entry = failureStore.get(key)
  if (!entry || entry.lockedUntil === 0) return { locked: false, retryAfterSeconds: 0 }
  if (entry.lockedUntil > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) }
  }
  // Lockout expired — clean up
  failureStore.delete(key)
  return { locked: false, retryAfterSeconds: 0 }
}
