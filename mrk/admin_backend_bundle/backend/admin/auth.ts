import crypto from "crypto";

const COOKIE_NAME = "admin_session";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function assertSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET not set");
  }
  return secret;
}

function sign(value: string) {
  const secret = assertSecret();
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function verifySignedToken(token: string) {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const [version, ts] = payload.split(":");
  if (version !== "v1") return false;
  const issued = Number(ts);
  if (!Number.isFinite(issued)) return false;
  if (Date.now() - issued > TOKEN_TTL_MS) return false;
  return true;
}

function parseCookie(header: string | null) {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [k, ...rest] = part.trim().split("=");
    acc[k] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

export function requireAdmin(request: Request) {
  // Prefer signed cookie
  const cookies = parseCookie(request.headers.get("cookie"));
  const cookieToken = cookies[COOKIE_NAME];
  if (cookieToken && verifySignedToken(cookieToken)) {
    return true;
  }

  // Legacy header auth is allowed only outside production for controlled migration.
  const allowLegacyHeader =
    process.env.NODE_ENV !== "production" && process.env.ALLOW_LEGACY_ADMIN_HEADER === "true";
  if (allowLegacyHeader) {
    const header = request.headers.get("x-admin-token") || request.headers.get("authorization");
    if (header && header.replace("Bearer ", "") === assertSecret()) {
      return true;
    }
  }

  throw new Error("Unauthorized");
}

export function createAdminSessionCookie() {
  const payload = `v1:${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TOKEN_TTL_MS / 1000};${
    process.env.NODE_ENV === "production" ? " Secure" : ""
  }`;
}

export function clearAdminSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;${
    process.env.NODE_ENV === "production" ? " Secure" : ""
  }`;
}
