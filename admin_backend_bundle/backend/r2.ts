import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";

const accessKeyId = process.env.R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_KEY;
const bucket = process.env.R2_BUCKET;
const endpointFromEnv = process.env.R2_ENDPOINT;
const accountId = process.env.R2_ACCOUNT_ID;
const endpoint = (endpointFromEnv || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined))?.replace(/\/$/, "");
const publicBaseOverride = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
const hasImageKitFallback = Boolean(process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT);

const isConfigured = Boolean(accessKeyId && secretAccessKey && bucket && endpoint);
if (!isConfigured && !hasImageKitFallback) {
  console.warn("[r2] Missing R2 credentials or bucket configuration; admin uploads will use local storage fallback.");
}

const client = endpoint
  ? new S3Client({
      region: "auto",
      endpoint,
      forcePathStyle: true,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    })
  : null;

type UploadParams = {
  data: Buffer | Uint8Array | string;
  contentType?: string;
  fileName?: string;
  prefix?: string;
  bucketOverride?: string;
};

type UploadResult = {
  key: string;
  url: string;
};

export async function uploadToR2({ data, contentType, fileName, prefix = "uploads", bucketOverride }: UploadParams): Promise<UploadResult> {
  const targetBucket = bucketOverride || bucket;
  if (!client || !targetBucket) {
    throw new Error("R2 client is not configured");
  }

  const key = buildObjectKey(prefix, fileName);
  await client.send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: data,
      ContentType: contentType || "application/octet-stream",
    }),
  );

  return { key, url: buildPublicUrl(key, targetBucket) };
}

type DeleteParams = {
  key: string;
  bucketOverride?: string;
};

export async function deleteFromR2({ key, bucketOverride }: DeleteParams): Promise<void> {
  const targetBucket = bucketOverride || bucket;
  if (!client || !targetBucket) {
    throw new Error("R2 client is not configured");
  }
  const normalizedKey = key.replace(/^\/+/, "");
  await client.send(
    new DeleteObjectCommand({
      Bucket: targetBucket,
      Key: normalizedKey,
    }),
  );
}

export function extractR2Key(value: string): string {
  if (!value.includes("://")) {
    return value.replace(/^\/+/, "");
  }
  try {
    const url = new URL(value);
    const pathValue = url.pathname.replace(/^\/+/, "");
    if (bucket && pathValue.startsWith(`${bucket}/`)) {
      return pathValue.slice(bucket.length + 1);
    }
    return pathValue;
  } catch {
    return value;
  }
}

function buildObjectKey(prefix: string, fileName?: string) {
  const safePrefix = prefix?.trim().replace(/^\/+/, "").replace(/\/+$/g, "");
  const normalizedPrefix = safePrefix ? safePrefix : "uploads";
  const ext = fileName ? path.extname(fileName).toLowerCase().slice(0, 8) : "";
  const uniquePart = `${Date.now()}-${crypto.randomUUID()}`;
  return `${normalizedPrefix}/${uniquePart}${ext}`;
}

function buildPublicUrl(key: string, targetBucket: string) {
  const base = publicBaseOverride || (endpoint ? `${endpoint}/${targetBucket}` : undefined);
  if (!base) {
    return key;
  }
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return new URL(key.replace(/^\/+/, ""), normalizedBase).toString();
}

export function isR2Ready() {
  return Boolean(client && bucket);
}
