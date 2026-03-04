export type StorefrontMedia = {
  src: string
  type?: "image" | "video"
  alt?: string
}

export type StorefrontRelatedItem = {
  id?: string
  name: string
  priceUsd?: number
  image?: string
}

export interface StorefrontProduct {
  id: string
  name: string
  brand: string
  priceTZS: number
  description?: string
  subtitle?: string
  fit?: string
  fabric?: string
  shipping?: string
  features?: string[]
  care?: string[]
  image: string
  media?: StorefrontMedia[]
  slug: string
  tags: string[]
  sizes: string[]
  hasSizeVariants?: boolean
  soldOut?: boolean
  fbt?: StorefrontRelatedItem[]
  styleWith?: StorefrontRelatedItem[]
  alsoPicked?: StorefrontRelatedItem[]
  showFbt?: boolean
  showStyleWith?: boolean
  showAlsoPicked?: boolean
  showDescription?: boolean
  showFabricCare?: boolean
  showFitSize?: boolean
  showShippingReturns?: boolean
  showSustainability?: boolean
  showGarmentMeasurements?: boolean
  showBodyMeasurements?: boolean
  showHeightGuide?: boolean
}

export interface StorefrontCategory {
  name: string
  slug: string
  products: StorefrontProduct[]
}

export type StorefrontCollection = {
  title: string
  slug: string
  image: string
  description: string
}
