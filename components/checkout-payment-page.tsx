"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SiteFooter } from "@/components/site-footer"
import { useCart } from "@/lib/cart-context"

type Order = {
  id: string
  total: number
  paymentMethod: string
  paymentChannel?: string
  customer: { fullName: string; email: string }
}

function PaymentInner({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { clearCart } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState("")
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/orders?id=${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Unable to load order")
          return
        }
        setOrder(data.order || null)
      })
      .catch(() => setError("Unable to load order"))
  }, [orderId])

  const continueAfterPayment = () => {
    if (!order) return
    // TODO(payments-api): replace this manual continue with provider callback/webhook confirmation.
    setFinishing(true)
    clearCart()
    router.push(`/checkout/success?orderId=${order.id}`)
  }

  if (error) return <section className="mx-auto max-w-4xl px-4 py-12 text-destructive">{error}</section>
  if (!order) return <section className="mx-auto max-w-4xl px-4 py-12">Loading payment details...</section>

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl text-foreground">Order Confirmed</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
        <p className="mt-1 text-sm text-muted-foreground">Customer: {order.customer.fullName} ({order.customer.email})</p>
        <p className="mt-3 text-xl font-semibold text-foreground">Total: TZS {order.total.toLocaleString("en-US")}</p>
        <div className="mt-4 rounded-xl border border-accent/50 bg-accent/10 px-4 py-4">
          <p className="text-sm font-medium text-foreground">Cash on Delivery</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your order has been placed successfully. Payment will be collected when your order arrives.
            Our team will reach out to confirm your delivery details.
          </p>
          <p className="mt-2 text-xs text-muted-foreground italic">
            For international orders, our team will contact you with the shipping cost before dispatch.
          </p>
        </div>
        <button onClick={continueAfterPayment} disabled={finishing} className="mt-6 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground">
          {finishing ? "Continuing..." : "View Order Confirmation"}
        </button>
      </div>
    </section>
  )
}

export function CheckoutPaymentPage({ orderId }: { orderId: string }) {
  return (
    <main className="min-h-screen bg-background">
      <PaymentInner orderId={orderId} />
      <SiteFooter />
    </main>
  )
}
