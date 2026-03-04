"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Category } from "@/lib/data"
import { formatTZS } from "@/lib/data"

interface CategoryCarouselProps {
  category: Category
}

export function CategoryCarousel({ category }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [checkScroll])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector("div")?.offsetWidth || 300
    const scrollAmount = cardWidth + 16
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  return (
    <section className="py-10 md:py-14">
      {/* Header: arrows + title + VIEW ALL */}
      <div className="mb-2 flex flex-col items-center">
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`flex h-8 w-8 items-center justify-center transition-opacity ${
              canScrollLeft ? "text-foreground hover:text-accent" : "text-border"
            }`}
            aria-label={`Scroll ${category.name} left`}
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
          </button>

          <h2 className="font-serif text-2xl uppercase tracking-[0.15em] text-foreground md:text-3xl">
            {category.name}
          </h2>

          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`flex h-8 w-8 items-center justify-center transition-opacity ${
              canScrollRight ? "text-foreground hover:text-accent" : "text-border"
            }`}
            aria-label={`Scroll ${category.name} right`}
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
          </button>
        </div>

        <Link
          href={`/shop/${encodeURIComponent(category.slug)}`}
          className="mt-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          View All
        </Link>
      </div>

      {/* Product Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-4 pb-4 pt-4 scrollbar-hide md:gap-5 md:px-8 lg:px-12"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {category.products.map((product, idx) => {
          const mediaList = product.media?.length
            ? product.media.filter((item): item is NonNullable<typeof item> => Boolean(item?.src))
            : [{ src: product.image, type: "image" as const, alt: product.name }]
          const primaryMedia = mediaList[0]
          const secondaryImage = mediaList.find((item, index) => index > 0 && item.type !== "video")
          return (
            <Link
              key={product.id + category.slug}
              href={`/products/${encodeURIComponent(product.slug || product.id)}`}
              className="group relative w-[48%] flex-shrink-0 cursor-pointer sm:w-[32%] md:w-[28%] lg:w-[22%]"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Product Image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-card">
                {primaryMedia.type === "video" ? (
                  <video
                    src={primaryMedia.src}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    muted
                    playsInline
                    loop
                    autoPlay
                    preload="metadata"
                  />
                ) : (
                  <>
                    <Image
                      src={primaryMedia.src}
                      alt={primaryMedia.alt || product.name}
                      fill
                      loading={idx < 2 ? "eager" : "lazy"}
                      priority={idx < 2}
                      className={`object-cover transition-all duration-500 ${
                        secondaryImage ? "group-hover:opacity-0 group-hover:scale-[1.03]" : "group-hover:scale-[1.03]"
                      }`}
                      sizes="(max-width: 640px) 48vw, (max-width: 768px) 32vw, (max-width: 1024px) 28vw, 22vw"
                    />
                    {secondaryImage && (
                      <Image
                        src={secondaryImage.src}
                        alt={secondaryImage.alt || `${product.name} back view`}
                        fill
                        loading="lazy"
                        className="object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 48vw, (max-width: 768px) 32vw, (max-width: 1024px) 28vw, 22vw"
                      />
                    )}
                  </>
                )}
                {primaryMedia.type === "video" && (
                  <span className="absolute left-3 top-3 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-background">
                    Video
                  </span>
                )}
                {product.soldOut && (
                  <span className="absolute right-3 top-3 bg-destructive px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive-foreground">
                    Sold Out
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="mt-3 text-center">
                <p className="text-xs text-foreground md:text-sm">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatTZS(product.priceTZS)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
