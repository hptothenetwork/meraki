import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";
import {
  createPost,
  getPostById,
  listPosts,
  permanentlyDeletePost,
  restorePost,
  softDeletePost,
  updatePost,
  type BlogPost,
} from "@backend/db/posts";
import { triggerStorefrontRevalidate } from "@backend/revalidateStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function postPaths(post?: { slug?: string }) {
  return post?.slug ? ["/", "/blogs", `/blogs/${post.slug}`] : ["/", "/blogs"];
}

function validatePost(body: Partial<BlogPost>) {
  const errors: string[] = [];
  if (!String(body.title || "").trim()) errors.push("Title is required");
  if (!String(body.content || "").trim()) errors.push("Content is required");
  return errors;
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const includeDeleted = new URL(req.url).searchParams.get("deleted") === "true";
  const items = await listPosts({ includeDeleted });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<BlogPost>;
  const errors = validatePost(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  const created = await createPost(body);
  await triggerStorefrontRevalidate({ reason: "post-create", paths: postPaths(created) });
  return NextResponse.json({ ok: true, item: created });
}

export async function PUT(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<BlogPost>;
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const errors = validatePost(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  const before = await getPostById(id);
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await updatePost(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const paths = new Set<string>([...postPaths(before), ...postPaths(updated)]);
  await triggerStorefrontRevalidate({ reason: "post-update", paths: Array.from(paths) });

  return NextResponse.json({ ok: true, item: updated });
}

export async function PATCH(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const body = (await req.json().catch(() => ({}))) as { action?: "restore" };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (body.action !== "restore") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  await restorePost(id);
  const restored = await getPostById(id);
  await triggerStorefrontRevalidate({ reason: "post-restore", paths: postPaths(restored || undefined) });
  return NextResponse.json({ ok: true, restored: true });
}

export async function DELETE(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const permanent = searchParams.get("permanent") === "true";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await getPostById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (permanent) {
    await permanentlyDeletePost(id);
    await triggerStorefrontRevalidate({ reason: "post-delete-permanent", paths: postPaths(existing) });
    return NextResponse.json({ ok: true, permanent: true });
  }

  await softDeletePost(id);
  await triggerStorefrontRevalidate({ reason: "post-soft-delete", paths: postPaths(existing) });
  return NextResponse.json({ ok: true, deleted: true });
}
