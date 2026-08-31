/** @type {import('next').NextConfig} */

// Admin app URL — e.g. https://admin.merakithebrand.com in production,
// or http://localhost:4000 when running both apps locally.
// When not set, /admin falls through to the built-in stub page.
const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_APP_URL || process.env.ADMIN_APP_URL || "https://admin-meraki-amber-nine.vercel.app").replace(/\/$/, "")

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },

  async rewrites() {
    if (!ADMIN_URL) return { beforeFiles: [], afterFiles: [], fallback: [] }

    return {
      // beforeFiles: run BEFORE filesystem routes.
      // Captures /admin page routes so the local stub page is never rendered.
      beforeFiles: [
        {
          source: "/admin",
          destination: `${ADMIN_URL}/admin/admin`,
        },
        {
          source: "/admin/subscribers",
          destination: `${ADMIN_URL}/admin/admin/subscribers`,
        },
        {
          source: "/admin/_next/:path*",
          destination: `${ADMIN_URL}/admin/_next/:path*`,
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
          destination: `${ADMIN_URL}/admin/api/admin/:path*`,
        },
        {
          source: "/api/stock-notifications",
          destination: `${ADMIN_URL}/admin/api/stock-notifications`,
        },
        {
          source: "/api/stock-notifications/:path*",
          destination: `${ADMIN_URL}/admin/api/stock-notifications/:path*`,
        },
        {
          source: "/api/proxy-image/:path*",
          destination: `${ADMIN_URL}/admin/api/proxy-image/:path*`,
        },
      ],

      fallback: [],
    }
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-Requested-With, Content-Type, Authorization, x-admin-token, Range" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
      {
        source: "/admin/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-Requested-With, Content-Type, Authorization, x-admin-token, Range" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ]
  },
}

export default nextConfig
