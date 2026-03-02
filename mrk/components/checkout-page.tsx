"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, CreditCard, Smartphone, Landmark } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { SiteFooter } from "@/components/site-footer"

type PaymentOption = {
  id: "visa_mastercard_amex" | "mpesa" | "airtel_money" | "mtn_momo" | "tigo_pesa_mixx" | "bank_transfer"
  method: "card" | "mobile_money" | "bank_transfer"
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

// TODO(payments-api): keep these as UI mock options until payment provider API keys + callback flow are wired.
const paymentOptions: PaymentOption[] = [
  { id: "visa_mastercard_amex", method: "card", title: "Visa / Mastercard / Amex", note: "Pay securely by card", logos: ["/payments/visa.PNG", "/payments/master.PNG"] },
  { id: "mpesa", method: "mobile_money", title: "M-Pesa", note: "Mobile money checkout", logos: ["/payments/voda.png"] },
  { id: "airtel_money", method: "mobile_money", title: "Airtel Money", note: "Mobile money checkout", logos: ["/payments/airtel.PNG"] },
  { id: "mtn_momo", method: "mobile_money", title: "MTN MoMo", note: "Mobile money checkout", logos: ["/payments/halotel.PNG", "/payments/Zantel.PNG"] },
  { id: "tigo_pesa_mixx", method: "mobile_money", title: "Tigo Pesa / Mixx", note: "Mobile money checkout", logos: ["/payments/Tpesa.PNG", "/payments/mixx.PNG"] },
  { id: "bank_transfer", method: "bank_transfer", title: "Bank Transfer", note: "Direct bank settlement", logos: [] },
]

function iconForMethod(method: PaymentOption["method"]) {
  if (method === "card") return <CreditCard className="h-4 w-4" />
  if (method === "mobile_money") return <Smartphone className="h-4 w-4" />
  return <Landmark className="h-4 w-4" />
}

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
    paymentChannel: "mpesa" as PaymentOption["id"],
  })

  // TODO(shipping-api): replace this flat mock rule with live shipping quotes once courier API keys are ready.
  const shipping = totalPrice >= 250000 ? 0 : 10000
  const discountAmount = appliedGiftCode?.discountAmount || 0
  const total = Math.max(0, totalPrice + shipping - discountAmount)
  const selectedOption = paymentOptions.find((option) => option.id === form.paymentChannel) || paymentOptions[0]

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
        paymentMethod: selectedOption.method,
        paymentChannel: selectedOption.id,
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
            {!sameAsBilling && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input required={!sameAsBilling} placeholder="Recipient name" value={form.shippingRecipientName} onChange={(e) => setForm({ ...form, shippingRecipientName: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
                <input required={!sameAsBilling} placeholder="Phone" value={form.shippingPhone} onChange={(e) => setForm({ ...form, shippingPhone: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
                <input required={!sameAsBilling} placeholder="City" value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
                <input required={!sameAsBilling} placeholder="Country" value={form.shippingCountry} onChange={(e) => setForm({ ...form, shippingCountry: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
                <input required={!sameAsBilling} placeholder="Address" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} className="md:col-span-2 rounded-lg border border-border bg-background px-3 py-2" />
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Payment method</h2>
            <p className="mt-2 text-sm text-muted-foreground">Choose a Pesapal-supported method.</p>
            <div className="mt-4 grid gap-2">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${
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
                    <span className="flex items-center gap-2 text-sm text-foreground">
                      {iconForMethod(option.method)}
                      {option.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {option.logos.length > 0 &&
                      option.logos.map((logoSrc) => (
                        <Image
                          key={`${option.id}-${logoSrc}`}
                          src={logoSrc}
                          alt={`${option.title} placeholder`}
                          width={40}
                          height={24}
                          unoptimized
                          className="h-6 w-10 rounded border border-border bg-background object-contain p-1"
                        />
                      ))}
                    {option.logos.length === 0 && (
                      <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Bank
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{option.note}</span>
                  </div>
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-serif text-2xl text-foreground">Shipping price mockup</h2>
            <p className="mt-2 text-sm text-muted-foreground">Example rates to preview delivery pricing logic.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Dar es Salaam</p>
                <p className="mt-2 text-lg font-semibold text-foreground">TZS 10,000</p>
                <p className="text-xs text-muted-foreground">Same/next day zone</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Other cities</p>
                <p className="mt-2 text-lg font-semibold text-foreground">TZS 15,000</p>
                <p className="text-xs text-muted-foreground">1-3 business days</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Express</p>
                <p className="mt-2 text-lg font-semibold text-foreground">TZS 25,000</p>
                <p className="text-xs text-muted-foreground">Priority handling</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Current live cart rule: free shipping from TZS 250,000; otherwise TZS 10,000.</p>
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
