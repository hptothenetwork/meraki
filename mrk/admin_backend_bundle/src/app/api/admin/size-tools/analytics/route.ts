import { NextRequest, NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { requireAdmin } from "@backend/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SizeToolEvent = {
  tool?: "find_my_size" | "length_guide";
  sessionId?: string;
  userId?: string;
  recommendedSize?: string;
  selectedSize?: string;
  createdAt?: string;
};

type OrderSummary = {
  id?: string;
  sessionId?: string;
  userId?: string;
  total?: number;
  createdAt?: string;
};

function safeDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function toTopList(source: Map<string, number>, limit = 5) {
  return [...source.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function parseTotal(value: unknown) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = safeDate(searchParams.get("startDate"), defaultStart);
    const endDate = safeDate(searchParams.get("endDate"), now);
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    const [eventSnapshot, orderSnapshot] = await Promise.all([
      db
        .collection("size_tool_events")
        .where("createdAt", ">=", startIso)
        .where("createdAt", "<=", endIso)
        .limit(5000)
        .get(),
      db
        .collection("orders")
        .where("createdAt", ">=", startIso)
        .where("createdAt", "<=", endIso)
        .limit(5000)
        .get(),
    ]);

    const events = eventSnapshot.docs.map((doc) => doc.data() as SizeToolEvent);
    const orders = orderSnapshot.docs.map((doc) => doc.data() as OrderSummary);

    const recommendedCounts = new Map<string, number>();
    const selectedCounts = new Map<string, number>();
    const dailyCounts = new Map<string, { total: number; findMySize: number; lengthGuide: number }>();
    const sessionIds = new Set<string>();
    const userIds = new Set<string>();

    let totalFindMySize = 0;
    let totalLengthGuide = 0;
    let acceptedRecommendation = 0;
    let recommendationComparisons = 0;

    for (const event of events) {
      const day = String(event.createdAt || "").slice(0, 10) || "unknown";
      const bucket = dailyCounts.get(day) || { total: 0, findMySize: 0, lengthGuide: 0 };
      bucket.total += 1;

      if (event.tool === "find_my_size") {
        totalFindMySize += 1;
        bucket.findMySize += 1;
      }
      if (event.tool === "length_guide") {
        totalLengthGuide += 1;
        bucket.lengthGuide += 1;
      }

      const recommended = String(event.recommendedSize || "").trim().toUpperCase();
      const selected = String(event.selectedSize || "").trim().toUpperCase();

      if (recommended) {
        recommendedCounts.set(recommended, (recommendedCounts.get(recommended) || 0) + 1);
      }
      if (selected) {
        selectedCounts.set(selected, (selectedCounts.get(selected) || 0) + 1);
      }
      if (recommended && selected) {
        recommendationComparisons += 1;
        if (recommended === selected) {
          acceptedRecommendation += 1;
        }
      }

      if (event.sessionId) sessionIds.add(event.sessionId);
      if (event.userId) userIds.add(event.userId);

      dailyCounts.set(day, bucket);
    }

    const sizeToolOrders = orders.filter((order) => {
      if (order.userId && userIds.has(order.userId)) return true;
      if (order.sessionId && sessionIds.has(order.sessionId)) return true;
      return false;
    });
    const nonSizeToolOrders = orders.filter((order) => !sizeToolOrders.includes(order));

    const totalOrders = orders.length;
    const sizeToolOrderCount = sizeToolOrders.length;
    const sizeToolOrderRate = totalOrders > 0 ? Number(((sizeToolOrderCount / totalOrders) * 100).toFixed(1)) : 0;

    const sizeToolRevenue = sizeToolOrders.reduce((sum, order) => sum + parseTotal(order.total), 0);
    const nonSizeToolRevenue = nonSizeToolOrders.reduce((sum, order) => sum + parseTotal(order.total), 0);
    const avgOrderValueWithSizeTool = sizeToolOrderCount > 0 ? Number((sizeToolRevenue / sizeToolOrderCount).toFixed(2)) : 0;
    const avgOrderValueWithoutSizeTool =
      nonSizeToolOrders.length > 0 ? Number((nonSizeToolRevenue / nonSizeToolOrders.length).toFixed(2)) : 0;

    const recommendationAcceptanceRate =
      recommendationComparisons > 0
        ? Number(((acceptedRecommendation / recommendationComparisons) * 100).toFixed(1))
        : 0;

    const trends = [...dailyCounts.entries()]
      .map(([day, value]) => ({ day, ...value }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return NextResponse.json({
      startDate: startIso,
      endDate: endIso,
      summary: {
        totalEvents: events.length,
        totalFindMySize,
        totalLengthGuide,
        uniqueSessions: sessionIds.size,
        uniqueUsers: userIds.size,
        recommendationAcceptanceRate,
      },
      topRecommendedSizes: toTopList(recommendedCounts),
      topSelectedSizes: toTopList(selectedCounts),
      trends,
      conversionImpact: {
        totalOrders,
        sizeToolOrderCount,
        sizeToolOrderRate,
        avgOrderValueWithSizeTool,
        avgOrderValueWithoutSizeTool,
      },
    });
  } catch (error) {
    console.error("[admin/size-tools/analytics] error:", error);
    return NextResponse.json({ error: "Failed to fetch size tool analytics" }, { status: 500 });
  }
}
