"use client"

import Link from "next/link"

const quickLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Returns", href: "/returns" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-16 lg:px-24">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          (c) 2026 Meraki the Brand. All rights reserved. Made with love by{" "}
          <a
            href="https://www.instagram.com/kyro__digital/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline decoration-accent underline-offset-4 transition hover:text-accent"
          >
            kyro__digital
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
