import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionCookie } from "@backend/admin/auth";
import { verifyPassword } from "@backend/admin/passwordStore";
import { assertSameOrigin } from "@backend/admin/csrf";
import { getRequestIdentifier, strictRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const identifier = getRequestIdentifier(req);
  const rateLimitResult = strictRateLimit(identifier);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      },
      { status: 429 },
    );
  }

  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "CSRF origin mismatch" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (!body.password) {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }

  const { ok, expired } = await verifyPassword(body.password);
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (expired) {
    // Allow login with expired password, but flag it
    const res = NextResponse.json({ ok: true, passwordExpired: true });
    res.headers.append("Set-Cookie", createAdminSessionCookie());
    return res;
  }

  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", createAdminSessionCookie());
  return res;
}
