"use client"

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react"
import { Play } from "lucide-react"

type EventMediaItem = {
  url: string
  type: "image" | "video"
}

export function EventMediaCarousel({
  title,
  posterImage,
  image,
  media,
}: {
  title: string
  posterImage?: string
  image?: string
  media?: Array<{ url: string; type?: "image" | "video" }>
}) {
  const gallery = useMemo<EventMediaItem[]>(() => {
    const normalized = (media || [])
      .map((item) => {
        const url = (item?.url || "").trim()
        if (!url) return null
        return {
          url,
          type: detectMediaType(url, item?.type),
        }
      })
      .filter((item): item is EventMediaItem => Boolean(item))

    if (normalized.length > 0) return normalized

    const fallback = (posterImage || image || "").trim()
    if (!fallback) return []
    return [{ url: fallback, type: detectMediaType(fallback) }]
  }, [image, media, posterImage])

  const [activeIndex, setActiveIndex] = useState(0)
  const active = gallery[activeIndex] || gallery[0]

  if (!active) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
        No media uploaded for this event yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {active.type === "video" ? (
          <video src={active.url} className="aspect-[4/3] w-full object-cover" controls playsInline />
        ) : (
          <img src={active.url} alt={title} className="aspect-[4/3] w-full object-cover" />
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border ${
                index === activeIndex ? "border-foreground ring-1 ring-foreground/40" : "border-border"
              }`}
              aria-label={`Show event media ${index + 1}`}
            >
              {item.type === "video" ? (
                <>
                  <video src={item.url} className="h-full w-full object-cover" muted loop playsInline />
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/25 text-white">
                    <Play className="h-3.5 w-3.5" />
                  </span>
                </>
              ) : (
                <img src={item.url} alt={`${title} media ${index + 1}`} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function detectMediaType(src?: string, type?: "image" | "video"): "image" | "video" {
  if (type === "video") return "video"
  const clean = (src || "").split("?")[0].toLowerCase()
  return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov") || clean.endsWith(".m4v")
    ? "video"
    : "image"
}

