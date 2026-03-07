/**
 * Server-side email sending via EmailJS REST API.
 * Used for order confirmation emails sent from API routes.
 *
 * Required env vars:
 *   NEXT_PUBLIC_EMAILJS_SERVICE_ID   — EmailJS service ID (e.g. service_titusac)
 *   EMAILJS_ORDER_TEMPLATE_ID        — template ID for order confirmation
 *   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY   — EmailJS public key
 */

function fmtTzs(amount: number): string {
  return `TZS ${amount.toLocaleString("en-US")}`
}

function renderItemRows(
  items: Array<{ name: string; image?: string; size?: string; quantity: number; priceTzs: number }>,
): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e8e0d6;vertical-align:top;width:64px">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" width="60" height="72"
                   style="object-fit:cover;border-radius:4px;display:block" />`
              : `<div style="width:60px;height:72px;background:#f0ebe3;border-radius:4px"></div>`
          }
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e0d6;vertical-align:top">
          <div style="font-weight:600;color:#1a1a1a;font-size:14px">${item.name}</div>
          ${item.size ? `<div style="color:#888;font-size:13px;margin-top:2px">Size: ${item.size}</div>` : ""}
          <div style="color:#888;font-size:13px;margin-top:2px">Qty: ${item.quantity}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #e8e0d6;vertical-align:top;text-align:right;white-space:nowrap;font-size:14px;color:#1a1a1a">
          ${fmtTzs(item.priceTzs * item.quantity)}
        </td>
      </tr>`,
    )
    .join("")
}

export async function sendOrderConfirmationEmail(params: {
  toEmail: string
  customerName: string
  orderId: string
  orderDate: Date
  items: Array<{ name: string; image?: string; size?: string; quantity: number; priceTzs: number }>
  subtotal: number
  shipping: number
  discountAmount?: number
  total: number
  paymentChannel?: string
  shippingAddress: string
  siteUrl?: string
}): Promise<void> {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_ORDER_TEMPLATE_ID
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey) {
    console.warn("[email] Order confirmation email not sent — EmailJS env vars missing")
    return
  }

  const siteUrl = params.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://merakithebrand.store"
  const trackUrl = `${siteUrl}/track-order?orderId=${params.orderId}`

  const paymentLabel =
    params.paymentChannel === "pesapal"
      ? "PesaPal (Card / Mobile Money)"
      : params.paymentChannel === "cash_on_delivery"
        ? "Cash on Delivery"
        : params.paymentChannel || "—"

  const orderDateStr = params.orderDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const templateParams: Record<string, string> = {
    to_email: params.toEmail,
    customer_name: params.customerName,
    order_id: params.orderId,
    order_date: orderDateStr,
    items_html: renderItemRows(params.items),
    subtotal: fmtTzs(params.subtotal),
    shipping: params.shipping === 0 ? "FREE" : fmtTzs(params.shipping),
    discount:
      params.discountAmount && params.discountAmount > 0 ? `- ${fmtTzs(params.discountAmount)}` : "",
    total: fmtTzs(params.total),
    payment_method: paymentLabel,
    shipping_address: params.shippingAddress,
    track_url: trackUrl,
    site_url: siteUrl,
  }

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error(`[email] Failed to send order confirmation: ${res.status} ${text}`)
  } else {
    console.log(`[email] Order confirmation sent → ${params.toEmail} (order ${params.orderId})`)
  }
}
