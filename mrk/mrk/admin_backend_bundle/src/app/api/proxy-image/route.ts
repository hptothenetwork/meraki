import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const imageKitHost = process.env.IMAGEKIT_URL_ENDPOINT
    ? new URL(process.env.IMAGEKIT_URL_ENDPOINT).host
    : "";
  const allowedHosts = ["r2.cloudflarestorage.com", ".r2.dev", "ik.imagekit.io", ".imagekit.io", imageKitHost].filter(Boolean);
  const hostAllowed = allowedHosts.some((h) => parsed.host === h || parsed.host.endsWith(h));
  if (!hostAllowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error("[proxy-image] error:", error);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
