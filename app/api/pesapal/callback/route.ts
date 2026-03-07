import { NextRequest, NextResponse } from "next/server"
import { getPesapalTransactionStatus } from "@/backend/integrations/pesapal"
import { markOrderPaid, markOrderPaymentFailed } from "@/backend/db/orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * PesaPal redirects the user here after payment attempt.
 * URL will contain: OrderTrackingId, OrderMerchantReference, OrderNotificationType
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderTrackingId = searchParams.get("OrderTrackingId") ?? ""
  const merchantReference = searchParams.get("OrderMerchantReference") ?? "" // this is our order ID

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.redirect(new URL("/checkout?pesapal=error&reason=missing_params", req.url))
  }

  try {
    const status = await getPesapalTransactionStatus(orderTrackingId)

    if (status.statusCode === 1) {
      // Completed — cross-verify PesaPal's merchantReference matches our order ID
      if (status.merchantReference && status.merchantReference !== merchantReference) {
        console.error(`[pesapal/callback] merchantReference mismatch: expected ${merchantReference}, got ${status.merchantReference}`)
        return NextResponse.redirect(new URL(`/checkout/payment?orderId=${encodeURIComponent(merchantReference)}&pesapal=error`, req.url))
      }
      await markOrderPaid(merchantReference, {
        transactionId: orderTrackingId,
        confirmationCode: status.confirmationCode,
        paymentMethod: status.paymentMethod,
      })
      return NextResponse.redirect(
        new URL(`/checkout/success?orderId=${encodeURIComponent(merchantReference)}`, req.url),
      )
    }

    if (status.statusCode === 2 || status.statusCode === 3) {
      // Failed or Reversed
      await markOrderPaymentFailed(merchantReference)
      return NextResponse.redirect(
        new URL(`/checkout/payment?orderId=${encodeURIComponent(merchantReference)}&pesapal=failed`, req.url),
      )
    }

    // Pending — redirect back to payment page with pending state
    return NextResponse.redirect(
      new URL(`/checkout/payment?orderId=${encodeURIComponent(merchantReference)}&pesapal=pending`, req.url),
    )
  } catch (err) {
    console.error("[pesapal/callback]", err)
    return NextResponse.redirect(
      new URL(`/checkout/payment?orderId=${encodeURIComponent(merchantReference)}&pesapal=error`, req.url),
    )
  }
}
