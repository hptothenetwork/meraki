import type { Metadata } from "next"
import { listPublishedEvents } from "@/backend/db/events"
import { EventsLivePage } from "@/components/events-live-page"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Events",
  description: "See upcoming MERAKI the Brand events, showcases, and community experiences.",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    type: "website",
    url: "/events",
    title: "Events | MERAKI the Brand",
    description: "See upcoming MERAKI the Brand events, showcases, and community experiences.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Events | MERAKI the Brand",
    description: "See upcoming MERAKI the Brand events, showcases, and community experiences.",
  },
}

export default async function EventsPage() {
  const events = await listPublishedEvents()

  return (
    <main className="min-h-screen bg-background">
      <Navbar
        hideBrandLogo
        hideSearchIcon
        hideCartIcon
        hideAccountIcon
        alwaysShowMenuButton
      />
      <EventsLivePage initialEvents={events} />
      <SiteFooter />
    </main>
  )
}
