import crypto from "crypto";

type PasswordRecord = {
  hash: string;
  lastRotatedAt: number;
};

const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CF_URL = process.env.CF_ADMIN_AUTH_URL;
const CF_TOKEN = process.env.CF_ADMIN_AUTH_TOKEN;
const SALT = process.env.ADMIN_SECRET_SALT;

function requireSalt() {
  if (!SALT) throw new Error("ADMIN_SECRET_SALT not set");
  return SALT;
}

export function hmacPassword(password: string) {
  const salt = requireSalt();
  const hash = crypto.createHmac("sha256", salt).update(password).digest("base64url");
  return hash;
}

export function isExpired(record: PasswordRecord) {
  return Date.now() - record.lastRotatedAt > EXPIRY_MS;
}

async function fetchFromCf(): Promise<PasswordRecord | null> {
  if (!CF_URL || !CF_TOKEN) return null;
  const res = await fetch(`${CF_URL}/admin-auth`, {
    headers: { Authorization: `Bearer ${CF_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch admin password record from CF");
  // Get ArrayBuffer and convert, stripping BOM
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Check for UTF-8 BOM (0xEF 0xBB 0xBF) and skip it
  let offset = 0;
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    offset = 3;
  }
  
  // Decode from offset
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(bytes.slice(offset));
  const data = JSON.parse(text) as PasswordRecord;
  return data;
}

async function updateCf(record: PasswordRecord) {
  if (!CF_URL || !CF_TOKEN) throw new Error("CF_ADMIN_AUTH_URL or CF_ADMIN_AUTH_TOKEN not set");
  const res = await fetch(`${CF_URL}/admin-auth`, {
    method: "POST",
    headers: { Authorization: `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to update admin password record");
}

export async function getPasswordRecord(): Promise<PasswordRecord> {
  // Prefer Cloudflare Worker endpoint if configured
  if (CF_URL && CF_TOKEN) {
    const record = await fetchFromCf();
    if (record) return record;
  }

  // Fallback: derive from env (dev-only)
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD not set (and no CF worker configured)");
  const hash = hmacPassword(password);
  const rotatedAtEnv = process.env.ADMIN_PASSWORD_ROTATED_AT;
  const lastRotatedAt = rotatedAtEnv ? Number(rotatedAtEnv) : Date.now();
  return { hash, lastRotatedAt };
}

export async function verifyPassword(input: string): Promise<{ ok: boolean; expired: boolean }> {
  const record = await getPasswordRecord();
  const ok = hmacPassword(input) === record.hash;
  const expired = isExpired(record);
  return { ok, expired };
}

export async function rotatePassword(oldPassword: string, newPassword: string): Promise<void> {
  const { ok } = await verifyPassword(oldPassword);
  if (!ok) throw new Error("Invalid current password");
  const next: PasswordRecord = { hash: hmacPassword(newPassword), lastRotatedAt: Date.now() };
  if (CF_URL && CF_TOKEN) {
    await updateCf(next);
    return;
  }
  // Env fallback cannot persist rotation
  throw new Error("Rotation requires CF worker storage; set CF_ADMIN_AUTH_URL/CF_ADMIN_AUTH_TOKEN");
}
 
