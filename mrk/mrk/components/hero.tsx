"use client"

/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import type { ProductMedia } from "@/types/catalog"

type HeroProps = {
  backgroundMedia?: ProductMedia
}

export function Hero({ backgroundMedia }: HeroProps) {
  const [visible, setVisible] = useState(false)
  const heroMedia = backgroundMedia || { src: "/herosection/HSection.png", alt: "Meraki hero section", type: "image" as const }

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {heroMedia.type === "video" ? (
          <video
            src={heroMedia.src}
            className="h-full w-full object-cover object-[78%_center] sm:object-[74%_center] md:object-center"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={heroMedia.src}
            alt={heroMedia.alt || "Meraki hero section"}
            className="h-full w-full object-cover object-[78%_center] sm:object-[74%_center] md:object-center"
          />
        )}
        {/* Soft vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-foreground/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative flex h-full flex-col items-start justify-end px-6 pb-24 md:px-16 lg:px-24">
        <div
          className={`max-w-xl transition-all duration-1000 ease-out ${
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-primary-foreground/70">
            Afro-Inspired Elegant Wear
          </p>
          <h1 className="mb-4 font-serif text-4xl leading-tight text-primary-foreground md:text-5xl lg:text-6xl text-balance">
            {"Made with soul, creativity & love."}
          </h1>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-primary-foreground/80 md:text-base">
            Elegant kaftans with graceful coverage for the confident, modern woman. Designed in Tanzania.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/products" className="rounded-full bg-primary-foreground px-8 py-3 text-sm font-medium tracking-wide text-foreground transition-opacity hover:opacity-90">
              Shop Collection
            </Link>
            <Link href="/#our-story" className="rounded-full border border-primary-foreground/50 px-8 py-3 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary-foreground/10">
              Our Story
            </Link>
          </div>
        </div>

        {/* Scroll Cue */}
        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all delay-500 duration-1000 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50">
              Scroll
            </span>
            <ChevronDown className="h-4 w-4 animate-bounce text-primary-foreground/50" />
          </div>
        </div>
      </div>
    </section>
  )
}
