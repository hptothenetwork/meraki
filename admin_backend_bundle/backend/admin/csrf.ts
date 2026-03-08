// Hosts that are allowed to POST to admin APIs.
// Includes the admin app itself plus any configured proxy/storefront origin
// (e.g. when the storefront proxies /admin/* → admin app via Next.js rewrites).
// Production storefront hosts always trusted as proxy origins
const PRODUCTION_STOREFRONT_HOSTS = [
  "merakithebrand.store",
  "www.merakithebrand.store",
  "meraki-amber-nine.vercel.app",
  "meraki.vercel.app",
  "admin-meraki-amber-nine.vercel.app",
]

function allowedHosts(): Set<string> {
  const hosts = new Set<string>(PRODUCTION_STOREFRONT_HOSTS)
  // Admin app's own origin
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (baseUrl) {
    try { hosts.add(new URL(baseUrl).host) } catch { /* ignore */ }
  }
  // Storefront/proxy origin (e.g. localhost:3000 or merakithebrand.com)
  const storefrontUrl = process.env.STOREFRONT_URL
  if (storefrontUrl) {
    try { hosts.add(new URL(storefrontUrl).host) } catch { /* ignore */ }
  }
  return hosts
}

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  try {
    // Use the Host header to get the real external hostname.
    // Behind Vercel / reverse proxies, req.url may contain an internal
    // address (e.g. localhost:3000) that doesn't match the browser origin.
    const reqHost =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      new URL(req.url).host;
    // Strip port from reqHost if present (host header may include port)
    const reqHostname = reqHost.split(":")[0];
    const originHost = new URL(origin).host;
    const originHostname = originHost.split(":")[0];
    // Same-origin: always allowed
    if (reqHostname === originHostname) return;
    // Cross-origin via trusted proxy: check configured allowed hosts
    const extra = allowedHosts();
    if (extra.has(originHost) || extra.has(originHostname)) return;
    throw new Error("Origin mismatch");
  } catch (e) {
    if (e instanceof Error && e.message === "Origin mismatch") throw e;
    throw new Error("CSRF origin mismatch");
  }
}
