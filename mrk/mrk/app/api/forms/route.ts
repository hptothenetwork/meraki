import { NextRequest, NextResponse } from "next/server"
import { saveContactSubmission } from "@/backend/db/forms"
import { checkRateLimit } from "@/app/api/_utils/rate-limit"
import { syncFormSubmissionToGoogleWebapp } from "@/backend/integrations/google-webapp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const SUBMISSION_INBOX_EMAIL = "brandmeraki5@gmail.com"

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

async function verifyRecaptchaToken(token: string | undefined, ip: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return { ok: true, enforced: false as const }
  if (!token) return { ok: false, enforced: true as const, reason: "missing_token" }

  const params = new URLSearchParams()
  params.set("secret", secret)
  params.set("response", token)
  if (ip) params.set("remoteip", ip)

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
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
    key: "forms:submit",
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
    formType?: "contact" | "custom_cut" | "event_attendance"
    name?: string
    email?: string
    phone?: string
    message?: string
    style?: string
    fabric?: string
    timeline?: string
    notes?: string
    eventId?: string
    eventTitle?: string
    eventDate?: string
    eventLocation?: string
    captchaToken?: string
    recaptchaToken?: string
  }

  const formType = body.formType || "contact"
  const message =
    formType === "custom_cut"
      ? [
          `Style: ${body.style || "-"}`,
          `Fabric: ${body.fabric || "-"}`,
          `Timeline: ${body.timeline || "-"}`,
          `Notes: ${body.notes || "-"}`,
        ].join("\n")
      : formType === "event_attendance"
        ? [
            `Event: ${body.eventTitle || "-"}`,
            `Date: ${body.eventDate || "-"}`,
            `Location: ${body.eventLocation || "-"}`,
            `Phone: ${body.phone || "-"}`,
            `Attendance note: ${body.notes || body.message || "-"}`,
          ].join("\n")
      : body.message

  if (!body.name || !body.email || !message || (formType === "event_attendance" && !body.eventTitle)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const captchaToken = body.captchaToken || body.recaptchaToken
  const captchaResult = await verifyRecaptchaToken(captchaToken, getClientIp(req))
  if (!captchaResult.ok) {
    return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 })
  }

  let submission: Awaited<ReturnType<typeof saveContactSubmission>>
  try {
    submission = await saveContactSubmission({
      name: body.name,
      email: body.email,
      phone: body.phone,
      message,
      formType,
      recipientEmail: SUBMISSION_INBOX_EMAIL,
      eventId: body.eventId,
      eventTitle: body.eventTitle,
      eventDate: body.eventDate,
      eventLocation: body.eventLocation,
      summary:
        formType === "custom_cut"
          ? `Custom Cut Request\nName: ${body.name}\nEmail: ${body.email}\nPhone: ${body.phone || "-"}\n${message}\nInbox: ${SUBMISSION_INBOX_EMAIL}`
          : formType === "event_attendance"
            ? `Event Attendance Request\nEvent: ${body.eventTitle}\nName: ${body.name}\nEmail: ${body.email}\nPhone: ${body.phone || "-"}\n${message}\nInbox: ${SUBMISSION_INBOX_EMAIL}`
            : `Contact Request\nName: ${body.name}\nEmail: ${body.email}\nPhone: ${body.phone || "-"}\nMessage: ${message}\nInbox: ${SUBMISSION_INBOX_EMAIL}`,
    })
  } catch (error) {
    console.error("[forms] failed to save form submission:", error)
    return NextResponse.json({ error: "Failed to save submission. Please try again." }, { status: 500 })
  }

  try {
    await syncFormSubmissionToGoogleWebapp({
      formType,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message,
      style: body.style,
      fabric: body.fabric,
      timeline: body.timeline,
      notes: body.notes,
      eventId: body.eventId,
      eventTitle: body.eventTitle,
      eventDate: body.eventDate,
      eventLocation: body.eventLocation,
      recipientEmail: SUBMISSION_INBOX_EMAIL,
      summary: submission.summary,
    })
  } catch (error) {
    console.error("[forms] failed to sync submission to google webapp:", error)
  }

  return NextResponse.json({ ok: true, submissionId: submission.id })
}
