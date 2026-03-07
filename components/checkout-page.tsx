"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, Package, CreditCard } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { SiteFooter } from "@/components/site-footer"

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
    id: "cash_on_delivery",
    method: "cash_on_delivery",
    title: "Cash on Delivery",
    note: "Pay when your order arrives",
    logos: [],
  },
  {
    id: "pesapal",
    method: "card",
    title: "Pay Online via PesaPal",
    note: "Card, M-Pesa, Airtel Money, MTN MoMo & more",
    logos: ["/payments/visa.PNG", "/payments/master.PNG", "/payments/voda.png", "/payments/airtel.PNG"],
  },
]

function CheckoutInner() {
  const router = useRouter()
  const { items, totalPrice } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [giftCodeInput, setGiftCodeInput] = useState("")
  const [appliedGiftCode, setAppliedGiftCode] = useState<AppliedGiftCode | null>(null)
  const [giftCodeError, setGiftCodeError] = useState("")
  const [giftCodeBusy, setGiftCodeBusy] = useState(false)
  const [form, setForm] = useState({
    billingFullName: "",
    billingEmail: "",
    billingPhone: "",
    billingAddress: "",
    billingCity: "",
    billingCountry: "Tanzania",
    shippingRecipientName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingCountry: "Tanzania",
    notes: "",
    paymentChannel: "cash_on_delivery" as PaymentOption["id"],
  })

  // TODO(shipping-api): replace this flat mock rule with live shipping quotes once courier API keys are ready.
  const shipping = totalPrice >= 250000 ? 0 : 10000
  const discountAmount = appliedGiftCode?.discountAmount || 0
  const total = Math.max(0, totalPrice + shipping - discountAmount)
  const selectedOption = paymentOptions.find((o) => o.id === form.paymentChannel) ?? paymentOptions[0]

  const shippingDetails = useMemo(
    () =>
      sameAsBilling
        ? {
            recipientName: form.billingFullName,
            phone: form.billingPhone,
            address: form.billingAddress,
            city: form.billingCity,
            country: form.billingCountry,
          }
        : {
            recipientName: form.shippingRecipientName,
            phone: form.shippingPhone,
            address: form.shippingAddress,
            city: form.shippingCity,
            country: form.shippingCountry,
          },
    [form, sameAsBilling],
  )

  const isInternational = (shippingDetails.country || "").trim().toLowerCase() !== "tanzania"

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

    setSubmitting(true)
    setSubmitError("")
    // TODO(payments-api): this only creates an order draft. Real payment intent/session creation should happen here.
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer: {
          fullName: form.billingFullName,
          email: form.billingEmail,
          phone: form.billingPhone,
          address: form.billingAddress,
          city: form.billingCity,
          country: form.billingCountry,
        },
        billingDetails: {
          fullName: form.billingFullName,
          email: form.billingEmail,
          phone: form.billingPhone,
          address: form.billingAddress,
          city: form.billingCity,
          country: form.billingCountry,
        },
        shippingDetails,
        notes: form.notes,
        paymentMethod: selectedOption.method === "cash_on_delivery" ? "cash_on_delivery" : "card",
        paymentChannel: form.paymentChannel,
        items: items.map((item) => ({
          id: item.product.id,
          size: item.size,
          quantity: item.quantity,
        })),
        giftCode: appliedGiftCode?.code,
      }),
    })
    const payload = (await res.json().catch(() => ({}))) as { error?: string; order?: { id: string } }
    setSubmitting(false)
    if (!res.ok || !payload.order?.id) {
      setSubmitError(payload.error || "Failed to create order. Please review checkout details.")
      return
    }

    router.push(`/checkout/payment?orderId=${payload.order.id}`)
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] md:px-8">
      <div>
        <h1 className="font-serif text-4xl text-foreground">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">Billing, shipping and secure payment confirmation.</p>

        <form onSubmit={submit} className="mt-6 space-y-6">
          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Billing details</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input required placeholder="Full name" value={form.billingFullName} onChange={(e) => setForm({ ...form, billingFullName: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
              <input required type="email" placeholder="Email" value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
              <input required placeholder="Phone" value={form.billingPhone} onChange={(e) => setForm({ ...form, billingPhone: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
              <input required placeholder="City" value={form.billingCity} onChange={(e) => setForm({ ...form, billingCity: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
            </div>
            <input required placeholder="Address" value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </article>

          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl text-foreground">Shipping details</h2>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} />
                Same as billing
              </label>
            </div>
            {(!sameAsBilling || isInternational) && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input required={!sameAsBilling} placeholder="Recipient name" value={form.shippingRecipientName} onChange={(e) => setForm({ ...form, shippingRecipientName: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
                <input required={!sameAsBilling} placeholder="Phone" value={form.shippingPhone} onChange={(e) => setForm({ ...form, shippingPhone: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
                <input required={!sameAsBilling} placeholder="City" value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
                <input required={!sameAsBilling} placeholder="Country" value={form.shippingCountry} onChange={(e) => setForm({ ...form, shippingCountry: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
                <input required={!sameAsBilling} placeholder="Address" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} className="md:col-span-2 rounded-lg border border-border bg-background px-3 py-2" />
                {isInternational && (
                  <p className="md:col-span-2 rounded-lg bg-accent/10 border border-accent/40 px-3 py-2 text-xs text-muted-foreground">
                    International order detected — our team will contact you with the shipping cost before processing your order.
                  </p>
                )}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Payment method</h2>
            <p className="mt-2 text-sm text-muted-foreground">Choose how you would like to pay.</p>
            <div className="mt-4 grid gap-3">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                    form.paymentChannel === option.id ? "border-foreground bg-foreground/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentChannel"
                      checked={form.paymentChannel === option.id}
                      onChange={() => setForm({ ...form, paymentChannel: option.id })}
                    />
                    <div className="flex items-center gap-2">
                      {option.id === "cash_on_delivery" ? (
                        <Package className="h-4 w-4 text-foreground" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{option.title}</p>
                        <p className="text-xs text-muted-foreground">{option.note}</p>
                      </div>
                    </div>
                  </div>
                  {option.logos.length > 0 && (
                    <div className="flex items-center gap-1">
                      {option.logos.map((logoSrc) => (
                        <Image
                          key={logoSrc}
                          src={logoSrc}
                          alt="payment logo"
                          width={36}
                          height={22}
                          unoptimized
                          className="h-5 w-9 rounded border border-border bg-background object-contain p-0.5"
                        />
                      ))}
                    </div>
                  )}
                </label>
              ))}
            </div>
            {form.paymentChannel === "pesapal" && (
              <p className="mt-3 text-xs text-muted-foreground">
                You will be redirected to PesaPal&apos;s secure payment page after placing your order.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Shipping</h2>
            {isInternational ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">You have entered an international destination. Please make sure all your shipping details above are filled in correctly.</p>
                <div className="mt-4 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">International shipping — cost to be confirmed</p>
                  <p className="mt-1 text-xs text-muted-foreground">Our team will review your order and reach out to you via email or phone with the exact international shipping cost before your order is processed and dispatched.</p>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">Domestic delivery rates for Tanzania.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Dar es Salaam</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">TZS 10,000</p>
                    <p className="text-xs text-muted-foreground">Same/next day zone</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Other cities</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">TZS 15,000</p>
                    <p className="text-xs text-muted-foreground">1–3 business days</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Express</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">TZS 25,000</p>
                    <p className="text-xs text-muted-foreground">Priority handling</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Free shipping on orders from TZS 250,000.</p>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Confirm checkout</h2>
            <textarea
              placeholder="Order notes (optional)"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
            <label className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I confirm the billing and shipping details are correct and I am ready to complete this order.
            </label>
            <button
              disabled={submitting || items.length === 0 || !confirmed}
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
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
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
          <div className="mt-1 flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `TZS ${shipping.toLocaleString("en-US")}`}</span></div>
          {discountAmount > 0 && (
            <div className="mt-1 flex justify-between text-green-700">
              <span>Discount ({appliedGiftCode?.code})</span>
              <span>- TZS {discountAmount.toLocaleString("en-US")}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between font-semibold"><span>Total</span><span>TZS {total.toLocaleString("en-US")}</span></div>
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
