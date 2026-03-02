"use client"

import type { SiteAssets } from "@/types/catalog"

type AnnouncementBarProps = {
  sale?: SiteAssets["globalSale"]
}

export function AnnouncementBar({ sale }: AnnouncementBarProps) {
  const showSale = Boolean(sale?.active && sale?.showBanner !== false && sale?.label)

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="flex w-full items-center justify-between px-6 py-2 lg:px-10">
        <span className="hidden text-xs tracking-wide sm:block">
          Nationwide & International Delivery
        </span>
        <span className="mx-auto text-xs tracking-wide sm:mx-0">
          {showSale ? sale?.label : "Graceful silhouettes with confident coverage"}
        </span>
        <span className="hidden text-xs tracking-wide sm:block">
          Secure Checkout
        </span>
      </div>
    </div>
  )
}
