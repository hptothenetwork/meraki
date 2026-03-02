import "server-only"
import { db } from "../firebase.server"

export type ContactFormSubmission = {
  id: string
  type: "contact" | "custom_cut" | "event_attendance"
  channel: "form"
  summary: string
  data: Record<string, unknown>
  createdAt: string
  status: "stored"
}

const collectionName = "formSubmissions"

export async function saveContactSubmission(input: {
  name: string
  email: string
  phone?: string
  message: string
  formType?: "contact" | "custom_cut" | "event_attendance"
  summary?: string
  recipientEmail?: string
  eventId?: string
  eventTitle?: string
  eventDate?: string
  eventLocation?: string
}) {
  const ref = db.collection(collectionName).doc()
  const type = input.formType || "contact"
  const cleanInput = stripUndefined(input) as typeof input
  const payload: ContactFormSubmission = {
    id: ref.id,
    type,
    channel: "form",
    summary:
      cleanInput.summary ||
      `Name: ${cleanInput.name}\nEmail: ${cleanInput.email}\nPhone: ${cleanInput.phone || "-"}\nMessage: ${cleanInput.message}`,
    data: cleanInput,
    createdAt: new Date().toISOString(),
    status: "stored",
  }
  await ref.set(payload, { merge: true })
  return payload
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined) continue
      output[key] = stripUndefined(nested)
    }
    return output as T
  }
  return value
}
