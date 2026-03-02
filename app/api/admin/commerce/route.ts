import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/firebase.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type OrderItem = { id?: string; quantity?: number; priceTzs?: number }
type OrderDoc = {
  status?: string
  paymentStatus?: string
  total?: number
  items?: OrderItem[]
}

type ProductDoc = {
  name?: string
  stock?: number
  priceTzs?: number
  priceUsd?: number
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function parseAuthSecret(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim()
  return req.headers.get("x-admin-secret") || ""
}

function toTzsPrice(product: ProductDoc) {
  const priceTzs = numberOrZero(product.priceTzs)
  if (priceTzs > 0) return priceTzs
  const priceUsd = numberOrZero(product.priceUsd)
  return Math.round(priceUsd * 2600)
}

export async function GET(req: NextRequest) {
  const expectedSecret = process.env.ADMIN_ANALYTICS_SECRET
  const providedSecret = parseAuthSecret(req)
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [productsSnap, ordersSnap] = await Promise.all([
    db.collection("products").get(),
    db.collection("orders").get(),
  ])

  const products = productsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as ProductDoc),
  }))
  const orders = ordersSnap.docs.map((doc) => doc.data() as OrderDoc)

  const salesByProduct = new Map<string, { units: number; revenueTzs: number }>()
  let paidRevenueTzs = 0
  let openRevenueTzs = 0
  let pendingOrders = 0
  let processingOrders = 0
  let shippedOrders = 0
  let deliveredOrders = 0
  let cancelledOrders = 0
  let paidOrders = 0
  let reservedUnits = 0
  let totalUnitsSold = 0

  for (const order of orders) {
    const status = String(order.status || "pending")
    const paymentStatus = String(order.paymentStatus || "pending")
    const total = numberOrZero(order.total)
    const items = Array.isArray(order.items) ? order.items : []

    if (status === "pending") pendingOrders += 1
    if (status === "processing") processingOrders += 1
    if (status === "shipped") shippedOrders += 1
    if (status === "delivered") deliveredOrders += 1
    if (status === "cancelled") cancelledOrders += 1

    if (paymentStatus === "paid") {
      paidOrders += 1
      paidRevenueTzs += total
    } else if (status !== "cancelled") {
      openRevenueTzs += total
    }

    for (const item of items) {
      const qty = Math.max(0, numberOrZero(item.quantity))
      const linePrice = numberOrZero(item.priceTzs) * qty
      if (status !== "cancelled" && paymentStatus !== "paid") {
        reservedUnits += qty
      }
      if (paymentStatus === "paid") {
        totalUnitsSold += qty
        const key = String(item.id || "")
        if (!key) continue
        const current = salesByProduct.get(key) || { units: 0, revenueTzs: 0 }
        salesByProduct.set(key, {
          units: current.units + qty,
          revenueTzs: current.revenueTzs + linePrice,
        })
      }
    }
  }

  let stockUnits = 0
  let inventoryValueTzs = 0
  let lowStockCount = 0
  for (const product of products) {
    const stock = Math.max(0, numberOrZero(product.stock))
    stockUnits += stock
    inventoryValueTzs += stock * toTzsPrice(product)
    if (stock > 0 && stock <= 3) lowStockCount += 1
  }

  const topProducts = Array.from(salesByProduct.entries())
    .map(([productId, sales]) => {
      const product = products.find((p) => p.id === productId)
      return {
        productId,
        name: product?.name || productId,
        units: sales.units,
        revenueTzs: sales.revenueTzs,
      }
    })
    .sort((a, b) => b.units - a.units)
    .slice(0, 10)

  return NextResponse.json({
    at: new Date().toISOString(),
    orders: {
      total: orders.length,
      pending: pendingOrders,
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
      paid: paidOrders,
    },
    sales: {
      paidRevenueTzs,
      openRevenueTzs,
      unitsSold: totalUnitsSold,
    },
    inventory: {
      products: products.length,
      unitsInStock: stockUnits,
      reservedUnits,
      availableUnitsEstimate: Math.max(0, stockUnits - reservedUnits),
      inventoryValueTzs,
      lowStockProducts: lowStockCount,
    },
    topProducts,
  })
}
