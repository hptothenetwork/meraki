import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductsCatalogPage } from "@/components/products-catalog-page"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const { categories } = await loadStorefrontData()
  const foundCategory = categories.find((item) => item.slug === category)
  const categoryName = foundCategory?.name || toTitleCase(category)
  const canonical = `/shop/${encodeURIComponent(category)}`
  const description = `Explore ${categoryName} styles from MERAKI the Brand.`

  return {
    title: `${categoryName} Collection`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${categoryName} Collection | MERAKI the Brand`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} Collection | MERAKI the Brand`,
      description,
    },
  }
}

export default async function ShopCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const { products, categories } = await loadStorefrontData()

  const exists =
    categories.some((item) => item.slug === category) ||
    products.some((item) => item.tags.includes(category))

  if (!exists) notFound()

  return <ProductsCatalogPage products={products} categories={categories} initialCategory={category} />
}

function toTitleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}
