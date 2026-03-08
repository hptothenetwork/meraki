import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";

type UploadLocalParams = {
  data: Buffer | Uint8Array | string;
  fileName?: string;
  contentType?: string;
  prefix?: string;
};

type UploadLocalResult = {
  key: string;
  url: string;
};

const PRIMARY_UPLOADS_ROOT = process.env.ADMIN_LOCAL_UPLOAD_DIR?.trim()
  ? path.resolve(process.env.ADMIN_LOCAL_UPLOAD_DIR.trim())
  : path.resolve(process.cwd(), "..", "public", "uploads", "local");

const LEGACY_UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "local");
const UPLOAD_ROOTS = Array.from(new Set([PRIMARY_UPLOADS_ROOT, LEGACY_UPLOADS_ROOT]));

const DEFAULT_DEV_PUBLIC_BASE_URL = "http://localhost:3000";
const RAW_PUBLIC_BASE_URL =
  process.env.LOCAL_UPLOAD_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.NODE_ENV === "production" ? "" : DEFAULT_DEV_PUBLIC_BASE_URL);
// In production, if no explicit base URL is set, use relative paths to avoid
// localhost URLs being stored in the database (breaks on deployment).
const PUBLIC_BASE_URL = RAW_PUBLIC_BASE_URL && !RAW_PUBLIC_BASE_URL.includes("localhost")
  ? RAW_PUBLIC_BASE_URL.replace(/\/+$/, "")
  : process.env.NODE_ENV === "production" ? "" : (RAW_PUBLIC_BASE_URL?.replace(/\/+$/, "") ?? "");

export async function uploadToLocalStorage({
  data,
  fileName,
  contentType,
  prefix = "products",
}: UploadLocalParams): Promise<UploadLocalResult> {
  const safePrefix = normalizePrefix(prefix);
  const ext = pickExtension(fileName, contentType);
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const relative = path.posix.join(safePrefix, filename);
  const key = `local/${relative}`;
  const absolutePath = path.join(UPLOAD_ROOTS[0], ...relative.split("/"));
  const relativeUrl = `/uploads/local/${relative}`;

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.isBuffer(data) ? data : Buffer.from(data));

  return {
    key,
    url: PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}${relativeUrl}` : relativeUrl,
  };
}

export async function deleteFromLocalStorage(key: string): Promise<void> {
  const parsed = extractLocalUploadKey(key);
  if (!parsed) return;
  const relative = parsed.replace(/^local\//, "");
  for (const root of UPLOAD_ROOTS) {
    const absolutePath = path.join(root, ...relative.split("/"));
    try {
      await unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}

export function extractLocalUploadKey(value: string): string | null {
  if (!value) return null;
  if (value.startsWith("local/")) {
    return `local/${value.replace(/^local\/+/, "")}`;
  }

  if (value.startsWith("/uploads/local/")) {
    return `local/${value.replace(/^\/uploads\/local\//, "")}`;
  }

  if (value.includes("://")) {
    try {
      const url = new URL(value);
      if (url.pathname.startsWith("/uploads/local/")) {
        return `local/${url.pathname.replace(/^\/uploads\/local\//, "")}`;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function normalizePrefix(input: string): string {
  const cleaned = input
    .split(/[\\/]+/)
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, "-"));
  return cleaned.length > 0 ? cleaned.join("/") : "products";
}

function pickExtension(fileName?: string, contentType?: string) {
  const nameExt = (fileName ? path.extname(fileName).toLowerCase() : "").slice(0, 10);
  if (/^\.[a-z0-9]+$/.test(nameExt)) return nameExt;

  const normalized = (contentType || "").toLowerCase();
  if (normalized === "image/jpeg") return ".jpg";
  if (normalized === "image/png") return ".png";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "image/avif") return ".avif";
  if (normalized === "image/gif") return ".gif";
  if (normalized === "video/mp4") return ".mp4";
  if (normalized === "video/webm") return ".webm";
  if (normalized === "video/quicktime") return ".mov";
  return "";
}
