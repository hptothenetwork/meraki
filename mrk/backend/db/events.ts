import "server-only"
import { db } from "../firebase.server"

export type StorefrontEvent = {
  id: string
  title: string
  description: string
  shortDescription?: string
  date: string
  endDate?: string
  location: string
  image?: string
  posterImage?: string
  media?: Array<{
    url: string
    type?: "image" | "video"
  }>
  link?: string
  status: "upcoming" | "ongoing" | "past" | "draft" | "deleted"
  featured?: boolean
  createdAt?: string
}

const collectionName = "events"

export async function listPublishedEvents(): Promise<StorefrontEvent[]> {
  const snap = await db.collection(collectionName).get()
  return snap.docs
    .map((doc) => normalizeEvent({ id: doc.id, ...(doc.data() as Omit<StorefrontEvent, "id">) }))
    .filter((event) => event.status !== "deleted")
    .sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")))
}

export async function getVisibleEventById(id: string): Promise<StorefrontEvent | null> {
  const eventId = id.trim()
  if (!eventId) return null

  const snap = await db.collection(collectionName).doc(eventId).get()
  if (!snap.exists) return null

  const event = normalizeEvent({ id: snap.id, ...(snap.data() as Omit<StorefrontEvent, "id">) })
  if (event.status === "deleted") return null
  return event
}

function normalizeEvent(event: StorefrontEvent): StorefrontEvent {
  return {
    ...event,
    image: normalizeAssetUrl(event.image),
    posterImage: normalizeAssetUrl(event.posterImage),
    media: Array.isArray(event.media)
      ? event.media
          .map((item) => ({
            ...item,
            url: normalizeAssetUrl(item?.url),
          }))
          .filter((item): item is { url: string; type?: "image" | "video" } => Boolean(item.url))
      : undefined,
  }
}

function normalizeAssetUrl(value: string | undefined): string | undefined {
  const src = (value || "").trim()
  if (!src) return undefined
  if (src.startsWith("data:")) return src
  if (/^https?:\/\//i.test(src)) return src
  if (src.startsWith("/")) return src

  if (/^[^/\\]+\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|mov|m4v)$/i.test(src)) {
    return `/uploads/local/products/${src}`
  }

  return `/${src.replace(/^\/+/, "")}`
}
