"use client"

/* eslint-disable @next/next/no-img-element */
import { useMemo, type CSSProperties } from "react"
import Link from "next/link"
import { formatTZS, type Category, type Product } from "@/lib/data"
import type { ProductMedia, SiteAssets } from "@/types/catalog"
import { AnnouncementBar } from "@/components/announcement-bar"
import { Navbar } from "@/components/navbar"
import { MiniCart } from "@/components/mini-cart"
import { Hero } from "@/components/hero"
import { CategoryCarousel } from "@/components/category-carousel"
import { BrandStory } from "@/components/brand-story"
import { Newsletter } from "@/components/newsletter"
import { SiteFooter } from "@/components/site-footer"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { useLiveSiteAssets } from "@/hooks/use-live-site-assets"

type StorefrontHomeProps = {
  categories: Category[]
  products: Product[]
  siteAssets: SiteAssets
}

type EditorialItem = {
  id: string
  src: string
  caption?: string
  span?: string
  height?: number
  offset?: string
}

type InstagramItem = {
  src: string
  caption?: string
  link?: string
}

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/meraki_the_brand/"

export function StorefrontHome({ categories, products, siteAssets }: StorefrontHomeProps) {
  const liveSiteAssets = useLiveSiteAssets(siteAssets)
  const quickShopProducts = useMemo(() => {
    const quickShopIds = liveSiteAssets.quickShop?.productIds || []
    return quickShopIds.map((id) => products.find((product) => product.id === id)).filter((p): p is Product => Boolean(p))
  }, [products, liveSiteAssets.quickShop?.productIds])

  const visibility = liveSiteAssets.sectionVisibility || {}
  const heroMedia = resolveSectionMedia(liveSiteAssets.sectionImages?.heroMain)
  const heroFullscreenMedia = resolveSectionMedia(liveSiteAssets.sectionImages?.heroFullscreen)
  const aboutMedia = resolveSectionMedia(liveSiteAssets.sectionImages?.aboutMubah)
  const materialTextureMedia = resolveSectionMedia(liveSiteAssets.sectionImages?.materialTexture)
  const contactHeroMedia = resolveSectionMedia(liveSiteAssets.sectionImages?.contactHero)
  const contactStudioMedia = resolveSectionMedia(liveSiteAssets.sectionImages?.contactStudio)
  const productEditorialMedia = resolveSectionMediaList(liveSiteAssets.sectionImages?.productEditorial)

  const instagramItems = useMemo<InstagramItem[]>(() => {
    if (Array.isArray(liveSiteAssets.instagramPhotos) && liveSiteAssets.instagramPhotos.length > 0) {
      return [...liveSiteAssets.instagramPhotos]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((photo) => ({
          src: normalizeClientAssetSrc(photo.imageUrl),
          caption: photo.caption,
          link: INSTAGRAM_PROFILE_URL,
        }))
    }
    return (liveSiteAssets.sectionImages?.instagramStrip || []).map((src) => ({
      src: normalizeClientAssetSrc(src),
      caption: undefined,
      link: INSTAGRAM_PROFILE_URL,
    }))
  }, [liveSiteAssets.instagramPhotos, liveSiteAssets.sectionImages?.instagramStrip])

  const editorialItems = useMemo<EditorialItem[]>(() => {
    if (Array.isArray(liveSiteAssets.editorialPhotos) && liveSiteAssets.editorialPhotos.length > 0) {
      return [...liveSiteAssets.editorialPhotos]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((photo) => ({
          id: photo.id,
          src: photo.imageUrl,
          caption: photo.caption,
          span: photo.span,
          height: photo.height,
          offset: photo.offset,
        }))
    }
    return (liveSiteAssets.sectionImages?.editorialCustomers || []).map((src, index) => ({
      id: `editorial-${index}`,
      src,
      caption: undefined,
      span: undefined,
      height: undefined,
      offset: undefined,
    }))
  }, [liveSiteAssets.editorialPhotos, liveSiteAssets.sectionImages?.editorialCustomers])

  const partners = liveSiteAssets.partners || []
  const partnerTickerDuration = Math.max(16, partners.length * 8)

  const lengthGuideItems = useMemo(
    () => Object.entries(liveSiteAssets.sectionImages?.lengthGuide || {}),
    [liveSiteAssets.sectionImages?.lengthGuide],
  )

  const signatureCutMedia = liveSiteAssets.sectionImages?.signatureCuts || {}
  const signatureCuts = [...(liveSiteAssets.signatureCuts || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

  const showHero = visibility.hero !== false
  const showQuickShop = visibility.quickShop !== false && liveSiteAssets.quickShop?.enabled !== false && quickShopProducts.length > 0
  const showAbout = visibility.aboutMubah !== false
  const showPartners = visibility.partners !== false && partners.length > 0
  const showSignatureCuts = visibility.signatureCuts !== false && signatureCuts.length > 0
  const showMaterialTexture = visibility.materialTexture !== false && Boolean(materialTextureMedia)
  const showEditorialCustomers = visibility.editorialCustomers !== false && editorialItems.length > 0
  const showInstagramFeed = visibility.instagramFeed !== false && instagramItems.length > 0

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar sale={liveSiteAssets.globalSale} />
      <Navbar />
      <MiniCart />

      <main>
        {showHero && <Hero backgroundMedia={heroMedia} />}

        {heroFullscreenMedia && (
          <section className="px-4 py-6 md:px-8 lg:px-12">
            <div className="overflow-hidden rounded-xl">
              <MediaFrame media={heroFullscreenMedia} className="aspect-[21/9] w-full" style={displayStyle(liveSiteAssets, "heroFullscreen")} />
            </div>
          </section>
        )}

        {showQuickShop && (
          <section className="py-10 md:py-14">
            <div className="mb-2 flex flex-col items-center">
              <h2 className="font-serif text-2xl uppercase tracking-[0.15em] text-foreground md:text-3xl">Quick Shop</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 md:px-8 lg:grid-cols-4 lg:px-12">
              {quickShopProducts.map((product) => {
                const mediaList = (product.media || []).filter((item): item is ProductMedia => Boolean(item?.src))
                const primary = mediaList[0] || { src: product.image, alt: product.name, type: "image" as const }
                const secondaryImage = mediaList.find((item, index) => index > 0 && item.type !== "video")
                const imageStyle = displayStyle(liveSiteAssets, product.id)

                return (
                  <Link
                    key={`quickshop-${product.id}`}
                    className="group text-left"
                    href={`/products/${encodeURIComponent(product.slug || product.id)}`}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-card">
                      {primary.type === "video" ? (
                        <MediaFrame
                          media={primary}
                          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                          style={imageStyle}
                          autoplayVideo
                        />
                      ) : (
                        <>
                          <MediaFrame
                            media={primary}
                            className={`h-full w-full object-cover transition-all duration-500 ${secondaryImage ? "group-hover:opacity-0 group-hover:scale-[1.03]" : "group-hover:scale-[1.03]"
                              }`}
                            style={imageStyle}
                            autoplayVideo
                          />
                          {secondaryImage && (
                            <MediaFrame
                              media={secondaryImage}
                              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
                              style={imageStyle}
                              autoplayVideo
                            />
                          )}
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-foreground md:text-sm">{product.name}</p>
                    <p className="text-[11px] text-muted-foreground md:text-xs">{formatTZS(product.priceTZS)}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {categories.map((category) => (
          <CategoryCarousel key={category.slug} category={category} />
        ))}

        {productEditorialMedia.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
              <div className="mb-4 text-center">
                <h2 className="font-serif text-2xl uppercase tracking-[0.15em] text-foreground md:text-3xl">Editorial Highlights</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {productEditorialMedia.slice(0, 8).map((media, idx) => (
                  <div key={`${media.src}-${idx}`} className="overflow-hidden rounded-lg bg-card">
                    <MediaFrame media={media} className="aspect-[3/4] w-full" style={displayStyle(liveSiteAssets, "productEditorial")} autoplayVideo />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showMaterialTexture && materialTextureMedia && (
          <section className="px-4 py-12 md:px-8 lg:px-12">
            <div className="relative overflow-hidden rounded-xl">
              <MediaFrame media={materialTextureMedia} className="aspect-[16/5] w-full" style={displayStyle(liveSiteAssets, "materialTexture")} />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-center font-serif text-2xl uppercase tracking-[0.2em] text-white md:text-3xl">Crafted for Modest Elegance</p>
              </div>
            </div>
          </section>
        )}

        {showSignatureCuts && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
              <div className="mb-4 text-center">
                <h2 className="font-serif text-2xl uppercase tracking-[0.15em] text-foreground md:text-3xl">Signature Cuts</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {signatureCuts.map((cut) => {
                  const media = resolveSectionMedia(signatureCutMedia[cut.slug as keyof typeof signatureCutMedia]) || {
                    src: cut.image,
                    alt: cut.title,
                  }
                  return (
                    <div key={cut.id} className="overflow-hidden rounded-lg border border-border bg-card">
                      <MediaFrame media={media} className="aspect-[3/4] w-full" autoplayVideo />
                      <div className="p-4">
                        <h3 className="font-serif text-lg text-foreground">{cut.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{cut.copy}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {showAbout && <BrandStory storyMedia={aboutMedia} />}

        {showEditorialCustomers && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
              <div className="mb-4 text-center">
                <h2 className="font-serif text-2xl uppercase tracking-[0.15em] text-foreground md:text-3xl">Real People, Real Meraki</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {editorialItems.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="overflow-hidden rounded-lg bg-card" style={item.offset ? { transform: item.offset } : undefined}>
                    <img src={item.src} alt={item.caption || "Editorial customer"} className="h-full w-full object-cover" />
                    {item.caption && <p className="px-2 py-1 text-xs text-muted-foreground">{item.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showPartners && (
          <section className="py-14">
            <div className="px-4 md:px-8 lg:px-12">
              <div className="mb-6 text-center">
                <h2 className="font-serif text-2xl uppercase tracking-[0.15em] text-foreground md:text-3xl">Partners</h2>
              </div>
              <div className="partners-ticker">
                {partners.map((partner, idx) => {
                  const itemStyle: CSSProperties = {
                    animationDuration: `${partnerTickerDuration}s`,
                    animationDelay: `${-((partnerTickerDuration / Math.max(partners.length, 1)) * idx)}s`,
                  }
                  const hasLink = Boolean(partner.website)
                  return hasLink ? (
                    <a
                      key={`${partner.name}-${partner.logo}-${idx}`}
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="partners-ticker-item inline-flex items-center justify-center opacity-90 transition hover:opacity-100"
                      style={itemStyle}
                    >
                      <img src={partner.logo} alt={partner.name} className="h-14 w-full object-contain md:h-16" />
                    </a>
                  ) : (
                    <span
                      key={`${partner.name}-${partner.logo}-${idx}`}
                      className="partners-ticker-item inline-flex items-center justify-center opacity-90"
                      style={itemStyle}
                    >
                      <img src={partner.logo} alt={partner.name} className="h-14 w-full object-contain md:h-16" />
                    </span>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {showInstagramFeed && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
              <div className="mb-4 text-center">
                <h2 className="font-serif text-2xl uppercase tracking-[0.15em] text-foreground md:text-3xl">Instagram Feed</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {instagramItems.slice(0, 8).map((item, idx) => {
                  const content = <img src={item.src} alt={item.caption || `Instagram item ${idx + 1}`} className="h-full w-full object-cover" />
                  return (
                    <div key={`${item.src}-${idx}`} className="overflow-hidden rounded-lg bg-card">
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noreferrer">
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {(contactHeroMedia || contactStudioMedia) && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
              <div className="grid gap-4 md:grid-cols-2">
                {contactHeroMedia && (
                  <div className="overflow-hidden rounded-lg">
                    <MediaFrame media={contactHeroMedia} className="aspect-[16/10] w-full" style={displayStyle(liveSiteAssets, "contactHero")} />
                  </div>
                )}
                {contactStudioMedia && (
                  <div className="overflow-hidden rounded-lg">
                    <MediaFrame media={contactStudioMedia} className="aspect-[16/10] w-full" style={displayStyle(liveSiteAssets, "contactStudio")} />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {lengthGuideItems.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
              <div className="mb-4 text-center">
                <h2 className="font-serif text-2xl uppercase tracking-[0.15em] text-foreground md:text-3xl">Length Guide</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {lengthGuideItems.map(([key, pair]) => {
                  const front = resolveSectionMedia(pair.front)
                  const back = resolveSectionMedia(pair.back)
                  return (
                    <div key={key} className="rounded-lg border border-border p-4">
                      <h3 className="mb-3 text-sm uppercase tracking-[0.15em] text-muted-foreground">{key}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="overflow-hidden rounded-lg bg-card">{front && <MediaFrame media={front} className="aspect-[3/4] w-full" />}</div>
                        <div className="overflow-hidden rounded-lg bg-card">{back && <MediaFrame media={back} className="aspect-[3/4] w-full" />}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

      </main>

      <Newsletter />
      <SiteFooter />
      <WhatsAppButton whatsappNumber={liveSiteAssets.contact?.whatsappNumber} />

    </div>
  )
}

function resolveSectionMedia(value: string | string[] | ProductMedia[] | undefined): ProductMedia | undefined {
  return resolveSectionMediaList(value)[0]
}

function resolveSectionMediaList(value: string | string[] | ProductMedia[] | undefined): ProductMedia[] {
  if (!value) return []
  if (typeof value === "string") return [{ src: value, type: inferType(value) }]

  const normalized: ProductMedia[] = []
  for (const item of value) {
    if (typeof item === "string") {
      normalized.push({ src: item, type: inferType(item) })
      continue
    }
    if (item && typeof item === "object" && typeof item.src === "string") {
      normalized.push({
        src: item.src,
        alt: item.alt,
        type: item.type || inferType(item.src),
      })
    }
  }
  return normalized
}

function inferType(src: string): "image" | "video" {
  const clean = src.split("?")[0].toLowerCase()
  if (clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov") || clean.endsWith(".m4v")) {
    return "video"
  }
  return "image"
}

function displayStyle(siteAssets: SiteAssets, key: string): CSSProperties | undefined {
  const settings = siteAssets.imageDisplaySettings?.[key]
  if (!settings) return undefined
  const scale = typeof settings.scale === "number" && settings.scale > 0 ? settings.scale : 1
  const x = typeof settings.positionX === "number" ? 50 + settings.positionX : 50
  const y = typeof settings.positionY === "number" ? 50 + settings.positionY : 50
  return {
    objectFit: settings.fit,
    objectPosition: `${x}% ${y}%`,
    transform: scale === 1 ? undefined : `scale(${scale})`,
  }
}

function normalizeClientAssetSrc(src: string): string {
  const value = (src || "").trim()
  if (!value) return value
  if (value.startsWith("data:")) return value
  // Strip localhost origin saved during local development
  const stripped = value.replace(/^https?:\/\/localhost(:\d+)?/i, "")
  if (stripped !== value) return stripped || "/"
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith("/")) return value
  if (/^[^/\\]+\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|mov|m4v)$/i.test(value)) {
    return `/uploads/local/products/${value}`
  }
  return `/${value.replace(/^\/+/, "")}`
}

function MediaFrame({
  media,
  className,
  style,
  autoplayVideo = false,
}: {
  media: ProductMedia
  className?: string
  style?: CSSProperties
  autoplayVideo?: boolean
}) {
  if (media.type === "video") {
    return (
      <video
        src={media.src}
        className={className}
        style={style}
        muted={autoplayVideo}
        autoPlay={autoplayVideo}
        loop={autoplayVideo}
        controls={!autoplayVideo}
        playsInline
      />
    )
  }
  return <img src={media.src} alt={media.alt || "Meraki media"} className={className} style={style} />
}
