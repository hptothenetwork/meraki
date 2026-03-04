"use client"

import { useEffect, useRef, useState } from "react"
import type { SiteAssets } from "@/types/catalog"

const DEFAULT_POLL_MS = 3000

export function useLiveSiteAssets(initialAssets: SiteAssets, pollMs: number = DEFAULT_POLL_MS): SiteAssets {
  const [siteAssets, setSiteAssets] = useState<SiteAssets>(initialAssets || {})
  const inFlightRef = useRef(false)

  useEffect(() => {
    setSiteAssets(initialAssets || {})
  }, [initialAssets])

  useEffect(() => {
    let cancelled = false

    const sync = async () => {
      if (cancelled || inFlightRef.current || document.visibilityState === "hidden") return
      inFlightRef.current = true
      try {
        const res = await fetch("/api/site-assets", { cache: "no-store" })
        if (!res.ok) return
        const json = (await res.json().catch(() => ({}))) as { assets?: SiteAssets }
        if (!json.assets || cancelled) return
        setSiteAssets((prev) => mergeSiteAssets(prev, json.assets || {}))
      } finally {
        inFlightRef.current = false
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void sync()
      }
    }

    const timer = window.setInterval(() => {
      void sync()
    }, Math.max(1000, pollMs))

    void sync()
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [pollMs])

  return siteAssets
}

function mergeSiteAssets(base: SiteAssets, incoming: SiteAssets): SiteAssets {
  return {
    ...base,
    ...incoming,
    quickShop: {
      ...(base.quickShop || {}),
      ...(incoming.quickShop || {}),
    },
    globalSale: {
      ...(base.globalSale || {}),
      ...(incoming.globalSale || {}),
    },
    contact: {
      ...(base.contact || {}),
      ...(incoming.contact || {}),
    },
    sectionVisibility: {
      ...(base.sectionVisibility || {}),
      ...(incoming.sectionVisibility || {}),
    },
    sectionImages: {
      ...(base.sectionImages || {}),
      ...(incoming.sectionImages || {}),
    },
    imageDisplaySettings: {
      ...(base.imageDisplaySettings || {}),
      ...(incoming.imageDisplaySettings || {}),
    },
  }
}
