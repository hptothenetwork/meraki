import Link from "next/link"

type NavbarBrandLogoProps = {
  isHome: boolean
  compact: boolean
  overlayStyle: boolean
  variant?: "default" | "about"
}

export function NavbarBrandLogo({ isHome, compact, overlayStyle, variant = "default" }: NavbarBrandLogoProps) {
  const sizeClass = compact
    ? "h-10 sm:h-12 md:h-14"
    : isHome
      ? "h-12 sm:h-14 md:h-16"
      : "h-10 sm:h-12 md:h-14"
  const textToneClass = overlayStyle ? "text-primary-foreground drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" : "text-foreground"

  return (
    <div className="pointer-events-auto absolute left-1/2 top-1 -translate-x-1/2 md:top-2">
      <Link href="/" className="inline-block">
        {variant === "about" ? (
          <span className={`block text-center leading-none ${textToneClass}`}>
            <span className="block font-serif text-[34px] tracking-[0.04em] sm:text-[40px] md:text-[44px]">MERAKI</span>
            <span className="block text-[12px] italic tracking-[0.24em] sm:text-[13px]">THE BRAND</span>
          </span>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logo.svg"
              alt="Meraki the Brand"
              className={`${sizeClass} w-auto object-contain ${
                overlayStyle ? "drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" : ""
              }`}
            />
          </>
        )}
      </Link>
    </div>
  )
}
