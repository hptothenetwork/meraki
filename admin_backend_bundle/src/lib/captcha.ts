import { NextRequest } from "next/server";
import { getRequestIdentifier } from "@/lib/rateLimit";

type CaptchaProvider = "turnstile" | "recaptcha";

type CaptchaBody = Record<string, unknown> | null | undefined;

type CaptchaResult = {
  ok: boolean;
  enforced: boolean;
  provider?: CaptchaProvider;
  reason?: string;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function chooseProvider(body?: CaptchaBody): CaptchaProvider | null {
  const preferred = asString(body?.captchaProvider);
  if (preferred === "turnstile" || preferred === "recaptcha") return preferred;
  if (process.env.TURNSTILE_SECRET_KEY) return "turnstile";
  if (process.env.RECAPTCHA_SECRET_KEY) return "recaptcha";
  return null;
}

function readToken(req: NextRequest, body?: CaptchaBody): string | null {
  const tokenFromBody =
    asString(body?.captchaToken) ||
    asString(body?.turnstileToken) ||
    asString(body?.recaptchaToken) ||
    asString(body?.token);
  if (tokenFromBody) return tokenFromBody;

  return (
    asString(req.headers.get("x-captcha-token")) ||
    asString(req.headers.get("cf-turnstile-response")) ||
    asString(req.headers.get("x-turnstile-token")) ||
    asString(req.headers.get("x-recaptcha-token"))
  );
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, reason: "turnstile_secret_missing" };

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip && ip !== "unknown") form.set("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return data.success ? { ok: true } : { ok: false, reason: "turnstile_verification_failed" };
}

async function verifyRecaptcha(token: string, ip: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: false, reason: "recaptcha_secret_missing" };

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip && ip !== "unknown") form.set("remoteip", ip);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as { success?: boolean; score?: number };
  if (!data.success) return { ok: false, reason: "recaptcha_verification_failed" };

  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || "0.5");
  if (typeof data.score === "number" && data.score < minScore) {
    return { ok: false, reason: "recaptcha_low_score" };
  }
  return { ok: true };
}

export async function verifyCaptchaForRequest(req: NextRequest, body?: CaptchaBody): Promise<CaptchaResult> {
  const provider = chooseProvider(body);
  if (!provider) {
    return { ok: true, enforced: false };
  }

  const token = readToken(req, body);
  if (!token) {
    return { ok: false, enforced: true, provider, reason: "captcha_token_missing" };
  }

  try {
    const ip = getRequestIdentifier(req);
    const result = provider === "turnstile" ? await verifyTurnstile(token, ip) : await verifyRecaptcha(token, ip);
    return { ok: result.ok, enforced: true, provider, reason: result.ok ? undefined : result.reason };
  } catch {
    return { ok: false, enforced: true, provider, reason: "captcha_verification_error" };
  }
}
