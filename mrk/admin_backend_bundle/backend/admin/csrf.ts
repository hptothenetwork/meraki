// Hosts that are allowed to POST to admin APIs.
// Includes the admin app itself plus any configured proxy/storefront origin
// (e.g. when the storefront proxies /admin/* → admin app via Next.js rewrites).
function allowedHosts(): Set<string> {
  const hosts = new Set<string>()
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
    const reqHost = new URL(req.url).host;
    const originHost = new URL(origin).host;
    // Same-origin: always allowed
    if (reqHost === originHost) return;
    // Cross-origin via trusted proxy: check configured allowed hosts
    const extra = allowedHosts();
    if (extra.has(originHost)) return;
    throw new Error("Origin mismatch");
  } catch (e) {
    if (e instanceof Error && e.message === "Origin mismatch") throw e;
    throw new Error("CSRF origin mismatch");
  }
}
