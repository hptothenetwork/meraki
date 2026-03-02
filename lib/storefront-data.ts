import "server-only"
import { getAllProducts } from "@/backend/db/products"
import { listCategories } from "@/backend/db/categories"
import { getSiteAssets } from "@/backend/db/site-settings"
import { categories as fallbackCategories, products as fallbackProducts } from "@/lib/data"
import type { StorefrontCategory as Category, StorefrontProduct as Product } from "@/types/storefront"
import type { SiteAssets } from "@/types/catalog"

export async function loadStorefrontData(): Promise<{
  products: Product[]
  categories: Category[]
  siteAssets: SiteAssets
}> {
  const defaultSiteAssets: SiteAssets = {
    quickShop: { enabled: true, productIds: [] },
    partners: [],
    sectionVisibility: {
      hero: true,
      quickShop: true,
      signatureCuts: true,
      aboutMubah: true,
      customerReviews: true,
      editorialCustomers: true,
      materialTexture: true,
      brandValues: true,
      eventsPreview: true,
      partners: true,
      instagramFeed: true,
      newsletter: false,
    },
  }

  try {
    const [rawProducts, rawCategories, rawSiteAssets] = await Promise.all([
      getAllProducts(),
      listCategories(),
      getSiteAssets(),
    ])

    const products = rawProducts.map(normalizeProduct)
    const categoryNames = new Map<string, string>()

    for (const c of rawCategories) {
      const categorySlug = toSlug(c.id || c.name || "general")
      categoryNames.set(categorySlug, c.name || titleCase(categorySlug))
    }

    const categories: Category[] = Array.from(categoryNames.entries())
      .map(([slug, name]) => ({
        name,
        slug,
        products: products.filter((p) => p.tags.includes(slug)),
      }))
      .filter((c) => c.products.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name))

    const quickShopIds = rawSiteAssets?.quickShop?.productIds?.filter((id): id is string => typeof id === "string" && id.length > 0)
    const defaultQuickShopIds = products.slice(0, 4).map((p) => p.id)

    return {
      products,
      categories,
      siteAssets: {
        ...defaultSiteAssets,
        ...(rawSiteAssets || {}),
        quickShop: {
          enabled: rawSiteAssets?.quickShop?.enabled !== false,
          productIds: quickShopIds && quickShopIds.length > 0 ? quickShopIds : defaultQuickShopIds,
        },
        partners: Array.isArray(rawSiteAssets?.partners) ? rawSiteAssets?.partners : [],
        sectionVisibility: {
          ...defaultSiteAssets.sectionVisibility,
          ...(rawSiteAssets?.sectionVisibility || {}),
        },
      },
    }
  } catch (error) {
    console.warn("[storefront] failed to load live data; using bundled fallback dataset", error)
    return {
      products: fallbackProducts,
      categories: fallbackCategories,
      siteAssets: {
        ...defaultSiteAssets,
        quickShop: {
          enabled: true,
          productIds: fallbackProducts.slice(0, 4).map((product) => product.id),
        },
      },
    }
  }
}

function normalizeProduct(raw: Record<string, unknown>): Product {
  const id = asString(raw.id) || asString(raw.slug) || fallbackProductId(raw)
  const category = toSlug(asString(raw.category) || "general")
  const media = normalizeMedia(raw.media, asString(raw.name) || "Meraki product")
  const image =
    media.find((m) => m.type !== "video")?.src ||
    normalizeAssetUrl(asString(raw.fallbackImage)) ||
    "/images/placeholder.jpg"

  const sizeGuide =
    asStringArray(raw.sizeGuide) ||
    asStringArray(raw.sizes) ||
    (Array.isArray(raw.sizeStock)
      ? raw.sizeStock
          .map((s) => (typeof s === "object" && s ? asString((s as Record<string, unknown>).size) : ""))
          .filter((size): size is string => Boolean(size))
      : [])
  const hasSizeVariants = asBoolean(raw.hasSizeVariants) ?? false
  const normalizedSizes = hasSizeVariants ? (sizeGuide.length > 0 ? sizeGuide : ["S", "M", "L"]) : ["Free Size"]

  const priceTzsRaw = asNumber(raw.priceTzs) ?? asNumber(raw.priceTZS)
  const priceUsd = asNumber(raw.priceUsd) ?? 0
  const priceTZS = priceTzsRaw ?? Math.round(priceUsd * 2600)

  const stockStatus = asString(raw.stockStatus)
  const stock = asNumber(raw.stock) ?? 0
  const tags = Array.from(new Set([category, ...(asStringArray(raw.tags) || [])]))
  const fbt = asRelatedItems(raw.fbt) || asRelatedItems(raw.related)
  const styleWith = asRelatedItems(raw.styleWith) || asRelatedItems(raw.styling)
  const alsoPicked = asRelatedItems(raw.alsoPicked)

  return {
    id,
    name: asString(raw.name) || "Untitled Product",
    brand: asString(raw.brand) || "Meraki",
    priceTZS,
    description:
      asString(raw.description) ||
      `A signature ${titleCase(category)} piece designed for confident modest style, crafted for comfort and elevated everyday wear.`,
    subtitle: asString(raw.subtitle),
    fit: asString(raw.fit),
    fabric: asString(raw.fabric),
    shipping: asString(raw.shipping),
    features: asStringArray(raw.features),
    care: asStringArray(raw.care),
    image,
    media,
    slug: asString(raw.slug) || id,
    tags,
    sizes: normalizedSizes,
    hasSizeVariants,
    soldOut: stockStatus === "out_of_stock" || (stockStatus !== "preorder" && stock <= 0),
    fbt,
    styleWith,
    alsoPicked,
    showFbt: asBoolean(raw.showFbt),
    showStyleWith: asBoolean(raw.showStyleWith),
    showAlsoPicked: asBoolean(raw.showAlsoPicked),
    showDescription: asBoolean(raw.showDescription),
    showFabricCare: asBoolean(raw.showFabricCare),
    showFitSize: asBoolean(raw.showFitSize),
    showShippingReturns: asBoolean(raw.showShippingReturns),
    showSustainability: asBoolean(raw.showSustainability),
    showGarmentMeasurements: asBoolean(raw.showGarmentMeasurements),
    showBodyMeasurements: asBoolean(raw.showBodyMeasurements),
    showHeightGuide: asBoolean(raw.showHeightGuide),
  }
}

function fallbackProductId(raw: Record<string, unknown>): string {
  const name = asString(raw.name) || "product"
  const category = asString(raw.category) || "general"
  return toSlug(`${category}-${name}`)
}

function normalizeMedia(value: unknown, productName: string): NonNullable<Product["media"]> {
  if (!Array.isArray(value) || value.length === 0) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const data = item as Record<string, unknown>
      const src = asString(data.src)
      if (!src) return null
      const type = asString(data.type)
      const normalizedSrc = normalizeAssetUrl(src)
      return {
        src: normalizedSrc,
        alt: asString(data.alt) || productName,
        type: type === "video" || type === "image" ? type : inferMediaType(normalizedSrc),
      }
    })
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
}

function inferMediaType(src: string): "image" | "video" {
  const clean = src.split("?")[0].toLowerCase()
  if (clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov") || clean.endsWith(".m4v")) {
    return "video"
  }
  return "image"
}

function titleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general"
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value.map((v) => asString(v)).filter((v): v is string => Boolean(v))
  return items
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return undefined
}

function asRelatedItems(value: unknown): Array<{ id?: string; name: string; priceUsd?: number; image?: string }> | undefined {
  if (!Array.isArray(value)) return undefined

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const data = item as Record<string, unknown>
      const id =
        asString(data.id)?.trim() ||
        asString(data.productId)?.trim() ||
        asString(data.slug)?.trim() ||
        undefined
      const name = asString(data.name)?.trim() || (id ? titleCase(id) : undefined)
      if (!name) return null
      const image =
        normalizeAssetUrl(asString(data.image)) ||
        normalizeAssetUrl(asString(data.fallbackImage)) ||
        normalizeMedia(data.media, name).find((m) => m.type !== "video")?.src ||
        undefined
      return {
        id,
        name,
        priceUsd: asNumber(data.priceUsd) ?? asNumber(data.price),
        image,
      }
    })
    .filter(Boolean) as Array<{ id?: string; name: string; priceUsd?: number; image?: string }>

  return items.length > 0 ? items : undefined
}

function normalizeAssetUrl(value: string | undefined): string {
  const src = (value || "").trim()
  if (!src) return ""
  if (src.startsWith("data:")) return src
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith("/")) return src

  // Handle legacy filenames saved without a path.
  if (/^[^/\\]+\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|mov|m4v)$/i.test(src)) {
    return `/uploads/local/products/${src}`
  }

  return `/${src.replace(/^\/+/, "")}`
}
