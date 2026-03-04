import crypto from "crypto";

export const INTERNAL_API_HEADER = "x-internal-api-key";

function getInternalApiSecret() {
  // Reuse ADMIN_SECRET by default to avoid introducing a required new env var.
  return process.env.INTERNAL_API_SECRET || process.env.ADMIN_SECRET || "";
}

function constantTimeEqual(left: string, right: string) {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) return false;
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}

export function createInternalApiHeaders(): Record<string, string> {
  const secret = getInternalApiSecret();
  if (!secret) return {};
  return { [INTERNAL_API_HEADER]: secret };
}

export function requireInternalApi(request: Request) {
  const secret = getInternalApiSecret();
  if (!secret) throw new Error("Internal API secret is not configured");

  const provided =
    request.headers.get(INTERNAL_API_HEADER) ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!provided || !constantTimeEqual(provided, secret)) {
    throw new Error("Unauthorized");
  }
}
