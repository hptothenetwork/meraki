import type { Metadata } from "next"
import { ContactPage } from "@/components/contact-page"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a message to MERAKI support and get direct help from the contact form page.",
  alternates: {
    canonical: "/contact",
  },
}

export default async function Contact() {
  const { siteAssets } = await loadStorefrontData()
  return <ContactPage siteAssets={siteAssets} />
}
