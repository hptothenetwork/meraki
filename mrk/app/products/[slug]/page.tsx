import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetailPage } from "@/components/product-detail-page"
import { loadStorefrontData } from "@/lib/storefront-data"
import { buildBreadcrumbJsonLd, safeJsonLd, toAbsoluteUrl } from "@/lib/seo"

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { products } = await loadStorefrontData()
  const product = products.find((item) => item.slug === slug || item.id === slug)

  if (!product) {
    return {
      title: "Product Not Found",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const canonical = `/products/${encodeURIComponent(product.slug || product.id)}`
  const image = product.media?.find((item) => item.type !== "video")?.src || product.image
  const description =
    product.description ||
    product.subtitle ||
    `${product.name} by ${product.brand}. Explore premium modest wear from Meraki the Brand.`

  return {
    title: product.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${product.name} | MERAKI the Brand`,
      description,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | MERAKI the Brand`,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { products } = await loadStorefrontData()
  const product = products.find((item) => item.slug === slug || item.id === slug)
  if (!product) notFound()

  const canonicalPath = `/products/${encodeURIComponent(product.slug || product.id)}`
  const schemaDescription =
    product.description ||
    product.subtitle ||
    `${product.name} by ${product.brand}. Explore premium modest wear from MERAKI the Brand.`
  const schemaImages = Array.from(
    new Set(
      [
        ...(product.media || []).filter((item) => item.type !== "video").map((item) => item.src),
        product.image,
      ]
        .filter((item): item is string => Boolean(item))
        .map((item) => toAbsoluteUrl(item)),
    ),
  )

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: schemaDescription,
    image: schemaImages,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "MERAKI the Brand",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "TZS",
      price: String(product.priceTZS),
      availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: toAbsoluteUrl(canonicalPath),
    },
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: product.name, path: canonicalPath },
  ])

  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.tags.some((tag) => product.tags.includes(tag)))
    .slice(0, 4)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd([productJsonLd, breadcrumbJsonLd]) }}
      />
      <ProductDetailPage product={product} relatedProducts={relatedProducts} allProducts={products} />
    </>
  )
}
