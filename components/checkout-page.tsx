"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, Package, CreditCard } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { SiteFooter } from "@/components/site-footer"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"

type PaymentOption = {
  id: "cash_on_delivery" | "pesapal"
  method: "cash_on_delivery" | "card"
  title: string
  note: string
  logos: string[]
}

type AppliedGiftCode = {
  code: string
  discountType: "amount" | "percent"
  discountValue: number
  discountAmount: number
  currency: string
}

const paymentOptions: PaymentOption[] = [
  {
    id: "pesapal",
    method: "card",
    title: "Pay Online via PesaPal",
    note: "Card, M-Pesa, Airtel Money, MTN MoMo & more",
    logos: ["/payments/visa.PNG", "/payments/master.PNG", "/payments/voda.png", "/payments/airtel.PNG"],
  },
  {
    id: "cash_on_delivery",
    method: "cash_on_delivery",
    title: "Cash on Delivery",
    note: "Pay when your order arrives",
    logos: [],
  },
]

function CheckoutInner() {
  const router = useRouter()
  const { items, totalPrice } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [billingMatchesShipping, setBillingMatchesShipping] = useState(true)
  const [deliveryScope, setDeliveryScope] = useState<"local" | "international">("local")
  const [confirmed, setConfirmed] = useState(false)
  const [captchaToken, setCaptchaToken] = useState("")
  const captchaRef = useRef<TurnstileInstance | null>(null)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
  const [giftCodeInput, setGiftCodeInput] = useState("")
  const [appliedGiftCode, setAppliedGiftCode] = useState<AppliedGiftCode | null>(null)
  const [giftCodeError, setGiftCodeError] = useState("")
  const [giftCodeBusy, setGiftCodeBusy] = useState(false)
  const [form, setForm] = useState({
    // Shipping
    shippingRecipientName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingCountry: "Tanzania",
    shippingSpecialNote: "",
    // Billing
    billingEmail: "",
    billingFullName: "",
    billingPhone: "",
    billingAddress: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "Tanzania",
    // General
    notes: "",
    paymentChannel: "pesapal" as PaymentOption["id"],
  })

  const isInternational = deliveryScope === "international"
  const discountAmount = appliedGiftCode?.discountAmount || 0
  const estimatedTotal = Math.max(0, totalPrice - discountAmount)
  const selectedOption = paymentOptions.find((o) => o.id === form.paymentChannel) ?? paymentOptions[0]

  const applyGiftCode = async (codeRaw?: string) => {
    const code = (codeRaw ?? giftCodeInput).trim().toUpperCase()
    if (!code) {
      setGiftCodeError("Enter a gift code first.")
      return
    }

    setGiftCodeBusy(true)
    setGiftCodeError("")
    const res = await fetch("/api/gift-codes/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        currency: "TZS",
        subtotal: totalPrice,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      code?: string
      discountType?: "amount" | "percent"
      discountValue?: number
      discountAmount?: number
      currency?: string
    }
    setGiftCodeBusy(false)

    if (!res.ok || !data.code || !data.discountType || typeof data.discountAmount !== "number") {
      setAppliedGiftCode(null)
      setGiftCodeError(data.error || "Unable to apply code.")
      return
    }

    setAppliedGiftCode({
      code: data.code,
      discountType: data.discountType,
      discountValue: typeof data.discountValue === "number" ? data.discountValue : 0,
      discountAmount: data.discountAmount,
      currency: data.currency || "TZS",
    })
    setGiftCodeInput(data.code)
  }

  useEffect(() => {
    if (!appliedGiftCode) return
    // Keep discount accurate if cart subtotal changes.
    void applyGiftCode(appliedGiftCode.code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || !confirmed) return

    if (turnstileSiteKey && !captchaToken) {
      setSubmitError("Please complete the captcha verification.")
      return
    }

    const effectiveBilling = billingMatchesShipping
      ? {
          fullName: form.shippingRecipientName,
          email: form.billingEmail,
          phone: form.shippingPhone,
          address: form.shippingAddress,
          city: form.shippingCity,
          postalCode: form.shippingPostalCode,
          country: form.shippingCountry,
        }
      : {
          fullName: form.billingFullName,
          email: form.billingEmail,
          phone: form.billingPhone,
          address: form.billingAddress,
          city: form.billingCity,
          postalCode: form.billingPostalCode,
          country: form.billingCountry,
        }

    setSubmitting(true)
    setSubmitError("")
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer: {
          fullName: effectiveBilling.fullName,
          email: effectiveBilling.email,
          phone: effectiveBilling.phone,
          address: effectiveBilling.address,
          city: effectiveBilling.city,
          country: effectiveBilling.country,
        },
        billingDetails: effectiveBilling,
        shippingDetails: {
          recipientName: form.shippingRecipientName,
          phone: form.shippingPhone,
          address: form.shippingAddress,
          city: form.shippingCity,
          postalCode: form.shippingPostalCode,
          country: form.shippingCountry,
          specialNote: form.shippingSpecialNote,
        },
        notes: form.notes,
        paymentMethod: selectedOption.method === "cash_on_delivery" ? "cash_on_delivery" : "card",
        paymentChannel: form.paymentChannel,
        items: items.map((item) => ({
          id: item.product.id,
          size: item.size,
          quantity: item.quantity,
        })),
        giftCode: appliedGiftCode?.code,
        captchaToken,
      }),
    })
    const payload = (await res.json().catch(() => ({}))) as { error?: string; order?: { id: string } }
    setSubmitting(false)
    if (!res.ok || !payload.order?.id) {
      setSubmitError(payload.error || "Failed to create order. Please review checkout details.")
      captchaRef.current?.reset()
      setCaptchaToken("")
      return
    }

    router.push(`/checkout/payment?orderId=${payload.order.id}`)
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] md:px-8">
      <div>
        <h1 className="font-serif text-4xl text-foreground">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">Complete your shipping, billing, and payment details below.</p>

        <form onSubmit={submit} className="mt-6 space-y-6">

          {/* 1 — Shipping details */}
          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Shipping details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Where should we deliver your order?</p>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => { setDeliveryScope("local"); setForm((f) => ({ ...f, shippingCountry: "Tanzania" })) }}
                className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${deliveryScope === "local" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}
              >
                Local — Tanzania
              </button>
              <button
                type="button"
                onClick={() => { setDeliveryScope("international"); setForm((f) => ({ ...f, shippingCountry: "" })) }}
                className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${deliveryScope === "international" ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}
              >
                International
              </button>
            </div>

            {isInternational && (
              <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-muted-foreground">
                International order — our team will contact you with the shipping cost before processing and dispatching your order.
              </p>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input required autoComplete="name" placeholder="Recipient full name" value={form.shippingRecipientName} onChange={(e) => setForm({ ...form, shippingRecipientName: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-base" />
              <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone number" value={form.shippingPhone} onChange={(e) => setForm({ ...form, shippingPhone: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-base" />
              <input required autoComplete="street-address" placeholder="Address / Street" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} className="md:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-base" />
              <input required autoComplete="address-level2" placeholder="City / Town" value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-base" />
              <input autoComplete="postal-code" placeholder="Postal code (optional)" value={form.shippingPostalCode} onChange={(e) => setForm({ ...form, shippingPostalCode: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-base" />
              <input
                required={isInternational}
                autoComplete="country-name"
                placeholder={deliveryScope === "local" ? "Tanzania" : "Country"}
                readOnly={deliveryScope === "local"}
                value={form.shippingCountry}
                onChange={(e) => setForm({ ...form, shippingCountry: e.target.value })}
                className={`md:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-base ${deliveryScope === "local" ? "cursor-not-allowed opacity-60" : ""}`}
              />
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Special delivery note (optional)</label>
              <textarea
                rows={2}
                placeholder="Landmark, gate code, best delivery time, building name…"
                value={form.shippingSpecialNote}
                onChange={(e) => setForm({ ...form, shippingSpecialNote: e.target.value })}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-base placeholder:text-muted-foreground"
              />
            </div>
          </article>

          {/* 2 — Billing details */}
          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl text-foreground">Billing details</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={billingMatchesShipping} onChange={(e) => setBillingMatchesShipping(e.target.checked)} />
                Same as shipping
              </label>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input required type="email" inputMode="email" autoComplete="email" placeholder="Email address" value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} className="md:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-base" />
              {!billingMatchesShipping && (
                <>
                  <input required autoComplete="name" placeholder="Full name" value={form.billingFullName} onChange={(e) => setForm({ ...form, billingFullName: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-base" />
                  <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone" value={form.billingPhone} onChange={(e) => setForm({ ...form, billingPhone: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-base" />
                  <input required autoComplete="street-address" placeholder="Address" value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} className="md:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-base" />
                  <input required autoComplete="address-level2" placeholder="City / Town" value={form.billingCity} onChange={(e) => setForm({ ...form, billingCity: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-base" />
                  <input autoComplete="postal-code" placeholder="Postal code (optional)" value={form.billingPostalCode} onChange={(e) => setForm({ ...form, billingPostalCode: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-base" />
                  <input required autoComplete="country-name" placeholder="Country" value={form.billingCountry} onChange={(e) => setForm({ ...form, billingCountry: e.target.value })} className="md:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-base" />
                </>
              )}
              {billingMatchesShipping && (
                <p className="md:col-span-2 text-xs text-muted-foreground">Billing address will be taken from your shipping details above.</p>
              )}
            </div>
          </article>

          {/* 3 — Payment method */}
          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Payment method</h2>
            <p className="mt-2 text-sm text-muted-foreground">Choose how you would like to pay for your order.</p>
            <div className="mt-4 grid gap-3">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition-colors ${form.paymentChannel === option.id ? "border-foreground bg-foreground/5" : "border-border"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="paymentChannel" checked={form.paymentChannel === option.id} onChange={() => setForm({ ...form, paymentChannel: option.id })} />
                      <div className="flex items-center gap-2">
                        {option.id === "cash_on_delivery" ? (
                          <Package className="h-4 w-4 text-foreground" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-foreground" />
                        )}
                        <p className="text-sm font-medium text-foreground">{option.title}</p>
                      </div>
                    </div>
                    {option.logos.length > 0 && (
                      <div className="flex items-center gap-1">
                        {option.logos.map((logoSrc) => (
                          <Image key={logoSrc} src={logoSrc} alt="payment logo" width={36} height={22} unoptimized className="h-5 w-9 rounded border border-border bg-background object-contain p-0.5" />
                        ))}
                      </div>
                    )}
                  </div>
                  {form.paymentChannel === option.id && (
                    <p className="ml-7 mt-2 text-xs text-muted-foreground">
                      {option.id === "pesapal"
                        ? "After placing your order you will be securely redirected to PesaPal's payment page. Accepts Visa, Mastercard, M-Pesa, Airtel Money, MTN MoMo, and more."
                        : "After placing your order, our team will WhatsApp or call you to confirm your delivery details and arrange payment on arrival."}
                    </p>
                  )}
                </label>
              ))}
            </div>
          </article>

          {/* 4 — Confirm checkout */}
          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Confirm checkout</h2>
            <p className="mt-1 text-sm text-muted-foreground">Almost done! Add any extra delivery instructions or notes for our team below.</p>
            <textarea
              placeholder="Extra delivery instructions or order notes (optional)"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-base"
            />
            <label className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I confirm the billing and shipping details are correct and I am ready to complete this order.
            </label>
            {turnstileSiteKey && (
              <div className="mt-4">
                <Turnstile
                  ref={captchaRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken("")}
                />
              </div>
            )}
            <button
              disabled={submitting || items.length === 0 || !confirmed || (!!turnstileSiteKey && !captchaToken)}
              className="mt-5 w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Creating order..." : "Complete order"}
            </button>
            {submitError && <p className="mt-3 text-sm text-destructive">{submitError}</p>}
          </article>
        </form>
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="font-serif text-2xl text-foreground">Order summary</h2>
        <div className="mt-4 rounded-xl border border-border bg-background p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Gift code</p>
          <div className="mt-2 flex gap-2">
            <input
              value={giftCodeInput}
              onChange={(e) => {
                setGiftCodeInput(e.target.value.toUpperCase())
                setGiftCodeError("")
              }}
              placeholder="Enter code"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-base"
            />
            <button
              type="button"
              onClick={() => void applyGiftCode()}
              disabled={giftCodeBusy}
              className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground disabled:opacity-60"
            >
              {giftCodeBusy ? "Applying..." : "Apply"}
            </button>
          </div>
          {giftCodeError && <p className="mt-2 text-xs text-destructive">{giftCodeError}</p>}
          {appliedGiftCode && (
            <p className="mt-2 text-xs text-foreground">
              Applied {appliedGiftCode.code}: -{appliedGiftCode.currency} {appliedGiftCode.discountAmount.toLocaleString("en-US")}
            </p>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.size}`} className="flex items-center justify-between text-sm">
              <span>{item.product.name} ({item.size}) x{item.quantity}</span>
              <span>TZS {(item.product.priceTZS * item.quantity).toLocaleString("en-US")}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>TZS {totalPrice.toLocaleString("en-US")}</span></div>
          <div className="mt-1 flex justify-between text-muted-foreground"><span>Shipping</span><span>TBA</span></div>
          {discountAmount > 0 && (
            <div className="mt-1 flex justify-between text-green-700">
              <span>Discount ({appliedGiftCode?.code})</span>
              <span>- TZS {discountAmount.toLocaleString("en-US")}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between font-semibold"><span>Estimated total</span><span>TZS {estimatedTotal.toLocaleString("en-US")}</span></div>
          <p className="mt-1 text-xs text-muted-foreground">Final total includes shipping, confirmed after order placement.</p>
        </div>
        <div className="mt-5 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Selected payment
          </div>
          <p className="mt-2">{selectedOption.title}</p>
        </div>
      </aside>
    </section>
  )
}

export function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <CheckoutInner />
      <SiteFooter />
    </main>
  )
}
