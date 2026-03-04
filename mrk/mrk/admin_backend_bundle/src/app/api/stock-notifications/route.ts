import { NextRequest, NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { distributedRateLimit, getRequestIdentifier } from "@/lib/rateLimit";
import { requireAdmin } from "@backend/admin/auth";
import { verifyCaptchaForRequest } from "@/lib/captcha";

/**
 * POST /api/stock-notifications - Request stock notification
 */
export async function POST(req: NextRequest) {
  // Rate limiting - 3 stock notification requests per 5 minutes
  const identifier = getRequestIdentifier(req);
  const rateLimitResult = await distributedRateLimit("stock-notifications", identifier, 3, 5 * 60 * 1000);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      },
      { status: 429 }
    );
  }
  
  try {
    const body = await req.json();
    const captcha = await verifyCaptchaForRequest(req, body as Record<string, unknown>);
    if (!captcha.ok) {
      return NextResponse.json({ error: "Captcha verification failed", reason: captcha.reason }, { status: 400 });
    }
    const { email, productId, size } = body;

    if (!email || !productId) {
      return NextResponse.json(
        { error: "Email and productId required" },
        { status: 400 }
      );
    }

    // Check if already requested
    const existing = await db
      .collection("stock_notifications")
      .where("email", "==", email.toLowerCase())
      .where("productId", "==", productId)
      .where("size", "==", size || null)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { message: "Already subscribed for this product" },
        { status: 200 }
      );
    }

    // Add notification request
    await db.collection("stock_notifications").add({
      email: email.toLowerCase(),
      productId,
      size: size || null,
      status: "pending",
      requestedAt: new Date().toISOString(),
      notifiedAt: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating stock notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stock-notifications - Get all pending notifications (admin)
 */
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await db
      .collection("stock_notifications")
      .where("status", "==", "pending")
      .orderBy("requestedAt", "desc")
      .limit(100)
      .get();

    const results = notifications.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ notifications: results });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
