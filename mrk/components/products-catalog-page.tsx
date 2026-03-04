"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Product, Category } from "@/lib/data"
import { Navbar } from "@/components/navbar"
import { MiniCart } from "@/components/mini-cart"
import { SiteFooter } from "@/components/site-footer"
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs"
import { ProductCard } from "@/components/product-card"
import { QuickViewModal } from "@/components/quick-view-modal"

export function ProductsCatalogPage({
  products,
  categories,
  initialCategory,
}: {
  products: Product[]
  categories: Category[]
  initialCategory?: string
}) {
  const [activeCategory, setActiveCategory] = useState(() => {
    if (initialCategory && categories.some((category) => category.slug === initialCategory)) {
      return initialCategory
    }
    return "all"
  })
  const [query, setQuery] = useState("")
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const byCategory = activeCategory === "all" || product.tags.includes(activeCategory)
      const byQuery = !query.trim() || product.name.toLowerCase().includes(query.toLowerCase())
      return byCategory && byQuery
    })
  }, [products, activeCategory, query])

  return (
    <main className="min-h-screen bg-background">
      <Navbar cartOnly />
      <MiniCart />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-28 md:px-8 md:pb-12 md:pt-32">
        <SiteBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} className="mb-4" />
        <h1 className="font-serif text-4xl text-foreground">Shop</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory("all")} className={`rounded-full px-4 py-2 text-sm ${activeCategory === "all" ? "bg-foreground text-background" : "bg-card border border-border"}`}>All</button>
          {categories.map((category) => (
            <button key={category.slug} onClick={() => setActiveCategory(category.slug)} className={`rounded-full px-4 py-2 text-sm ${activeCategory === category.slug ? "bg-foreground text-background" : "bg-card border border-border"}`}>
              {category.name}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products"
          className="mt-4 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <div key={product.id} className="space-y-2">
              <ProductCard product={product} onQuickView={setQuickViewProduct} />
              <Link className="inline-block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4" href={`/products/${encodeURIComponent(product.slug || product.id)}`}>
                View Details
              </Link>
            </div>
          ))}
        </div>
      </section>
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      <SiteFooter />
    </main>
  )
}
