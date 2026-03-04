import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, Dancing_Script } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { FirebaseAnalytics } from "@/components/firebase-analytics"
import { CartProvider } from "@/lib/cart-context"
import { buildOrganizationJsonLd, buildWebsiteJsonLd, safeJsonLd } from "@/lib/seo"
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const dancing = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://merakithebrand.com"),
  title: {
    default: "MERAKI the Brand | Modest Afro-Inspired Fashion",
    template: "%s | MERAKI the Brand",
  },
  description:
    "Discover elegant kaftans and boubous crafted for graceful coverage, comfort, and confident modest style in Tanzania.",
  applicationName: "MERAKI the Brand",
  category: "fashion",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Meraki the Brand",
    "modest fashion Tanzania",
    "kaftan Tanzania",
    "boubou dress",
    "Dar es Salaam fashion",
    "Afro-inspired modest wear",
    "free size kaftan",
    "women modest clothing",
  ],
  authors: [{ name: "MERAKI the Brand" }],
  creator: "MERAKI the Brand",
  publisher: "MERAKI the Brand",
  openGraph: {
    type: "website",
    locale: "en_TZ",
    url: "/",
    siteName: "MERAKI the Brand",
    title: "MERAKI the Brand | Modest Afro-Inspired Fashion",
    description:
      "Elegant modest wear inspired by African identity. Shop kaftans and boubous designed in Tanzania.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MERAKI the Brand | Modest Afro-Inspired Fashion",
    description:
      "Elegant modest wear inspired by African identity. Shop kaftans and boubous designed in Tanzania.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "geo.region": "TZ",
    "geo.placename": "Dar es Salaam",
    "geo.position": "-6.7924;39.2083",
    ICBM: "-6.7924, 39.2083",
  },
}

export const viewport: Viewport = {
  themeColor: '#F6F0E8',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const globalJsonLd = [buildOrganizationJsonLd(), buildWebsiteJsonLd()]

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${dancing.variable} font-sans antialiased`} suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(globalJsonLd) }} />
        <CartProvider>{children}</CartProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#FFFBF5',
              border: '1px solid #DDD5C8',
              color: '#3A3632',
            },
          }}
        />
        {process.env.NODE_ENV === "production" ? <Analytics /> : null}
        <FirebaseAnalytics />
      </body>
    </html>
  )
}
