import "server-only";
import { put, del } from "@vercel/blob";

export function isVercelBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

type UploadBlobParams = {
  data: Buffer | Uint8Array;
  fileName: string;
  contentType?: string;
  prefix?: string;
};

type UploadBlobResult = {
  key: string;
  url: string;
};

export async function uploadToVercelBlob({
  data,
  fileName,
  contentType,
  prefix = "products",
}: UploadBlobParams): Promise<UploadBlobResult> {
  if (!isVercelBlobConfigured()) {
    throw new Error("Vercel Blob is not configured (missing BLOB_READ_WRITE_TOKEN)");
  }

  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_");
  const pathName = `${safePrefix}/${Date.now()}-${fileName}`;

  const blob = await put(pathName, Buffer.from(data), {
    access: "public",
    contentType: contentType || "application/octet-stream",
  });

  return {
    key: blob.pathname,
    url: blob.url,
  };
}

export async function deleteFromVercelBlob(url: string): Promise<void> {
  if (!isVercelBlobConfigured()) return;
  try {
    await del(url);
  } catch {
    // ignore missing blobs
  }
}
