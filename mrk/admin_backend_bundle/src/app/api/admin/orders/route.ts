import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import { deleteOrder, getAllOrders, updateOrderStatus, type OrderStatus } from "@backend/db/orders";
import { assertSameOrigin } from "@backend/admin/csrf";
import { triggerStorefrontRevalidate } from "@backend/revalidateStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await getAllOrders();
  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { id?: string; status?: OrderStatus };
  if (!body.id || !body.status) return NextResponse.json({ error: "Missing id/status" }, { status: 400 });
  await updateOrderStatus(body.id, body.status);
  await triggerStorefrontRevalidate({ reason: "order-status-update", paths: ["/", "/track-order"] });
  return NextResponse.json({ ok: true });
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
  await deleteOrder(id);
  await triggerStorefrontRevalidate({ reason: "order-delete", paths: ["/", "/track-order"] });
  return NextResponse.json({ ok: true });
}
