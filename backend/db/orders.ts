import "server-only"
import { db } from "../firebase.server"
import { createHash } from "node:crypto"

export type CheckoutOrderItem = {
  id: string
  name: string
  image?: string
  size?: string
  quantity: number
  priceTzs: number
}

export type CheckoutOrder = {
  id: string
  sessionId: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentMethod: "card" | "mobile_money" | "bank_transfer" | "cash_on_delivery"
  paymentChannel?:
    | "visa_mastercard_amex"
    | "mpesa"
    | "airtel_money"
    | "mtn_momo"
    | "tigo_pesa_mixx"
    | "bank_transfer"
    | "pesapal"
    | "cash_on_delivery"
  paymentStatus: "pending" | "paid" | "failed"
  paymentProvider?: string
  transactionId?: string
  customer: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    country: string
  }
  contact: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    country: string
  }
  shippingDetails?: {
    recipientName: string
    phone: string
    address: string
    city: string
    country: string
  }
  billingDetails?: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    country: string
  }
  notes?: string
  items: CheckoutOrderItem[]
  subtotal: number
  shipping: number
  discountAmount?: number
  discount?: {
    code: string
    type: "amount" | "percent"
    value: number
    amount: number
    currency: string
  }
  total: number
  currency: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  processingAt?: string
  shippedAt?: string
  deliveredAt?: string
  trackingNumber?: string
  trackingUrl?: string
  accessTokenHash: string
}

const collectionName = "orders"

export function hashOrderAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createOrder(payload: Omit<CheckoutOrder, "id" | "createdAt" | "updatedAt" | "status" | "paymentStatus">) {
  const ref = db.collection(collectionName).doc()
  const now = new Date().toISOString()
  const order: CheckoutOrder = {
    ...payload,
    id: ref.id,
    status: "pending",
    paymentStatus: "pending",
    createdAt: now,
    updatedAt: now,
  }
  await ref.set(order, { merge: true })
  return order
}

export async function getOrder(id: string): Promise<CheckoutOrder | null> {
  const snap = await db.collection(collectionName).doc(id).get()
  if (!snap.exists) return null
  return snap.data() as CheckoutOrder
}

export async function getOrderBySession(sessionId: string): Promise<CheckoutOrder[]> {
  const snap = await db
    .collection(collectionName)
    .where("sessionId", "==", sessionId)
    .orderBy("createdAt", "desc")
    .get()
  return snap.docs.map((doc) => doc.data() as CheckoutOrder)
}

export async function markOrderPaid(
  id: string,
  details?: { transactionId?: string; confirmationCode?: string; paymentMethod?: string },
) {
  const now = new Date().toISOString()
  await db.collection(collectionName).doc(id).set(
    {
      status: "processing",
      paymentStatus: "paid",
      paymentProvider: "pesapal",
      ...(details?.transactionId ? { transactionId: details.transactionId } : {}),
      ...(details?.confirmationCode ? { confirmationCode: details.confirmationCode } : {}),
      ...(details?.paymentMethod ? { paymentMethodResolved: details.paymentMethod } : {}),
      paidAt: now,
      updatedAt: now,
    },
    { merge: true },
  )
}

export async function markOrderPaymentFailed(id: string) {
  const now = new Date().toISOString()
  await db.collection(collectionName).doc(id).set(
    { paymentStatus: "failed", updatedAt: now },
    { merge: true },
  )
}

export async function savePesapalTracking(id: string, orderTrackingId: string) {
  const now = new Date().toISOString()
  await db.collection(collectionName).doc(id).set(
    { transactionId: orderTrackingId, paymentProvider: "pesapal", updatedAt: now },
    { merge: true },
  )
}
