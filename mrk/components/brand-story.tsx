"use client"

import Image from "next/image"
import { Layers, Scissors, MapPin, Globe } from "lucide-react"
import type { ProductMedia } from "@/types/catalog"

const proofPoints = [
  {
    icon: Layers,
    label: "Small batches",
  },
  {
    icon: Scissors,
    label: "Handcrafted finishing",
  },
  {
    icon: MapPin,
    label: "Designed in Tanzania",
  },
  {
    icon: Globe,
    label: "Agents worldwide",
  },
]

type BrandStoryProps = {
  storyMedia?: ProductMedia
}

export function BrandStory({ storyMedia }: BrandStoryProps) {
  return (
    <section id="our-story" className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Image */}
          <div className="relative">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
              <Image
                src={storyMedia?.src || "/images/product-kaftan-green.jpg"}
                alt={storyMedia?.alt || "Meraki the Brand - Afro-inspired kaftan craftsmanship"}
                fill
                className="object-cover"
              />
            </div>
            {/* Handwritten caption */}
            <p
              className="mt-4 text-center text-sm italic text-muted-foreground"
              style={{ fontFamily: "var(--font-dancing)" }}
            >
              putting soul, creativity & love into everything we do
            </p>
          </div>

          {/* Right: Story */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Our Story
            </p>
            <h2 className="mb-8 font-serif text-3xl text-foreground md:text-4xl text-balance">
              Born from Passion, Rooted in Africa
            </h2>

            <div className="mb-10 space-y-5 text-sm leading-relaxed text-muted-foreground md:text-base">
              <p>
                Meraki the Brand was born from passion, purpose, and a deep love for
                African identity. What started as a local dream has grown into a brand
                that proudly sews, designs, and represents Afro-inspired and modest
                casual wear made for today&apos;s confident, modern woman.
              </p>
              <p>
                Our design language is intentionally modest at its core: longer lines,
                comfortable coverage, breathable fabrics, and elegant silhouettes that
                let women feel confident without compromising personal values.
              </p>
              <p>
                From our early days of small productions and learning every stitch by
                hand, we have grown step by step through consistency, faith, and the
                unwavering support of our customers. Every collection tells a story
                &mdash; of culture, craftsmanship, and commitment to quality.
              </p>
              <p>
                Today, Meraki the Brand stands strong as a local Tanzanian brand with
                agents across different countries. Our designs have crossed borders while
                staying true to their roots, carrying the beauty of Afro heritage
                wherever they go.
              </p>
            </div>

            {/* Proof Points */}
            <div className="flex flex-wrap gap-8">
              {proofPoints.map((point) => (
                <div key={point.label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <point.icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm text-foreground">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
