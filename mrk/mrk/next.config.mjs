/** @type {import('next').NextConfig} */

const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_APP_URL || process.env.ADMIN_APP_URL || "").replace(/\/$/, "")

const nextConfig = {
  images: {
    unoptimized: true,
  },

  async rewrites() {
    if (!ADMIN_URL) return { beforeFiles: [], afterFiles: [], fallback: [] }

    return {
      beforeFiles: [
        { source: "/admin", destination: `${ADMIN_URL}/admin` },
        { source: "/admin/:path*", destination: `${ADMIN_URL}/admin/:path*` },
      ],
      afterFiles: [
        // Admin app uses basePath '/admin', so its API routes live at /admin/api/...
        // We proxy /api/admin/* → admin_app/admin/api/admin/* accordingly.
        { source: "/api/admin/:path*", destination: `${ADMIN_URL}/admin/api/admin/:path*` },
        { source: "/api/stock-notifications", destination: `${ADMIN_URL}/admin/api/stock-notifications` },
        { source: "/api/stock-notifications/:path*", destination: `${ADMIN_URL}/admin/api/stock-notifications/:path*` },
        { source: "/api/proxy-image/:path*", destination: `${ADMIN_URL}/admin/api/proxy-image/:path*` },
      ],
      fallback: [],
    }
  },
}

export default nextConfig
