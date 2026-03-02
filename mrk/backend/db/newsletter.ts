import "server-only"
import { db } from "../firebase.server"

export type NewsletterSubscriber = {
  id: string
  email: string
  status: "active" | "unsubscribed"
  source: string
  subscribedAt: string
  updatedAt: string
}

const collectionName = "newsletter_subscribers"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function toDocId(email: string) {
  return encodeURIComponent(normalizeEmail(email))
}

export async function upsertNewsletterSubscriber(input: {
  email: string
  source?: string
}) {
  const normalizedEmail = normalizeEmail(input.email)
  const now = new Date().toISOString()
  const docId = toDocId(normalizedEmail)
  const ref = db.collection(collectionName).doc(docId)
  const existing = await ref.get()

  const payload: NewsletterSubscriber = {
    id: docId,
    email: normalizedEmail,
    status: "active",
    source: input.source || "website",
    subscribedAt: existing.exists
      ? ((existing.data()?.subscribedAt as string | undefined) || now)
      : now,
    updatedAt: now,
  }

  await ref.set(payload, { merge: true })
  return { subscriber: payload, created: !existing.exists }
}
