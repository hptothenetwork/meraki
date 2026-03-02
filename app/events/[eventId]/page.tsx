import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CalendarDays, MapPin, ArrowLeft } from "lucide-react"
import { getVisibleEventById } from "@/backend/db/events"
import { EventMediaCarousel } from "@/components/event-media-carousel"
import { EventAttendanceForm } from "@/components/event-attendance-form"
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs"
import { SiteFooter } from "@/components/site-footer"
import { buildBreadcrumbJsonLd, parseDateValue, safeJsonLd, toAbsoluteUrl } from "@/lib/seo"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params
  const event = await getVisibleEventById(eventId)

  if (!event) {
    return {
      title: "Event Not Found",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const canonical = `/events/${encodeURIComponent(event.id)}`
  const image = event.posterImage || event.image || event.media?.[0]?.url
  const description = event.shortDescription || event.description || `Join ${event.title} by MERAKI the Brand.`
  const isDraft = event.status === "draft"

  return {
    title: event.title,
    description,
    alternates: {
      canonical,
    },
    robots: isDraft
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      type: "website",
      url: canonical,
      title: `${event.title} | MERAKI the Brand`,
      description,
      images: image ? [{ url: image, alt: event.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} | MERAKI the Brand`,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const event = await getVisibleEventById(eventId)
  if (!event) notFound()

  const canonicalPath = `/events/${encodeURIComponent(event.id)}`
  const eventDescription = event.shortDescription || event.description || `Join ${event.title} by MERAKI the Brand.`
  const startDate = parseDateValue(event.date, new Date()).toISOString()
  const endDate = event.endDate ? parseDateValue(event.endDate, new Date(startDate)).toISOString() : undefined
  const eventImages = Array.from(
    new Set(
      [event.posterImage, event.image, ...(event.media || []).map((item) => item.url)]
        .filter((item): item is string => Boolean(item))
        .map((item) => toAbsoluteUrl(item)),
    ),
  )

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: eventDescription,
    startDate,
    endDate,
    eventStatus: mapEventStatus(event.status),
    image: eventImages.length > 0 ? eventImages : undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location || "Venue to be announced",
      address: event.location || undefined,
    },
    organizer: {
      "@type": "Organization",
      name: "MERAKI the Brand",
      url: toAbsoluteUrl("/"),
    },
    url: toAbsoluteUrl(canonicalPath),
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: event.title, path: canonicalPath },
  ])

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd([eventJsonLd, breadcrumbJsonLd]) }}
      />
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <SiteBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Events", href: "/events" },
            { label: event.title },
          ]}
          className="mb-4"
        />

        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <EventMediaCarousel title={event.title} posterImage={event.posterImage} image={event.image} media={event.media} />

          <aside className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Event</p>
              <h1 className="mt-2 font-serif text-3xl text-foreground">{event.title}</h1>
              {event.featured && (
                <span className="mt-3 inline-flex rounded-full bg-accent/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
                  Featured
                </span>
              )}
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-accent" />
                <span>{formatEventDateTime(event.date, event.endDate)}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-accent" />
                <span>{event.location || "Venue to be announced"}</span>
              </div>
            </div>

            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-foreground px-5 py-2 text-sm font-medium text-foreground transition hover:bg-foreground hover:text-background"
              >
                Register / Learn more
              </a>
            )}
          </aside>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-2xl text-foreground">Event Details</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {event.description || event.shortDescription || "Details coming soon."}
            </p>
          </article>

          <EventAttendanceForm
            eventId={event.id}
            eventTitle={event.title}
            eventDate={event.date}
            eventLocation={event.location}
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

function formatEventDateTime(start?: string, end?: string) {
  if (!start) return "Date TBA"
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null

  if (Number.isNaN(startDate.getTime())) return start

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const hasTime = startDate.getHours() !== 0 || startDate.getMinutes() !== 0
  const startLabel = hasTime
    ? `${dateFormatter.format(startDate)} at ${timeFormatter.format(startDate)}`
    : dateFormatter.format(startDate)

  if (!endDate || Number.isNaN(endDate.getTime())) return startLabel

  const endHasTime = endDate.getHours() !== 0 || endDate.getMinutes() !== 0
  const endLabel = endHasTime ? `${dateFormatter.format(endDate)} at ${timeFormatter.format(endDate)}` : dateFormatter.format(endDate)
  return `${startLabel} - ${endLabel}`
}

function mapEventStatus(status: string | undefined) {
  if (status === "past") return "https://schema.org/EventCompleted"
  if (status === "deleted") return "https://schema.org/EventCancelled"
  return "https://schema.org/EventScheduled"
}
