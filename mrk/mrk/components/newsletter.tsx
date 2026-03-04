"use client"

import { useRef, useState } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { toast } from "sonner"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const captchaRef = useRef<ReCAPTCHA | null>(null)
  const captchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Please enter your email")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email")
      return
    }
    if (captchaSiteKey && !captchaToken) {
      setError("Please complete the captcha")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; created?: boolean }

      if (!res.ok) {
        setError(data.error || "Could not subscribe right now")
        return
      }

      if (data.created === false) {
        toast("You are already subscribed", {
          description: "We'll keep you posted on new drops.",
        })
      } else {
        toast("Welcome to the list", {
          description: "You'll be the first to know about new drops.",
        })
      }
      setEmail("")
      setCaptchaToken("")
      captchaRef.current?.reset()
    } catch {
      setError("Could not subscribe right now")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border border-border bg-card px-8 py-14 text-center md:px-14">
          <h2 className="mb-3 font-serif text-2xl text-foreground md:text-3xl">
            Be Part of Our Story
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            New collection alerts, early access, and exclusive offers from Meraki the Brand.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("")
                  }}
                  placeholder="your@email.com"
                  className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  aria-label="Email address"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary px-8 py-3 text-sm font-medium tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
              >
                {submitting ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
            {captchaSiteKey && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={captchaSiteKey}
                  onChange={(token) => {
                    setCaptchaToken(token || "")
                    setError("")
                  }}
                />
              </div>
            )}
            {error && <p className="text-left text-xs text-destructive">{error}</p>}
          </form>

          <p className="mt-6 text-[11px] text-muted-foreground">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
