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

function PaymentInner({ orderId, pesapalState }: { orderId: string; pesapalState?: string }) {
  const router = useRouter()
  const { clearCart } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState("")
  const [finishing, setFinishing] = useState(false)
  const [pesapalLoading, setPesapalLoading] = useState(false)

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/orders?id=${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Unable to load order")
          return
        }
        const loaded = data.order as Order | null
        setOrder(loaded ?? null)

        // Auto-initiate PesaPal redirect if payment channel is pesapal and no prior result
        if (loaded?.paymentChannel === "pesapal" && !pesapalState) {
          setPesapalLoading(true)
          try {
            const initRes = await fetch("/api/pesapal/initiate", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ orderId: loaded.id }),
            })
            const initData = (await initRes.json().catch(() => ({}))) as { redirectUrl?: string; error?: string }
            if (!initRes.ok || !initData.redirectUrl) {
              setError(initData.error || "Failed to initiate PesaPal payment. Please try again.")
              setPesapalLoading(false)
              return
            }
            window.location.href = initData.redirectUrl
          } catch {
            setError("Unable to connect to payment provider. Please try again.")
            setPesapalLoading(false)
          }
        }
      })
      .catch(() => setError("Unable to load order"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const confirmCOD = () => {
    if (!order) return
    setFinishing(true)
    clearCart()
    router.push(`/checkout/success?orderId=${order.id}`)
  }

  const retryPesapal = async () => {
    if (!order) return
    setPesapalLoading(true)
    setError("")
    try {
      const initRes = await fetch("/api/pesapal/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })
      const initData = (await initRes.json().catch(() => ({}))) as { redirectUrl?: string; error?: string }
      if (!initRes.ok || !initData.redirectUrl) {
        setError(initData.error || "Failed to initiate payment.")
        setPesapalLoading(false)
        return
      }
      window.location.href = initData.redirectUrl
    } catch {
      setError("Unable to connect to payment provider.")
      setPesapalLoading(false)
    }
  }

  if (error) return <section className="mx-auto max-w-4xl px-4 py-12 text-destructive">{error}</section>
  if (!order || pesapalLoading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-muted-foreground">{pesapalLoading ? "Redirecting to PesaPal secure payment..." : "Loading order..."}</p>
      </section>
    )
  }

  const isPesapal = order.paymentChannel === "pesapal"

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      {isPesapal ? (
        <>
          <h1 className="font-serif text-4xl text-foreground">Payment</h1>
          <div className="mt-6 rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
            <p className="mt-1 text-sm text-muted-foreground">Customer: {order.customer.fullName} ({order.customer.email})</p>
            <p className="mt-3 text-xl font-semibold text-foreground">Total: TZS {order.total.toLocaleString("en-US")}</p>

            {pesapalState === "failed" && (
              <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
                <p className="text-sm font-medium text-destructive">Payment was not completed</p>
                <p className="mt-1 text-xs text-muted-foreground">Your payment was declined or cancelled. Please try again or use a different method.</p>
              </div>
            )}
            {pesapalState === "pending" && (
              <div className="mt-4 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3">
                <p className="text-sm font-medium text-foreground">Payment is being processed</p>
                <p className="mt-1 text-xs text-muted-foreground">Your payment is pending confirmation. You will be notified once complete.</p>
              </div>
            )}
            {(pesapalState === "error" || !pesapalState) && (
              <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-sm text-muted-foreground">Click below to proceed to PesaPal's secure payment page.</p>
              </div>
            )}

            <button
              onClick={() => void retryPesapal()}
              disabled={pesapalLoading}
              className="mt-6 w-full rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pesapalLoading ? "Redirecting..." : pesapalState === "failed" ? "Try Payment Again" : "Proceed to PesaPal"}
            </button>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
        </>
      ) : (
        <>
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
            <button
              onClick={confirmCOD}
              disabled={finishing}
              className="mt-6 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground"
            >
              {finishing ? "Continuing..." : "View Order Confirmation"}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export function CheckoutPaymentPage({ orderId, pesapalState }: { orderId: string; pesapalState?: string }) {
  return (
    <main className="min-h-screen bg-background">
      <PaymentInner orderId={orderId} pesapalState={pesapalState} />
      <SiteFooter />
    </main>
  )
}

