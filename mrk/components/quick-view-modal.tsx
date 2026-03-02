"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatTZS, getProductMedia, type Product } from "@/lib/data"
import { toast } from "sonner"

interface QuickViewModalProps {
  product: Product | null
  onClose: () => void
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  if (!product) return null
  return <QuickViewModalContent key={product.id} product={product} onClose={onClose} />
}

function QuickViewModalContent({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "One Size")
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const mediaItems = getProductMedia(product)
  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0]
  const showSizeSelector =
    product.hasSizeVariants === true &&
    product.sizes.length > 0 &&
    !product.sizes.every((item) => /^(one size|free size)$/i.test(item))

  const handleAdd = () => {
    addItem(product, selectedSize || product.sizes[0])
    toast("Added to bag", {
      description: `${product.name} (${selectedSize || product.sizes[0]}) has been added to your bag.`,
    })
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view of ${product.name}`}
        className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
          aria-label="Close quick view"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square bg-secondary md:aspect-auto md:min-h-[500px]">
            {activeMedia?.type === "video" ? (
              <video src={activeMedia.src} className="h-full w-full object-cover" controls muted playsInline />
            ) : (
              <button
                type="button"
                onClick={() => setIsZoomed((prev) => !prev)}
                className="relative h-full w-full overflow-hidden"
                aria-label={isZoomed ? "Zoom out image" : "Zoom in image"}
              >
                <Image
                  src={activeMedia?.src || product.image}
                  alt={activeMedia?.alt || product.name}
                  fill
                  className={`object-cover transition-transform duration-300 ${isZoomed ? "scale-[2]" : "scale-100"}`}
                />
              </button>
            )}
            {activeMedia?.type !== "video" && (
              <button
                type="button"
                onClick={() => setIsZoomed((prev) => !prev)}
                className="absolute right-3 top-3 z-10 rounded-full bg-card/80 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm"
              >
                {isZoomed ? "Zoom out" : "Zoom in"}
              </button>
            )}
            {mediaItems.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur-sm"
                  onClick={() => setActiveMediaIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))}
                  aria-label="Previous media"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur-sm"
                  onClick={() => setActiveMediaIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))}
                  aria-label="Next media"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-card/75 px-2 py-1 backdrop-blur-sm">
                {mediaItems.map((item, idx) => (
                  <button
                    key={`${item.src}-${idx}`}
                    onClick={() => setActiveMediaIndex(idx)}
                    aria-label={`Show media ${idx + 1}`}
                    className={`h-2 w-2 rounded-full ${idx === activeMediaIndex ? "bg-foreground" : "bg-muted-foreground/60"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center px-8 py-10 md:px-10">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {product.brand}
            </p>
            <h3 className="mb-2 font-serif text-2xl text-foreground">
              {product.name}
            </h3>
            <p className="mb-8 text-lg text-muted-foreground">
              {formatTZS(product.priceTZS)}
            </p>

            {showSizeSelector && (
              <div className="mb-8">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex h-10 w-14 items-center justify-center rounded-md border text-sm transition-all ${
                        (selectedSize || product.sizes[0]) === size
                          ? "border-foreground bg-foreground text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-accent"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to bag */}
            <button
              onClick={handleAdd}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-medium tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
            >
              Add to Bag
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
