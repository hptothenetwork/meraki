"use client"

import Image from "next/image"
import Link from "next/link"

const categories = [
  { name: "Kaftans", href: "/shop/kaftans" },
  { name: "Boubous", href: "/shop/boubous" },
  { name: "Two-Piece Sets", href: "/shop/two-piece" },
  { name: "Savannah", href: "/shop/savannah" },
  { name: "New In", href: "/shop/new" },
]

const quickLinks = [
  { name: "Shop All", href: "/shop" },
  { name: "Best Sellers", href: "/shop/best-seller" },
]

export function MegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute left-0 top-full z-50 w-full border-b border-border bg-card shadow-sm"
      onMouseLeave={onClose}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-8 py-10">
        {/* Categories */}
        <div className="col-span-3">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Categories
          </h3>
          <ul className="space-y-3">
            {categories.map((cat) => (
              <li key={cat.name}>
                <Link
                  href={cat.href}
                  className="text-sm text-foreground transition-colors hover:text-accent"
                  onClick={onClose}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links */}
        <div className="col-span-3">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Quick Links
          </h3>
          <ul className="space-y-3">
            {quickLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-sm text-foreground transition-colors hover:text-accent"
                  onClick={onClose}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Featured Image */}
        <div className="col-span-6">
          <div className="group relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src="/images/product-kaftan-navy.jpg"
              alt="Editor's pick - Indigo Night Kaftan"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-foreground/20" />
            <div className="absolute bottom-6 left-6">
              <p className="mb-1 text-xs uppercase tracking-widest text-primary-foreground/80">
                {"Editor's Pick"}
              </p>
              <p className="font-serif text-lg text-primary-foreground">
                The Savannah Edit
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
