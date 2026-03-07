import { NextRequest, NextResponse } from "next/server"
import { getOrder } from "@/backend/db/orders"
import { registerIPN, submitPesapalOrder } from "@/backend/integrations/pesapal"
import { savePesapalTracking } from "@/backend/db/orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${req.headers.get("host")}`

    // Register IPN URL (PesaPal de-dupes by URL, so this is safe to call repeatedly)
    const ipnUrl = `${siteUrl}/api/pesapal/ipn`
    const notificationId = await registerIPN(ipnUrl)

    // Build billing name
    const nameParts = (order.customer.fullName ?? "Customer").trim().split(/\s+/)
    const firstName = nameParts[0] ?? "Customer"
    const lastName = nameParts.slice(1).join(" ") || "-"

    // Country code (2-letter ISO) — default TZ for Tanzania
    const country = (order.customer.country ?? "Tanzania").trim().toLowerCase()
    const countryCode = country === "tanzania" ? "TZ" : "KE" // Expand as needed

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
        countryCode,
        firstName,
        lastName,
        line1: order.customer.address ?? "",
        city: order.customer.city ?? "",
      },
    })

    // Persist PesaPal tracking ID against the order
    await savePesapalTracking(order.id, result.orderTrackingId)

    return NextResponse.json({ redirectUrl: result.redirectUrl, orderTrackingId: result.orderTrackingId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "PesaPal initiation failed"
    console.error("[pesapal/initiate]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
