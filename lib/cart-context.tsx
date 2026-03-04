"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Product } from "./data"

export interface CartItem {
  product: Product
  quantity: number
  size: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, size?: string) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function loadInitialCartItems(): CartItem[] {
  try {
    const raw = localStorage.getItem("meraki_cart")
    if (!raw) return []

    const parsed = JSON.parse(raw) as CartItem[]
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item) => item?.product?.id && item?.quantity > 0)
      .map((item) => ({
        ...item,
        size: item.size || item.product.sizes[0] || "One Size",
      }))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    // Keep first client render identical to server render; read localStorage after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadInitialCartItems())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem("meraki_cart", JSON.stringify(items))
    } catch {
      // ignore storage errors
    }
  }, [hydrated, items])

  const addItem = useCallback((product: Product, size?: string) => {
    const selectedSize = size || product.sizes[0] || "One Size"
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.size === selectedSize)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1, size: selectedSize }]
    })
    setIsCartOpen(true)
  }, [])

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size)))
  }, [])

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size)))
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.size === size ? { ...item, quantity } : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.priceTZS * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
