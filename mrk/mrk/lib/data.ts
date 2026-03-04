import type { StorefrontCategory, StorefrontCollection, StorefrontProduct } from "@/types/storefront"

export type Product = StorefrontProduct
export type Category = StorefrontCategory
export type Collection = StorefrontCollection

const allProducts: Product[] = [
  {
    id: "savannah-kaftan-red",
    name: "Savannah Kaftan - Red Print",
    brand: "Meraki",
    priceTZS: 185000,
    image: "/images/product-kaftan-red.jpg",
    media: [{ src: "/images/product-kaftan-red.jpg", type: "image", alt: "Savannah Kaftan - Red Print" }],
    slug: "savannah-kaftan-red",
    tags: ["savannah", "kaftans", "best-seller"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "indigo-night-kaftan",
    name: "Indigo Night Kaftan",
    brand: "Meraki",
    priceTZS: 195000,
    image: "/images/product-kaftan-navy.jpg",
    media: [{ src: "/images/product-kaftan-navy.jpg", type: "image", alt: "Indigo Night Kaftan" }],
    slug: "indigo-night-kaftan",
    tags: ["savannah", "kaftans", "best-seller"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "emerald-baroque-kaftan",
    name: "Emerald Baroque Kaftan",
    brand: "Meraki",
    priceTZS: 175000,
    image: "/images/product-kaftan-green.jpg",
    media: [{ src: "/images/product-kaftan-green.jpg", type: "image", alt: "Emerald Baroque Kaftan" }],
    slug: "emerald-baroque-kaftan",
    tags: ["savannah", "kaftans", "trending"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "ocean-bloom-kaftan",
    name: "Ocean Bloom Kaftan",
    brand: "Meraki",
    priceTZS: 185000,
    image: "/images/product-kaftan-blue.jpg",
    media: [{ src: "/images/product-kaftan-blue.jpg", type: "image", alt: "Ocean Bloom Kaftan" }],
    slug: "ocean-bloom-kaftan",
    tags: ["boubous", "new"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "tropical-leaf-kaftan",
    name: "Tropical Leaf Kaftan",
    brand: "Meraki",
    priceTZS: 195000,
    image: "/images/product-kaftan-olive.jpg",
    media: [{ src: "/images/product-kaftan-olive.jpg", type: "image", alt: "Tropical Leaf Kaftan" }],
    slug: "tropical-leaf-kaftan",
    tags: ["kaftans", "best-seller"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "mint-splash-kaftan",
    name: "Mint Splash Kaftan",
    brand: "Meraki",
    priceTZS: 175000,
    image: "/images/product-kaftan-mint.jpg",
    media: [{ src: "/images/product-kaftan-mint.jpg", type: "image", alt: "Mint Splash Kaftan" }],
    slug: "mint-splash-kaftan",
    tags: ["two-piece", "trending"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
]

export const products = allProducts

export const categories: Category[] = [
  {
    name: "Savannah",
    slug: "savannah",
    products: allProducts.filter((p) => p.tags.includes("savannah")),
  },
  {
    name: "Kaftans",
    slug: "kaftans",
    products: allProducts.filter((p) => p.tags.includes("kaftans")),
  },
  {
    name: "Boubous",
    slug: "boubous",
    products: allProducts.filter((p) => p.tags.includes("boubous")),
  },
  {
    name: "Two-Piece Sets",
    slug: "two-piece",
    products: allProducts.filter((p) => p.tags.includes("two-piece")),
  },
]

export const collections: Collection[] = [
  {
    title: "Coastal Evenings",
    slug: "coastal-evenings",
    image: "/images/collection-coastal.jpg",
    description: "Soft silhouettes for sunset dinners and ocean breeze nights.",
  },
  {
    title: "Everyday Ease",
    slug: "everyday-ease",
    image: "/images/collection-everyday.jpg",
    description: "Breathable staples designed for movement and comfort.",
  },
  {
    title: "Night Edit",
    slug: "night-edit",
    image: "/images/collection-night.jpg",
    description: "Statement pieces for elevated evenings and events.",
  },
]

export function getProductMedia(product: Product) {
  if (product.media?.length) return product.media
  return [{ src: product.image, type: "image" as const, alt: product.name }]
}

export function getPrimaryMedia(product: Product) {
  return getProductMedia(product)[0]
}

export function formatTZS(amount: number): string {
  return `TZS ${amount.toLocaleString("en-US")}`
}
