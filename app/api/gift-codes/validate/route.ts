import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/app/api/_utils/rate-limit"
import { validateDiscountCode } from "@/backend/db/gift-codes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    key: "gift-codes:validate",
    max: 40,
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

  const code = typeof body.code === "string" ? body.code : ""
  if (!code.trim()) return NextResponse.json({ error: "Code is required." }, { status: 400 })

  const result = await validateDiscountCode(code, body.currency || "TZS", toNumber(body.subtotal))
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 })
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
