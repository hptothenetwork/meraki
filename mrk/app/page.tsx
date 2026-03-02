import { StorefrontHome } from "@/components/storefront-home"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export default async function MerakiLandingPage() {
  const { categories, products, siteAssets } = await loadStorefrontData()
  return <StorefrontHome categories={categories} products={products} siteAssets={siteAssets} />
}
