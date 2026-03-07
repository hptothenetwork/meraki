import "server-only"

const PESAPAL_BASE = "https://pay.pesapal.com/v3"

function consumerKey() {
  return process.env.PESAPAL_CONSUMER_KEY ?? ""
}
function consumerSecret() {
  return process.env.PESAPAL_CONSUMER_SECRET ?? ""
}

// ---------------------------------------------------------------------------
// Token cache (module-level, safe for serverless because we revalidate)
// ---------------------------------------------------------------------------
let tokenCache: { token: string; expiresAt: number } | null = null

export async function getPesapalToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token
  }

  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: consumerKey(),
      consumer_secret: consumerSecret(),
    }),
    cache: "no-store",
  })

  const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string }
  if (!res.ok || !data.token) {
    throw new Error(`PesaPal auth failed: ${data.message ?? res.status}`)
  }

  // PesaPal tokens expire in 5 minutes; cache for 4 minutes
  tokenCache = { token: data.token, expiresAt: Date.now() + 4 * 60 * 1000 }
  return data.token
}

// ---------------------------------------------------------------------------
// IPN Registration
// ---------------------------------------------------------------------------
export async function registerIPN(notifyUrl: string): Promise<string> {
  const token = await getPesapalToken()

  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: notifyUrl, ipn_notification_type: "GET" }),
    cache: "no-store",
  })

  const data = (await res.json().catch(() => ({}))) as { ipn_id?: string; message?: string }
  if (!res.ok || !data.ipn_id) {
    throw new Error(`PesaPal IPN registration failed: ${data.message ?? res.status}`)
  }

  return data.ipn_id
}

// ---------------------------------------------------------------------------
// Submit Order (get hosted payment redirect URL)
// ---------------------------------------------------------------------------
export type SubmitOrderParams = {
  merchantReference: string
  currency: string
  amount: number
  description: string
  callbackUrl: string
  notificationId: string
  billingAddress: {
    emailAddress: string
    phoneNumber: string
    countryCode: string
    firstName: string
    lastName: string
    line1: string
    city: string
  }
}

export type SubmitOrderResult = {
  orderTrackingId: string
  merchantReference: string
  redirectUrl: string
}

export async function submitPesapalOrder(params: SubmitOrderParams): Promise<SubmitOrderResult> {
  const token = await getPesapalToken()

  const res = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: params.merchantReference,
      currency: params.currency,
      amount: params.amount,
      description: params.description,
      callback_url: params.callbackUrl,
      notification_id: params.notificationId,
      billing_address: {
        email_address: params.billingAddress.emailAddress,
        phone_number: params.billingAddress.phoneNumber,
        country_code: params.billingAddress.countryCode,
        first_name: params.billingAddress.firstName,
        last_name: params.billingAddress.lastName,
        line_1: params.billingAddress.line1,
        city: params.billingAddress.city,
      },
    }),
    cache: "no-store",
  })

  const data = (await res.json().catch(() => ({}))) as {
    order_tracking_id?: string
    merchant_reference?: string
    redirect_url?: string
    message?: string
  }

  if (!res.ok || !data.redirect_url) {
    throw new Error(`PesaPal submit order failed: ${data.message ?? res.status}`)
  }

  return {
    orderTrackingId: data.order_tracking_id ?? "",
    merchantReference: data.merchant_reference ?? params.merchantReference,
    redirectUrl: data.redirect_url,
  }
}

// ---------------------------------------------------------------------------
// Transaction Status
// ---------------------------------------------------------------------------
export type PesapalTransactionStatus = {
  /** 0=Invalid, 1=Completed, 2=Failed, 3=Reversed */
  statusCode: number
  paymentMethod: string
  amount: number
  confirmationCode: string
  orderTrackingId: string
  merchantReference: string
  paymentStatusDescription: string
}

export async function getPesapalTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
  const token = await getPesapalToken()

  const res = await fetch(
    `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  )

  const data = (await res.json().catch(() => ({}))) as {
    status_code?: number
    payment_method?: string
    amount?: number
    confirmation_code?: string
    order_tracking_id?: string
    merchant_reference?: string
    payment_status_description?: string
    message?: string
  }

  if (!res.ok) {
    throw new Error(`PesaPal status check failed: ${data.message ?? res.status}`)
  }

  return {
    statusCode: data.status_code ?? 0,
    paymentMethod: data.payment_method ?? "",
    amount: data.amount ?? 0,
    confirmationCode: data.confirmation_code ?? "",
    orderTrackingId: data.order_tracking_id ?? orderTrackingId,
    merchantReference: data.merchant_reference ?? "",
    paymentStatusDescription: data.payment_status_description ?? "",
  }
}
