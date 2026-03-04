import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "CSRF origin mismatch" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearAdminSessionCookie());
  return res;
}
