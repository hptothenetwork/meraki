import "server-only"

type FormType = "contact" | "custom_cut" | "event_attendance"

type FormPayload = {
  formType: FormType
  name: string
  email: string
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
  recipientEmail?: string
  summary?: string
}

const WEBAPP_URL = process.env.GOOGLE_FORMS_WEBAPP_URL || ""
const WEBAPP_SECRET = process.env.GOOGLE_FORMS_SECRET || ""

function getEndpoint() {
  return WEBAPP_URL.trim()
}

async function postJson(payload: Record<string, unknown>) {
  const endpoint = getEndpoint()
  if (!endpoint) return { ok: false, skipped: true as const, reason: "missing_webapp_url" }

  const body: Record<string, unknown> = { ...payload }
  if (WEBAPP_SECRET.trim()) body.secret = WEBAPP_SECRET.trim()

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Google webapp responded ${response.status}: ${text}`)
  }

  return { ok: true, skipped: false as const }
}

export async function syncFormSubmissionToGoogleWebapp(payload: FormPayload) {
  return postJson({
    formType: payload.formType,
    source: "website",
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "",
    recipientEmail: payload.recipientEmail || "",
    summary: payload.summary || "",
    message: payload.message || "",
    style: payload.style || "",
    fabric: payload.fabric || "",
    timeline: payload.timeline || "",
    notes: payload.notes || "",
    eventId: payload.eventId || "",
    eventTitle: payload.eventTitle || "",
    eventDate: payload.eventDate || "",
    eventLocation: payload.eventLocation || "",
  })
}

export async function syncNewsletterToGoogleWebapp(input: { email: string; created: boolean }) {
  return postJson({
    formType: "newsletter",
    source: "website",
    email: input.email,
    status: input.created ? "new_subscriber" : "existing_subscriber",
  })
}
