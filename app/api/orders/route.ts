import { NextRequest, NextResponse } from "next/server"
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto"
import { createOrder, getOrder, hashOrderAccessToken, markOrderPaid } from "@/backend/db/orders"
import { validateDiscountCode } from "@/backend/db/gift-codes"
import { getProductsByIds } from "@/backend/db/products"
import { checkRateLimit } from "@/app/api/_utils/rate-limit"
import { sendOrderConfirmationEmail } from "@/backend/integrations/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ORDER_AUTH_COOKIE = "meraki_order_auth"
const CHECKOUT_SESSION_COOKIE = "meraki_checkout_session"
const ORDER_AUTH_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function isAdminOverride(req: NextRequest) {
  const expected = process.env.ORDER_API_ADMIN_SECRET
  const provided = req.headers.get("x-order-admin-secret")
  return Boolean(expected && provided && safeEquals(provided, expected))
}

function safeEquals(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

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

function sanitizeOrder(order: Awaited<ReturnType<typeof getOrder>>) {
  if (!order) return null
  const safeOrder = { ...order } as Omit<typeof order, "accessTokenHash"> & { accessTokenHash?: string }
  delete safeOrder.accessTokenHash
  return safeOrder
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const integer = Math.floor(value)
    return integer > 0 ? integer : null
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      const integer = Math.floor(parsed)
      return integer > 0 ? integer : null
    }
  }
  return null
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function normalizeRequestItems(
  items: unknown,
): Array<{ id: string; size?: string; quantity: number; name?: string; image?: string }> {
  if (!Array.isArray(items)) return []

  return items
    .map((raw) => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null))
    .filter((raw): raw is Record<string, unknown> => Boolean(raw))
    .map((raw) => {
      const id = toStringOrEmpty(raw.id).trim()
      const quantity = toPositiveInteger(raw.quantity)
      const size = toStringOrEmpty(raw.size).trim()
      const name = toStringOrEmpty(raw.name).trim()
      const image = toStringOrEmpty(raw.image).trim()
      return {
        id,
        quantity: quantity ?? 0,
        size: size || undefined,
        name: name || undefined,
        image: image || undefined,
      }
    })
    .filter((item) => item.id && item.quantity > 0)
}

function resolveProductPriceTzs(product: Record<string, unknown>): number {
  const rawTzs = toNumber(product.priceTzs) ?? toNumber(product.priceTZS)
  if (rawTzs && rawTzs > 0) return Math.round(rawTzs)

  const rawUsd = toNumber(product.priceUsd)
  if (rawUsd && rawUsd > 0) return Math.round(rawUsd * 2600)

  return 0
}

function resolveProductImage(product: Record<string, unknown>, fallback?: string): string | undefined {
  const direct = toStringOrEmpty(product.image).trim()
  if (direct) return direct

  const media = product.media
  if (Array.isArray(media)) {
    for (const item of media) {
      if (!item || typeof item !== "object") continue
      const src = toStringOrEmpty((item as Record<string, unknown>).src).trim()
      if (src) return src
    }
  }

  return fallback
}

async function authorizeOrderAccess(req: NextRequest, id: string) {
  const order = await getOrder(id)
  if (!order) return { order: null, authorized: false }

  if (isAdminOverride(req)) {
    return { order, authorized: true }
  }

  const auth = parseOrderAuthCookie(req)
  if (!auth || auth.id !== id) return { order, authorized: false }
  const providedHash = hashOrderAccessToken(auth.token)
  return { order, authorized: safeEquals(order.accessTokenHash, providedHash) }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { order, authorized } = await authorizeOrderAccess(req, id)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ order: sanitizeOrder(order) })
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    key: "orders:create",
    max: 20,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    )
  }

  const body = (await req.json().catch(() => ({}))) as {
    customer?: {
      fullName?: string
      email?: string
      phone?: string
      address?: string
      city?: string
      country?: string
    }
    shippingDetails?: {
      recipientName?: string
      phone?: string
      address?: string
      city?: string
      country?: string
    }
    billingDetails?: {
      fullName?: string
      email?: string
      phone?: string
      address?: string
      city?: string
      country?: string
    }
    notes?: string
    giftCode?: string
    captchaToken?: string
    items?: Array<{ id?: string; name?: string; image?: string; size?: string; quantity?: number }>
    paymentMethod?: "card" | "mobile_money" | "bank_transfer" | "cash_on_delivery"
    paymentChannel?: "visa_mastercard_amex" | "mpesa" | "airtel_money" | "mtn_momo" | "tigo_pesa_mixx" | "bank_transfer" | "pesapal" | "cash_on_delivery"
  }

  // Server-side Turnstile verification
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
  if (turnstileSecret) {
    const token = body.captchaToken
    if (!token) {
      return NextResponse.json({ error: "Captcha verification required." }, { status: 400 })
    }
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${turnstileSecret}&response=${token}`,
    })
    const verifyData = (await verifyRes.json().catch(() => ({}))) as { success?: boolean }
    if (!verifyData.success) {
      return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 })
    }
  }

  const requestedItems = normalizeRequestItems(body.items)
  if (requestedItems.length === 0) return NextResponse.json({ error: "No items" }, { status: 400 })
  if (!body.customer?.fullName || !body.customer?.email || !body.customer?.address) {
    return NextResponse.json({ error: "Missing customer details" }, { status: 400 })
  }

  const productDocs = await getProductsByIds(requestedItems.map((item) => item.id))
  const productMap = new Map(
    productDocs.map((product) => [product.id, product as unknown as Record<string, unknown>]),
  )

  const missingIds = Array.from(
    new Set(requestedItems.filter((item) => !productMap.has(item.id)).map((item) => item.id)),
  )
  if (missingIds.length > 0) {
    return NextResponse.json(
      { error: "Some products are unavailable", missingProductIds: missingIds },
      { status: 400 },
    )
  }

  const invalidPriceIds = new Set<string>()
  const items = requestedItems.map((item) => {
    const product = productMap.get(item.id)!
    const priceTzs = resolveProductPriceTzs(product)
    if (priceTzs <= 0) invalidPriceIds.add(item.id)

    return {
      id: item.id,
      name: toStringOrEmpty(product.name).trim() || item.name || "Product",
      image: resolveProductImage(product, item.image),
      size: item.size,
      quantity: item.quantity,
      priceTzs,
    }
  })
  if (invalidPriceIds.size > 0) {
    return NextResponse.json(
      {
        error: "Some products have invalid pricing and cannot be ordered right now",
        invalidPriceProductIds: Array.from(invalidPriceIds),
      },
      { status: 400 },
    )
  }

  const currency = "TZS"
  const subtotal = items.reduce((sum, item) => sum + item.priceTzs * item.quantity, 0)
  let discountAmount = 0
  let appliedDiscount:
    | {
        code: string
        type: "amount" | "percent"
        value: number
        amount: number
        currency: string
      }
    | undefined

  const giftCode = toStringOrEmpty(body.giftCode).trim()
  if (giftCode) {
    const validation = await validateDiscountCode(giftCode, currency, subtotal)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    discountAmount = validation.discountAmount
    appliedDiscount = {
      code: validation.code,
      type: validation.discountType,
      value: validation.discountValue,
      amount: validation.discountAmount,
      currency: validation.currency,
    }
  }

  // TODO(shipping-api): replace flat shipping rule with real-time courier quote integration.
  const shipping = subtotal >= 250000 ? 0 : 10000
  const total = Math.max(0, subtotal + shipping - discountAmount)
  const accessToken = randomBytes(24).toString("hex")
  const sessionId = req.cookies.get(CHECKOUT_SESSION_COOKIE)?.value || randomUUID()

  const order = await createOrder({
    sessionId,
    customer: {
      fullName: body.customer.fullName,
      email: body.customer.email,
      phone: body.customer.phone || "",
      address: body.customer.address,
      city: body.customer.city || "",
      country: body.customer.country || "Tanzania",
    },
    contact: {
      name: body.customer.fullName,
      email: body.customer.email,
      phone: body.customer.phone || "",
      address: body.customer.address,
      city: body.customer.city || "",
      country: body.customer.country || "Tanzania",
    },
    shippingDetails: body.shippingDetails
      ? {
          recipientName: body.shippingDetails.recipientName || body.customer.fullName,
          phone: body.shippingDetails.phone || body.customer.phone || "",
          address: body.shippingDetails.address || body.customer.address,
          city: body.shippingDetails.city || body.customer.city || "",
          country: body.shippingDetails.country || body.customer.country || "Tanzania",
        }
      : undefined,
    billingDetails: body.billingDetails
      ? {
          fullName: body.billingDetails.fullName || body.customer.fullName,
          email: body.billingDetails.email || body.customer.email,
          phone: body.billingDetails.phone || body.customer.phone || "",
          address: body.billingDetails.address || body.customer.address,
          city: body.billingDetails.city || body.customer.city || "",
          country: body.billingDetails.country || body.customer.country || "Tanzania",
        }
      : undefined,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : undefined,
    items,
    subtotal,
    shipping,
    discountAmount,
    discount: appliedDiscount,
    total,
    currency,
    paymentMethod: body.paymentMethod || "mobile_money",
    paymentChannel: body.paymentChannel,
    accessTokenHash: hashOrderAccessToken(accessToken),
  })

  // Fire confirmation email — non-blocking, errors are logged but don't fail the request
  const shippingAddr = [
    (order.shippingDetails?.address || order.customer?.address || "").trim(),
    (order.shippingDetails?.city || order.customer?.city || "").trim(),
    (order.shippingDetails?.country || order.customer?.country || "").trim(),
  ]
    .filter(Boolean)
    .join(", ")

  sendOrderConfirmationEmail({
    toEmail: order.customer?.email || "",
    customerName: order.customer?.fullName || "",
    orderId: order.id,
    orderDate: new Date(),
    items: order.items as Array<{ name: string; image?: string; size?: string; quantity: number; priceTzs: number }>,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discountAmount: order.discountAmount,
    total: order.total,
    paymentChannel: order.paymentChannel,
    shippingAddress: shippingAddr,
  }).catch((err) => console.error("[email] order confirmation error:", err))

  const response = NextResponse.json({ order: sanitizeOrder(order) })
  response.cookies.set(CHECKOUT_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORDER_AUTH_COOKIE_TTL_SECONDS,
  })
  response.cookies.set(ORDER_AUTH_COOKIE, `${order.id}:${accessToken}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORDER_AUTH_COOKIE_TTL_SECONDS,
  })
  return response
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    id?: string
    action?: "mark_paid"
  }
  if (!body.id || body.action !== "mark_paid") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!isAdminOverride(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const order = await getOrder(body.id)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // TODO(payments-api): keep this admin-only fallback until payment webhook/callback updates order status automatically.
  if (order.paymentStatus !== "paid") {
    await markOrderPaid(body.id)
  }
  const paidOrder = await getOrder(body.id)
  return NextResponse.json({ order: sanitizeOrder(paidOrder) })
}
