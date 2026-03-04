import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import { listFormSubmissions, updateFormSubmissionStatus, deleteFormSubmission } from "@backend/db/forms";
import { assertSameOrigin } from "@backend/admin/csrf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbSubmissions = await listFormSubmissions();
  const scrubbedDb = dbSubmissions.map((s) => ({
    ...s,
    data: undefined,
  }));

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "Contact";

  const webappUrl = process.env.GOOGLE_FORMS_WEBAPP_URL;
  const secret = process.env.GOOGLE_FORMS_SECRET;

  if (!webappUrl) {
    return NextResponse.json({ submissions: scrubbedDb, note: "missing_webapp_env_fallback" });
  }

  try {
    const url = secret
      ? `${webappUrl}?secret=${encodeURIComponent(secret)}&tab=${encodeURIComponent(tab)}`
      : `${webappUrl}?tab=${encodeURIComponent(tab)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Webapp responded ${res.status}: ${text}`);
    }
    const data = await res.json();
    const webappSubs = ((data as { submissions?: unknown[] })?.submissions ?? []).map((s: unknown) =>
      typeof s === "object" && s !== null ? { ...s as Record<string, unknown>, data: undefined } : s,
    );
    const submissions = webappSubs.length > 0 ? webappSubs : scrubbedDb;
    return NextResponse.json({
      submissions,
      dbSubmissions: scrubbedDb,
      source: webappSubs.length > 0 ? "webapp" : "db_fallback",
    });
  } catch (error) {
    console.error("[forms] webapp fetch failed", error);
    return NextResponse.json({
      submissions: scrubbedDb,
      note: "forms_webapp_failed_db_fallback",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { id?: string; status?: string; note?: string };
  if (!body.id || !body.status) return NextResponse.json({ error: "Missing id/status" }, { status: 400 });
  await updateFormSubmissionStatus(body.id, body.status, body.note);
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
  await deleteFormSubmission(id);
  return NextResponse.json({ ok: true });
}
