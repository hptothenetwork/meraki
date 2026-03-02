import Link from "next/link"

type BreadcrumbItem = {
  label: string
  href?: string
}

export function SiteBreadcrumbs({
  items,
  className = "",
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={`text-xs uppercase tracking-[0.2em] text-muted-foreground ${className}`.trim()}>
      {items.map((item, index) => (
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
  )
}

