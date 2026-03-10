import { NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Returns a short-lived ImageKit auth token so the browser can upload videos
// directly to ImageKit — bypassing Vercel's 4.5 MB serverless body limit.
export async function GET(req: Request) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;

  if (!privateKey || !publicKey) {
    return NextResponse.json({ error: "ImageKit not configured" }, { status: 500 });
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 600; // valid for 10 minutes
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return NextResponse.json({ token, expire, signature, publicKey });
}
