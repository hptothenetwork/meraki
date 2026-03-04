import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { safeJsonLd } from "@/lib/seo"

const faqs = [
  {
    q: "How do I choose the right size?",
    a: "Our current collection is free size and designed for easy comfortable fit.",
  },
  {
    q: "How long does delivery take?",
    a: "Most orders process within 1-2 business days. Delivery timing depends on destination and courier schedules.",
  },
  {
    q: "Can I exchange my order?",
    a: "Yes. You can request an exchange within 7 days if the item is unworn and in original condition.",
  },
  {
    q: "How can I track my order?",
    a: "Order tracking will be available after shipping API integration. For now, contact support with your order ID.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, we support both local and international delivery.",
  },
  {
    q: "How do I request a return?",
    a: "Open the Returns page, then contact us with your order ID and reason within 7 days of delivery.",
  },
  {
    q: "Can I submit event collaboration requests?",
    a: "Yes. Use the Contact page and include event date, venue, and expected audience size in your message.",
  },
  {
    q: "Where can I get help quickly?",
    a: "Use the Contact page form for fastest response, or reach us using the listed phone and email details.",
  },
]

export const metadata: Metadata = {
  title: "FAQ",
  description: "Quick answers about sizing, delivery, returns, and support for MERAKI orders.",
  alternates: {
    canonical: "/faq",
  },
}

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <h1 className="font-serif text-4xl text-foreground">FAQ</h1>
        <p className="mt-2 text-muted-foreground">Quick answers for shopping, sizing, and orders.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          For complete return rules, visit the Returns page. For direct support, use the Contact page.
        </p>

        <div className="mt-6 space-y-3">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-serif text-2xl text-foreground">{item.q}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
