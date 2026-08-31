import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";

function getR2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const endpointFromEnv = process.env.R2_ENDPOINT;
  const endpoint = (endpointFromEnv || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined))?.replace(/\/$/, "");
  const publicBaseOverride = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    publicBaseOverride,
    isReady: Boolean(accessKeyId && secretAccessKey && bucket && endpoint),
  };
}

let cachedClient: S3Client | null = null;
let cachedClientKey = "";

function getS3Client() {
  const config = getR2Config();
  if (!config.isReady || !config.endpoint) return null;

  const clientKey = `${config.accessKeyId}:${config.endpoint}`;
  if (cachedClient && cachedClientKey === clientKey) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
  });
  cachedClientKey = clientKey;
  return cachedClient;
}

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
  const config = getR2Config();
  const client = getS3Client();
  const targetBucket = bucketOverride || config.bucket;
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
  const config = getR2Config();
  const client = getS3Client();
  const targetBucket = bucketOverride || config.bucket;
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
  const config = getR2Config();
  if (!value.includes("://")) {
    return value.replace(/^\/+/, "");
  }
  try {
    const url = new URL(value);
    const pathValue = url.pathname.replace(/^\/+/, "");
    if (config.bucket && pathValue.startsWith(`${config.bucket}/`)) {
      return pathValue.slice(config.bucket.length + 1);
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
  const config = getR2Config();
  const base = config.publicBaseOverride || (config.endpoint ? `${config.endpoint}/${targetBucket}` : undefined);
  if (!base) {
    return key;
  }
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return new URL(key.replace(/^\/+/, ""), normalizedBase).toString();
}

export function isR2Ready() {
  return getR2Config().isReady;
}
