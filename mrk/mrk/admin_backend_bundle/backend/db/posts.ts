import "server-only";
import { db } from "../firebase.server";

export type BlogPostStatus = "draft" | "published" | "deleted";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  media?: { url: string; type: "image" | "video" }[];
  author?: string;
  tags?: string[];
  status: BlogPostStatus;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

const collectionName = "posts";

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cleanUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

function mapDoc(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): BlogPost | null {
  if (!doc.exists) return null;
  const data = doc.data() as Omit<BlogPost, "id"> | undefined;
  if (!data) return null;
  return { ...data, id: doc.id };
}

export async function listPosts(options?: { includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted === true;
  const snapshot = await db.collection(collectionName).orderBy("createdAt", "desc").get();
  const posts = snapshot.docs
    .map((doc) => mapDoc(doc))
    .filter((item): item is BlogPost => Boolean(item));
  return includeDeleted ? posts.filter((post) => post.status === "deleted") : posts.filter((post) => post.status !== "deleted");
}

export async function createPost(payload: Partial<BlogPost>) {
  const now = new Date().toISOString();
  const ref = db.collection(collectionName).doc();
  const title = String(payload.title || "").trim();
  const slug = String(payload.slug || "").trim() || toSlug(title);
  const status: BlogPostStatus = payload.status === "published" ? "published" : "draft";

  const post: BlogPost = {
    id: ref.id,
    title,
    slug,
    excerpt: String(payload.excerpt || "").trim(),
    content: String(payload.content || "").trim(),
    coverImage: payload.coverImage,
    media: payload.media,
    author: payload.author || "Meraki",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    status,
    publishedAt: status === "published" ? payload.publishedAt || now : undefined,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await ref.set(cleanUndefined(post));
  return post;
}

export async function updatePost(id: string, payload: Partial<BlogPost>) {
  const ref = db.collection(collectionName).doc(id);
  const snapshot = await ref.get();
  const existing = mapDoc(snapshot);
  if (!existing) return null;

  const now = new Date().toISOString();
  const nextTitle = String(payload.title ?? existing.title ?? "").trim();
  const nextStatus: BlogPostStatus = (payload.status as BlogPostStatus) || existing.status || "draft";
  const nextSlugRaw = String(payload.slug ?? existing.slug ?? "").trim();
  const nextSlug = nextSlugRaw || toSlug(nextTitle);

  const publishedAt =
    nextStatus === "published"
      ? String(payload.publishedAt || existing.publishedAt || now)
      : undefined;

  const next = cleanUndefined({
    title: nextTitle,
    slug: nextSlug,
    excerpt: String(payload.excerpt ?? existing.excerpt ?? "").trim(),
    content: String(payload.content ?? existing.content ?? "").trim(),
    coverImage: payload.coverImage ?? existing.coverImage,
    media: payload.media ?? existing.media,
    author: payload.author ?? existing.author ?? "Meraki",
    tags: payload.tags ?? existing.tags ?? [],
    status: nextStatus,
    publishedAt,
    updatedAt: now,
    deletedAt: nextStatus === "deleted" ? now : null,
  });

  await ref.set(next, { merge: true });
  const after = await ref.get();
  return mapDoc(after);
}

export async function softDeletePost(id: string) {
  const ref = db.collection(collectionName).doc(id);
  await ref.set(
    {
      status: "deleted" as BlogPostStatus,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function restorePost(id: string) {
  const ref = db.collection(collectionName).doc(id);
  await ref.set(
    {
      status: "draft" as BlogPostStatus,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function permanentlyDeletePost(id: string) {
  await db.collection(collectionName).doc(id).delete();
}

export async function getPostById(id: string) {
  const snapshot = await db.collection(collectionName).doc(id).get();
  return mapDoc(snapshot);
}
