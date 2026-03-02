import { NextRequest, NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    requireAdmin(request);
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, trackingNumber, trackingUrl } = await request.json();

    if (!orderId || !trackingNumber) {
      return NextResponse.json({ error: "Order ID and tracking number are required" }, { status: 400 });
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const normalizedTrackingUrl = typeof trackingUrl === "string" ? trackingUrl.trim() : "";
    await orderRef.update({
      trackingNumber,
      trackingUrl: normalizedTrackingUrl,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Tracking number added successfully",
    });
  } catch (error) {
    console.error("[admin/orders/tracking] error:", error);
    return NextResponse.json({ error: "Failed to add tracking number" }, { status: 500 });
  }
}
