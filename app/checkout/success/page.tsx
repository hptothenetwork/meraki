import type { Metadata } from "next"
import { CheckoutSuccessPage } from "@/components/checkout-success-page"

export const metadata: Metadata = {
  title: "Order Success",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const params = await searchParams
  return <CheckoutSuccessPage orderId={params.orderId || "-"} />
}
