"use client"

import { useState, useEffect, type MouseEvent } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, User, ShoppingBag, X } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { MegaMenu } from "@/components/mega-menu"
import { NavbarBrandLogo } from "@/components/navbar-brand-logo"

const navLinks = [
  { name: "Shop", href: "/shop" },
  { name: "Collections", href: "/collections" },
  { name: "About", href: "/about" },
  { name: "Events", href: "/events" },
  { name: "Blogs", href: "/blogs" },
  { name: "Contact", href: "/contact" },
]

type NavbarProps = {
  cartOnly?: boolean
  compact?: boolean
  hideBrandLogo?: boolean
  hideSearchIcon?: boolean
  hideCartIcon?: boolean
  hideAccountIcon?: boolean
  showBreadcrumb?: boolean
  alwaysShowMenuButton?: boolean
  brandVariant?: "default" | "about"
}

export function Navbar({
  cartOnly = false,
  compact = false,
  hideBrandLogo = false,
  hideSearchIcon = false,
  hideCartIcon = false,
  hideAccountIcon = false,
  showBreadcrumb = false,
  alwaysShowMenuButton = false,
  brandVariant = "default",
}: NavbarProps) {
  const { totalItems, setIsCartOpen } = useCart()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopShopOpen, setDesktopShopOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Keep server and first client render identical for cart badge.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Lock body scroll when mobile menu is open and prevent layout jump.
  useEffect(() => {
    const body = document.body
    if (mobileOpen) {
      body.style.overflow = "hidden"
    } else {
      body.style.overflow = ""
    }
    return () => {
      body.style.overflow = ""
    }
  }, [mobileOpen])

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY || 0)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [pathname])

  const isHome = pathname === "/"
  const showPrimaryLinks = !cartOnly && !compact && isHome
  const minimalChrome = hideBrandLogo && hideSearchIcon && hideCartIcon
  const nearTop = scrollY <= 2
  const showHeader = cartOnly ? true : mobileOpen || nearTop
  const overlayStyle = !cartOnly && isHome && nearTop && !mobileOpen
  const headerTopClass = cartOnly ? "top-0" : isHome ? "top-9" : "top-0"
  const iconToneClass = overlayStyle
    ? "text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
    : "text-foreground"

  const handleMenuToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setMobileOpen((prev) => !prev)
  }

  const navHeightClass = compact
    ? "min-h-[64px] py-2 md:min-h-[68px]"
    : minimalChrome
      ? "min-h-[72px] py-3 md:min-h-[84px]"
      : "min-h-[72px] py-3 md:min-h-[84px]"
  const topRailOffsetClass = "mt-3 md:mt-4"
  const breadcrumbItems = buildBreadcrumbItems(pathname)

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-40 w-full transition-all duration-300 ${headerTopClass} ${
          showHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        } bg-transparent`}
      >
        <nav
          className={`relative flex w-full items-start px-4 pt-0 md:px-6 md:pt-0 lg:px-8 ${navHeightClass} ${cartOnly ? "justify-end" : "justify-between"}`}
        >
          {cartOnly ? (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative transition-colors text-foreground hover:text-foreground/75"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {mounted && totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                  {totalItems}
                </span>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleMenuToggle}
                className={`group ${topRailOffsetClass} flex flex-1 items-center transition-transform duration-200 hover:opacity-85 active:scale-95 ${
                  alwaysShowMenuButton ? "" : "lg:hidden"
                } ${iconToneClass}`}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <span className="relative block h-5 w-5">
                  <span
                    className={`absolute left-0 top-0 h-[2px] w-5 bg-current transition-all duration-300 ease-out ${
                      mobileOpen ? "translate-y-[8px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[8px] h-[2px] w-5 bg-current transition-all duration-300 ease-out ${
                      mobileOpen ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-4 h-[2px] w-5 bg-current transition-all duration-300 ease-out ${
                      mobileOpen ? "-translate-y-[8px] -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>
              {showBreadcrumb && (
                <nav aria-label="Breadcrumb" className={`${topRailOffsetClass} ml-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground`}>
                  {breadcrumbItems.map((item, index) => (
                    <span key={`${item.label}-${index}`}>
                      {index > 0 && <span className="px-2 text-muted-foreground/70">/</span>}
                      {item.href ? (
                        <Link href={item.href} className="hover:text-foreground">
                          {item.label}
                        </Link>
                      ) : (
                        <span className="text-foreground/80">{item.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              {showPrimaryLinks ? (
                <div className="relative hidden flex-1 items-center gap-6 lg:flex">
                  {navLinks.map((link) => {
                    if (link.name === "Shop") {
                      return (
                        <button
                          key={link.name}
                          type="button"
                          onMouseEnter={() => setDesktopShopOpen(true)}
                          className={`text-xs font-medium uppercase tracking-[0.16em] transition-colors ${iconToneClass} ${overlayStyle ? "hover:text-primary-foreground/80" : "hover:text-foreground/75"}`}
                        >
                          Shop
                        </button>
                      )
                    }
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`text-xs font-medium uppercase tracking-[0.16em] transition-colors ${iconToneClass} ${overlayStyle ? "hover:text-primary-foreground/80" : "hover:text-foreground/75"}`}
                      >
                        {link.name}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="hidden flex-1 lg:block" />
              )}

              {/* Center: Logo */}
              {!hideBrandLogo && (
                <NavbarBrandLogo isHome={isHome} compact={compact} overlayStyle={overlayStyle} variant={brandVariant} />
              )}

              {/* Right: Icons */}
              <div className={`${topRailOffsetClass} flex flex-1 items-center justify-end gap-4`}>
                {!hideSearchIcon && (
                  <Link
                    href="/search"
                    className={`transition-colors ${iconToneClass} ${overlayStyle ? "hover:text-primary-foreground/80" : "hover:text-foreground/75"}`}
                    aria-label="Search"
                  >
                    <Search className="h-[18px] w-[18px]" />
                  </Link>
                )}
                {!hideAccountIcon && (
                  <Link
                    href="/account"
                    className={`hidden transition-colors sm:block ${iconToneClass} ${overlayStyle ? "hover:text-primary-foreground/80" : "hover:text-foreground/75"}`}
                    aria-label="Account"
                  >
                    <User className="h-[18px] w-[18px]" />
                  </Link>
                )}
                {!hideCartIcon && (
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className={`relative transition-colors ${iconToneClass} ${overlayStyle ? "hover:text-primary-foreground/80" : "hover:text-foreground/75"}`}
                    aria-label="Shopping bag"
                  >
                    <ShoppingBag className="h-[18px] w-[18px]" />
                    {mounted && totalItems > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                        {totalItems}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </nav>
        {showPrimaryLinks && !cartOnly && desktopShopOpen && (
          <div onMouseEnter={() => setDesktopShopOpen(true)} onMouseLeave={() => setDesktopShopOpen(false)} className="hidden lg:block">
            <MegaMenu onClose={() => setDesktopShopOpen(false)} />
          </div>
        )}
      </header>

      {!cartOnly && (
        <>
      {/* Mobile Menu Overlay - Slides from LEFT */}
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-foreground/30"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Slide-in Panel from Left */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          onClick={(event) => event.stopPropagation()}
          className={`absolute left-0 top-0 flex h-full w-[76%] max-w-[320px] flex-col bg-primary transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Top: Close */}
          <div className="flex items-center justify-end px-6 py-5">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="text-primary-foreground transition-opacity hover:opacity-70"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-6 py-4">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li
                  key={link.name}
                  className={`transition-all duration-300 ease-out ${
                    mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
                  }`}
                  style={{ transitionDelay: mobileOpen ? `${70 + navLinks.indexOf(link) * 45}ms` : "0ms" }}
                >
                  <Link
                    href={link.href}
                    className="block py-3 text-base font-medium tracking-wide text-primary-foreground transition-opacity hover:opacity-70"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom: Social Icons */}
          <div className="border-t border-primary-foreground/10 px-6 py-6">
            <div className="flex gap-5">
              {/* Instagram */}
              <a
                href="https://instagram.com/merakithebrand"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground transition-opacity hover:opacity-70"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </>
  )
}

function buildBreadcrumbItems(pathname: string) {
  if (!pathname || pathname === "/") return [{ label: "HOME", href: "/" }]

  const rawSegments = pathname.split("/").filter(Boolean)
  const segments = rawSegments
    .map((segment) =>
      decodeURIComponent(segment)
        .replace(/[-_]/g, " ")
        .trim()
        .toUpperCase(),
    )

  return [
    { label: "HOME", href: "/" },
    ...segments.map((label, index) => ({
      label,
      href: index === segments.length - 1 ? undefined : `/${rawSegments.slice(0, index + 1).join("/")}`,
    })),
  ]
}
