"use client"

import { useRef, useState } from "react"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"

export function EventAttendanceForm({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
}: {
  eventId: string
  eventTitle: string
  eventDate?: string
  eventLocation?: string
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const recaptchaRef = useRef<TurnstileInstance | null>(null)
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (recaptchaSiteKey && !captchaToken) {
      setMessage("Please complete captcha first.")
      return
    }
    setSending(true)
    setMessage("")

    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formType: "event_attendance",
        captchaToken,
        eventId,
        eventTitle,
        eventDate,
        eventLocation,
        ...form,
      }),
    })

    setSending(false)
    if (res.ok) {
      setMessage("Attendance request sent to brandmeraki5@gmail.com.")
      setForm({ name: "", email: "", phone: "", notes: "" })
      setCaptchaToken("")
      recaptchaRef.current?.reset()
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setMessage(data.error || "Failed to submit request. Please try again.")
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-serif text-xl text-foreground">Attend This Event</h3>
      <p className="mt-2 text-sm text-muted-foreground">Submit your details and we will contact you.</p>

      <div className="mt-4 grid gap-3">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <input
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <textarea
          rows={3}
          placeholder="Any note (optional)"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      {recaptchaSiteKey && (
        <div className="mt-4">
          <Turnstile
            ref={recaptchaRef}
            siteKey={recaptchaSiteKey}
            onSuccess={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken("")}
          />
        </div>
      )}

      <button
        disabled={sending}
        className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {sending ? "Submitting..." : "Submit Attendance"}
      </button>

      {message && (
        <p className={`mt-3 text-sm ${message.startsWith("Failed") ? "text-destructive" : "text-foreground"}`}>{message}</p>
      )}
    </form>
  )
}
