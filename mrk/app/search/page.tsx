import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Search",
  description: "Search categories at MERAKI the Brand.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SearchPage() {
  const { categories } = await loadStorefrontData()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <h1 className="font-serif text-4xl text-foreground">Search</h1>
        <p className="mt-2 text-muted-foreground">Pick a category to start browsing.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-accent"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
