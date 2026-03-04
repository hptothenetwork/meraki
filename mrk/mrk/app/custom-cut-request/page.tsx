import type { Metadata } from "next"
import { ContactPage } from "@/components/contact-page"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Custom Cut Request",
  description: "Submit a custom cut request to MERAKI with your preferred style, fabric, and timeline.",
  alternates: {
    canonical: "/custom-cut-request",
  },
}

export default async function CustomCutRequestPage() {
  const { siteAssets } = await loadStorefrontData()
  return <ContactPage siteAssets={siteAssets} mode="custom_cut" />
}
