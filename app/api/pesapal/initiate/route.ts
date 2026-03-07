import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { getOrder, hashOrderAccessToken, savePesapalTracking } from "@/backend/db/orders"
import { registerIPN, submitPesapalOrder } from "@/backend/integrations/pesapal"
import { checkRateLimit } from "@/app/api/_utils/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ORDER_AUTH_COOKIE = "meraki_order_auth"

function parseOrderAuthCookie(req: NextRequest) {
  const raw = req.cookies.get(ORDER_AUTH_COOKIE)?.value
  if (!raw) return null
  const splitIndex = raw.indexOf(":")
  if (splitIndex <= 0) return null
  const id = raw.slice(0, splitIndex)
  const token = raw.slice(splitIndex + 1)
  if (!id || !token) return null
  return { id, token }
}

function safeEquals(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** Minimal ISO 3166-1 alpha-2 mapping for common countries */
function resolveCountryCode(country: string): string {
  const map: Record<string, string> = {
    tanzania: "TZ",
    kenya: "KE",
    uganda: "UG",
    rwanda: "RW",
    burundi: "BI",
    ethiopia: "ET",
    nigeria: "NG",
    ghana: "GH",
    "south africa": "ZA",
    usa: "US",
    "united states": "US",
    uk: "GB",
    "united kingdom": "GB",
    canada: "CA",
    australia: "AU",
    uae: "AE",
    "united arab emirates": "AE",
    india: "IN",
    china: "CN",
    france: "FR",
    germany: "DE",
  }
  return map[country.trim().toLowerCase()] ?? "TZ"
}

export async function POST(req: NextRequest) {
  // Rate limit: max 10 initiations per IP per minute
  const rateLimit = checkRateLimit(req, { key: "pesapal:initiate", max: 10, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    )
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { orderId?: string }
    const orderId = (body.orderId ?? "").trim()
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
    }

    const order = await getOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify the caller owns this order via the session auth cookie
    const auth = parseOrderAuthCookie(req)
    if (!auth || auth.id !== orderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const providedHash = hashOrderAccessToken(auth.token)
    if (!safeEquals(order.accessTokenHash, providedHash)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Guard: do not re-initiate payment for already-paid orders
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 409 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${req.headers.get("host")}`

    // Register IPN URL (PesaPal de-dupes by URL, safe to call repeatedly)
    const ipnUrl = `${siteUrl}/api/pesapal/ipn`
    const notificationId = await registerIPN(ipnUrl)

    // Build billing name parts
    const nameParts = (order.customer.fullName ?? "Customer").trim().split(/\s+/)
    const firstName = nameParts[0] ?? "Customer"
    const lastName = nameParts.slice(1).join(" ") || "-"

    const result = await submitPesapalOrder({
      merchantReference: order.id,
      currency: order.currency ?? "TZS",
      amount: order.total,
      description: `Meraki Order ${order.id}`,
      callbackUrl: `${siteUrl}/api/pesapal/callback`,
      notificationId,
      billingAddress: {
        emailAddress: order.customer.email,
        phoneNumber: order.customer.phone ?? "",
        countryCode: resolveCountryCode(order.customer.country ?? "Tanzania"),
        firstName,
        lastName,
        line1: order.customer.address ?? "",
        city: order.customer.city ?? "",
      },
    })

    await savePesapalTracking(order.id, result.orderTrackingId)

    return NextResponse.json({ redirectUrl: result.redirectUrl, orderTrackingId: result.orderTrackingId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "PesaPal initiation failed"
    console.error("[pesapal/initiate]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

