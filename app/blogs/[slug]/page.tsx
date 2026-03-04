import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { getPublishedPostBySlug } from "@/backend/db/posts"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { buildBreadcrumbJsonLd, parseDateValue, safeJsonLd, toAbsoluteUrl } from "@/lib/seo"

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)

  if (!post) {
    return {
      title: "Blog Not Found",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const canonical = `/blogs/${encodeURIComponent(post.slug)}`
  const description = post.excerpt || post.content.slice(0, 160)
  const publishedTime = post.publishedAt || post.createdAt

  return {
    title: post.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${post.title} | MERAKI the Brand`,
      description,
      authors: post.author ? [post.author] : undefined,
      publishedTime,
      images: post.coverImage ? [{ url: post.coverImage, alt: post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | MERAKI the Brand`,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) notFound()

  const canonicalPath = `/blogs/${encodeURIComponent(post.slug)}`
  const description = post.excerpt || post.content.slice(0, 160)
  const publishedDate = parseDateValue(post.publishedAt || post.createdAt, new Date())
  const updatedDate = parseDateValue(post.updatedAt || post.publishedAt || post.createdAt, publishedDate)

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    image: post.coverImage ? [toAbsoluteUrl(post.coverImage)] : undefined,
    datePublished: publishedDate.toISOString(),
    dateModified: updatedDate.toISOString(),
    author: {
      "@type": "Person",
      name: post.author || "MERAKI Team",
    },
    publisher: {
      "@type": "Organization",
      name: "MERAKI the Brand",
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl("/logo/logo.svg"),
      },
    },
    mainEntityOfPage: toAbsoluteUrl(canonicalPath),
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blogs", path: "/blogs" },
    { name: post.title, path: canonicalPath },
  ])

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd([articleJsonLd, breadcrumbJsonLd]) }}
      />
      <Navbar hideBrandLogo hideSearchIcon hideCartIcon />
      <article className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h1 className="font-serif text-4xl text-foreground">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {post.author || "Meraki"} {" - "} {new Date(post.publishedAt || post.createdAt || "").toLocaleDateString()}
        </p>
        {post.coverImage && (
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1200}
            height={700}
            unoptimized
            className="mt-6 h-auto w-full rounded-xl object-cover"
          />
        )}
        <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-foreground/90">{post.content}</div>
      </article>
      <SiteFooter />
    </main>
  )
}

