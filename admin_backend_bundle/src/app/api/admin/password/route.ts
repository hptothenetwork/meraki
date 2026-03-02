import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";
import { rotatePassword } from "@backend/admin/passwordStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  if (!body.current || !body.next) return NextResponse.json({ error: "Missing current/next password" }, { status: 400 });
  if (body.next.length < 10) return NextResponse.json({ error: "Password too short" }, { status: 400 });

  try {
    await rotatePassword(body.current, body.next);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Rotate failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
