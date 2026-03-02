type JsonLd = Record<string, unknown>

const FALLBACK_SITE_URL = "https://merakithebrand.com"
const BRAND_NAME = "MERAKI the Brand"

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, "")
}

export function toAbsoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) return getSiteUrl()
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`
  return `${getSiteUrl()}${normalizedPath}`
}

export function parseDateValue(value: unknown, fallback: Date): Date {
  if (!value) return fallback

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? fallback : parsed
  }

  if (typeof value === "object") {
    const timestamp = value as { toDate?: () => Date; seconds?: number }
    if (typeof timestamp.toDate === "function") {
      const parsed = timestamp.toDate()
      return Number.isNaN(parsed.getTime()) ? fallback : parsed
    }
    if (typeof timestamp.seconds === "number") {
      const parsed = new Date(timestamp.seconds * 1000)
      return Number.isNaN(parsed.getTime()) ? fallback : parsed
    }
  }

  return fallback
}

export function safeJsonLd(input: JsonLd | JsonLd[]) {
  return JSON.stringify(input).replace(/</g, "\\u003c")
}

export function buildWebsiteJsonLd(): JsonLd {
  const siteUrl = getSiteUrl()
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: siteUrl,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

export function buildOrganizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: getSiteUrl(),
    logo: toAbsoluteUrl("/logo/logo.svg"),
    sameAs: ["https://www.instagram.com/meraki_the_brand/"],
  }
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  }
}
