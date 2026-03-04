import type { Metadata } from "next"
import { CheckoutPaymentPage } from "@/components/checkout-payment-page"

export const metadata: Metadata = {
  title: "Checkout Payment",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CheckoutPayment({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const params = await searchParams
  return <CheckoutPaymentPage orderId={params.orderId || ""} />
}
