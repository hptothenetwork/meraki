import { NextRequest, NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { requireAdmin } from "@backend/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventType = searchParams.get("event");

    let query: FirebaseFirestore.Query = db.collection("analytics_events").orderBy("timestamp", "desc");

    if (eventType && eventType !== "all") {
      query = query.where("event", "==", eventType);
    }

    if (startDate) {
      query = query.where("timestamp", ">=", startDate);
    }
    if (endDate) {
      query = query.where("timestamp", "<=", endDate);
    }

    query = query.limit(1000);

    const snapshot = await query.get();
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("[admin/analytics] fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
