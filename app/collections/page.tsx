import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore MERAKI collections by category and discover signature modest looks.",
  alternates: {
    canonical: "/collections",
  },
}

export default async function CollectionsPage() {
  const { categories } = await loadStorefrontData()

  return (
    <main className="min-h-screen bg-background">
      <Navbar
        hideSearchIcon
        hideCartIcon
        hideAccountIcon
        alwaysShowMenuButton
      />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-28 md:px-8 md:pb-12 md:pt-32">
        <h1 className="font-serif text-4xl text-foreground">Collections</h1>
        <p className="mt-2 text-muted-foreground">Explore collections by category.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent"
            >
              <h2 className="font-serif text-2xl text-foreground">{category.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{category.products.length} styles</p>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
