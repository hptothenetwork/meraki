/** @type {import('next').NextConfig} */

// Admin app URL — e.g. https://admin.merakithebrand.com in production,
// or http://localhost:4000 when running both apps locally.
// When not set, /admin falls through to the built-in stub page.
const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_APP_URL || process.env.ADMIN_APP_URL || "https://admin-meraki-amber-nine.vercel.app").replace(/\/$/, "")

const nextConfig = {
  images: {
    unoptimized: true,
  },

  async rewrites() {
    if (!ADMIN_URL) return { beforeFiles: [], afterFiles: [], fallback: [] }

    return {
      // beforeFiles: run BEFORE filesystem routes.
      // Captures /admin page routes so the local stub page is never rendered.
      beforeFiles: [
        {
          source: "/admin",
          destination: `${ADMIN_URL}/admin`,
        },
        {
          source: "/admin/:path*",
          destination: `${ADMIN_URL}/admin/:path*`,
        },
      ],

      // afterFiles: run AFTER filesystem routes.
      // The storefront's own /api/admin/commerce is matched first;
      // anything else (e.g. /api/admin/products, /api/admin/orders …)
      // falls through to the admin app untouched.
      afterFiles: [
        {
          source: "/api/admin/:path*",
          destination: `${ADMIN_URL}/api/admin/:path*`,
        },
        {
          source: "/api/stock-notifications",
          destination: `${ADMIN_URL}/api/stock-notifications`,
        },
        {
          source: "/api/stock-notifications/:path*",
          destination: `${ADMIN_URL}/api/stock-notifications/:path*`,
        },
        {
          source: "/api/proxy-image/:path*",
          destination: `${ADMIN_URL}/api/proxy-image/:path*`,
        },
      ],

      fallback: [],
    }
  },
}

export default nextConfig
