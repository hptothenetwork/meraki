import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import { db } from "@backend/firebase.server";
import type { Product } from "@/types/catalog";
import { assertSameOrigin } from "@backend/admin/csrf";
import { getAllProducts } from "@backend/db/products";
import { sendPendingStockNotifications } from "@backend/db/stockNotifications";
import { triggerStorefrontRevalidate } from "@backend/revalidateStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getAllProducts();
    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error("[admin/products] fetch failed:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<Product> & { id?: string };
  const errors = validate(body);
  if (errors.length) return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });

  const productRef = db.collection("products").doc(body.id!);
  const previousSnapshot = await productRef.get();
  const previousProduct = previousSnapshot.exists ? (previousSnapshot.data() as Partial<Product>) : undefined;
  const nextProduct = { ...(previousProduct || {}), ...body } as Partial<Product>;

  const wasAvailable = isProductAvailable(previousProduct);
  const nowAvailable = isProductAvailable(nextProduct);

  await db.collection("products").doc(body.id!).set(body, { merge: true });
  await triggerStorefrontRevalidate({ reason: "product-upsert", paths: ["/"] });

  let stockNotifications: { sent: number; total: number } | null = null;
  if (!wasAvailable && nowAvailable) {
    try {
      stockNotifications = await sendPendingStockNotifications(body.id!);
    } catch (error) {
      console.error("[admin/products] failed to send stock notifications:", error);
    }
  }

  return NextResponse.json({ ok: true, stockNotifications });
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
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.collection("products").doc(id).delete();
  await triggerStorefrontRevalidate({ reason: "product-delete", paths: ["/"] });
  return NextResponse.json({ ok: true });
}

function validate(body: Partial<Product> & { id?: string }) {
  const errors: string[] = [];
  if (!body.id) errors.push("Missing id");
  if (!body.name) errors.push("Missing name");
  if (!body.category) errors.push("Missing category");
  if (body.priceUsd === undefined || body.priceUsd === null || Number(body.priceUsd) < 0) {
    errors.push("Price USD must be >= 0");
  }
  if (body.media && body.media.some((m) => !m.alt || !m.alt.trim())) {
    errors.push("All media must have alt text");
  }
  if (body.fbt && body.fbt.some((i) => !i.name || !i.image)) {
    errors.push("FBT items need name and image");
  }
  return errors;
}

function isProductAvailable(product?: Partial<Product>) {
  if (!product) return false;
  if (product.stockStatus === "out_of_stock") return false;
  if (product.stockStatus === "in_stock" || product.stockStatus === "low_stock") return true;
  return Number(product.stock || 0) > 0;
}
