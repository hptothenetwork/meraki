import { NextRequest, NextResponse } from "next/server"
import { getPesapalTransactionStatus } from "@/backend/integrations/pesapal"
import { markOrderPaid, markOrderPaymentFailed } from "@/backend/db/orders"
import { checkRateLimit } from "@/app/api/_utils/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * PesaPal IPN (Instant Payment Notification) — server-to-server GET notification.
 * Query params: orderTrackingId, orderMerchantReference, orderNotificationType
 * Must respond with: { orderNotificationType, orderTrackingId, orderMerchantReference, status }
 */
export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, { key: "pesapal:ipn", max: 60, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return NextResponse.json({ status: "500" }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const orderTrackingId = searchParams.get("orderTrackingId") ?? ""
  const orderMerchantReference = searchParams.get("orderMerchantReference") ?? ""
  const orderNotificationType = searchParams.get("orderNotificationType") ?? ""

  if (!orderTrackingId || !orderMerchantReference) {
    return NextResponse.json({ status: "500" }, { status: 400 })
  }

  try {
    const status = await getPesapalTransactionStatus(orderTrackingId)

    if (status.statusCode === 1) {
      await markOrderPaid(orderMerchantReference, {
        transactionId: orderTrackingId,
        confirmationCode: status.confirmationCode,
        paymentMethod: status.paymentMethod,
      })
    } else if (status.statusCode === 2 || status.statusCode === 3) {
      await markOrderPaymentFailed(orderMerchantReference)
    }

    // PesaPal expects this specific JSON response
    return NextResponse.json({
      orderNotificationType,
      orderTrackingId,
      orderMerchantReference,
      status: "200",
    })
  } catch (err) {
    console.error("[pesapal/ipn]", err)
    return NextResponse.json({ status: "500" }, { status: 500 })
  }
}
