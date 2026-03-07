/**
 * Server-side email sending via EmailJS REST API.
 * Used for order confirmation emails sent from API routes.
 *
 * Required env vars:
 *   NEXT_PUBLIC_EMAILJS_SERVICE_ID   — EmailJS service ID (e.g. service_titusac)
 *   EMAILJS_ORDER_TEMPLATE_ID        — template ID for order confirmation
 *   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY   — EmailJS public key
 *
 * Template variable names (match your EmailJS template exactly):
 *   {{order_id}}           — order document ID
 *   {{email}}              — customer email (shown in footer "sent to …")
 *   {{to_email}}           — used by EmailJS to route delivery (same value as {{email}})
 *   {{#orders}}            — Handlebars loop over items array
 *     {{image_url}}        —   product image URL
 *     {{name}}             —   product name (+ size appended when present)
 *     {{units}}            —   quantity
 *     {{price}}            —   line total, formatted as "TZS X,XXX"
 *   {{/orders}}
 *   {{cost.shipping}}      — shipping cost
 *   {{cost.tax}}           — tax (always "TZS 0" — no tax collected)
 *   {{cost.total}}         — order total
 */

function fmtTzs(amount: number): string {
  return `TZS ${amount.toLocaleString("en-US")}`
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

  // Build the `orders` array that EmailJS iterates with {{#orders}}…{{/orders}}
  const orders = params.items.map((item) => ({
    image_url: item.image || "",
    name: item.size ? `${item.name} (${item.size})` : item.name,
    units: item.quantity,
    price: fmtTzs(item.priceTzs * item.quantity),
  }))

  // Nested `cost` object accessed as {{cost.shipping}}, {{cost.tax}}, {{cost.total}}
  const cost = {
    shipping: params.shipping === 0 ? "FREE" : fmtTzs(params.shipping),
    tax: "TZS 0",
    total: fmtTzs(params.total),
  }

  const templateParams = {
    // Routing / identification
    to_email: params.toEmail,   // used by EmailJS to deliver the email
    email: params.toEmail,      // shown in template footer "sent to {{email}}"
    order_id: params.orderId,

    // Items loop
    orders,

    // Totals
    cost,
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
