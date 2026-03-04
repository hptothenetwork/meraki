"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Play, ShieldCheck, ShoppingBag, Truck, RotateCcw, Star } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatTZS, type Product } from "@/lib/data"
import { MiniCart } from "@/components/mini-cart"
import { SiteFooter } from "@/components/site-footer"

type ProductDetailPageProps = {
  product: Product
  relatedProducts: Product[]
  allProducts: Product[]
}

type ShareNetwork = "facebook" | "twitter" | "instagram" | "snapchat" | "whatsapp"

function ProductDetailInner({ product, relatedProducts, allProducts }: ProductDetailPageProps) {
  const { addItem, totalItems, setIsCartOpen } = useCart()
  const [size, setSize] = useState(product.sizes[0] || "One Size")
  const [mediaIndex, setMediaIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareHint, setShareHint] = useState("")
  const isSoldOut = Boolean(product.soldOut)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  useEffect(() => {
    const path = `/products/${encodeURIComponent(product.slug || product.id)}`
    const absolute = typeof window === "undefined" ? path : `${window.location.origin}${path}`
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShareUrl(absolute)
  }, [product.id, product.slug])

  const galleryMedia = useMemo(() => {
    const productMedia =
      product.media?.filter((item): item is NonNullable<typeof item> => Boolean(item?.src)) || []
    if (productMedia.length > 0) return productMedia
    return [{ src: product.image, alt: product.name, type: "image" as const }]
  }, [product.image, product.media, product.name])
  const activeMedia = galleryMedia[mediaIndex] || galleryMedia[0]

  const highlights = useMemo(
    () =>
      product.features?.length
        ? product.features
        : [
            "Graceful coverage tailored for confident movement",
            "Versatile styling for events, work, and weekend looks",
            "Designed to feel breathable and polished all day",
          ],
    [product.features],
  )

  const shippingNote =
    product.shipping || "Processing in 1-2 business days. Delivery time depends on destination and courier availability."
  const showSizeSelector =
    product.hasSizeVariants === true &&
    product.sizes.length > 0 &&
    !product.sizes.every((item) => /^(one size|free size)$/i.test(item))
  const sizeSupportLine = showSizeSelector
    ? "Size support and exchange assistance available"
    : "Free size fit designed for comfortable wear"

  const addToBag = () => {
    for (let i = 0; i < quantity; i += 1) addItem(product, size)
  }

  const relatedCatalog = useMemo(() => {
    const byId = new Map<string, Product>()
    const bySlug = new Map<string, Product>()
    const byName = new Map<string, Product>()
    allProducts.forEach((item) => {
      byId.set(item.id, item)
      bySlug.set(item.slug, item)
      byName.set(item.name.toLowerCase(), item)
    })
    return { byId, bySlug, byName }
  }, [allProducts])

  const fbtItems = useMemo(
    () => resolveRelations(product.fbt, relatedCatalog, allProducts),
    [product.fbt, relatedCatalog, allProducts],
  )
  const styleWithItems = useMemo(
    () => resolveRelations(product.styleWith, relatedCatalog, allProducts),
    [product.styleWith, relatedCatalog, allProducts],
  )
  const alsoPickedItems = useMemo(
    () => resolveRelations(product.alsoPicked, relatedCatalog, allProducts),
    [product.alsoPicked, relatedCatalog, allProducts],
  )

  const showDescription = product.showDescription !== false
  const showFitCard =
    product.showFitSize !== false || product.showFabricCare !== false || product.showShippingReturns !== false
  const shareText = `${product.name} | Meraki the Brand`

  const shareItems = useMemo(
    () => [
      {
        key: "facebook" as const,
        label: "Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        icon: "/socialicons/facebook.png",
      },
      {
        key: "twitter" as const,
        label: "X (Twitter)",
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        icon: null,
      },
      {
        key: "whatsapp" as const,
        label: "WhatsApp",
        href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
        icon: "/socialicons/whatsapp.jpg",
      },
      {
        key: "instagram" as const,
        label: "Instagram",
        href: "https://www.instagram.com/",
        icon: "/socialicons/instagram.jpg",
      },
      {
        key: "snapchat" as const,
        label: "Snapchat",
        href: "https://www.snapchat.com/",
        icon: "/socialicons/snapchat.jpg",
      },
    ],
    [shareText, shareUrl],
  )

  const openShare = async (item: { key: ShareNetwork; href: string }) => {
    if (item.key === "instagram" || item.key === "snapchat") {
      if (shareUrl && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl)
          setShareHint(`${item.key === "instagram" ? "Instagram" : "Snapchat"} opened. Product link copied, paste it in your post.`)
        } catch {
          setShareHint(`Open ${item.key === "instagram" ? "Instagram" : "Snapchat"} and paste this product link manually.`)
        }
      }
    } else {
      setShareHint("")
    }
    window.open(item.href, "_blank", "noopener,noreferrer")
  }

  return (
    <main className="min-h-screen bg-background">
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="fixed right-4 top-4 z-40 rounded-full bg-background/90 p-2 text-foreground shadow-sm backdrop-blur"
        aria-label="Open shopping bag"
      >
        <ShoppingBag className="h-5 w-5" />
        {mounted && totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
            {totalItems}
          </span>
        )}
      </button>
      <MiniCart />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>{" "}
          / {product.tags[0] || "Collection"} / {product.name}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {activeMedia.type === "video" ? (
                <video src={activeMedia.src} className="h-full w-full object-cover" controls playsInline />
              ) : (
                <Image
                  src={activeMedia.src}
                  alt={activeMedia.alt || product.name}
                  width={1200}
                  height={1600}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            {galleryMedia.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryMedia.map((media, index) => (
                  <button
                    key={`${media.src}-${index}`}
                    onClick={() => setMediaIndex(index)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border ${
                      index === mediaIndex ? "border-foreground ring-1 ring-foreground/40" : "border-border"
                    }`}
                    aria-label={`Show media ${index + 1}`}
                  >
                    {media.type === "video" ? (
                      <>
                        <video src={media.src} className="h-full w-full object-cover" muted loop playsInline />
                        <span className="absolute inset-0 flex items-center justify-center bg-foreground/25 text-white">
                          <Play className="h-3.5 w-3.5" />
                        </span>
                      </>
                    ) : (
                      <Image
                        src={media.src}
                        alt={media.alt || product.name}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-1 py-2 md:px-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.brand}</p>
            <h1 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">{product.name}</h1>
            {product.subtitle && <p className="mt-3 text-muted-foreground">{product.subtitle}</p>}
            <p className="mt-4 text-3xl text-foreground">{formatTZS(product.priceTZS)}</p>
            {isSoldOut && (
              <span className="mt-3 inline-flex rounded-full bg-[#b14432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                Sold out
              </span>
            )}

            <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" />
                Premium quality checked before dispatch
              </div>
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 text-accent" />
                Fast regional and international delivery
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 h-4 w-4 text-accent" />
                {sizeSupportLine}
              </div>
            </div>

            {showSizeSelector && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Select size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((itemSize) => (
                    <button
                      key={itemSize}
                      onClick={() => setSize(itemSize)}
                      className={`rounded-md border px-4 py-2 text-sm ${
                        size === itemSize ? "border-foreground bg-foreground text-background" : "border-border bg-background"
                      }`}
                    >
                      {itemSize}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quantity</p>
              <div className="mt-2 inline-flex items-center overflow-hidden rounded-full border border-border">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={isSoldOut}
                  className="px-4 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  disabled={isSoldOut}
                  className="px-4 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={addToBag}
                disabled={isSoldOut}
                className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55 sm:min-w-[170px]"
              >
                {isSoldOut ? "Sold out" : "Add to Bag"}
              </button>
              {isSoldOut ? (
                <span className="rounded-full border border-border px-7 py-3 text-center text-sm font-medium text-muted-foreground sm:min-w-[170px]">
                  Unavailable
                </span>
              ) : (
                <Link
                  href="/checkout"
                  className="rounded-full border border-border px-7 py-3 text-center text-sm font-medium text-foreground sm:min-w-[170px]"
                >
                  Buy now
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {showDescription && (
            <article className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-2xl text-foreground">Description</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Share</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {shareItems.map((social) => {
                    return (
                      <button
                        type="button"
                        key={social.key}
                        onClick={() => void openShare(social)}
                        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-background/80 transition hover:opacity-85"
                        aria-label={`Share on ${social.label}`}
                        title={social.label}
                      >
                        {social.icon ? (
                          <Image
                            src={social.icon}
                            alt={social.label}
                            width={36}
                            height={36}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-foreground">X</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {shareHint && <p className="mt-2 text-xs text-muted-foreground">{shareHint}</p>}
              </div>
            </article>
          )}
          <article className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-2xl text-foreground">Why You&apos;ll Love It</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {highlights.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <Star className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
          {showFitCard && (
            <article className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-2xl text-foreground">Fit, Care & Shipping</h2>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {product.showFitSize !== false && (
                  <p>
                    <span className="font-medium text-foreground">Fit:</span> {product.fit || "Relaxed flowing fit"}
                  </p>
                )}
                {product.showFabricCare !== false && (
                  <>
                    <p>
                      <span className="font-medium text-foreground">Fabric:</span> {product.fabric || "Premium breathable blend"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Care:</span> {product.care?.join(", ") || "Hand wash cold, line dry"}
                    </p>
                  </>
                )}
                {product.showShippingReturns !== false && (
                  <p>
                    <span className="font-medium text-foreground">Shipping:</span> {shippingNote}
                  </p>
                )}
              </div>
            </article>
          )}
        </div>

        {product.showFbt !== false && fbtItems.length > 0 && (
          <RelatedSection title="Frequently Bought Together" items={fbtItems} />
        )}
        {product.showStyleWith !== false && styleWithItems.length > 0 && (
          <RelatedSection title="Style It With" items={styleWithItems} />
        )}
        {product.showAlsoPicked !== false && alsoPickedItems.length > 0 && (
          <RelatedSection title="Also Picked" items={alsoPickedItems} />
        )}

        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-3xl text-foreground">Complete the look</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/products/${item.slug}`} className="group">
                  <div className="overflow-hidden rounded-xl bg-card">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={600}
                      height={800}
                      unoptimized
                      className="aspect-[3/4] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-2 text-sm text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatTZS(item.priceTZS)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
      <SiteFooter />
    </main>
  )
}

export function ProductDetailPage({ product, relatedProducts, allProducts }: ProductDetailPageProps) {
  return <ProductDetailInner key={product.id} product={product} relatedProducts={relatedProducts} allProducts={allProducts} />
}

type ResolvedRelationItem = {
  id: string
  name: string
  image: string
  priceTZS: number
  href?: string
}

function resolveRelations(
  items: Array<{ id?: string; name: string; priceUsd?: number; image?: string }> | undefined,
  catalog: { byId: Map<string, Product>; bySlug: Map<string, Product>; byName: Map<string, Product> },
  fallbackProducts: Product[],
): ResolvedRelationItem[] {
  if (!items?.length) return []

  return items.map((item, index) => {
    const fromCatalog =
      (item.id ? catalog.byId.get(item.id) || catalog.bySlug.get(item.id) : undefined) ||
      catalog.byName.get(item.name.toLowerCase()) ||
      fallbackProducts.find((p) => p.id === item.id || p.slug === item.id)

    if (fromCatalog) {
      return {
        id: `${fromCatalog.id}-${index}`,
        name: fromCatalog.name,
        image: fromCatalog.image,
        priceTZS: fromCatalog.priceTZS,
        href: `/products/${encodeURIComponent(fromCatalog.slug || fromCatalog.id)}`,
      }
    }

    return {
      id: `${item.id || item.name}-${index}`,
      name: item.name,
      image: item.image || "/images/placeholder.jpg",
      priceTZS: Math.round((item.priceUsd || 0) * 2600),
      href: undefined,
    }
  })
}

function RelatedSection({ title, items }: { title: string; items: ResolvedRelationItem[] }) {
  return (
    <section className="mt-12">
      <h2 className="font-serif text-3xl text-foreground">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((item) =>
          item.href ? (
            <Link key={item.id} href={item.href} className="group">
              <div className="overflow-hidden rounded-xl bg-card">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={600}
                  height={800}
                  unoptimized
                  className="aspect-[3/4] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <p className="mt-2 text-sm text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{formatTZS(item.priceTZS)}</p>
            </Link>
          ) : (
            <div key={item.id}>
              <div className="overflow-hidden rounded-xl bg-card">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={600}
                  height={800}
                  unoptimized
                  className="aspect-[3/4] h-full w-full object-cover"
                />
              </div>
              <p className="mt-2 text-sm text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{formatTZS(item.priceTZS)}</p>
            </div>
          ),
        )}
      </div>
    </section>
  )
}
