import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Returns and Exchanges",
  description: "Read the MERAKI return and exchange policy, eligibility, and processing timeline.",
  alternates: {
    canonical: "/returns",
  },
}

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <h1 className="font-serif text-4xl text-foreground">Returns & Exchanges</h1>
        <p className="mt-3 text-muted-foreground">
          We keep this simple. If your size or fit is not right, contact us within 7 days of delivery and include your order ID.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-serif text-2xl text-foreground">Eligible</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Unworn and unwashed items</li>
              <li>Original tags still attached</li>
              <li>Request made within 7 days</li>
            </ul>
          </article>
          <article className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-serif text-2xl text-foreground">Not Eligible</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Worn or altered garments</li>
              <li>Items damaged by misuse</li>
              <li>Requests after policy window</li>
            </ul>
          </article>
        </div>

        <article className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-2xl text-foreground">How to Request</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Go to contact page and choose Returns/Exchange in your message.</li>
            <li>Include order ID, item name, and preferred replacement size.</li>
            <li>Our team confirms next steps and return address.</li>
          </ol>
          <Link href="/contact" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
            Request return
          </Link>
        </article>

        <article className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-2xl text-foreground">Processing Timeline</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Return request review: within 1-2 business days</li>
            <li>Exchange dispatch: after item quality check</li>
            <li>Refund window (if approved): 5-10 business days</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Shipping charges are non-refundable unless the delivered item is incorrect or damaged.
          </p>
        </article>
      </section>
      <SiteFooter />
    </main>
  )
}
