import type { MetadataRoute } from "next"
import { loadStorefrontData } from "@/lib/storefront-data"
import { listPublishedPosts } from "@/backend/db/posts"
import { listPublishedEvents } from "@/backend/db/events"
import { getAllProducts } from "@/backend/db/products"
import { getSiteUrl, parseDateValue, toAbsoluteUrl } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const routes = [
    "",
    "/shop",
    "/products",
    "/collections",
    "/about",
    "/events",
    "/contact",
    "/contact-details",
    "/custom-cut-request",
    "/faq",
    "/returns",
    "/blogs",
  ]

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }))

  try {
    const [{ products }, rawProducts, posts, events] = await Promise.all([
      loadStorefrontData(),
      getAllProducts(),
      listPublishedPosts(),
      listPublishedEvents(),
    ])

    const productDates = new Map<string, Date>()
    for (const product of rawProducts as Array<Record<string, unknown> & { id: string }>) {
      productDates.set(product.id, parseDateValue(product.updatedAt ?? product.createdAt, now))
    }

    const productEntries: MetadataRoute.Sitemap = products
      .filter((product) => Boolean(product.slug || product.id))
      .map((product) => ({
        url: `${siteUrl}/products/${encodeURIComponent(product.slug || product.id)}`,
        lastModified: productDates.get(product.id) || now,
        changeFrequency: "weekly",
        priority: 0.8,
        images: listProductImages(product),
      }))

    const blogEntries: MetadataRoute.Sitemap = posts
      .filter((post) => Boolean(post.slug))
      .map((post) => ({
        url: `${siteUrl}/blogs/${encodeURIComponent(post.slug)}`,
        lastModified: parseDateValue(post.updatedAt || post.publishedAt || post.createdAt, now),
        changeFrequency: "weekly",
        priority: 0.75,
        images: post.coverImage ? [toAbsoluteUrl(post.coverImage)] : undefined,
      }))

    const eventEntries: MetadataRoute.Sitemap = events
      .filter((event) => event.status !== "draft" && event.status !== "deleted")
      .map((event) => ({
        url: `${siteUrl}/events/${encodeURIComponent(event.id)}`,
        lastModified: parseDateValue(event.date || event.createdAt, now),
        changeFrequency: "weekly",
        priority: 0.7,
        images: listEventImages(event),
      }))

    return dedupeByUrl([...staticEntries, ...productEntries, ...blogEntries, ...eventEntries])
  } catch {
    return staticEntries
  }
}

function listProductImages(product: { image?: string; media?: Array<{ src: string; type?: "image" | "video" }> }) {
  const images = new Set<string>()
  if (product.image) images.add(toAbsoluteUrl(product.image))

  if (Array.isArray(product.media)) {
    for (const item of product.media) {
      if (!item?.src || item.type === "video") continue
      images.add(toAbsoluteUrl(item.src))
    }
  }

  return images.size > 0 ? Array.from(images) : undefined
}

function listEventImages(event: { posterImage?: string; image?: string; media?: Array<{ url?: string; type?: "image" | "video" }> }) {
  const images = new Set<string>()
  if (event.posterImage) images.add(toAbsoluteUrl(event.posterImage))
  if (event.image) images.add(toAbsoluteUrl(event.image))

  if (Array.isArray(event.media)) {
    for (const item of event.media) {
      if (!item?.url || item.type === "video") continue
      images.add(toAbsoluteUrl(item.url))
    }
  }

  return images.size > 0 ? Array.from(images) : undefined
}

function dedupeByUrl(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>()
  const output: MetadataRoute.Sitemap = []
  for (const entry of entries) {
    if (seen.has(entry.url)) continue
    seen.add(entry.url)
    output.push(entry)
  }
  return output
}
