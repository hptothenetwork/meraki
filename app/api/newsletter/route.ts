import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/app/api/_utils/rate-limit"
import { upsertNewsletterSubscriber } from "@/backend/db/newsletter"
import { syncNewsletterToGoogleWebapp } from "@/backend/integrations/google-webapp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return ""
}

async function verifyTurnstileToken(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true, enforced: false as const }
  if (!token) return { ok: false, enforced: true as const, reason: "missing_token" }

  const params = new URLSearchParams()
  params.set("secret", secret)
  params.set("response", token)
  if (ip) params.set("remoteip", ip)

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    })
    const data = (await res.json().catch(() => ({}))) as { success?: boolean }
    if (!res.ok || !data.success) return { ok: false, enforced: true as const, reason: "verification_failed" }
    return { ok: true, enforced: true as const }
  } catch {
    return { ok: false, enforced: true as const, reason: "verification_error" }
  }
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    key: "newsletter:subscribe",
    max: 10,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    )
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string
    captchaToken?: string
    recaptchaToken?: string
  }
  const email = String(body.email || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 })
  }

  const captchaToken = body.captchaToken || body.recaptchaToken
  const captchaResult = await verifyTurnstileToken(captchaToken, getClientIp(req))
  if (!captchaResult.ok) {
    return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 })
  }

  try {
    const { created } = await upsertNewsletterSubscriber({ email, source: "storefront_newsletter" })
    try {
      await syncNewsletterToGoogleWebapp({ email, created })
    } catch (error) {
      console.error("[newsletter] failed to sync subscriber to google webapp:", error)
    }
    return NextResponse.json({ ok: true, created })
  } catch (error) {
    console.error("[newsletter] failed to subscribe:", error)
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 500 })
  }
}
