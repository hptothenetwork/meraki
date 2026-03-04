import "server-only"
import { db } from "../firebase.server"

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  author?: string
  tags?: string[]
  status: "draft" | "published" | "deleted"
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

const collectionName = "posts"

export async function listPublishedPosts(): Promise<BlogPost[]> {
  try {
    const snap = await db
      .collection(collectionName)
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .get()
    return snap.docs.map((doc) => ({ ...(doc.data() as Omit<BlogPost, "id">), id: doc.id }))
  } catch {
    const fallback = await db.collection(collectionName).where("status", "==", "published").get()
    return fallback.docs
      .map((doc) => ({ ...(doc.data() as Omit<BlogPost, "id">), id: doc.id }))
      .sort((a, b) => String(b.publishedAt || b.createdAt || "").localeCompare(String(a.publishedAt || a.createdAt || "")))
  }
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await listPublishedPosts()
  return posts.find((post) => post.slug === slug) || null
}
