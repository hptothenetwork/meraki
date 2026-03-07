"use client"

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs"

type StorefrontEvent = {
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

type EventsLivePageProps = {
  initialEvents: StorefrontEvent[]
}

type EventsApiResponse = {
  items?: StorefrontEvent[]
}

export function EventsLivePage({ initialEvents }: EventsLivePageProps) {
  const [events, setEvents] = useState<StorefrontEvent[]>(initialEvents)

  const refreshEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/events?t=${Date.now()}`, { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as EventsApiResponse
      setEvents(Array.isArray(data.items) ? data.items : [])
    } catch {
      // Keep last known events on network/API errors.
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshEvents()
    const interval = window.setInterval(() => {
      void refreshEvents()
    }, 4000)
    return () => window.clearInterval(interval)
  }, [refreshEvents])

  useEffect(() => {
    const onFocus = () => {
      void refreshEvents()
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshEvents()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [refreshEvents])

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-28 md:px-8 md:pb-12 md:pt-32">
      <SiteBreadcrumbs items={[{ label: "HOME", href: "/" }, { label: "EVENTS" }]} className="mb-5" />
      <h1 className="font-serif text-4xl text-foreground">Events</h1>
      <p className="mt-2 text-muted-foreground">Live updates from admin-published events.</p>

      {events.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No events published yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {events.map((event) => {
            const hero = event.posterImage || event.image || event.media?.[0]?.url
            const heroType = detectMediaType(hero, event.media?.[0]?.type)
            return (
              <article key={event.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <Link href={`/events/${encodeURIComponent(event.id)}`} className="block">
                  {hero &&
                    (heroType === "video" ? (
                      <video src={hero} className="h-56 w-full object-cover" muted loop playsInline />
                    ) : (
                      <img src={hero} alt={event.title} className="h-56 w-full object-cover" />
                    ))}
                </Link>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-serif text-2xl text-foreground">{event.title}</h2>
                    {event.featured && (
                      <span className="rounded-full bg-accent/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatEventDate(event.date)} - {event.location || "Venue TBA"}
                  </p>
                  <p className="mt-3 text-sm text-foreground/90 line-clamp-3">{event.shortDescription || event.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <Link href={`/events/${encodeURIComponent(event.id)}`} className="text-sm font-medium text-foreground underline underline-offset-4">
                      Open Event
                    </Link>
                    {event.link && (
                      <a href={event.link} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground underline underline-offset-4">
                        Registration link
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function detectMediaType(src?: string, type?: "image" | "video") {
  if (type === "video") return "video"
  const clean = (src || "").split("?")[0].toLowerCase()
  return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov") || clean.endsWith(".m4v")
    ? "video"
    : "image"
}

function formatEventDate(value?: string) {
  if (!value) return "Date TBA"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed)
}
