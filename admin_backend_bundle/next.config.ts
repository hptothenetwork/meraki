import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/admin",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "*.imagekit.io" },
    ],
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
    ];
  },
};

export default nextConfig;
