import "server-only"
import { db } from "../firebase.server"

type DiscountType = "amount" | "percent"

type GiftCodeDoc = {
  code?: string
  status?: "active" | "disabled" | "redeemed"
  kind?: "gift_card" | "discount_code"
  expiryDate?: string
  discountType?: DiscountType
  discountByCurrency?: Record<string, unknown>
}

export type DiscountCodeValidation =
  | {
      valid: true
      code: string
      currency: string
      discountType: DiscountType
      discountValue: number
      discountAmount: number
      totalAfterDiscount: number
    }
  | {
      valid: false
      error: string
    }

const collectionName = "gift_cards"

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase() || "TZS"
}

function toCurrencyValue(value: number, currency: string) {
  if (currency === "TZS") return Math.max(0, Math.round(value))
  return Math.max(0, Math.round((value + Number.EPSILON) * 100) / 100)
}

function normalizeDiscountMap(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object") return {}
  const record = input as Record<string, unknown>
  const normalized: Record<string, number> = {}
  for (const [key, raw] of Object.entries(record)) {
    const currency = normalizeCurrency(key)
    const parsed = toNumber(raw)
    if (parsed && parsed > 0) normalized[currency] = parsed
  }
  return normalized
}

function pickDiscountValue(map: Record<string, number>, currency: string) {
  if (map[currency] && map[currency] > 0) return map[currency]
  if (map.DEFAULT && map.DEFAULT > 0) return map.DEFAULT
  return 0
}

export async function validateDiscountCode(
  code: string,
  currency: string,
  subtotal: number,
): Promise<DiscountCodeValidation> {
  const normalizedCode = normalizeCode(code)
  if (!normalizedCode) return { valid: false, error: "Enter a code first." }

  const normalizedCurrency = normalizeCurrency(currency)
  const subtotalValue = toCurrencyValue(subtotal, normalizedCurrency)
  if (subtotalValue <= 0) {
    return { valid: false, error: "Cart subtotal must be greater than zero." }
  }

  const snap = await db.collection(collectionName).doc(normalizedCode).get()
  if (!snap.exists) {
    return { valid: false, error: "Code not found." }
  }

  const codeDoc = snap.data() as GiftCodeDoc
  if (codeDoc.status !== "active") {
    return { valid: false, error: "Code is not active." }
  }

  if (codeDoc.expiryDate) {
    const expiry = new Date(codeDoc.expiryDate)
    if (!Number.isNaN(expiry.valueOf()) && expiry.getTime() < Date.now()) {
      return { valid: false, error: "Code has expired." }
    }
  }

  const kind = codeDoc.kind || (codeDoc.discountByCurrency ? "discount_code" : "gift_card")
  if (kind !== "discount_code") {
    return { valid: false, error: "This code cannot be used at checkout." }
  }

  const discountType: DiscountType = codeDoc.discountType === "percent" ? "percent" : "amount"
  const discounts = normalizeDiscountMap(codeDoc.discountByCurrency)
  const discountValue = pickDiscountValue(discounts, normalizedCurrency)
  if (!(discountValue > 0)) {
    return { valid: false, error: `Code has no ${normalizedCurrency} discount configured.` }
  }

  const rawDiscountAmount =
    discountType === "percent" ? subtotalValue * (discountValue / 100) : discountValue
  const discountAmount = toCurrencyValue(Math.min(subtotalValue, rawDiscountAmount), normalizedCurrency)
  if (!(discountAmount > 0)) {
    return { valid: false, error: "Code discount is invalid." }
  }

  const totalAfterDiscount = toCurrencyValue(
    Math.max(0, subtotalValue - discountAmount),
    normalizedCurrency,
  )

  return {
    valid: true,
    code: normalizedCode,
    currency: normalizedCurrency,
    discountType,
    discountValue,
    discountAmount,
    totalAfterDiscount,
  }
}
