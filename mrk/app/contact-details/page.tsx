import type { Metadata } from "next"
import { ContactPage } from "@/components/contact-page"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Contact Details",
  description: "View MERAKI email, phone, and studio details.",
  alternates: {
    canonical: "/contact-details",
  },
}

export default async function ContactDetailsPage() {
  const { siteAssets } = await loadStorefrontData()
  return <ContactPage siteAssets={siteAssets} mode="details" />
}
