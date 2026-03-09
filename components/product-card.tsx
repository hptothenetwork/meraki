"use client"

import Image from "next/image"
import { Plus } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatTZS, getPrimaryMedia, type Product } from "@/lib/data"
import { toast } from "sonner"

interface ProductCardProps {
  product: Product
  compact?: boolean
  onQuickView?: (product: Product) => void
}

export function ProductCard({ product, compact = false, onQuickView }: ProductCardProps) {
  const { addItem } = useCart()
  const primaryMedia = getPrimaryMedia(product)

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
    toast("Added to bag", {
      description: `${product.name} has been added to your bag.`,
    })
  }

  return (
    <div
      className="group cursor-pointer"
      onClick={() => onQuickView?.(product)}
    >
      <div
        className={`relative mb-3 overflow-hidden rounded-lg bg-secondary ${
          compact ? "aspect-[3/4]" : "aspect-[3/4]"
        }`}
      >
        {primaryMedia.type === "video" ? (
          <video
            src={primaryMedia.src}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
          />
        ) : (
          <Image
            src={primaryMedia.src}
            alt={primaryMedia.alt || product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}
        {/* Add to bag button */}
        <button
          onClick={handleAdd}
          className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-card hover:shadow-md"
          aria-label={`Add ${product.name} to bag`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className={compact ? "" : ""}>
        <p className="mb-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {product.brand}
        </p>
        <p className={`font-serif text-foreground ${compact ? "text-sm" : "text-base"}`}>
          {product.name}
        </p>
        <p className={`mt-1 text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
          {formatTZS(product.priceTZS)}
        </p>
      </div>
    </div>
  )
}
