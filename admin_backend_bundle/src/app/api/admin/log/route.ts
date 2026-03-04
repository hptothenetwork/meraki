import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        requireAdmin(req);
        assertSameOrigin(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json() as { action?: string };
        // Log admin session activity (can be extended to store in DB)
        console.log(`[admin-log] Action: ${body.action || 'unknown'} at ${new Date().toISOString()}`);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[admin-log] Failed:", error);
        return NextResponse.json({ error: "Failed to log" }, { status: 500 });
    }
}
