import type { Metadata } from "next"
import { ProductsCatalogPage } from "@/components/products-catalog-page"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the MERAKI shop for elegant modest fashion inspired by African identity.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    type: "website",
    url: "/shop",
    title: "Shop | MERAKI the Brand",
    description: "Browse the MERAKI shop for elegant modest fashion inspired by African identity.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop | MERAKI the Brand",
    description: "Browse the MERAKI shop for elegant modest fashion inspired by African identity.",
  },
}

export default async function ShopPage() {
  const { products, categories } = await loadStorefrontData()
  return <ProductsCatalogPage products={products} categories={categories} />
}
