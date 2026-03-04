import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { listPublishedPosts } from "@/backend/db/posts"
import { Navbar } from "@/components/navbar"
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs"
import { SiteFooter } from "@/components/site-footer"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Blogs",
  description: "Read MERAKI stories, styling ideas, and modest fashion insights.",
  alternates: {
    canonical: "/blogs",
  },
  openGraph: {
    type: "website",
    url: "/blogs",
    title: "Blogs | MERAKI the Brand",
    description: "Read MERAKI stories, styling ideas, and modest fashion insights.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blogs | MERAKI the Brand",
    description: "Read MERAKI stories, styling ideas, and modest fashion insights.",
  },
}

export default async function BlogsPage() {
  const posts = await listPublishedPosts()

  return (
    <main className="min-h-screen bg-background">
      <Navbar hideSearchIcon hideCartIcon hideAccountIcon alwaysShowMenuButton />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-28 md:px-8 md:pb-12 md:pt-32">
        <SiteBreadcrumbs items={[{ label: "HOME", href: "/" }, { label: "BLOGS" }]} className="mb-5" />
        <h1 className="font-serif text-4xl text-foreground">Blogs</h1>
        <p className="mt-2 text-muted-foreground">Read MERAKI stories, styling ideas, and modest fashion insights.</p>
        {posts.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No published blogs yet.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent">
                {post.coverImage && (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    width={1200}
                    height={560}
                    unoptimized
                    className="h-56 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <h2 className="font-serif text-2xl text-foreground">{post.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  <Link href={`/blogs/${post.slug}`} className="mt-4 inline-block text-sm font-medium text-foreground underline underline-offset-4">
                    Read more
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  )
}
