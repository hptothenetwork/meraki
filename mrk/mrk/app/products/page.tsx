import type { Metadata } from "next"
import { ProductsCatalogPage } from "@/components/products-catalog-page"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Products",
  description: "Shop MERAKI the Brand products, including modest Afro-inspired kaftans and boubous.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    type: "website",
    url: "/products",
    title: "Products | MERAKI the Brand",
    description: "Shop MERAKI the Brand products, including modest Afro-inspired kaftans and boubous.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Products | MERAKI the Brand",
    description: "Shop MERAKI the Brand products, including modest Afro-inspired kaftans and boubous.",
  },
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams
  const { products, categories } = await loadStorefrontData()
  return <ProductsCatalogPage products={products} categories={categories} initialCategory={params.category} />
}
