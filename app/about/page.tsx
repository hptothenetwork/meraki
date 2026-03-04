import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { BrandStory } from "@/components/brand-story"
import { SiteFooter } from "@/components/site-footer"
import { loadStorefrontData } from "@/lib/storefront-data"

export const revalidate = 300

export const metadata: Metadata = {
  title: "About",
  description: "Learn the story and values behind MERAKI the Brand.",
  alternates: {
    canonical: "/about",
  },
}

export default async function AboutPage() {
  const { siteAssets } = await loadStorefrontData()
  const aboutMedia = siteAssets.sectionImages?.aboutMubah
  const storyMedia =
    typeof aboutMedia === "string"
      ? { src: aboutMedia, type: "image" as const }
      : Array.isArray(aboutMedia) && typeof aboutMedia[0] === "string"
        ? { src: aboutMedia[0], type: "image" as const }
        : Array.isArray(aboutMedia) && aboutMedia[0] && typeof aboutMedia[0] === "object" && "src" in aboutMedia[0]
          ? aboutMedia[0]
          : undefined

  return (
    <main className="min-h-screen bg-background">
      <Navbar
        brandVariant="about"
        hideSearchIcon
        hideCartIcon
        hideAccountIcon
        alwaysShowMenuButton
      />
      <BrandStory storyMedia={storyMedia} />
      <SiteFooter />
    </main>
  )
}
