export type ProductMedia = {
  src: string
  alt?: string
  type?: "image" | "video"
}

export type Product = {
  id: string
  name: string
  category: string
  subtitle?: string
  description?: string
  priceUsd: number
  priceTzs?: number
  stock?: number
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "preorder"
  badge?: string
  media?: ProductMedia[]
  fit?: string
  fabric?: string
  shipping?: string
  features?: string[]
  care?: string[]
  sizeGuide?: string[]
  hasSizeVariants?: boolean
}

export type Partner = {
  name: string
  logo: string
  website?: string
  size?: "small" | "medium" | "large" | "xlarge"
}

export type SignatureCut = {
  id: string
  title: string
  copy: string
  image: string
  slug: string
  order?: number
}

export type InstagramPhoto = {
  id: string
  imageUrl: string
  caption?: string
  link?: string
  order?: number
}

export type EditorialPhoto = {
  id: string
  imageUrl: string
  caption?: string
  span?: string
  height?: number
  offset?: string
  order?: number
}

export type ImageDisplaySettings = {
  scale?: number
  positionX?: number
  positionY?: number
  fit?: "cover" | "contain" | "fill"
}

export type SiteAssets = {
  partners?: Partner[]
  sectionImages?: {
    heroMain?: string | string[] | ProductMedia[]
    heroFullscreen?: string | string[] | ProductMedia[]
    aboutMubah?: string | string[] | ProductMedia[]
    materialTexture?: string | string[] | ProductMedia[]
    productEditorial?: string | string[] | ProductMedia[]
    contactHero?: string | string[] | ProductMedia[]
    contactStudio?: string | string[] | ProductMedia[]
    signatureCuts?: Partial<Record<"relaxedFit" | "tropicalUrban" | "campShirt" | "linenSets", string | string[] | ProductMedia[]>>
    instagramStrip?: string[]
    editorialCustomers?: string[]
    lengthGuide?: Record<string, { front?: string | string[] | ProductMedia[]; back?: string | string[] | ProductMedia[] }>
  }
  imageDisplaySettings?: Record<string, ImageDisplaySettings>
  globalSale?: {
    active?: boolean
    type?: "clearance" | "blackfriday" | "holiday" | "flash" | "seasonal" | ""
    label?: string
    discountPercent?: number
    showBanner?: boolean
    showNavbar?: boolean
    endsAt?: string
  }
  contact?: {
    whatsappNumber?: string
    phone?: string
    email?: string
    studio?: string
    enableCustomCutsForm?: boolean
  }
  signatureCuts?: SignatureCut[]
  instagramPhotos?: InstagramPhoto[]
  editorialPhotos?: EditorialPhoto[]
  quickShop?: {
    productIds?: string[]
    enabled?: boolean
  }
  sectionVisibility?: {
    hero?: boolean
    quickShop?: boolean
    signatureCuts?: boolean
    aboutMubah?: boolean
    customerReviews?: boolean
    editorialCustomers?: boolean
    materialTexture?: boolean
    brandValues?: boolean
    eventsPreview?: boolean
    partners?: boolean
    instagramFeed?: boolean
    newsletter?: boolean
    [key: string]: boolean | undefined
  }
}

export type Category = {
  id: string
  name: string
  description?: string
  cover?: string
  createdAt?: string
}

export type CurrencyRate = {
  base: string
  target: string
  rate: number
  source?: string
  updatedAt: string
  pairId?: string
}
