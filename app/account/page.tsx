"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

type AccountOrder = {
  id: string
  status: string
  paymentStatus?: string
  currency: string
  total: number
  createdAt?: string
}

export default function AccountPage() {
  const [orderId, setOrderId] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<AccountOrder | null>(null)

  const handleLookup = async (event: FormEvent) => {
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
      const data = (await res.json().catch(() => ({}))) as { error?: string; order?: AccountOrder }
      if (!res.ok || !data.order) {
        setError(data.error || "Could not find your order.")
        return
      }
      setOrder(data.order)
    } catch {
      setError("Could not load order details right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Account</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground">Account and Order Help</h1>
        <p className="mt-4 text-muted-foreground">
          Quick access to track your order and get support.
        </p>

        <form onSubmit={handleLookup} className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
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
          <button type="submit" disabled={loading} className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground">
            {loading ? "Checking..." : "Find Order"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {order && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-medium text-foreground">Order {order.id}</p>
            <p className="mt-1 text-muted-foreground">Status: {order.status}</p>
            <p className="text-muted-foreground">Payment: {order.paymentStatus || "pending"}</p>
            <p className="text-muted-foreground">
              Total: {order.currency} {Number(order.total || 0).toLocaleString("en-US")}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/track-order" className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground">
            Open Full Tracking Page
          </Link>
          <Link href="/contact" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
            Contact Support
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
