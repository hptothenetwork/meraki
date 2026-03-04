"use client"

import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"

export function CheckoutSuccessPage({ orderId }: { orderId: string }) {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-5xl text-foreground">Thank You</h1>
        <p className="mt-4 text-muted-foreground">Your order has been received. Payment confirmation will be completed after verification.</p>
        <p className="mt-2 text-sm text-muted-foreground">Order: {orderId}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/products" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Continue Shopping</Link>
          <Link href="/blogs" className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground">Read Blogs</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
