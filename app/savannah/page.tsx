import { ProductsCatalogPage } from "@/components/products-catalog-page"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export default async function SavannahPage() {
  const { products, categories } = await loadStorefrontData()
  return <ProductsCatalogPage products={products} categories={categories} initialCategory="savannah" />
}
