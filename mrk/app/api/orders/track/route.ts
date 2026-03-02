import { NextRequest, NextResponse } from "next/server"
import { getOrder } from "@/backend/db/orders"
import { checkRateLimit } from "@/app/api/_utils/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    key: "orders:track",
    max: 20,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many tracking attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    )
  }

  const body = (await req.json().catch(() => ({}))) as { orderId?: string; email?: string }
  const orderId = String(body.orderId || "").trim()
  const email = String(body.email || "").trim().toLowerCase()

  if (!orderId || !email) {
    return NextResponse.json({ error: "Order ID and email are required." }, { status: 400 })
  }

  const order = await getOrder(orderId)
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 })

  const customerEmail = String(order.customer?.email || "").trim().toLowerCase()
  const contactEmail = String(order.contact?.email || "").trim().toLowerCase()
  if (email !== customerEmail && email !== contactEmail) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 })
  }

  const tracked = order as typeof order & {
    trackingNumber?: string
    trackingUrl?: string
    processingAt?: string
    shippedAt?: string
    deliveredAt?: string
  }

  return NextResponse.json({
    order: {
      id: tracked.id,
      status: tracked.status,
      paymentStatus: tracked.paymentStatus,
      total: tracked.total,
      currency: tracked.currency,
      createdAt: tracked.createdAt,
      updatedAt: tracked.updatedAt,
      processingAt: tracked.processingAt,
      shippedAt: tracked.shippedAt,
      deliveredAt: tracked.deliveredAt,
      trackingNumber: tracked.trackingNumber,
      trackingUrl: tracked.trackingUrl,
      items: (tracked.items || []).map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
      })),
    },
  })
}
