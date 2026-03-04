"use client"

import { FormEvent, useState } from "react"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

type TrackedOrder = {
  id: string
  status: string
  paymentStatus?: string
  total: number
  currency: string
  createdAt?: string
  updatedAt?: string
  processingAt?: string
  shippedAt?: string
  deliveredAt?: string
  trackingNumber?: string
  trackingUrl?: string
  items?: Array<{ id: string; name: string; quantity: number; size?: string }>
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [order, setOrder] = useState<TrackedOrder | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setOrder(null)

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; order?: TrackedOrder }
      if (!res.ok || !data.order) {
        setError(data.error || "Could not find that order.")
        return
      }
      setOrder(data.order)
    } catch {
      setError("Could not track your order right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <h1 className="font-serif text-4xl text-foreground">Track Order</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your order ID and the same email used at checkout.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
          <input
            required
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Order ID"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Checkout email"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
          >
            {loading ? "Checking..." : "Track"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {order && (
          <article className="mt-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Order</p>
                <h2 className="text-xl font-semibold text-foreground">{order.id}</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium text-foreground">{order.status}</p>
                <p className="text-xs text-muted-foreground">Payment: {order.paymentStatus || "pending"}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Total: {order.currency} {Number(order.total || 0).toLocaleString("en-US")}
            </p>

            {order.trackingNumber ? (
              <div className="mt-3 text-sm text-foreground">
                Tracking Number: <span className="font-medium">{order.trackingNumber}</span>
                {order.trackingUrl && (
                  <>
                    {" "}
                    -{" "}
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                      Open tracking link
                    </a>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Tracking number not added yet. Your order is still being prepared.
              </p>
            )}

            {order.items && order.items.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">Items</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {order.items.map((item, index) => (
                    <li key={`${item.id}-${index}`}>
                      {item.name} x{item.quantity} {item.size ? `(${item.size})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </section>
      <SiteFooter />
    </main>
  )
}
