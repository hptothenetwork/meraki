import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, isLockedOut, trackFailure } from "@/app/api/_utils/rate-limit"
import { validateDiscountCode } from "@/backend/db/gift-codes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Only uppercase alphanumeric and hyphens, 4–64 chars.
const VALID_CODE_RE = /^[A-Z0-9\-]{4,64}$/

// Errors from the backend that indicate a code-state issue (not a client input
// error). We normalize these to a single generic message so attackers cannot
// enumerate valid vs invalid codes.
const CODE_STATE_ERRORS = new Set([
  "Code not found.",
  "Code is not active.",
  "Code has expired.",
  "This code cannot be used at checkout.",
  "Code discount is invalid.",
])

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

export async function POST(req: NextRequest) {
  // Check failure lockout first — IPs that have made too many wrong attempts
  // are blocked for 15 minutes regardless of rate-limit window.
  const lockout = isLockedOut(req, "gift-codes")
  if (lockout.locked) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(lockout.retryAfterSeconds) } },
    )
  }

  // Strict rate limit: 5 attempts per IP per minute.
  const rateLimit = checkRateLimit(req, {
    key: "gift-codes:validate",
    max: 5,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many code checks. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    )
  }

  const body = (await req.json().catch(() => ({}))) as {
    code?: string
    currency?: string
    subtotal?: number | string
  }

  // Sanitize: strip spaces, uppercase, allow only alphanumeric + hyphens.
  const rawCode = typeof body.code === "string" ? body.code.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, "") : ""
  if (!rawCode) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 })
  }
  if (!VALID_CODE_RE.test(rawCode)) {
    trackFailure(req, "gift-codes")
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 })
  }

  const subtotal = toNumber(body.subtotal)
  if (subtotal <= 0) {
    return NextResponse.json({ error: "Cart subtotal must be greater than zero." }, { status: 400 })
  }

  const result = await validateDiscountCode(rawCode, body.currency || "TZS", subtotal)

  if (!result.valid) {
    // Track this IP's failure. After 5 failures it will be locked out for 15 min.
    trackFailure(req, "gift-codes")

    // Normalize code-state messages into a generic response to prevent enumeration.
    const clientError = CODE_STATE_ERRORS.has(result.error)
      ? "Invalid or expired code."
      : result.error
    return NextResponse.json({ error: clientError }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    currency: result.currency,
    discountType: result.discountType,
    discountValue: result.discountValue,
    discountAmount: result.discountAmount,
    subtotalAfterDiscount: result.totalAfterDiscount,
  })
}
