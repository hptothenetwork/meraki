import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import { listCategories, saveCategory, deleteCategory, type Category } from "@backend/db/categories";
import { assertSameOrigin } from "@backend/admin/csrf";
import { triggerStorefrontRevalidate } from "@backend/revalidateStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const CATEGORY_REVALIDATE_PATHS = ["/", "/shop", "/collections", "/products", "/savannah"];

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categories = await listCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Partial<Category>;
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
  }
  const category: Category = {
    id: body.id,
    name: body.name,
    description: body.description ?? "",
    cover: body.cover ?? "",
    createdAt: body.createdAt,
  };
  const saved = await saveCategory(category);
  await triggerStorefrontRevalidate({ reason: "category-upsert", paths: CATEGORY_REVALIDATE_PATHS });
  return NextResponse.json({ category: saved });
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
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteCategory(id);
  await triggerStorefrontRevalidate({ reason: "category-delete", paths: CATEGORY_REVALIDATE_PATHS });
  return NextResponse.json({ ok: true });
}
