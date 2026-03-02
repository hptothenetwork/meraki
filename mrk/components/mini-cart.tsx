"use client"

import Image from "next/image"
import Link from "next/link"
import { X, Minus, Plus } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatTZS } from "@/lib/data"

export function MiniCart() {
  const { items, removeItem, updateQuantity, totalPrice, isCartOpen, setIsCartOpen } =
    useCart()

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ${
          isCartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Shopping bag"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-xl transition-transform duration-300 ease-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-serif text-lg text-foreground">Your Bag</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close bag"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground">Your bag is empty</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 text-sm text-foreground underline underline-offset-4 transition-colors hover:text-accent"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={`${item.product.id}-${item.size}`} className="flex gap-4">
                  <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {item.product.brand}
                      </p>
                      <p className="font-serif text-sm text-foreground">
                        {item.product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Size: {item.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.size, item.quantity - 1)
                          }
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs tabular-nums text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.size, item.quantity + 1)
                          }
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm text-foreground">
                        {formatTZS(item.product.priceTZS * item.quantity)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id, item.size)}
                    className="self-start text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-serif text-foreground">
                {formatTZS(totalPrice)}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="block w-full rounded-full bg-primary py-3.5 text-center text-sm font-medium tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
            >
              Checkout
            </Link>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-3 w-full text-center text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
