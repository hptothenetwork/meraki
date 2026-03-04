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

declare global {
  var __merakiRateLimitStore: Map<string, Bucket> | undefined
}

const store = globalThis.__merakiRateLimitStore ?? new Map<string, Bucket>()
globalThis.__merakiRateLimitStore = store

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
