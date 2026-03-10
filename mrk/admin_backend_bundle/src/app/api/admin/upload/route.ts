import { NextResponse } from "next/server";
import { deleteFromR2, extractR2Key, isR2Ready, uploadToR2 } from "@backend/r2";
import { deleteFromImageKit, isImageKitConfigured, uploadToImageKit } from "@backend/imagekit";
import { deleteFromLocalStorage, extractLocalUploadKey, uploadToLocalStorage } from "@backend/local-upload";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Basic Origin check for cookie-based auth to reduce CSRF window
  const origin = req.headers.get("origin");
  if (origin) {
    const url = new URL(req.url);
    if (new URL(origin).host !== url.host) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File missing" }, { status: 400 });
  }

  const allowedTypes = ["image/", "video/"];
  const isAllowedType = allowedTypes.some((p) => file.type.startsWith(p));
  if (!isAllowedType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }
  const envMaxMb = Number(process.env.ADMIN_UPLOAD_MAX_MB || "50");
  const maxMb = Number.isFinite(envMaxMb) && envMaxMb > 0 ? envMaxMb : 50;
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File too large. Max ${maxMb}MB` }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  let outputBuffer: Uint8Array = inputBuffer;
  const outputContentType = file.type || "application/octet-stream";

  if (file.type.startsWith("image/") && process.env.ADMIN_IMAGE_WATERMARK_ENABLED !== "false") {
    try {
      outputBuffer = await applyMerakiWatermark(inputBuffer);
    } catch (error) {
      console.warn("[upload] watermark failed, falling back to original image", error);
      outputBuffer = inputBuffer;
    }
  }

  try {
    if (isImageKitConfigured()) {
      try {
        const { key, url } = await uploadToImageKit({
          data: outputBuffer,
          contentType: outputContentType,
          fileName: file.name,
          folder: "/products",
        });
        return NextResponse.json({ url, key, public_id: key, provider: "imagekit" });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error("[upload] imagekit failed:", detail);
        return NextResponse.json({ error: `ImageKit upload failed: ${detail}` }, { status: 500 });
      }
    }

    if (isR2Ready()) {
      try {
        const { key, url } = await uploadToR2({
          data: outputBuffer,
          contentType: outputContentType,
          fileName: file.name,
          prefix: "products",
        });
        return NextResponse.json({ url, key, public_id: key, provider: "r2" });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error("[upload] r2 failed:", detail);
        return NextResponse.json({ error: `R2 upload failed: ${detail}` }, { status: 500 });
      }
    }

    const { key, url } = await uploadToLocalStorage({
      data: outputBuffer,
      contentType: outputContentType,
      fileName: file.name,
      prefix: "products",
    });
    return NextResponse.json({ url, key, public_id: key, provider: "local" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[upload] failed:", detail);
    return NextResponse.json({ error: `Upload failed: ${detail}` }, { status: 500 });
  }
}

async function applyMerakiWatermark(buffer: Uint8Array) {
  const image = sharp(buffer, { failOn: "none" });
  const metadata = await image.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 1200;
  const shortestSide = Math.min(width, height);

  const fontSize = clamp(Math.round(shortestSide * 0.045), 12, 22);
  const padX = Math.max(10, Math.round(width * 0.02));
  const padY = Math.max(10, Math.round(height * 0.02));
  const boxWidth = Math.round(fontSize * 4.9);
  const boxHeight = Math.round(fontSize * 1.7);
  const left = Math.max(0, width - boxWidth - padX);
  const top = Math.max(0, height - boxHeight - padY);

  const svg = `
  <svg width="${boxWidth}" height="${boxHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${Math.round(fontSize * 0.32)}" ry="${Math.round(fontSize * 0.32)}" fill="rgba(0,0,0,0.28)" />
    <text x="50%" y="57%" text-anchor="middle" fill="rgba(255,255,255,0.84)" font-size="${fontSize}" font-family="Georgia, 'Times New Roman', serif" letter-spacing="1.1">MERAKI</text>
  </svg>`;

  return image
    .composite([
      {
        input: Buffer.from(svg),
        left,
        top,
      },
    ])
    .toBuffer();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function DELETE(req: Request) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const publicId = searchParams.get("public_id");
  if (!publicId) return NextResponse.json({ error: "Missing public_id" }, { status: 400 });
  try {
    if (isImageKitConfigured() && /^file_/.test(publicId)) {
      await deleteFromImageKit(publicId);
      return NextResponse.json({ ok: true });
    }

    const localKey = extractLocalUploadKey(publicId);
    if (localKey) {
      await deleteFromLocalStorage(localKey);
      return NextResponse.json({ ok: true });
    }

    if (!isR2Ready()) {
      return NextResponse.json({ ok: true });
    }

    const key = extractR2Key(publicId);
    await deleteFromR2({ key });
  } catch (error) {
    console.error("[upload] delete failed", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
